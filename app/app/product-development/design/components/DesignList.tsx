"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Filter, Info, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusClassMap, statusLabelMap, type Design, type DesignStatus } from "../types";
import { useDeleteDesign, useDesignList } from "../hooks/useDesigns";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).format(date);
}

export function DesignList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DesignStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [deleting, setDeleting] = useState<Design | null>(null);
  const pageToken = pageTokens[page - 1] || undefined;
  const { data, isLoading, isFetching } = useDesignList({ search: search.trim() || undefined, status: status === "all" ? undefined : status, page_size: pageSize, page_token: pageToken });
  const designs = data?.items ?? [];
  const deleteDesign = useDeleteDesign();
  const awaitingReview = designs.filter((item) => item.status === "in_review");

  const resetPagination = () => {
    setPage(1);
    setPageTokens([""]);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950">Design</h1>
        <p className="mt-1 text-sm text-gray-500">
          {designs.length} design files across all projects — read-only aggregate view; new designs are uploaded from within a project.
        </p>
      </div>

      {awaitingReview.length > 0 && (
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5">
          <div className="flex items-center gap-3 text-violet-800">
            <Info className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">
              {awaitingReview.length} design{awaitingReview.length > 1 ? "s" : ""} awaiting review — need engineering sign-off before prototype phase.
            </p>
          </div>
          <button type="button" className="text-xs font-semibold text-violet-700 hover:text-violet-900" onClick={() => router.push(`/app/product-development/design/${awaitingReview[0].id}`)}>
            Review now →
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); resetPagination(); }} placeholder="Search..." className="h-10 w-72 pl-9 text-sm" aria-label="Search designs" />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value as DesignStatus | "all"); resetPagination(); }}>
            <SelectTrigger className="h-10 w-36 text-sm"><Filter className="mr-1 h-4 w-4" /><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">Under Review</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="released">Released</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="h-10 bg-violet-700 text-white hover:bg-violet-800" onClick={() => router.push("/app/product-development/design/create")}>
          <Plus className="h-4 w-4" /> New Design
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left">
            <thead className="border-b border-gray-200 bg-gray-50/70">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="w-[22%] px-4 py-3">Project</th>
                <th className="w-[26%] px-4 py-3">Title</th>
                <th className="w-[9%] px-4 py-3">Version</th>
                <th className="w-[12%] px-4 py-3">Status</th>
                <th className="w-[10%] px-4 py-3">Created at</th>
                <th className="w-[10%] px-4 py-3">Updated at</th>
                <th className="w-[7%] px-4 py-3 text-center">Activity</th>
                <th className="w-[6%] px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="h-40 text-center text-sm text-gray-400">Loading designs...</td></tr>
              ) : designs.length === 0 ? (
                <tr><td colSpan={8} className="h-40 text-center text-sm text-gray-400">No designs found.</td></tr>
              ) : designs.map((design) => (
                <DesignTableRow key={design.id} design={design} onOpen={() => router.push(`/app/product-development/design/${design.id}`)} onDelete={() => setDeleting(design)} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-2">
          <p className="mr-auto text-xs text-gray-500">Page {page}{data?.totalCount ? ` · ${data.totalCount} total designs` : ""}{isFetching && !isLoading ? " · Updating..." : ""}</p>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); resetPagination(); }}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZE_OPTIONS.map((size) => <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={page === 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous design page"><ChevronLeft /> Previous</Button>
            <Button variant="outline" size="sm" disabled={!data?.nextPageToken || isFetching} onClick={() => {
              if (!data?.nextPageToken) return;
              setPageTokens((current) => {
                const next = current.slice(0, page);
                next[page] = data.nextPageToken;
                return next;
              });
              setPage((value) => value + 1);
            }} aria-label="Next design page">Next <ChevronRight /></Button>
          </div>
        </div>
      </div>
      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete design?"
        description={`Are you sure you want to delete ${deleting?.name || deleting?.design_no || "this design"}? This action cannot be undone.`}
        confirmLabel="Delete Design"
        isLoading={deleteDesign.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteDesign.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              if (designs.length === 1 && page > 1) setPage((value) => value - 1);
            },
          });
        }}
      />
    </div>
  );
}

function DesignTableRow({ design, onOpen, onDelete }: { design: Design; onOpen: () => void; onDelete: () => void }) {
  return (
    <tr className="cursor-pointer text-sm text-gray-700 transition-colors hover:bg-violet-50/40" onClick={onOpen} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(); }}>
      <td className="px-4 py-3">
        <p className="truncate font-medium text-gray-900">{design.project.name || "Untitled project"}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400">{design.project.project_no || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="truncate font-medium text-gray-900">{design.design_no ? `${design.design_no} — ` : ""}{design.name}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400">{design.file_name || design.design_no || "—"}</p>
      </td>
      <td className="px-4 py-3"><Badge className="border-0 bg-teal-50 text-[10px] font-semibold text-teal-700 hover:bg-teal-50">{design.version}</Badge></td>
      <td className="px-4 py-3"><Badge variant="outline" className={`whitespace-nowrap text-[10px] font-medium ${statusClassMap[design.status]}`}>{design.status === "in_review" ? "Under Review" : statusLabelMap[design.status]}</Badge></td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(design.uploaded_at)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(design.updated_at)}</td>
      <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-xs text-gray-500"><MessageSquare className="h-3.5 w-3.5" />{design.comment_count}</span></td>
      <td className="px-4 py-3 text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${design.name || design.design_no}`}
          onClick={(event) => { event.stopPropagation(); onDelete(); }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
