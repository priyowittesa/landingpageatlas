"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  useExportAuditTrail,
  useTokenAuditTrail
} from "../hooks/useAdminTokenPolicy";
import {
  auditActionClassMap,
  auditActionLabels,
  auditActionOptions,
  type TokenAuditAction,
  type TokenAuditEntry
} from "../types/admin";

const PAGE_SIZE = 10;
const ALL_ACTIONS = "all";

/** Soft pill for the POLICY column. */
function AuditActionBadge({ action }: { action: TokenAuditAction }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        auditActionClassMap[action]
      )}
    >
      {auditActionLabels[action]}
    </Badge>
  );
}

/** `quota_amount  50.000 → 90.000  +2` cell. */
function ChangeCell({ entry }: { entry: TokenAuditEntry }) {
  const first = entry.diff[0];
  const extra = entry.diff.length - 1;
  if (!first) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-sm text-gray-600">{first.field}</span>
      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-sm font-semibold text-rose-600">
        {first.old}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-600">
        {first.new}
      </span>
      {extra > 0 && <span className="text-sm text-gray-400">+{extra}</span>}
    </div>
  );
}

/** Two-line WHEN cell: date on top, time underneath. */
function WhenCell({ occurredAt }: { occurredAt: string }) {
  const date = new Date(occurredAt);
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-800">{day}</span>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

/** One expandable audit row. */
function AuditRow({ entry }: { entry: TokenAuditEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        className="cursor-pointer border-gray-100 hover:bg-gray-50/70"
        onClick={() => setExpanded((value) => !value)}
      >
        <TableCell className="w-12 pl-4">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-700 transition-transform",
              expanded && "rotate-90"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        </TableCell>
        <TableCell>
          <WhenCell occurredAt={entry.occurredAt} />
        </TableCell>
        <TableCell className="text-sm font-semibold text-gray-900">
          {entry.adminName}
        </TableCell>
        <TableCell>
          <AuditActionBadge action={entry.action} />
        </TableCell>
        <TableCell className="text-sm text-gray-700">
          {entry.tenantName}
        </TableCell>
        <TableCell>
          <ChangeCell entry={entry} />
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="border-gray-100 bg-gray-50/40 hover:bg-gray-50/40">
          <TableCell colSpan={6} className="py-4">
            <div className="ml-14 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Field changes
              </p>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="grid grid-cols-3 gap-0 border-b border-gray-100 bg-gray-50/60 px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Field
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Old
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    New
                  </span>
                </div>
                {entry.diff.map((change, index) => (
                  <div
                    key={`${entry.id}-${index}`}
                    className="grid grid-cols-3 gap-0 border-b border-gray-100 px-4 py-2 last:border-0"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {change.field}
                    </span>
                    <span>
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                        {change.old}
                      </span>
                    </span>
                    <span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                        {change.new}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">{entry.summary}</p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/** Numbered pagination matching the design footer. */
function Pagination({
  currentPage,
  totalPages,
  onChange
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1 text-xs"
        disabled={currentPage <= 1}
        onClick={() => onChange(currentPage - 1)}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </Button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={cn(
            "h-9 w-9 rounded-lg border text-xs font-medium transition-colors",
            page === currentPage
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          {page}
        </button>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1 text-xs"
        disabled={currentPage >= totalPages}
        onClick={() => onChange(currentPage + 1)}
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function TokenUsageAuditTrail() {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState<TokenAuditAction | typeof ALL_ACTIONS>(
    ALL_ACTIONS
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Audit trail" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

  const filter = useMemo(
    () => ({
      search,
      action,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: PAGE_SIZE
    }),
    [search, action, from, to, page]
  );

  const { data, isLoading, isError } = useTokenAuditTrail(filter);
  const exportAudit = useExportAuditTrail();

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startEntry = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * PAGE_SIZE, total);

  const resetPagination = () => setPage(1);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Audit trail
          </h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Every policy change, who made it, and exactly which fields moved.
            Entries are read-only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-sm"
            onClick={() => exportAudit.mutate(filter)}
            disabled={exportAudit.isPending}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="h-10 gap-1.5 bg-gray-400 text-sm hover:bg-gray-500"
            disabled
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPagination();
            }}
            placeholder="Search..."
            className="h-11 pl-9 text-sm"
          />
        </div>
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value as TokenAuditAction | typeof ALL_ACTIONS);
            resetPagination();
          }}
        >
          <SelectTrigger className="h-11 w-40 text-sm">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ACTIONS}>All actions</SelectItem>
            {auditActionOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {auditActionLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <DatePicker
            value={from}
            onChange={(value) => {
              setFrom(value);
              resetPagination();
            }}
            placeholder="From"
            className="h-11 w-36 text-sm"
            max={to || undefined}
          />
          <span className="text-sm text-gray-400">-</span>
          <DatePicker
            value={to}
            onChange={(value) => {
              setTo(value);
              resetPagination();
            }}
            placeholder="To"
            className="h-11 w-36 text-sm"
            min={from || undefined}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 overflow-hidden p-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-220">
            <TableHeader>
              <TableRow className="border-gray-100 bg-white hover:bg-white">
                <TableHead className="w-12 pl-4" />
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  When
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Admin
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Policy
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tenant
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Change
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    Loading audit entries…
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    Failed to load audit entries. Please try again.
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    No audit entries match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <span className="text-sm text-gray-500">
            Showing {startEntry}-{endEntry} of {total}
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setPage}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
