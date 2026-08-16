import { Types } from "mongoose";
import httpStatus from "http-status";
import ApiError from "../errors/ApiErrors";

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export const isValidObjectId = (id: unknown): id is string => {
  if (typeof id !== "string" || !OBJECT_ID_PATTERN.test(id)) {
    return false;
  }

  return Types.ObjectId.isValid(id);
};

export const toObjectId = (id: string): Types.ObjectId => {
  if (!isValidObjectId(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid ID");
  }

  return new Types.ObjectId(id);
};

export const assertValidObjectId = (id: unknown, fieldName = "id"): string => {
  if (!isValidObjectId(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${fieldName}`);
  }

  return id;
};
