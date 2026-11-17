"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  useExportClients,
  useTokenClients
} from "../hooks/useAdminTokenPolicy";
import { formatTokens } from "../lib/format";
import type {
  TokenClient,
  TokenClientPolicyStatus,
  TokenResetPeriod
} from "../types/admin";
import { EditClientQuotasDialog } from "./admin/EditClientQuotasDialog";

const PAGE_SIZE = 10;
const ALL_STATUSES = "all";
const ALL_RESET_PERIODS = "all";

/** Policy badge — Custom (orange), Default (blue), Schedule (violet). */
function PolicyBadge({ client }: { client: TokenClient }) {
  if (client.hasScheduledChange) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#f2ebfd] px-3 py-0.5 text-xs font-medium text-[#5829a8]">
        Schedule
      </span>
    );
  }
  if (client.policySource === "override") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-0.5 text-xs font-medium text-amber-600">
        Custom
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#0152cb]">
      Default
    </span>
  );
}

export function TokenUsageClients() {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    TokenClientPolicyStatus | typeof ALL_STATUSES
  >(ALL_STATUSES);
  const [resetPeriod, setResetPeriod] = useState<
    TokenResetPeriod | typeof ALL_RESET_PERIODS
  >(ALL_RESET_PERIODS);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Clients" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

  const { data, isLoading } = useTokenClients({
    search,
    status,
    resetPeriod,
    page,
    pageSize: PAGE_SIZE
  });

  const clients = useMemo(() => data?.clients ?? [], [data?.clients]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startEntry = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(currentPage * PAGE_SIZE, total);

  const resetPagination = () => setPage(1);

  const allVisibleSelected =
    clients.length > 0 && clients.every((client) => selectedIds.has(client.id));

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        clients.forEach((client) => next.delete(client.id));
      } else {
        clients.forEach((client) => next.add(client.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedClients = clients.filter((client) =>
    selectedIds.has(client.id)
  );
  const editTargets = selectedClients.map((client) => ({
    tenantId: client.id,
    name: client.name,
    allowance: client.quota,
    resetPeriod: client.resetPeriod ?? ("monthly" as const)
  }));

  const exportClients = useExportClients();
  const handleExport = () => {
    exportClients.mutate({ search, status, resetPeriod });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-7 text-gray-950">
            Clients
          </h1>
          <p className="mt-0.5 text-sm leading-5 text-gray-500">
            Every tenant on ATLAS, the policy in force for them, and when their
            tokens reset next.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 text-sm"
            onClick={handleExport}
            disabled={exportClients.isPending}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="h-10 gap-2 bg-primary-700 text-sm hover:bg-primary-800"
            disabled={selectedClients.length === 0}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-100 bg-primary-50/50 px-4 py-2.5">
          <span className="text-xs font-medium text-primary-700">
            {selectedIds.size} client{selectedIds.size === 1 ? "" : "s"}{" "}
            selected
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Filters + table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPagination();
              }}
              placeholder="Search..."
              className="h-10 pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(
                  value as TokenClientPolicyStatus | typeof ALL_STATUSES
                );
                resetPagination();
              }}
            >
              <SelectTrigger className="h-10 w-44 gap-2.5 text-base font-medium">
                <SelectValue placeholder="All policy statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>
                  All policy statuses
                </SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="scheduled">Schedule</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={resetPeriod}
              onValueChange={(value) => {
                setResetPeriod(
                  value as TokenResetPeriod | typeof ALL_RESET_PERIODS
                );
                resetPagination();
              }}
            >
              <SelectTrigger className="h-10 w-40 gap-2.5 text-base font-medium">
                <SelectValue placeholder="All reset periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_RESET_PERIODS}>
                  All reset periods
                </SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="gap-0 overflow-hidden p-0">
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-220">
              <TableHeader>
                <TableRow className="border-gray-100 bg-white hover:bg-white">
                  <TableHead className="w-12 pl-4">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAllVisible}
                      aria-label="Select all visible clients"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.6px] text-gray-500">
                    Client
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-[0.6px] text-gray-500">
                    Policy
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-[0.6px] text-gray-500">
                    Quota
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.6px] text-gray-500">
                    Reset period
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.6px] text-gray-500">
                    Next reset
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.6px] text-gray-500">
                    Feature
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-xs text-gray-400"
                    >
                      Loading clients...
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-xs text-gray-400"
                    >
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client: TokenClient) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer border-gray-100 hover:bg-gray-50/70"
                      onClick={() =>
                        router.push(`/app/token-usage/clients/${client.id}`)
                      }
                    >
                      <TableCell
                        className="w-12 pl-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={() => toggleOne(client.id)}
                          aria-label={`Select ${client.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/app/token-usage/clients/${client.id}`}
                          className="flex flex-col"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className="text-sm font-semibold text-gray-900 hover:text-primary-700">
                            {client.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {client.plan} · {client.userCount} users
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <PolicyBadge client={client} />
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold text-gray-900">
                        {formatTokens(client.quota)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-500">
                        {client.resetPeriodLabel}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-500">
                        {client.nextResetLabel}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatTokens(client.used)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({Math.round(client.remainingPercent)}%)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            <span className="text-sm text-gray-500">
              Showing {startEntry}-{endEntry} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 text-xs"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "h-9 w-9 rounded-lg border text-xs font-medium transition-colors",
                      pageNum === currentPage
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 text-xs"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <EditClientQuotasDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        targets={editTargets}
      />
    </div>
  );
}
