"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import AddButton from "@/components/AddButton";
import ConfirmationModal from "@/components/ConfirmationModal";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/useUrlState";
import { ProjectStatus, type Project } from "../types";
import {
  useDeleteProject,
  useProjectDashboardSummary,
  useProjectEnums,
  useProjectList,
  useProjectTypes,
} from "../use-projects";
import { ProjectFilters } from "./project-filters";
import { ProjectStats } from "./project-stats";
import { ProjectTable } from "./project-table";

type ProjectListProps = {
  activeOnly?: boolean;
  title?: string;
  subtitle?: string;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ProjectList({
  activeOnly = false,
  title = "Project",
  subtitle = "Manage all project data in the system. Add, edit, or remove project records.",
}: ProjectListProps = {}) {
  const router = useRouter();
  const deleteProject = useDeleteProject();

  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    status: activeOnly ? ProjectStatus.PROJECT_STATUS_ACTIVE : "all",
    projectType: "all",
    sortBy: "",
    sortDir: "asc",
  });

  const { page, pageSize, status, projectType, sortBy, sortDir } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [pendingSort, setPendingSort] = useState<
    { by: string; dir: "asc" | "desc" } | null
  >(null);
  const projectTypesQuery = useProjectTypes();
  const projectEnumsQuery = useProjectEnums();
  const dashboardSummaryQuery = useProjectDashboardSummary();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  // Page tokens are tied to the previous sort order — reset them when sort changes,
  // and debounce so a rapid burst of header clicks only fires one fetch.
  useEffect(() => {
    if (!pendingSort) return;
    const timeout = window.setTimeout(() => {
      setMany({
        sortBy: pendingSort.by,
        sortDir: pendingSort.dir,
        page: 1,
      });
      setPageTokens([""]);
      setPendingSort(null);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [pendingSort, setMany]);

  // UI reflects pendingSort immediately so the header icon feels responsive
  // while the URL/fetch is debounced.
  const sortByForUI = (pendingSort?.by ?? sortBy) || null;
  const sortDirForUI: "asc" | "desc" =
    pendingSort?.dir ?? (sortDir === "desc" ? "desc" : "asc");

  const filters = useMemo(
    () => ({
      pageSize,
      pageToken: pageTokens[page - 1] ?? "",
      projectTypeId: projectType === "all" ? undefined : projectType,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      ...(sortBy ? { sortBy, sortDir: sortDirForUI } : {}),
    }),
    [
      debouncedSearch,
      page,
      pageSize,
      pageTokens,
      projectType,
      status,
      sortBy,
      sortDirForUI,
    ],
  );
  const { data, isLoading, isFetching, isError, refetch } =
    useProjectList(filters);
  const projects = data?.items ?? [];
  useEffect(() => {
    if (!data?.nextPageToken) return;
    setPageTokens((current) => {
      if (current[page] === data.nextPageToken) return current;
      const next = [...current];
      next[page] = data.nextPageToken;
      return next;
    });
  }, [data?.nextPageToken, page]);

  const hasActiveFilters = Boolean(
    search.trim() ||
      projectType !== "all" ||
      (!activeOnly && status !== "all"),
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        addBtnLabel={!activeOnly ? "Create Project" : undefined}
        handleAdd={
          !activeOnly
            ? () => router.push("/app/master-data/projects/new")
            : undefined
        }
      />

      <ProjectStats
        loading={dashboardSummaryQuery.isLoading}
        summary={dashboardSummaryQuery.data}
      />
      <ProjectFilters
        search={search}
        status={status}
        projectType={projectType}
        projectTypes={projectTypesQuery.data ?? []}
        statuses={projectEnumsQuery.data?.project_status ?? []}
        projectTypesLoading={projectTypesQuery.isLoading}
        onSearchChange={(value) => {
          setSearch(value);
          setPageTokens([""]);
          set("page", 1);
        }}
        onStatusChange={(value) => {
          setPageTokens([""]);
          setMany({ status: value, page: 1 });
        }}
        onProjectTypeChange={(value) => {
          setPageTokens([""]);
          setMany({ projectType: value, page: 1 });
        }}
      />

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? <LoadingState /> : isError ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"><p className="text-sm text-slate-600">Project data could not be loaded.</p><Button variant="outline" onClick={() => refetch()}>Try Again</Button></div>
        ) : projects.length === 0 && !hasActiveFilters ? <EmptyState onAdd={() => router.push("/app/master-data/projects/new")} /> : projects.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center"><Search className="mb-3 h-10 w-10 text-primary-300" /><h2 className="font-semibold">No matching projects</h2><p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p></div>
        ) : (
          <>
            <ProjectTable
              projects={projects}
              onDelete={setDeleting}
              actionMode={activeOnly ? "rostering" : "manage"}
              showSummary={false}
              sortKey={sortByForUI}
              sortDir={sortDirForUI}
              onSortChange={(key, dir) => {
                setPendingSort({ by: key ?? "", dir });
              }}
            />
            <div className="flex flex-wrap items-center gap-3 border-t px-5 py-3">
              <p className="mr-auto text-xs text-slate-500">
                Page {page}
                {data?.totalCount
                  ? ` · ${data.totalCount} total project${data.totalCount === 1 ? "" : "s"}`
                  : ""}
                {isFetching && !isLoading ? " · Updating..." : ""}
              </p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageTokens([""]);
                  setMany({ pageSize: Number(value), page: 1 });
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
                disabled={page === 1 || isFetching}
                onClick={() => {
                  setPageTokens((current) => current.slice(0, page - 1));
                  set("page", Math.max(1, page - 1));
                }}
                aria-label="Previous project page"
              >
                <ChevronLeft />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.nextPageToken || isFetching}
                onClick={() => set("page", page + 1)}
                aria-label="Next project page"
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete project?"
        description={`Are you sure you want to delete ${deleting?.title ?? "this project"}? This action cannot be undone.`}
        confirmLabel="Delete Project"
        isLoading={deleteProject.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteProject.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading projects...</div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
      <svg
        role="img"
        aria-label="No projects available"
        viewBox="0 0 259 190"
        className="mb-5 h-40 w-40"
      >
        <use href="/data-not-found.svg" />
      </svg>
      <h2 className="text-lg font-semibold">No projects found</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        It looks like you haven&apos;t added any projects. Get started by creating your first project.
      </p>
      <div className="mt-5">
        <AddButton label="Add Project" onClick={onAdd} />
      </div>
    </div>
  );
}
