import httpStatus from "http-status";
import ApiError from "../errors/ApiErrors";
import { PAGINATION } from "../constants/pagination";

type IOptions = {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type IOptionsResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const toPositiveInt = (value: number | string | undefined, fallback: number, field: string) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${field} parameter`);
  }

  return parsed;
};

const calculatePagination = (options: IOptions): IOptionsResult => {
  const page = toPositiveInt(options.page, PAGINATION.DEFAULT_PAGE, "page");
  const rawLimit = toPositiveInt(options.limit, PAGINATION.DEFAULT_LIMIT, "limit");
  const limit = Math.min(rawLimit, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

const buildPagination = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
});

export const paginationHelpers = {
  calculatePagination,
  buildPagination,
};
