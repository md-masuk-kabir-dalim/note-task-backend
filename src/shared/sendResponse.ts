import { Response } from "express";
import { PaginationMeta } from "../utils/paginationHelper";

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  apiVersion?: string;
}

interface ResponseData<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T | null;
  errors?: unknown;
  meta?: Meta | null;
  pagination?: PaginationMeta;
}

const sendResponse = <T>(res: Response, jsonData: ResponseData<T>) => {
  res.status(jsonData.statusCode).json({
    success: jsonData.success,
    message: jsonData.message,
    data: jsonData.data ?? null,
    errors: jsonData.errors ?? null,
    ...(jsonData.pagination ? { pagination: jsonData.pagination } : {}),
    meta: {
      apiVersion: "v1",
      ...jsonData.meta,
      ...(jsonData.pagination ?? {}),
    },
  });
};

export default sendResponse;
