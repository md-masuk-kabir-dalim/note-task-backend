import { Document, Model, Query } from "mongoose";
import { paginationHelpers } from "../utils/paginationHelper";

export interface PopulateOption {
  path: string;
  select?: string;
}

interface SearchPaginateOptions<T extends Document> {
  model: Model<T>;
  searchFields?: (keyof T)[];
  filters?: Record<string, unknown>;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  select?: string;
  populate?: PopulateOption | PopulateOption[];
  skipCount?: boolean;
}

const hasMongoOperator = (value: object) =>
  Object.keys(value).some((key) => key.startsWith("$"));

export const searchPaginate = async <T extends Document>({
  model,
  searchFields = [],
  filters = {},
  search = "",
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  select,
  populate,
  skipCount = false,
}: SearchPaginateOptions<T>) => {
  const pagination = paginationHelpers.calculatePagination({
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const filter: Record<string, unknown> = {};

  if (search && searchFields.length > 0) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filter.$or = searchFields.map((field) => ({
      [field]: regex,
    }));
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (typeof value === "object" && !Array.isArray(value)) {
      if (hasMongoOperator(value)) {
        (filter as Record<string, unknown>)[key] = value;
        return;
      }

      const range: Record<string, unknown> = {};
      const rangeValue = value as { gte?: unknown; lte?: unknown };
      if (rangeValue.gte !== undefined) range.$gte = rangeValue.gte;
      if (rangeValue.lte !== undefined) range.$lte = rangeValue.lte;
      if (Object.keys(range).length) {
        (filter as Record<string, unknown>)[key] = range;
      }
      return;
    }

    if (Array.isArray(value)) {
      (filter as Record<string, unknown>)[key] = { $in: value };
      return;
    }

    (filter as Record<string, unknown>)[key] = value;
  });

  let queryBuilder: Query<T[], T> = model
    .find(filter)
    .lean()
    .sort({ [pagination.sortBy]: pagination.sortOrder === "asc" ? 1 : -1 })
    .skip(pagination.skip)
    .limit(pagination.limit) as Query<T[], T>;

  if (select) queryBuilder = queryBuilder.select(select);

  if (populate) {
    (Array.isArray(populate) ? populate : [populate]).forEach((item) => {
      queryBuilder = queryBuilder.populate(item);
    });
  }

  const dataPromise = queryBuilder.exec();
  const totalPromise = skipCount
    ? Promise.resolve(0)
    : model.countDocuments(filter);

  const [total, data] = await Promise.all([totalPromise, dataPromise]);
  const resolvedTotal = skipCount ? data.length : total;
  const paginationMeta = paginationHelpers.buildPagination(
    pagination.page,
    pagination.limit,
    resolvedTotal
  );

  return {
    meta: {
      total: paginationMeta.total,
      page: paginationMeta.page,
      limit: paginationMeta.limit,
      pages: paginationMeta.totalPages,
      totalPages: paginationMeta.totalPages,
    },
    pagination: paginationMeta,
    data,
  };
};
