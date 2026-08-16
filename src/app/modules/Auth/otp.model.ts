import { Schema, model, Types, Document } from "mongoose";
import { IOtp } from "./auth.interface";

// Enum
export enum OtpType {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  PHONE_NUMBER_VERIFICATION = "PHONE_NUMBER_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
  TWO_FACTO = "TWO_FACTO",
}

const OtpSchema = new Schema<IOtp>(
  {
    identifier: { type: String, required: true, unique: true },
    otpCode: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    type: { type: String, enum: Object.values(OtpType), required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const OtpModel = model<IOtp>("Otp", OtpSchema);
