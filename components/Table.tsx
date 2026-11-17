"use client";

import type { ReactNode } from "react";
import {
  Search,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import type {
  TableColumn,
  TableEmptyState,
  TableFilter,
  TablePagination
} from "@/types/type";
import AddButton from "./AddButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: TableFilter[];
  onResetFilters?: () => void;
  pagination?: TablePagination;
  emptyState?: TableEmptyState;
  name?: string;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string | null, dir: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  toolbarActions?: ReactNode;
  toolbarLayout?: "horizontal" | "vertical";
  className?: string;
};

export default function Table<T>({
  columns,
  data,
  getRowId,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  onResetFilters,
  pagination,
  emptyState,
  name,
  sortKey: sortKeyProp,
  sortDir: sortDirProp,
  onSortChange,
  onRowClick,
  toolbarActions,
  toolbarLayout = "horizontal",
  className
}: TableProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc">("asc");

  const isControlled = sortKeyProp !== undefined && onSortChange !== undefined;
  const sortKey = isControlled ? sortKeyProp : internalSortKey;
  const sortDir: "asc" | "desc" = isControlled
    ? (sortDirProp ?? "asc")
    : internalSortDir;

  const showSearch = onSearchChange !== undefined;

  const handleSort = (key: string) => {
    let nextDir: "asc" | "desc";
    let nextKey: string | null;
    if (sortKey !== key) {
      nextKey = key;
      nextDir = "asc";
    } else if (sortDir === "asc") {
      nextKey = key;
      nextDir = "desc";
    } else {
      nextKey = null;
      nextDir = "asc";
    }
    if (isControlled) {
      onSortChange(nextKey, nextDir);
    } else {
      setInternalSortKey(nextKey);
      setInternalSortDir(nextDir);
    }
  };

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalEntries / pagination.pageSize))
    : 1;

  // Pagination Page Number
  const paginationRange = useMemo(() => {
    if (!pagination) return [];
    const { page } = pagination;
    const pages = new Set<number | "ellipsis">();

    pages.add(1);
    pages.add(totalPages);
    for (let p = page - 1; p <= page + 1; p++) {
      if (p > 1 && p < totalPages) pages.add(p);
    }

    const sorted = Array.from(pages).sort(
      (a, b) =>
        (a === "ellipsis" ? 0 : (a as number)) -
        (b === "ellipsis" ? 0 : (b as number))
    );

    const withEllipsis: (number | "ellipsis")[] = [];
    let prev = 0;
    for (const p of sorted) {
      const num = p as number;
      if (prev && num - prev > 1) withEllipsis.push("ellipsis");
      withEllipsis.push(num);
      prev = num;
    }
    return withEllipsis;
  }, [pagination, totalPages]);

  // Entries Count
  const startEntry = pagination
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const endEntry = pagination
    ? data.length === 0
      ? 0
      : Math.min(startEntry - 1 + data.length, pagination.totalEntries)
    : 0;

  return (
    <div
      className={cn(
        "w-full rounded-lg bg-white p-4 shadow-sm space-y-3",
        className
      )}
    >
      {/* Search and Filter */}
      {(showSearch || (filters && filters.length > 0) || toolbarActions) && (
        <div
          className={cn(
            "flex gap-3",
            toolbarLayout === "vertical"
              ? "flex-col items-stretch"
              : "flex-wrap items-center"
          )}
        >
          {/* Search Input */}
          {showSearch && (
            <div className="relative min-w-0 max-w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "pl-10",
                  toolbarLayout === "vertical" ? "w-full" : "w-sm max-w-full"
                )}
              />
            </div>
          )}

          {/* Filter Select */}
          {filters?.map((filter) =>
            filter.searchable ? (
              <Popover key={filter.key}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="min-w-36 justify-between font-normal"
                  >
                    {filter.options.find(
                      (option) => option.value === filter.value
                    )?.label ?? filter.placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={
                        filter.searchPlaceholder ??
                        `Search ${filter.placeholder.toLowerCase()}...`
                      }
                    />
                    <CommandList>
                      <CommandEmpty>No option found.</CommandEmpty>
                      <CommandGroup>
                        {filter.options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => filter.onChange(option.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                option.value === filter.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Select
                key={filter.key}
                value={filter.value}
                onValueChange={filter.onChange}
              >
                <SelectTrigger
                  className={
                    toolbarLayout === "horizontal"
                      ? "w-auto min-w-36 max-w-full"
                      : undefined
                  }
                >
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          )}
          {onResetFilters &&
            filters?.some((filter) => filter.value !== "all") && (
              <Button type="button" variant="outline" onClick={onResetFilters}>
                Clear filters
              </Button>
            )}
          {toolbarActions}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <ShadTable>
          {/* Table Column Header */}
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={cn(col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-700 text-sm font-semibold"
                    >
                      {col.header}
                      <span className="flex items-center -space-x-2">
                        <MoveUp
                          size={12}
                          className={cn(
                            sortKey === col.key && sortDir === "asc"
                              ? "text-primary-700"
                              : "text-gray-300"
                          )}
                        />
                        <MoveDown
                          size={12}
                          className={cn(
                            sortKey === col.key && sortDir === "desc"
                              ? "text-primary-700"
                              : "text-gray-300"
                          )}
                        />
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Row Content */}
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <svg
                      role="img"
                      aria-label="No data found"
                      viewBox="0 0 259 190"
                      className="h-40 w-40"
                    >
                      <use href="/data-not-found.svg" />
                    </svg>
                    <strong className="text-base text-foreground">
                      No {name}s found
                    </strong>
                    <p className="text-sm text-muted-foreground text-center">
                      {emptyState?.description ?? (
                        <>
                          You haven&apos;t added any {name}s yet. <br />
                          Get Started by creating your first {name} record.
                        </>
                      )}
                    </p>
                    {emptyState?.actionLabel && (
                      <AddButton
                        label={emptyState.actionLabel}
                        onClick={emptyState.onAction}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={(event) => {
                    if (
                      !onRowClick ||
                      (event.target as HTMLElement).closest(
                        "a,button,input,select,textarea,[role='menuitem']"
                      )
                    )
                      return;
                    onRowClick(row);
                  }}
                  onKeyDown={(event) => {
                    if (
                      !onRowClick ||
                      (event.key !== "Enter" && event.key !== " ")
                    )
                      return;
                    event.preventDefault();
                    onRowClick(row);
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn(col.className)}>
                      {col.render
                        ? col.render(row)
                        : String(Reflect.get(Object(row), col.key) ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadTable>
      </div>

      {/* Page Count & Pagination */}
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm text-foreground">
            Showing {data.length === 0 ? 0 : startEntry} to {endEntry} of{" "}
            {pagination.totalEntries} entries
          </span>

          <div className="flex items-center gap-1.5">
            {pagination.onPageSizeChange && (
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  pagination.onPageSizeChange?.(Number(value))
                }
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(pagination.pageSizeOptions ?? [10, 25, 50, 100]).map(
                    (size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} per page
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={
                pagination.page <= 1 ||
                (pagination.canPageChange
                  ? !pagination.canPageChange(pagination.page - 1)
                  : false)
              }
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {paginationRange.map((p, idx) =>
              p === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-sm text-gray-400"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === pagination.page ? "default" : "outline"}
                  size="icon"
                  disabled={
                    pagination.canPageChange
                      ? !pagination.canPageChange(p)
                      : false
                  }
                  className={cn(
                    "h-8 w-8",
                    p === pagination.page &&
                      "bg-primary-700 hover:bg-primary-700"
                  )}
                  onClick={() => pagination.onPageChange(p)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={
                pagination.page >= totalPages ||
                (pagination.canPageChange
                  ? !pagination.canPageChange(pagination.page + 1)
                  : false)
              }
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
