"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
  useExportTokenUsers,
  useTokenMonitoring
} from "../hooks/useTokenUsage";
import { formatPercent, formatRelativeTime, formatTokens } from "../lib/format";
import { type TokenUsageGranularity } from "../types";
import { ConsumptionChart } from "./ConsumptionChart";
import {
  GranularityTabs,
  TokenKpiCard,
  TokenUsageCard
} from "./TokenUsageShared";
import { WarningThresholdDialog } from "./WarningThresholdDialog";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export function TokenUsageMonitoring() {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const [granularity, setGranularity] =
    useState<TokenUsageGranularity>("daily");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quotaOpen, setQuotaOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Monitoring" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

  const { data, isLoading, isFetching } = useTokenMonitoring({ granularity });
  const exportUsers = useExportTokenUsers();
  const users = useMemo(() => data?.users ?? [], [data?.users]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        !query ||
        [user.name, user.email].some((value) =>
          value.toLowerCase().includes(query)
        )
    );
  }, [users, search]);

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

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Monitoring
          </h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Tenant-wide token consumption and per-user balances
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-xs"
            onClick={() => exportUsers.mutate({})}
            disabled={exportUsers.isPending}
          >
            <Download className="h-3.5 w-3.5" />
            Export report
          </Button>
          <Button
            size="sm"
            className="h-10 gap-1.5 bg-primary-700 text-xs hover:bg-primary-800"
            onClick={() => setQuotaOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Set Warning Threshold
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TokenKpiCard
          label="Tenant quota"
          value={formatTokens(data.tenantQuota)}
          caption={`${data.activeUsers} active users`}
        />
        <TokenKpiCard
          label="Used this month"
          value={formatTokens(data.usedThisMonth)}
          caption={`${formatPercent(data.usedPercent)} of quota`}
        />
        <TokenKpiCard
          label="Users running low"
          value={String(data.usersRunningLow)}
          caption={`Below ${data.warningThresholdPercent}% tokens left`}
          valueClassName="text-amber-600"
        />
        <TokenKpiCard
          label="Users blocked"
          value={String(data.usersBlocked)}
          caption="Out of tokens, requests rejected"
          valueClassName="text-red-600"
        />
      </div>

      {/* Tenant consumption trend */}
      <TokenUsageCard
        icon={BarChart3}
        title="Tenant Consumption Trend"
        subtitle="Track daily token consumption over time"
        headerRight={
          <GranularityTabs
            value={granularity}
            options={["daily", "weekly", "monthly"]}
            onChange={setGranularity}
          />
        }
      >
        <ConsumptionChart
          series={data.consumption}
          isLoading={isFetching && !data}
          height={220}
        />
      </TokenUsageCard>

      {/* Per-user table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Usage by user</h2>
            <p className="text-xs text-gray-500">
              Token usage per user for the current period
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
                placeholder="Search user or email..."
                className="h-9 w-64 pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Card className="gap-0 overflow-hidden p-0">
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-220">
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/60 hover:bg-gray-50/60">
                  <TableHead className="w-56 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    User
                  </TableHead>
                  <TableHead className="w-72 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </TableHead>
                  <TableHead className="w-1/2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Usage
                  </TableHead>
                  <TableHead className="w-32 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Last used
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-xs text-gray-400"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-gray-100 hover:bg-gray-50/70"
                    >
                      <TableCell className="text-sm font-medium text-gray-800">
                        {user.name || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={user.percentageOfTenantUsage}
                            className="h-2 flex-1"
                            indicatorClassName="bg-primary-600"
                          />
                          <span className="w-16 shrink-0 text-right text-sm font-medium text-gray-600">
                            {formatTokens(user.used_tokens)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {formatRelativeTime(user.lastUsedAt)}
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
              {isFetching ? " · Updating..." : ""}
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
                aria-label="Previous monitoring page"
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Next monitoring page"
              >
                Next <ChevronRight />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <WarningThresholdDialog
        open={quotaOpen}
        onOpenChange={setQuotaOpen}
        warningThresholdPercent={data.warningThresholdPercent}
      />
    </div>
  );
}
