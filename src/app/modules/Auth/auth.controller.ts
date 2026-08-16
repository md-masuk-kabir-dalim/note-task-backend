import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import ApiError from "../../../errors/ApiErrors";
import { REFRESH_COOKIE } from "./auth.constants";
import {
  clearAuthCookies,
  clearOtpCookie,
  setAuthCookies,
  setOtpCookie,
} from "./auth.cookies";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.registerUser(req.body);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: result.message,
    data: result,
  });
});

const verifyUserByOTP = catchAsync(async (req: Request, res: Response) => {
  const email = req.user?.email;
  const { otp } = req.body;
  const result = await AuthServices.verifyUserByOTP(email, otp);
  const { accessToken, refreshToken } = result || {};

  clearOtpCookie(res);
  setAuthCookies(res, accessToken, refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User verified successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthServices.loginUser(email, password);
  const { accessToken, refreshToken } = result.data;

  setAuthCookies(res, accessToken, refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token missing");
  }

  const result = await AuthServices.refreshToken(token);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.getMyProfile(req.user.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgetPassword(req.body.email);

  setOtpCookie(res, result?.token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Forget password OTP sent successfully",
    data: { message: result.message },
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resetPassword(
    req.user?.email,
    req.body.otp,
    req.body.password
  );
  clearOtpCookie(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.changePassword(
    req.user.id,
    req.body.newPassword,
    req.body.oldPassword
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const otpSend = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.sendOtpService(req.body.email, req.body.type);

  setOtpCookie(res, result?.token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent successfully",
    data: result,
  });
});

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginAdmin(req.body.email, req.body.password);
  const { accessToken, refreshToken, user } = result.data;

  setAuthCookies(res, accessToken, refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: { accessToken, refreshToken, user },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");

  await AuthServices.logout(userId);
  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logout successful",
    data: null,
  });
});

export const AuthController = {
  registerUser,
  verifyUserByOTP,
  loginUser,
  refreshToken,
  getMyProfile,
  forgetPassword,
  resetPassword,
  changePassword,
  otpSend,
  loginAdmin,
  logout,
};
