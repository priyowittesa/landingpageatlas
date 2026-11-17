import { ReactNode } from "react";

export type TableFilter = {
  key: string;
  placeholder: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export type TableColumn<T> = {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => ReactNode;
};

export type TableEmptyState = {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type TablePagination = {
  page: number;
  pageSize: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  canPageChange?: (page: number) => boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
};
