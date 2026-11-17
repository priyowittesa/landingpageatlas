"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Cursor pagination: tokens[n] is the page_token for page n + 1. Reset whenever the filters change. */
export function usePageTokens(resetKey: string) {
  const [state, setState] = useState({ key: resetKey, page: 1, tokens: [""] });
  const current = state.key === resetKey ? state : { key: resetKey, page: 1, tokens: [""] };
  return {
    page: current.page,
    token: current.tokens[current.page - 1] ?? "",
    next: (nextToken: string) =>
      setState({ key: resetKey, page: current.page + 1, tokens: [...current.tokens.slice(0, current.page), nextToken] }),
    prev: () => setState({ ...current, page: Math.max(1, current.page - 1) }),
    /** Pages already reached have a known token, so any of them can be opened directly. */
    visited: current.tokens.length,
    goTo: (page: number) => {
      if (page >= 1 && page <= current.tokens.length) setState({ ...current, page });
    },
  };
}

export function Pager({
  page,
  pageSize,
  shown,
  total,
  hasNext,
  loading,
  onPrev,
  onNext,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  shown: number;
  total: number;
  hasNext: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
}) {
  const start = shown ? (page - 1) * pageSize + 1 : 0;
  const end = (page - 1) * pageSize + shown;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span>
        {start}–{end}
        {total > 0 && ` of ${total}`}
      </span>
      <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger className="h-8 w-[104px]" aria-label="Rows per page"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((size) => <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Previous page" disabled={page <= 1 || loading} onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Next page" disabled={!hasNext || loading} onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function LoadState({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-gray-500">
      {error ? (
        <>
          Data could not be loaded.
          <Button variant="outline" onClick={onRetry}>Try Again</Button>
        </>
      ) : (
        "Loading..."
      )}
    </div>
  );
}
