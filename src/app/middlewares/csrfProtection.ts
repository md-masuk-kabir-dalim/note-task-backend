import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import config from "../../config";

const CSRF_SECRET = config.jwt.CSRF_SECRET;
const CSRF_COOKIE_NAME = "XSRF-TOKEN";

// Generate token
function generateCsrfToken(sessionId: string) {
  const random = crypto.randomBytes(24).toString("hex");
  const hash = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(sessionId + random)
    .digest("hex");
  return `${random}.${hash}`;
}

// Validate token
function verifyCsrfToken(token: string, sessionId: string): boolean {
  const [random, hash] = token.split(".");
  if (!random || !hash) return false;
  const validHash = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(sessionId + random)
    .digest("hex");
  return hash === validHash;
}

// Middleware: set token only if not exists
export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let sessionId = req.cookies["SESSION-ID"];
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie("SESSION-ID", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      path: "/",
      maxAge: 1000 * 60,
    });
  }

  // Only generate token if cookie does not exist
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken(sessionId);
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: false,
      sameSite: "none",
      path: "/",
      maxAge: 1000 * 60,
    });
    res.locals.csrfToken = token;
  } else {
    res.locals.csrfToken = req.cookies[CSRF_COOKIE_NAME];
  }

  next();
};

// Middleware: validate token
export const validateCsrf = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    (req.headers["x-csrf-token"] as string) || req.cookies[CSRF_COOKIE_NAME];
  const sessionId = req.cookies["SESSION-ID"];

  // if (!token || !sessionId || !verifyCsrfToken(token, sessionId)) {
  //   res.status(403).json({ success: false, message: "Invalid CSRF token" });
  //   return;
  // }

  next();
};
