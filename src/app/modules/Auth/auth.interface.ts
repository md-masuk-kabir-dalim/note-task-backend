import { Types } from "mongoose";
import { OtpType } from "./otp.model";

export interface IOtp extends Document {
  identifier: string;
  otpCode: string;
  userId: Types.ObjectId;
  type: OtpType;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
