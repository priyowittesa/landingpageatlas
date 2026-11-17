"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
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
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  useExportTokenRequests,
  useTokenUsageHistory
} from "../hooks/useTokenUsage";
import { formatDateTime, formatTokens, getMonthDateRange } from "../lib/format";
import type { TokenUsageGranularity } from "../types";
import { ConsumptionChart } from "./ConsumptionChart";
import {
  ConsumptionFilters,
  RequestStatusBadge,
  TokenUsageCard
} from "./TokenUsageShared";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const ALL_MODULES = "all";

export function TokenUsageHistory() {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [granularity, setGranularity] =
    useState<TokenUsageGranularity>("monthly");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState<string>(ALL_MODULES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Usage History" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

  const dateRange = useMemo(() => getMonthDateRange(month), [month]);
  const { data, isLoading, isFetching } = useTokenUsageHistory({
    ...dateRange,
    granularity
  });
  const exportRequests = useExportTokenRequests();
  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);

  // Module options are derived from the log so the filter never offers a value
  // that yields zero rows.
  const moduleOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.module))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter(
      (entry) =>
        (module === ALL_MODULES || entry.module === module) &&
        (!query ||
          [entry.module, entry.feature].some((value) =>
            value.toLowerCase().includes(query)
          ))
    );
  }, [entries, module, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const startEntry =
    filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, filtered.length);

  const resetPagination = () => setPage(1);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Usage History
          </h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Every AI request logged against your token quota, newest first
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 text-xs"
          onClick={() => exportRequests.mutate(dateRange)}
          disabled={exportRequests.isPending}
        >
          <Download className="h-3.5 w-3.5" />
          Export history
        </Button>
      </div>

      {/* Consumption trend */}
      <TokenUsageCard
        icon={BarChart3}
        title="Consumption"
        subtitle="Track daily token consumption over time"
        headerRight={
          <ConsumptionFilters
            month={month}
            granularity={granularity}
            onMonthChange={setMonth}
            onGranularityChange={setGranularity}
          />
        }
      >
        <ConsumptionChart
          series={data?.consumption}
          isLoading={isLoading || isFetching}
          height={220}
        />
      </TokenUsageCard>

      {/* Request log */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Recent Request</h2>
            <p className="text-xs text-gray-500">
              {filtered.length} request{filtered.length === 1 ? "" : "s"} in
              this period
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPagination();
                }}
                placeholder="Search module or feature..."
                className="h-9 w-64 pl-8 text-xs"
              />
            </div>
            <Select
              value={module}
              onValueChange={(value) => {
                setModule(value);
                resetPagination();
              }}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MODULES}>All Modules</SelectItem>
                {moduleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="gap-0 overflow-hidden p-0">
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-180">
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/60 hover:bg-gray-50/60">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Time
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Request ID
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Module
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Feature
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Tokens
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
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
                      Loading usage history...
                    </TableCell>
                  </TableRow>
                ) : visible.length === 0 ? (
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-xs text-gray-400"
                    >
                      No AI requests found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-gray-100 hover:bg-gray-50/70"
                    >
                      <TableCell className="text-xs text-gray-600">
                        {formatDateTime(entry.occurredAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {entry.requestId}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-800">
                        {entry.module}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {entry.feature}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-gray-800">
                        {formatTokens(entry.tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        <RequestStatusBadge
                          status={entry.status}
                          statusCode={entry.statusCode}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-[11px] text-gray-500">
            <span>
              Showing {startEntry}-{endEntry} of {filtered.length}
              {isFetching && !isLoading ? " · Updating..." : ""}
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  resetPagination();
                }}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label="Previous usage history page"
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Next usage history page"
              >
                Next <ChevronRight />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
