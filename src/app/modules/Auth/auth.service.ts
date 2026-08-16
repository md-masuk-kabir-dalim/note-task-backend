import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import ApiError from "../../../errors/ApiErrors";
import config from "../../../config";
import { jwtHelpers } from "../../../utils/jwtHelpers";
import { comparePassword, hashPassword } from "../../../utils/passwordHelpers";
import { IUser } from "../User/user.interface";
import generateOtp from "../../../helpers/generateOtp";
import sendOtp from "../../../helpers/sendOtp";
import { UserModel, UserRole, UserStatus } from "../User/user.model";
import { OtpModel, OtpType } from "./otp.model";
import { USER_PUBLIC_FIELDS } from "../User/user.constants";
import { sanitizeUser } from "../../../utils/userSanitizer";

type AuthUserPayload = Pick<IUser, "name" | "email" | "password" | "interests"> & {
  fullName?: string;
  role?: string;
};

const buildTokenPayload = (user: { _id: unknown; email: string; role: string }) => ({
  userId: user._id,
  id: user._id,
  email: user.email,
  role: user.role,
});

const issueTokens = (
  user: { _id: unknown; email: string; role: string; tokenVersion?: number }
) => {
  const accessToken = jwtHelpers.generateToken(
    buildTokenPayload(user),
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      ...buildTokenPayload(user),
      tokenVersion: user.tokenVersion ?? 1,
    },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in
  );

  return { accessToken, refreshToken };
};

const checkEmailExists = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (user) {
    throw new ApiError(httpStatus.CONFLICT, "Email already in use");
  }
};

const loginAdmin = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email }).select("+password +tokenVersion");
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  if (user.status === UserStatus.DELETED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is deleted");
  }

  if (user.role !== UserRole.ADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized as admin");
  }

  const isCorrect = await comparePassword(password, user.password);
  if (!isCorrect) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  user.tokenVersion += 1;
  await user.save();

  const { accessToken, refreshToken } = issueTokens(user);
  const safeUser = sanitizeUser(user);

  return {
    message: "Admin login successful",
    isVerify: user.isVerified,
    data: { accessToken, refreshToken, user: safeUser },
  };
};

const registerUser = async (payload: AuthUserPayload) => {
  if (payload.role && payload.role !== UserRole.USER) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Public registration cannot create an ADMIN account"
    );
  }

  await checkEmailExists(payload.email);

  const hashedPassword = await hashPassword(payload.password);
  const name = payload.name || payload.fullName;

  if (!name) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Name is required");
  }

  const newUser = await UserModel.create({
    name,
    fullName: payload.fullName || name,
    email: payload.email,
    password: hashedPassword,
    role: UserRole.USER,
    interests: payload.interests || [],
    tokenVersion: 1,
    isVerified: true,
  });

  const { accessToken, refreshToken } = issueTokens(newUser);

  return {
    message: "Registration successful",
    accessToken,
    refreshToken,
    user: sanitizeUser(newUser),
  };
};

const verifyUserByOTP = async (email: string, otp: string) => {
  const user = await UserModel.findOne({ email }).select("+tokenVersion");
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  const otpRecord = await OtpModel.findOne({ identifier: email });
  if (!otpRecord || otpRecord.otpCode !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }
  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  }

  await OtpModel.deleteMany({ identifier: email });
  user.isVerified = true;
  await user.save();

  return issueTokens(user);
};

const loginUser = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email }).select("+password +tokenVersion");
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  if (user.status === UserStatus.DELETED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is deleted");
  }

  const isCorrect = await comparePassword(password, user.password);
  if (!isCorrect) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  const { accessToken, refreshToken } = issueTokens(user);

  return {
    message: "Login successful",
    isVerify: true,
    data: {
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    },
  };
};

const refreshToken = async (token: string) => {
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const user = await UserModel.findById(decoded.id || decoded.userId).select(
    "+tokenVersion"
  );
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");

  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token expired or reused");
  }

  return issueTokens(user);
};

const getMyProfile = async (email: string) => {
  const profile = await UserModel.findOne({ email }).select(USER_PUBLIC_FIELDS);
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  return profile;
};

const forgetPassword = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  const otpToken = await sendOtp(
    email,
    OtpType.PASSWORD_RESET,
    user.name,
    user._id.toString(),
    config.jwt.password_reset_secret,
    config.jwt.otp_expires_in,
    "Reset your password"
  );

  return {
    message: "OTP sent to email",
    token: otpToken?.otpToken,
    cooldownSeconds: otpToken?.cooldownSeconds,
  };
};

const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const user = await UserModel.findOne({ email }).select("+password");
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  const otpRecord = await OtpModel.findOne({
    identifier: email,
    type: "PASSWORD_RESET",
  });

  if (!otpRecord || otpRecord.otpCode !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }
  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  }

  await OtpModel.deleteMany({ identifier: email, type: "PASSWORD_RESET" });
  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: "Password reset successful" };
};

const changePassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  const isCorrect = await comparePassword(oldPassword, user.password);
  if (!isCorrect) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Old password incorrect");
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: "Password changed successfully" };
};

const sendOtpService = async (email: string, type: OtpType) => {
  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  let secret = "";
  if (type === OtpType.EMAIL_VERIFICATION) {
    if (user.isVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User is already verified");
    }
    secret = config.jwt.email_verification_secret;
  } else if (type === OtpType.PASSWORD_RESET) {
    secret = config.jwt.password_reset_secret;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP type");
  }

  const otpToken = await sendOtp(
    email,
    type,
    user.name,
    user._id.toString(),
    secret,
    config.jwt.otp_expires_in,
    type === OtpType.EMAIL_VERIFICATION ? "Verify your email" : "Reset Password",
    { throwOnCooldown: true }
  );

  return {
    message: "OTP sent to email",
    token: otpToken?.otpToken,
    cooldownSeconds: otpToken?.cooldownSeconds,
  };
};

const logout = async (userId: string) => {
  const user = await UserModel.findById(userId).select("+tokenVersion");
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  user.tokenVersion += 1;
  await user.save();

  return { message: "Logged out successfully" };
};

export const AuthServices = {
  registerUser,
  verifyUserByOTP,
  loginUser,
  refreshToken,
  getMyProfile,
  forgetPassword,
  resetPassword,
  changePassword,
  logout,
  sendOtpService,
  loginAdmin,
};
