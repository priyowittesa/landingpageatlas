"use client";

import { useState } from "react";
import {
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import AddButton from "@/components/AddButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "./ProductStructureStatusBadge";
import { EntityStatus, GroupStatus } from "../types";
import {
  AddAssemblyPartModal,
  AddGroupModal,
  AddLinesModal,
  AddPartModal,
} from "./ProductStructureAddModal";

function ActionsIconBtn({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex justify-center gap-1">
      <button
        type="button"
        aria-label="Edit"
        onClick={onEdit}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors border hover:bg-gray-100 text-muted-foreground`}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        aria-label="Delete"
        onClick={onDelete}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors bg-destructive hover:bg-destructive text-white`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const STATUS_FILTER_OPTIONS: Array<GroupStatus | "All Status"> = [
  "All Status",
  "Active",
  "Draft",
  "Inactive",
];

function alignClass(align?: "left" | "center" | "right") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

interface ColumnDef<T> {
  header?: string;
  align?: "left" | "center" | "right";
  cell: (row: T) => React.ReactNode;
}

interface ProductStructureTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  getSearchableText: (row: T) => string[];
  getStatus: (row: T) => string;
  statusOptions: string[];
  addBtnLabel: string;
  onAdd?: () => void;
  rowsPerPageOptions?: number[];
  emptyMessage?: string;
}

function ProductStructureTable<T>({
  title,
  data,
  columns,
  getRowId,
  getSearchableText,
  getStatus,
  statusOptions,
  addBtnLabel,
  onAdd,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  emptyMessage = "No results match your filters.",
}: ProductStructureTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    statusOptions[0] ?? "All Status",
  );
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0] ?? 5);
  const [page, setPage] = useState(1);

  const filtered = data.filter((row) => {
    const haystack = getSearchableText(row).join(" ").toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === statusOptions[0] || getStatus(row) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * rowsPerPage;
  const paginated = filtered.slice(start, start + rowsPerPage);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + rowsPerPage, filtered.length);

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
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

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="h-9 pl-8 text-xs w-60"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as EntityStatus | "All Status");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AddButton label={addBtnLabel} onClick={onAdd} />
      </div>

      {/* Table */}
      <Table
        className="min-w-190"
        containerClassName="border border-border rounded-md"
      >
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((column, index) => (
              <TableHead key={index} className={alignClass(column.align)}>
                {column.header}
              </TableHead>
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
                  <TableCell key={index} className={alignClass(column.align)}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>
          Showing {rangeStart}-{rangeEnd} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
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

interface ChildTableProps {
  datas: any[];
  onAdd?: () => void;
  onEdit?: (group: any) => void;
  onDelete?: (group: any) => void;
}

export function GroupsTable({
  datas: groups,
  onEdit,
  onDelete,
}: ChildTableProps) {
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);

  const columns: ColumnDef<any>[] = [
    {
      header: "Group Code",
      cell: (group) => <span className="font-semibold">{group.groupCode}</span>,
    },
    {
      header: "Group Name",
      cell: (group) => <span>{group.groupName}</span>,
    },
    {
      header: "Production Lines",
      align: "center",
      cell: (group) => (
        <span>
          {group.productionLines}{" "}
          {group.productionLines === 1 ? "line" : "lines"}
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (group) => <StatusBadge status={group.status} />,
    },
    {
      header: "Actions",
      align: "center",
      cell: (group) => (
        <ActionsIconBtn
          onEdit={() => onEdit?.(group)}
          onDelete={() => onDelete?.(group)}
        />
      ),
    },
  ];

  return (
    <>
      <ProductStructureTable
        title="Production Line Groups"
        data={groups}
        columns={columns}
        getRowId={(group) => group.id}
        getSearchableText={(group) => [group.groupName, group.groupCode]}
        getStatus={(group) => group.status}
        statusOptions={STATUS_FILTER_OPTIONS}
        addBtnLabel="Add Group"
        onAdd={() => setIsOpenAddModal(true)}
        emptyMessage="No production line groups match your filters."
      />

      <AddGroupModal
        open={isOpenAddModal}
        onOpenChange={() => setIsOpenAddModal((prev) => !prev)}
        // onSubmit={() => {}}
      />
    </>
  );
}

export function LineTable({ datas: lines, onEdit, onDelete }: ChildTableProps) {
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);

  const columns: ColumnDef<any>[] = [
    {
      header: "Line Code",
      cell: (line) => <span className="font-semibold">{line.code}</span>,
    },
    {
      header: "Line Name",
      cell: (line) => <span>{line.name}</span>,
    },
    {
      header: "Efficiency",
      align: "center",
      cell: (line) => <span>{line.efficiency}%</span>,
    },
    {
      header: "Status",
      align: "center",
      cell: (line) => <StatusBadge status={line.status} />,
    },
    {
      header: "Actions",
      align: "center",
      cell: (line) => (
        <ActionsIconBtn
          onEdit={() => onEdit?.(line)}
          onDelete={() => onDelete?.(line)}
        />
      ),
    },
  ];

  return (
    <>
      <ProductStructureTable
        title="Production Line"
        data={lines}
        columns={columns}
        getRowId={(line) => line.id}
        getSearchableText={(line) => [line.name, line.code]}
        getStatus={(line) => line.status}
        statusOptions={STATUS_FILTER_OPTIONS}
        addBtnLabel="Add Lines"
        onAdd={() => setIsOpenAddModal(true)}
        emptyMessage="No production line match your filters."
      />

      <AddLinesModal
        open={isOpenAddModal}
        onOpenChange={() => setIsOpenAddModal((prev) => !prev)}
        // onSubmit={() => {}}
      />
    </>
  );
}

export function PartTable({ datas: parts, onEdit, onDelete }: ChildTableProps) {
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);

  const columns: ColumnDef<any>[] = [
    {
      header: "Part Number",
      cell: (part) => <span className="font-semibold">{part.number}</span>,
    },
    {
      header: "Part Name",
      cell: (part) => <span>{part.name}</span>,
    },
    {
      header: "Back Number",
      align: "center",
      cell: (part) => <span>{part.back_number}</span>,
    },
    {
      header: "Model",
      align: "center",
      cell: (part) => <span>{part.model}</span>,
    },
    {
      header: "Cycle Time",
      align: "center",
      cell: (part) => <span>{part.cycle_time}s</span>,
    },
    {
      header: "Spm",
      align: "center",
      cell: (part) => <span>{part.spm}</span>,
    },
    {
      header: "Status",
      align: "center",
      cell: (part) => <StatusBadge status={part.status} />,
    },
    {
      header: "Actions",
      align: "center",
      cell: (line) => (
        <ActionsIconBtn
          onEdit={() => onEdit?.(line)}
          onDelete={() => onDelete?.(line)}
        />
      ),
    },
  ];

  return (
    <>
      <ProductStructureTable
        title="Part"
        data={parts}
        columns={columns}
        getRowId={(line) => line.id}
        getSearchableText={(line) => [line.name, line.code]}
        getStatus={(line) => line.status}
        statusOptions={STATUS_FILTER_OPTIONS}
        addBtnLabel="Add Part"
        onAdd={() => setIsOpenAddModal(true)}
        emptyMessage="No part match your filters."
      />

      <AddPartModal
        open={isOpenAddModal}
        onOpenChange={() => setIsOpenAddModal((prev) => !prev)}
      />
    </>
  );
}

