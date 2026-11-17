"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, Filter, LayoutGrid, List as ListIcon, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  categoryClassMap,
  type ProjectPlanning,
} from "../types";
import { useProjectList } from "../hooks/useProjectPlanning";

type ViewMode = "grid" | "list";
const PAGE_SIZE = 12;

function useDebouncedValue(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

export function ProjectPlanningList() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("");
  const [page, setPage] = useState(1);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const debouncedSearch = useDebouncedValue(search);
  const debouncedClassification = useDebouncedValue(classification);

  const filter = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      classification: debouncedClassification || undefined,
      page_size: PAGE_SIZE,
      page_token: pageTokens[page - 1] || undefined,
    }),
    [debouncedSearch, debouncedClassification, page, pageTokens]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useProjectList(filter);
  const projects = data?.items ?? [];

  const activeCount = projects.filter((p) => p.category !== "completed").length;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Project Planning
          </h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            {activeCount} active projects on this page - created automatically from approved
            engineering requests
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); setPageTokens([""]); }}
            placeholder="Search..."
            className="h-9 w-64 pl-8 text-xs"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input value={classification} onChange={(event) => { setClassification(event.target.value); setPage(1); setPageTokens([""]); }} placeholder="Classification" className="h-9 w-52 pl-8 text-xs" />
        </div>
        {isFetching && !isLoading && <span className="text-[11px] text-gray-400">Refreshing...</span>}
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-red-100 bg-red-50 py-10 text-center">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div><p className="text-sm font-medium text-red-700">Failed to load project planning</p><p className="mt-1 text-xs text-red-500">{error.response?.data?.message ?? error.message}</p></div>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>Try again</Button>
        </div>
      ) : isLoading ? (
        <div className="py-10 text-center text-xs text-gray-400">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-400">
          No projects found.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() =>
                router.push(`/app/product-development/project-planning/${project.id}`)
              }
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="divide-y divide-gray-100 p-0">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onOpen={() =>
                  router.push(`/app/product-development/project-planning/${project.id}`)
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!isError && (page > 1 || Boolean(data?.next_page_token)) && <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page === 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="mr-1 h-3.5 w-3.5" />Previous</Button>
        <span className="min-w-16 text-center text-xs text-gray-500">Page {page}</span>
        <Button size="sm" variant="outline" disabled={!data?.next_page_token || isFetching} onClick={() => {
          if (!data?.next_page_token) return;
          setPageTokens((tokens) => { const next = tokens.slice(0, page); next[page] = data.next_page_token; return next; });
          setPage((value) => value + 1);
        }}>Next<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
      </div>}
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: ProjectPlanning;
  onOpen: () => void;
}) {
  return (
    <Card className="hover:border-primary-300">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {project.project_no}
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {project.name}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-medium ${categoryClassMap[project.category]}`}
          >
            {project.category.toUpperCase()}
          </Badge>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <span className="text-gray-400">Customer:</span> {project.customer}
          </p>
          <p>
            <span className="text-gray-400">Due:</span> {formatDate(project.due_date)}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {project.summary.done}/{project.summary.total} tasks
            </span>
            <span>{project.progress_percent}%</span>
          </div>
          <Progress
            value={project.progress_percent}
            className="mt-1 h-1.5 bg-gray-100"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>Assigned: {project.project_manager.name || "—"}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={onOpen}
          >
            Open Project →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectRow({
  project,
  onOpen,
}: {
  project: ProjectPlanning;
  onOpen: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 hover:bg-gray-50/60">
      <div className="min-w-32">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {project.project_no}
        </p>
        <p className="text-xs font-semibold text-gray-800">{project.name}</p>
      </div>
      <Badge
        variant="outline"
        className={`text-[10px] font-medium ${categoryClassMap[project.category]}`}
      >
        {project.category.toUpperCase()}
      </Badge>
      <span className="text-xs text-gray-500">{project.customer}</span>
      <div className="flex-1 min-w-32">
        <Progress value={project.progress_percent} className="h-1.5" />
      </div>
      <span className="text-[11px] text-gray-500">
        {project.summary.done}/{project.summary.total} · {project.progress_percent}%
      </span>
      <span className="text-[11px] text-gray-500">
        {project.project_manager.name}
      </span>
      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onOpen}>
        Open Project →
      </Button>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
