"use client";

import Link from "next/link";
import { CalendarDays, MoveDown, MoveUp, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import MasterDataActions from "@/components/MasterDataActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectStatus, type Project } from "../types";

export function ProjectTable({
  projects,
  onDelete,
  actionMode = "manage",
  showSummary = true,
  sortKey = null,
  sortDir = "asc",
  onSortChange,
}: {
  projects: Project[];
  onDelete: (project: Project) => void;
  actionMode?: "manage" | "rostering";
  showSummary?: boolean;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string | null, dir: "asc" | "desc") => void;
}) {
  const router = useRouter();

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    let nextKey: string | null;
    let nextDir: "asc" | "desc";
    if (sortKey !== key) {
      nextKey = key;
      nextDir = "asc";
    } else if (sortDir === "asc") {
      nextKey = key;
      nextDir = "desc";
    } else {
      nextKey = null;
      nextDir = "asc";
    }
    onSortChange(nextKey, nextDir);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs text-slate-500">
          <tr>
            <SortableTh
              label="Project Name"
              columnKey="project_name"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortableTh
              label="Client"
              columnKey="client"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortableTh
              label="Start Date"
              columnKey="start_date"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortableTh
              label="End Date"
              columnKey="end_date"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortableTh
              label="Status"
              columnKey="status"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {projects.map((project) => {
            const configureHref = `/app/labour-rostering/active-project/${project.id}`;
            const isRostering = actionMode === "rostering";

            return (
            <tr
              key={project.id}
              className={cn(
                "hover:bg-slate-50",
                isRostering && "cursor-pointer focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
              )}
              tabIndex={isRostering ? 0 : undefined}
              onClick={isRostering ? () => router.push(configureHref) : undefined}
              onKeyDown={isRostering ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(configureHref);
                }
              } : undefined}
            >
              <td className="px-5 py-4 font-medium text-primary-700">{project.title}</td>
              <td className="px-5 py-4 text-slate-600">{project.client_name}</td>
              <td className="px-5 py-4 text-slate-600">{formatDate(project.start_date)}</td>
              <td className="px-5 py-4 text-slate-600">{formatDate(project.end_date)}</td>
              <td className="px-5 py-4"><StatusBadge status={project.status} /></td>
              <td className="px-5 py-4">
                {actionMode === "rostering" ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="h-9 whitespace-nowrap border-primary-100 px-4 text-xs font-medium hover:bg-primary-50 hover:text-primary-700"
                    >
                      <Link
                        href={configureHref}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Configure Rostering
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-primary-100 hover:bg-primary-50 hover:text-primary-700"
                    >
                      <Link
                        href={`#`}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Project setting for ${project.title}`}
                        title="Project Setting"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <MasterDataActions
                    name={project.title}
                    editHref={`/app/master-data/projects/${project.id}/edit`}
                    onDelete={() => onDelete(project)}
                  />
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      {showSummary && (
        <div className="border-t px-5 py-3 text-xs text-slate-500">
          Showing {projects.length} project{projects.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}

function SortableTh({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  columnKey: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  const isActive = sortKey === columnKey;
  return (
    <th className="px-5 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1 hover:text-slate-700"
      >
        {label}
        <span className="flex items-center -space-x-2">
          <MoveUp
            size={12}
            className={cn(
              isActive && sortDir === "asc"
                ? "text-primary-700"
                : "text-slate-300",
            )}
          />
          <MoveDown
            size={12}
            className={cn(
              isActive && sortDir === "desc"
                ? "text-primary-700"
                : "text-slate-300",
            )}
          />
        </span>
      </button>
    </th>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const statuses: Record<ProjectStatus, { label: string; className: string }> = {
    [ProjectStatus.PROJECT_STATUS_UNSPECIFIED]: { label: "Unspecified", className: "bg-amber-50 text-amber-700" },
    [ProjectStatus.PROJECT_STATUS_ACTIVE]: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
    [ProjectStatus.PROJECT_STATUS_INACTIVE]: { label: "Inactive", className: "bg-red-50 text-red-700" },
    [ProjectStatus.PROJECT_STATUS_COMPLETED]: { label: "Completed", className: "bg-slate-100 text-slate-600" },
  };
  const currentStatus = statuses[status] ?? statuses[ProjectStatus.PROJECT_STATUS_UNSPECIFIED];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", currentStatus.className)}>{currentStatus.label}</span>;
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
