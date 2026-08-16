import { Schema, model } from "mongoose";
import { IUser } from "./user.interface";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNo: { type: String },
    image: { type: String },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    interests: {
      type: [String],
      default: [],
    },
    isVerified: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    tokenVersion: { type: Number, default: 1, select: false },
  },
  { timestamps: true }
);


UserSchema.index({ createdAt: -1 });

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    delete record.password;
    delete record.tokenVersion;
    return record;
  },
});

UserSchema.set("toObject", {
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown>;
    delete record.password;
    delete record.tokenVersion;
    return record;
  },
});

export const UserModel = model<IUser>("User", UserSchema);
