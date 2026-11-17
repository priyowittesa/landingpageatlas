"use client";

import { useState, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Copy, Eye, History, MoreHorizontal, Pencil, Plus, RotateCcw, Search, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { LoadState, Pager, usePageTokens } from "../components/cursor-pager";
import { PriorityTag } from "../components/triage-badges";
import { format2 } from "../lib/scoring";
import { WEIGHT_KEYS, slaDisplayValue } from "./config-utils";
import type { VersionActions } from "./scoring-configuration";
import {
  formatVersionDate,
  useScoringConfigurations,
  type ScoringConfigurationVersion,
  type ScoringStatus,
} from "./use-scoring-configurations";
import { VersionStatusBadge } from "./version-status";

type Filter = "all" | ScoringStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export function VersionList({
  actions,
  active,
  draft,
}: {
  actions: VersionActions;
  active: UseQueryResult<ScoringConfigurationVersion | null>;
  draft: ScoringConfigurationVersion | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pageSize, setPageSize] = useState(10);
  const search = useDebouncedValue(query.trim(), 350);
  const paging = usePageTokens(`${search}|${filter}|${pageSize}`);
  const list = useScoringConfigurations({
    search: search || undefined,
    status: filter === "all" ? undefined : filter,
    page_size: pageSize,
    page_token: paging.token || undefined,
  });
  const rows = list.data?.items ?? [];
  const counts = list.data?.statusCounts ?? {};
  const countOf = (value: Filter) =>
    value === "all" ? (counts.active ?? 0) + (counts.draft ?? 0) + (counts.archived ?? 0) : counts[value] ?? 0;
  const activeVersion = active.data;

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">Scoring Configuration</h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Every change to weights, thresholds, response targets, or safety keywords is saved as a version. Only one
            version is active at a time; a draft goes live once it is activated.
          </p>
        </div>
        <Button onClick={actions.newVersion} disabled={actions.busy || active.isLoading}>
          {draft ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {draft ? `Continue draft v${draft.version}` : "New Version"}
        </Button>
      </header>

      <section className="rounded-xl border border-primary-200 bg-primary-50/40 p-5">
        {activeVersion ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-2xl font-bold tracking-tight text-gray-950">v{activeVersion.version}</span>
                <VersionStatusBadge status="active" />
                <span className="text-sm text-gray-500">
                  since {formatVersionDate(activeVersion.activatedAt || activeVersion.createdAt)}
                  {activeVersion.activatedBy && ` · activated by ${activeVersion.activatedBy}`}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => actions.open(activeVersion.id)}>
                <Eye className="h-4 w-4" />
                View
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ActiveSummary label="Weights">
                {WEIGHT_KEYS.map(({ key, code }) => (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    <code className="text-xs text-gray-500">{code}</code>
                    <b className="font-mono">{format2(activeVersion.config.weights[key])}</b>
                  </span>
                ))}
              </ActiveSummary>
              <ActiveSummary label="Thresholds">
                <span className="inline-flex items-center gap-1.5"><PriorityTag priority="P1" /><b className="font-mono">≥ {format2(activeVersion.config.p1Threshold)}</b></span>
                <span className="inline-flex items-center gap-1.5"><PriorityTag priority="P2" /><b className="font-mono">≥ {format2(activeVersion.config.p2Threshold)}</b></span>
              </ActiveSummary>
              <ActiveSummary label="Response targets">
                {(["P1", "P2", "P3"] as const).map((priority) => (
                  <span key={priority}>
                    {priority} <b className="font-mono">{slaDisplayValue(activeVersion.config, priority)} {priority === "P3" ? "h" : "min"}</b>
                  </span>
                ))}
              </ActiveSummary>
              <ActiveSummary label="Safety keywords">
                <span><b className="font-mono">{activeVersion.config.safetyKeywords.length}</b> keywords</span>
                <span>Escalation <b>{activeVersion.config.autoEscalate ? "on" : "off"}</b></span>
              </ActiveSummary>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            {active.isLoading
              ? "Loading the active version..."
              : active.isError
                ? "The active version could not be loaded."
                : "No version is active yet. Create a version and activate it to start scoring breakdown reports."}
          </p>
        )}
      </section>

      <section className="rounded-xl border bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search version or change"
              aria-label="Search versions"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium",
                  filter === option.value
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {option.label}
                <span className={cn("text-[11.5px]", filter === option.value ? "text-primary-600" : "text-gray-500")}>
                  {countOf(option.value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {list.isLoading || (list.isError && !list.data) ? (
          <LoadState error={list.isError} onRetry={() => list.refetch()} />
        ) : rows.length ? (
          <div className={cn("overflow-x-auto transition-opacity", list.isFetching && "opacity-60")}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Changes</th>
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3">Activated by</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="cursor-pointer hover:bg-gray-50" onClick={() => actions.open(row.id)}>
                    <td className="px-4 py-3 font-semibold">v{row.version}</td>
                    <td className="max-w-[380px] truncate px-4 py-3 text-gray-700" title={row.note}>{row.note || "No changes yet"}</td>
                    <td className="px-4 py-3">{row.author}</td>
                    <td className="px-4 py-3">{row.activatedBy || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px]">{formatVersionDate(row.activatedAt || row.createdAt)}</td>
                    <td className="px-4 py-3"><VersionStatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                      <RowMenu row={row} actions={actions} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <SearchX className="h-8 w-8 text-gray-400" />
            <h4 className="font-semibold text-gray-900">{search || filter !== "all" ? "No matching versions" : "No versions yet"}</h4>
            <p className="text-sm text-gray-500">
              {search || filter !== "all" ? "Change your search or filter." : "Create the first version to configure scoring."}
            </p>
            {(search || filter !== "all") && (
              <Button variant="outline" className="mt-2" onClick={() => { setQuery(""); setFilter("all"); }}>
                <RotateCcw className="h-4 w-4" />
                Reset filters
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-gray-500">
          <Pager
            page={paging.page}
            pageSize={pageSize}
            shown={rows.length}
            total={list.data?.totalCount ?? 0}
            hasNext={Boolean(list.data?.nextPageToken)}
            loading={list.isFetching}
            onPrev={paging.prev}
            onNext={() => list.data?.nextPageToken && paging.next(list.data.nextPageToken)}
            onPageSizeChange={setPageSize}
          />
          <span className="inline-flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Every activation and rollback is recorded in the audit log
          </span>
        </div>
      </section>
    </>
  );
}

function ActiveSummary({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-gray-800">{children}</div>
    </div>
  );
}

function RowMenu({ row, actions }: { row: ScoringConfigurationVersion; actions: VersionActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8" aria-label={`More actions for v${row.version}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => actions.open(row.id)}>
          <Eye className="h-4 w-4" />
          View
        </DropdownMenuItem>
        {row.status === "draft" ? (
          <>
            <DropdownMenuItem onSelect={() => actions.open(row.id)}>
              <Pencil className="h-4 w-4" />
              Edit draft
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-700" disabled={actions.busy} onSelect={() => actions.deleteDraft(row)}>
              <Trash2 className="h-4 w-4" />
              Delete draft
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem disabled={actions.busy} onSelect={() => actions.duplicate(row)}>
              <Copy className="h-4 w-4" />
              Duplicate as new version
            </DropdownMenuItem>
            {row.status === "archived" && (
              <DropdownMenuItem disabled={actions.busy} onSelect={() => actions.activate(row)}>
                <History className="h-4 w-4" />
                Activate this version
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
