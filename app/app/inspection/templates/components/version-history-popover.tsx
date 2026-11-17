"use client";

import { format } from "date-fns";
import { ChevronDown, X } from "lucide-react";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { TemplateStatus, TemplateVersionHistoryEntry } from "../types";

const STATUS_BADGE_CLASS: Record<TemplateStatus, string> = {
  Draft: "bg-blue-50 text-blue-700",
  Archived: "bg-amber-50 text-amber-700",
  Published: "bg-emerald-50 text-emerald-700"
};

function formatVersionDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1970) return "";
  return format(date, "MMM d, yyyy");
}

export function VersionHistoryPopover({
  currentVersion,
  versions,
  isLoading,
  onSelectVersion
}: {
  currentVersion: number;
  versions?: TemplateVersionHistoryEntry[];
  isLoading?: boolean;
  onSelectVersion?: (version: number) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
        >
          Rev {currentVersion}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-84 p-0">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-sm font-bold text-gray-950">Version History</h3>
          <PopoverClose
            className="text-gray-400 transition hover:text-gray-600"
            aria-label="Close version history"
          >
            <X className="h-4 w-4" />
          </PopoverClose>
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="p-3 text-sm text-gray-400">Loading versions...</p>
          ) : !versions || versions.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">No version history.</p>
          ) : (
            versions.map((entry) => {
              const isCurrent = entry.version === currentVersion;
              const author = entry.createdBy || entry.updatedBy || "system";
              const date =
                formatVersionDate(entry.publishedAt) ||
                formatVersionDate(entry.createdAt);
              const clickable = Boolean(onSelectVersion) && !isCurrent;
              return (
                <button
                  key={entry.version}
                  type="button"
                  disabled={!clickable}
                  onClick={() => onSelectVersion?.(entry.version)}
                  className={`w-full rounded-lg p-3 text-left transition ${
                    isCurrent
                      ? "bg-primary-50"
                      : clickable
                        ? "hover:bg-gray-50"
                        : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-950">
                      Rev {entry.version}
                    </span>
                    {entry.status && (
                      <Badge
                        variant="secondary"
                        className={STATUS_BADGE_CLASS[entry.status]}
                      >
                        {entry.status}
                      </Badge>
                    )}
                    {isCurrent && (
                      <span className="text-xs font-semibold text-primary-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    by {author}
                    {date ? ` • ${date}` : ""}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
