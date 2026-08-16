import { CookieOptions, Response } from "express";
import config from "../../../config";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth.constants";

const isProd = config.env === "production";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

const ACCESS_MAX_AGE_MS = 1000 * 60 * 60 * 24;
const REFRESH_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const OTP_MAX_AGE_MS = 1000 * 60 * 10;

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...authCookieOptions,
    maxAge: ACCESS_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...authCookieOptions,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function setOtpCookie(res: Response, token?: string) {
  if (!token) return;
  res.cookie("otpToken", token, {
    ...authCookieOptions,
    maxAge: OTP_MAX_AGE_MS,
  });
}

export function clearOtpCookie(res: Response) {
  res.clearCookie("otpToken", authCookieOptions);
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, authCookieOptions);
  res.clearCookie(REFRESH_COOKIE, authCookieOptions);
  res.clearCookie("accessToken", authCookieOptions);
  res.clearCookie("refreshToken", authCookieOptions);
}
