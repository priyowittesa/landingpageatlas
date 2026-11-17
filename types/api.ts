/** Standard API envelope */
export interface ApiResponse<T, U = undefined> {
  status: boolean;
  code: number;
  message: string;
  additional?: U;
  data: T;
}

/** Error response from the backend */
export interface ApiResponseError {
  statusCode: string;
  message: string | string[];
}

/** Paginated list response */
export interface ApiResponsePagination<T, U = undefined> {
  status: boolean;
  code: number;
  message: string;
  data: T;
  total: number;
  limit: number;
  offset: number;
  additional?: U;
}

/** Standard filter params for paginated list endpoints */
export interface PaginationFilter {
  perPage: number;
  page: number;
  search?: string;
  sortOrder?: "desc" | "asc";
  sortBy?: string;
  isArchived?: string;
}

/** Bulk delete payload */
export interface DeleteBulkDto {
  ids: string[];
}

/** Query key factory — prevents duplicate requests and fragile invalidation */
export const queryKeys = {
  user: {
    all: () => ["getUser"] as const,
    me: () => ["getUserMe"] as const,
  },
  campaign: {
    all: () => ["getCampaign"] as const,
    list: (filter: PaginationFilter) => ["getCampaign", filter] as const,
    infinite: (search: string) => ["getCampaignInfinite", search] as const,
    detail: (id: string) => ["getOneCampaign", id] as const,
  },
  customer: {
    all: () => ["getCustomer"] as const,
    list: (filter: PaginationFilter) => ["getCustomer", filter] as const,
    infinite: (search: string) => ["getCustomerInfinite", search] as const,
    detail: (id: string) => ["getOneCustomer", id] as const,
  },
  customerField: {
    all: () => ["getCustomerField"] as const,
    detail: (id: string) => ["getOneCustomerField", id] as const,
  },
} as const;

/** Meta types for centralized cache handlers */
export type ErrorMeta = {
  errorMessage?: string;
  suppressErrorStatuses?: number[];
};
export type SuccessMeta = { successMessage?: string };
export type QueryMeta = ErrorMeta;
export type MutationMeta = ErrorMeta & SuccessMeta;
