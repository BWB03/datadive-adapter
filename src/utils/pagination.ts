import { z } from "zod";
import { PaginationSchema } from "../schema/universal.js";

export type Pagination = z.infer<typeof PaginationSchema>;

export function extractPagination(raw: {
  currentPage?: number;
  pageSize?: number;
  lastPage?: number;
  total?: number;
  hasNext?: boolean;
}): Pagination | undefined {
  if (raw.currentPage == null) return undefined;
  return {
    current_page: raw.currentPage,
    total_pages: raw.lastPage ?? 1,
    total_items: raw.total ?? 0,
    has_more: raw.hasNext ?? false,
  };
}
