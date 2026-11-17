"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface CustomTableColumn<T> {
  header: string;
  align?: "left" | "center" | "right";
  cell: (row: T) => React.ReactNode;
}

export interface CustomTableStatusFilter<T> {
  getValue: (row: T) => string;
  options: string[];
}

export interface CustomTableProps<T> {
  title: string;
  columns: CustomTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  searchableFields?: (row: T) => string[];
  statusFilter?: CustomTableStatusFilter<T>;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  addBtnLabel?: string;
  onAdd?: () => void;
  emptyMessage?: string;
  legends?: React.ReactNode;
  className?: string;
}

export function CustomTable<T>({
  title,
  columns,
  data,
  getRowId,
  searchableFields,
  statusFilter,
  rowsPerPageOptions = [5, 10, 20],
  defaultRowsPerPage = 5,
  addBtnLabel,
  onAdd,
  emptyMessage = "No results found.",
  legends,
  className = "border border-border bg-background p-6",
}: CustomTableProps<T>) {
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusValue, setStatusValue] = useState<string>(
    statusFilter?.options[0] ?? "All Status",
  );

  const filtered = useMemo(() => {
    let rows = data;

    if (statusFilter && statusValue !== statusFilter.options[0]) {
      rows = rows.filter((row) => statusFilter.getValue(row) === statusValue);
    }

    if (searchableFields && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((row) =>
        searchableFields(row).some((field) =>
          field.toLowerCase().includes(term),
        ),
      );
    }

    return rows;
  }, [data, searchTerm, searchableFields, statusFilter, statusValue]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, filtered.length);

  return (
    <div className={`min-w-0 rounded-xl space-y-4 ${className}`}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      {/* Controls */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => {
                setRowsPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-25 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rowsPerPageOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} Rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {searchableFields && (
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search..."
                  className="h-9 w-full pl-8 text-xs sm:w-60"
                />
              </div>
            )}
          </div>

          {statusFilter && (
            <Select
              value={statusValue}
              onValueChange={(v) => {
                setStatusValue(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[288px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilter.options.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onAdd && <Button onClick={onAdd}><Plus size={16} />{addBtnLabel || "Add"}</Button>}
        </div>

        {legends && legends}
      </div>

      {/* Table */}
      <Table
        className="min-w-190"
        containerClassName="border border-border rounded-md"
      >
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow className="border-border hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-xs text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((row) => (
              <TableRow
                key={getRowId(row)}
                className="border-border hover:bg-gray-50/70"
              >
                {columns.map((column, index) => (
                  <TableCell key={index}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          Showing {rangeStart}-{rangeEnd} of {filtered.length}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-3 w-3" /> Previous
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (value) => (
              <Button
                key={value}
                size="sm"
                variant={currentPage === value ? "default" : "outline"}
                className="h-7 w-7 p-0 text-[11px]"
                onClick={() => setPage(value)}
              >
                {value}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
