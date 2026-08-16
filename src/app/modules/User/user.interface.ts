import { Document } from "mongoose";
import { UserRole, UserStatus } from "./user.model";

export interface IUser extends Document {
  name: string;
  fullName?: string;
  email: string;
  phoneNo?: string;
  image?: string;
  password: string;
  role: UserRole;
  interests: string[];
  status: UserStatus;
  isVerified: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
