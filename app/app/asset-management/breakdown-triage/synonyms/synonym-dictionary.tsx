"use client";

import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { Check, Eye, EyeOff, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { ApiResponseError } from "@/types/api";
import type { TableColumn } from "@/types/type";
import { LoadState, PAGE_SIZE_OPTIONS, usePageTokens } from "../components/cursor-pager";
import { StatusPill } from "../components/triage-badges";
import { SynonymDialog } from "./synonym-dialog";
import { SynonymTester } from "./synonym-tester";
import {
  CATEGORY_LABELS,
  SYNONYM_CATEGORIES,
  formatSynonymDate,
  useDeleteSynonym,
  useSaveSynonym,
  useSetSynonymActive,
  useSynonyms,
  type SynonymCategory,
  type SynonymDraft,
  type SynonymTerm,
} from "./use-synonyms";

type DialogState = { entry: SynonymTerm | null; initialTerm?: string } | null;

export function SynonymDictionary() {
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SynonymCategory | "all">("all");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState<SynonymTerm | null>(null);
  const search = useDebouncedValue(query.trim(), 350);
  const paging = usePageTokens(`${search}|${category}|${pageSize}`);
  const list = useSynonyms({
    search: search || undefined,
    category: category === "all" ? undefined : category,
    page_size: pageSize,
    page_token: paging.token || undefined,
  });
  const save = useSaveSynonym();
  const setActive = useSetSynonymActive();
  const remove = useDeleteSynonym();

  useEffect(() => {
    setBreadcrumbs([{ title: "Asset Management" }, { title: "Breakdown Triage" }, { title: "Synonym Dictionary" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);

  const rows = list.data?.items ?? [];
  const counts = list.data?.categoryCounts ?? {};
  const allCount = SYNONYM_CATEGORIES.reduce((sum, value) => sum + (counts[value] ?? 0), 0);
  const nextPageToken = list.data?.nextPageToken ?? "";

  const toggle = (entry: SynonymTerm) =>
    setActive.mutate(
      { id: entry.id, isActive: !entry.isActive },
      { onSuccess: () => toast.success(`“${entry.term}” ${entry.isActive ? "deactivated" : "activated"}`) }
    );

  /** Resolves when saved; rejects with the API message so the dialog can show it next to the fields. */
  const saveTerm = async (draft: SynonymDraft) => {
    try {
      await save.mutateAsync({ id: dialog?.entry?.id, draft });
    } catch (error) {
      const message = (error as AxiosError<ApiResponseError>).response?.data?.message;
      throw new Error((Array.isArray(message) ? message[0] : message) || "The term could not be saved.");
    }
    toast.success(`Term “${draft.term}” ${dialog?.entry ? "updated" : "added"}`);
    setDialog(null);
  };

  const columns: TableColumn<SynonymTerm>[] = [
    {
      key: "term",
      header: "Primary term",
      render: (row) => (
        <div className={cn(!row.isActive && "opacity-55")}>
          <div className="font-semibold text-gray-900">{row.term}</div>
          <div className="text-xs text-gray-500">
            {[row.updatedBy, formatSynonymDate(row.updatedAt)].filter(Boolean).join(" · ")}
          </div>
        </div>
      ),
    },
    {
      key: "synonyms",
      header: "Synonyms",
      render: (row) => (
        <div className={cn("flex max-w-md flex-wrap gap-1", !row.isActive && "opacity-55")}>
          {row.synonyms.map((synonym) => (
            <span key={synonym} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {synonym}
            </span>
          ))}
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => <StatusPill tone="muted">{CATEGORY_LABELS[row.category]}</StatusPill> },
    {
      key: "uses",
      header: "Matches (30 days)",
      render: (row) => <span className="font-mono text-sm">{row.uses == null ? "—" : `${row.uses} reports`}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.isActive ? (
          <StatusPill tone="green" icon={Check}>
            Active
          </StatusPill>
        ) : (
          <StatusPill tone="muted">Inactive</StatusPill>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${row.term}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialog({ entry: row })}>
              <Pencil className="h-4 w-4" />
              Edit term
            </DropdownMenuItem>
            <DropdownMenuItem disabled={setActive.isPending} onSelect={() => toggle(row)}>
              {row.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {row.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => setDeleting(row)}>
              <Trash2 className="h-4 w-4 text-red-600" />
              Delete term
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Synonym Dictionary"
        subtitle="Normalizes shop-floor terms, abbreviations, and mixed Indonesian–English wording before similar-case search, so short WO descriptions still find the right history."
        addBtnLabel="New Term"
        handleAdd={() => setDialog({ entry: null })}
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Changes apply to subsequent triage. The historical WO index is rebuilt every morning after normalization.
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-2">
          {list.isLoading || (list.isError && !list.data) ? (
            <div className="rounded-lg border bg-white">
              <LoadState error={list.isError} onRetry={() => list.refetch()} />
            </div>
          ) : (
            <div className={cn("transition-opacity", list.isFetching && "opacity-60")}>
              <Table
                columns={columns}
                data={rows}
                getRowId={(row) => row.id}
                name="term"
                searchValue={query}
                onSearchChange={setQuery}
                searchPlaceholder="Search terms or synonyms"
                filters={[
                  {
                    key: "category",
                    placeholder: "All Categories",
                    value: category,
                    onChange: (value) => setCategory(value as SynonymCategory | "all"),
                    options: [
                      { label: `All Categories (${allCount})`, value: "all" },
                      ...SYNONYM_CATEGORIES.map((value) => ({
                        label: `${CATEGORY_LABELS[value]} (${counts[value] ?? 0})`,
                        value,
                      })),
                    ],
                  },
                ]}
                onResetFilters={() => setCategory("all")}
                pagination={{
                  page: paging.page,
                  pageSize,
                  totalEntries: list.data?.totalCount ?? rows.length,
                  pageSizeOptions: PAGE_SIZE_OPTIONS,
                  canPageChange: (next) => next <= paging.visited || (next === paging.page + 1 && Boolean(nextPageToken)),
                  onPageChange: (next) => (next === paging.page + 1 && next > paging.visited ? paging.next(nextPageToken) : paging.goTo(next)),
                  onPageSizeChange: setPageSize,
                }}
                emptyState={
                  search
                    ? {
                        description: `No terms or synonyms match “${search}” yet.`,
                        actionLabel: `Add “${search}”`,
                        onAction: () => setDialog({ entry: null, initialTerm: search.toLowerCase() }),
                      }
                    : { description: "No terms in this category yet." }
                }
              />
            </div>
          )}
          <div className="flex justify-between px-1 text-xs text-gray-500">
            <span>
              {list.data?.activeTermCount ?? 0} active of {list.data?.termCount ?? 0} terms
            </span>
            <span>Last changed {formatSynonymDate(list.data?.lastChangedAt ?? "") || "—"}</span>
          </div>
        </div>
        <SynonymTester />
      </div>

      <SynonymDialog
        open={Boolean(dialog)}
        entry={dialog?.entry ?? null}
        initialTerm={dialog?.initialTerm}
        saving={save.isPending}
        onOpenChange={(open) => !open && setDialog(null)}
        onSave={saveTerm}
      />

      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        variant="delete"
        title={`Delete the term “${deleting?.term ?? ""}”?`}
        description={
          deleting && (
            <>
              Its {deleting.synonyms.length} synonyms will be deleted too.{" "}
              {deleting.uses ? (
                <>
                  This term matched {deleting.uses} reports in the last 30 days, so similar-case search for those
                  descriptions may get worse. Consider <b>Deactivate</b> if unsure.
                </>
              ) : (
                "Its words can be used by another term afterwards."
              )}
            </>
          )
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleting) return;
          const target = deleting;
          remove.mutate(target.id, { onSuccess: () => toast.success(`Term “${target.term}” deleted`) });
          setDeleting(null);
        }}
      />
    </div>
  );
}
