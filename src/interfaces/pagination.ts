export type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type IPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
