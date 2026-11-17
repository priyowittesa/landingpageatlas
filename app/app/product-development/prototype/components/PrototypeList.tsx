"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Filter, LayoutGrid, List as ListIcon, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  iterationStatusClassMap,
  type IterationStatus,
  type PrototypeIteration,
} from "../types";
import { usePrototypeList } from "../hooks/usePrototypes";

type ViewMode = "grid" | "list";

const STATUS_LABEL: Record<IterationStatus, string> = {
  draft: "Draft",
  testing: "Testing",
  approved: "Approved",
  rejected: "Rejected",
  on_hold: "On Hold",
};

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function PrototypeList() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IterationStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const filter = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      page_size: 6,
      page_token: pageTokens[page - 1] || undefined,
    }),
    [debouncedSearch, page, pageTokens, status]
  );

  const { data, isLoading, isFetching } = usePrototypeList(filter);
  const iterations = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Prototype
          </h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {data?.total_count ?? 0} prototype iterations across all projects -
            read-only aggregate view; new iterations are created from within a
            project.
          </p>
        </div>
        <div className="flex rounded-md border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex h-8 w-8 items-center justify-center rounded ${
              view === "grid"
                ? "bg-primary-50 text-primary-700"
                : "text-gray-500"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex h-8 w-8 items-center justify-center rounded ${
              view === "list"
                ? "bg-primary-50 text-primary-700"
                : "text-gray-500"
            }`}
            aria-label="List view"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setPageTokens([""]);
            }}
            placeholder="Search..."
            className="h-9 w-64 pl-8 text-xs"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as IterationStatus | "all");
            setPage(1);
            setPageTokens([""]);
          }}
        >
          <SelectTrigger className="h-9 w-44 text-xs">
            <Filter className="mr-1 h-3.5 w-3.5" />
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="testing">Testing</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-xs text-gray-400">
          Loading iterations...
        </div>
      ) : iterations.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-400">
          No iterations found.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {iterations.map((iteration) => (
            <IterationCard
              key={iteration.id}
              iteration={iteration}
              onOpen={() =>
                router.push(`/app/product-development/prototype/${iteration.id}`)
              }
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="divide-y divide-gray-100 p-0">
            {iterations.map((iteration) => (
              <IterationRow
                key={iteration.id}
                iteration={iteration}
                onOpen={() =>
                  router.push(`/app/product-development/prototype/${iteration.id}`)
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && (page > 1 || Boolean(data?.next_page_token)) && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-xs text-gray-500">
            Page {page}{data?.total_count ? ` - ${data.total_count} total` : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.next_page_token || isFetching}
            onClick={() => {
              if (!data?.next_page_token) return;
              setPageTokens((current) => {
                const next = current.slice(0, page);
                next[page] = data.next_page_token;
                return next;
              });
              setPage((current) => current + 1);
            }}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function IterationCard({
  iteration,
  onOpen,
}: {
  iteration: PrototypeIteration;
  onOpen: () => void;
}) {
  const initials =
    iteration.assignee.initials ||
    iteration.assignee.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  return (
    <Card
      className="cursor-pointer hover:border-primary-300"
      onClick={onOpen}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${iterationStatusClassMap[iteration.status]}`}
          >
            {STATUS_LABEL[iteration.status]}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {iteration.revision} - {iteration.name}
          </p>
          {(iteration.project.project_no || iteration.project.name) && (
            <p className="mt-1 text-[11px] text-gray-500">
              {iteration.project.project_no} {iteration.project.name}
            </p>
          )}
        </div>
        {iteration.build_method && (
          <div className="text-[11px] text-gray-500">
            <span className="rounded-md bg-gray-100 px-2 py-0.5">
              {iteration.build_method}
            </span>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {iteration.tests_passed}/{iteration.tests_total} tests passed
            </span>
            <span>{iteration.pass_rate}%</span>
          </div>
          <Progress
            value={iteration.pass_rate}
            className="mt-1 h-1.5 bg-gray-100"
            indicatorClassName={
              iteration.tests_total > 0 &&
              iteration.tests_passed === iteration.tests_total
                ? "bg-emerald-500"
                : "bg-amber-500"
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
              {initials}
            </span>
            <span className="text-[11px] text-gray-600">
              {iteration.assignee.name}
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            {formatDate(iteration.due_date)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function IterationRow({
  iteration,
  onOpen,
}: {
  iteration: PrototypeIteration;
  onOpen: () => void;
}) {
  const initials =
    iteration.assignee.initials ||
    iteration.assignee.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  return (
    <div
      className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50/60"
      onClick={onOpen}
    >
      <Badge
        variant="outline"
        className={`text-[10px] font-medium ${iterationStatusClassMap[iteration.status]}`}
      >
        {STATUS_LABEL[iteration.status]}
      </Badge>
      <div className="min-w-48">
        <p className="text-xs font-semibold text-gray-800">
          {iteration.revision} - {iteration.name}
        </p>
        {(iteration.project.project_no || iteration.project.name) && (
          <p className="text-[10px] text-gray-500">
            {iteration.project.project_no} {iteration.project.name}
          </p>
        )}
      </div>
      {iteration.build_method && (
        <span className="text-[11px] text-gray-500">
          {iteration.build_method}
        </span>
      )}
      <div className="flex-1 min-w-32">
        <Progress
          value={iteration.pass_rate}
          className="h-1.5"
          indicatorClassName={
            iteration.tests_total > 0 &&
            iteration.tests_passed === iteration.tests_total
              ? "bg-emerald-500"
              : "bg-amber-500"
          }
        />
      </div>
      <span className="text-[11px] text-gray-500">
        {iteration.tests_passed}/{iteration.tests_total} - {iteration.pass_rate}%
      </span>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
          {initials}
        </span>
        <span className="text-[11px] text-gray-600">
          {iteration.assignee.name}
        </span>
      </div>
      <span className="text-[11px] text-gray-500">
        {formatDate(iteration.due_date)}
      </span>
    </div>
  );
}
