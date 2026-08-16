import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { ZodError } from "zod";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import logger from "../../utils/logger";
import { logSecurityEvent } from "../../utils/auditLogger";

interface IGenericErrorMessage {
  path: string;
  message: string;
}

const GlobalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = error?.message || "An unexpected error occurred.";
  let errorMessages: IGenericErrorMessage[] = [];

  const createErrorMessage = (
    path: string,
    msg: string
  ): IGenericErrorMessage => ({ path, message: msg });

  /* -------------------- SECURITY LOGGER -------------------- */
  const logSecurity = (reason: string) => {
    logSecurityEvent(reason, {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  };

  /* -------------------- ERROR TYPE HANDLING -------------------- */

  // CSRF
  if (error.code === "EBADCSRFTOKEN") {
    statusCode = httpStatus.FORBIDDEN;
    message = "Invalid CSRF token";
    errorMessages.push(createErrorMessage(req.originalUrl, message));
    logSecurity("Invalid CSRF token detected");
  }

  // Mongoose Validation
  else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed";
    Object.values(error.errors).forEach((err: any) => {
      errorMessages.push(createErrorMessage(err.path, err.message));
    });
  }

  // Duplicate key
  else if (error?.code === 11000) {
    statusCode = httpStatus.CONFLICT;
    const field = Object.keys(error.keyValue)[0];
    message = `Duplicate value for '${field}' field.`;
    errorMessages.push(createErrorMessage(field, message));
  }

  // Cast error
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = `Invalid value for '${error.path}'`;
    errorMessages.push(createErrorMessage(error.path, message));
  }

  // Zod
  else if (error instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation error";
    error.issues.forEach((issue) => {
      errorMessages.push(
        createErrorMessage(issue.path.join("."), issue.message)
      );
    });
  }

  // Custom API Error
  else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.errors
      ? Array.isArray(error.errors)
        ? error.errors
        : [{ path: "", message: error.errors }]
      : [{ path: "", message }];

    if ([401, 403].includes(statusCode)) {
      logSecurity(`Auth error: ${message}`);
    }
  }

  // JWT
  else if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid or expired token";
    errorMessages.push(createErrorMessage("", message));
    logSecurity(`JWT error: ${error.message}`);
  }

  // Fallback
  else if (error instanceof Error) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessages.push(createErrorMessage("", message));
  }

  /* -------------------- WINSTON DB LOG (Vercel Safe) -------------------- */
  logger.error(message, {
    statusCode,
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    userId: (req as any)?.user?.id,
    stack: error?.stack,
    meta: {
      errors: errorMessages,
      params: req.params,
      query: req.query,
      body: "[SANITIZED]",
    },
  });

  /* -------------------- RESPONSE -------------------- */
  const response: any = {
    success: false,
    message,
    data: null,
    errors: errorMessages,
    meta: { apiVersion: "v1" },
  };

  if (config.env !== "production") {
    response.debug = {
      name: error.name,
      stack: error.stack,
    };
  }

  res.status(statusCode).json(response);
};

export default GlobalErrorHandler;
