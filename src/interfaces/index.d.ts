import express, { Application } from "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export interface CustomError extends Error {
  status?: number;
  code?: string;
}