export function AssemblyPartTable({
  datas: assemblyParts,
  onEdit,
  onDelete,
}: ChildTableProps) {
  const [isOpenAddModal, setIsOpenAddModal] = useState<boolean>(false);

  const columns: ColumnDef<any>[] = [
    {
      header: "Part Number",
      cell: (part) => <span className="font-semibold">{part.number}</span>,
    },
    {
      header: "Part Name",
      cell: (part) => <span>{part.name}</span>,
    },
    {
      header: "Usage",
      align: "center",
      cell: (part) => <span>{part.usage} pcs/unit</span>,
    },
    {
      header: "Status",
      align: "center",
      cell: (part) => <StatusBadge status={part.status} />,
    },
    {
      header: "Actions",
      align: "center",
      cell: (line) => (
        <ActionsIconBtn
          onEdit={() => onEdit?.(line)}
          onDelete={() => onDelete?.(line)}
        />
      ),
    },
  ];

  return (
    <>
      <ProductStructureTable
        title="Assembly Part"
        data={assemblyParts}
        columns={columns}
        getRowId={(line) => line.id}
        getSearchableText={(line) => [line.name, line.code]}
        getStatus={(line) => line.status}
        statusOptions={STATUS_FILTER_OPTIONS}
        addBtnLabel="Add Assembly Part"
        onAdd={() => setIsOpenAddModal(true)}
        emptyMessage="No assembly part match your filters."
      />

      <AddAssemblyPartModal
        open={isOpenAddModal}
        onOpenChange={() => setIsOpenAddModal((prev) => !prev)}
      />
    </>
  );
}
