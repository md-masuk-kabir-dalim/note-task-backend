import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import config from "../../config";

export const rateLimiter = (maxRequests: number, windowMinutes = 2) => {
  if (config.env === "test") {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      success: false,
      message: `Too many requests. Try again in ${windowMinutes} minute(s).`,
    },
  });
};
