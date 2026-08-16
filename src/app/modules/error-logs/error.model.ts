import { Schema, model } from "mongoose";

const ErrorLogSchema = new Schema(
  {
    level: String,
    message: String,
    stack: String,
    statusCode: Number,
    route: String,
    method: String,
    userId: String,
    ip: String,
    userAgent: String,
    service: String,
    environment: String,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const ErrorLog = model("ErrorLog", ErrorLogSchema);
