import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import { jwtHelpers } from "../../utils/jwtHelpers";
import { JWT_SECRET_TYPE } from "../../content/secret-type";
import { UserModel, UserStatus } from "../modules/User/user.model";
import { ACCESS_COOKIE } from "../modules/Auth/auth.constants";

const resolveSecret = (secretType?: string): Secret => {
  switch (secretType) {
    case JWT_SECRET_TYPE.REFRESH:
      return config.jwt.refresh_secret as Secret;
    case JWT_SECRET_TYPE.EMAIL_VERIFICATION:
      return config.jwt.email_verification_secret as Secret;
    case JWT_SECRET_TYPE.PASSWORD_RESET:
      return config.jwt.password_reset_secret as Secret;
    case JWT_SECRET_TYPE.ACCESS:
    default:
      return config.jwt.access_secret as Secret;
  }
};

const auth = (...roles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const jwtSecretType = req.headers["x-secret-type"] as string | undefined;
      const authHeader = req.headers.authorization;

      let token: string | undefined;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      if (!token) {
        token =
          req.cookies?.[ACCESS_COOKIE] ??
          req.cookies?.accessToken ??
          req.cookies?.otpToken;
      }

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
      }

      let verifiedUser: JwtPayload;

      try {
        verifiedUser = jwtHelpers.verifyToken(
          token,
          resolveSecret(jwtSecretType)
        );
      } catch {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Invalid or expired token"
        );
      }

      const userId = (verifiedUser.userId || verifiedUser.id) as string | undefined;

      const user = await UserModel.findOne({
        $or: [
          ...(verifiedUser.email ? [{ email: verifiedUser.email }] : []),
          ...(userId ? [{ _id: userId }] : []),
        ],
      }).select("+tokenVersion");

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Authentication required");
      }

      if (user.status === UserStatus.DELETED) {
        throw new ApiError(httpStatus.FORBIDDEN, "Your account is deleted");
      }

      if (roles.length && !roles.includes(user.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You are not authorized to access this resource"
        );
      }

      req.user = {
        ...verifiedUser,
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const requireAuth = auth();
export const requireRole = (...roles: string[]) => auth(...roles);

export default auth;
