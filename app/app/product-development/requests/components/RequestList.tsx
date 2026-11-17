"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  priorityClassMap,
  statusClassMap,
  type EngineeringRequest,
  type RequestStatus,
} from "../types";
import {
  useRequestList,
  useRequestStatusCounts,
} from "../hooks/useRequests";
import { formatLongDate } from "../lib/date";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const TABS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "rejected", label: "Rejected" },
];

function statusLabel(status: RequestStatus) {
  return status.replace("_", " ").toUpperCase();
}

export function RequestList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RequestStatus | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), 350);
  const [priority, setPriority] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const pageToken = pageTokens[page - 1] || undefined;

  const resetPagination = () => {
    setPage(1);
    setPageTokens([""]);
  };

  const filter = useMemo(
    () => ({
      status: activeTab === "all" ? undefined : activeTab,
      priority: priority === "all" ? undefined : priority,
      search: search || undefined,
      page_size: pageSize,
      page_token: pageToken,
    }),
    [activeTab, priority, search, pageSize, pageToken]
  );

  const { data, isLoading, isFetching } = useRequestList(filter);
  const { data: statusCounts } = useRequestStatusCounts();
  const items = useMemo<EngineeringRequest[]>(
    () => data?.items ?? [],
    [data?.items],
  );

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: statusCounts?.all ?? data?.totalCount ?? items.length,
    };
    items.forEach((item) => {
      counts[item.status] = statusCounts?.[item.status] ?? 0;
    });
    return { ...counts, ...(statusCounts ?? {}) };
  }, [items, data?.totalCount, statusCounts]);

  const onTabChange = (next: RequestStatus | "all") => {
    setActiveTab(next);
    resetPagination();
  };
  const onPriorityChange = (next: string) => {
    setPriority(next);
    resetPagination();
  };
  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
          Request Intake
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          Gate 1 - all engineering requests flow through here
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary-200 bg-primary-50/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-white">
            G1
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {tabCounts.submitted ?? 0} requests awaiting Gate 1 approval.
            </p>
            <p className="text-xs text-gray-500">
              Review intake, defer or reject before they move to planning.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition ${
                activeTab === tab.value
                  ? "border-b-2 border-primary-700 text-primary-700"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              <Badge
                variant="outline"
                className="border-gray-300 bg-white px-1.5 text-[10px] font-normal text-gray-500"
              >
                {tabCounts[tab.value] ?? 0}
              </Badge>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                resetPagination();
              }}
              placeholder="Search..."
              className="h-9 w-45 pl-8 text-xs"
            />
          </div>
          <Select
            value={priority}
            onValueChange={(value) => onPriorityChange(value)}
          >
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="h-9 gap-1.5 bg-primary-700 text-xs hover:bg-primary-800"
            onClick={() => router.push("/app/product-development/requests/create")}
          >
            <Plus className="h-3.5 w-3.5" /> New Request
          </Button>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-180">
            <TableHeader>
              <TableRow className="border-gray-100 bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Request
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Priority
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Due Date
                </TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Activity
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
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((request) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer border-gray-100 hover:bg-gray-50/70"
                    onClick={() =>
                      router.push(`/app/product-development/requests/${request.id}`)
                    }
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">
                          {request.title}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {request.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {request.customer}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${statusClassMap[request.status]}`}
                      >
                        {statusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${priorityClassMap[request.priority]}`}
                      >
                        {request.priority.charAt(0).toUpperCase() +
                          request.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {formatLongDate(request.due_date_at)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-primary-700">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {request.document_count} Files →
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-[11px] text-gray-500">
          <span>Page {page}{data?.totalCount ? ` · ${data.totalCount} total requests` : ""}{isFetching && !isLoading ? " · Updating..." : ""}</span>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); resetPagination(); }}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZE_OPTIONS.map((size) => <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Previous request page"
            >
              <ChevronLeft /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.nextPageToken || isFetching}
              onClick={() => {
                if (!data?.nextPageToken) return;
                setPageTokens((current) => {
                  const next = current.slice(0, page);
                  next[page] = data.nextPageToken;
                  return next;
                });
                setPage((current) => current + 1);
              }}
              aria-label="Next request page"
            >
              Next <ChevronRight />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
