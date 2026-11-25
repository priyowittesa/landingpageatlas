"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useProjectPreview } from "./ProjectPreview";
import { FileWarning } from "lucide-react";
import type { DataQualityFlag } from "../types";
import { Tr } from "./Tr";

/**
 * S1 data-quality flags in one place: records that need fixing before they can be
 * trusted (copied or incomplete numbers, files on personal drives). Each links to its evidence gate.
 */
const VISIBLE_FLAGS = 5;

export function DataQualityPanel({ flags }: { flags: DataQualityFlag[] }) {
  const preview = useProjectPreview();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? flags : flags.slice(0, VISIBLE_FLAGS);
  return (
    <div className="flex h-full flex-col gap-3">
    <ul className="flex flex-1 flex-col divide-y divide-border rounded-lg border border-border">
      {shown.map((flag) => (
        <li key={`${flag.reference}-${flag.label}`} className="flex flex-1">
          <button
            type="button"
            onClick={() => preview.open(flag.projectId, flag.detail ? `${flag.label}: ${flag.detail}` : flag.label)}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-50/50"
          >
            <FileWarning size={16} aria-hidden className="mt-0.5 shrink-0 text-amber-700" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-950">
                <Tr>{flag.label}</Tr>
              </span>
              {flag.detail && <span className="block text-xs text-gray-700">{flag.detail}</span>}
            </span>
            <span className="shrink-0 text-right text-xs">
              <span className="block font-semibold text-primary-800">{flag.projectId}</span>
              <span className="text-muted-foreground">
                {flag.reference} · <Tr>{flag.source}</Tr>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
    {flags.length > VISIBLE_FLAGS && (
      <button
        type="button"
        aria-expanded={showAll}
        onClick={() => setShowAll((value) => !value)}
        className="inline-flex cursor-pointer items-center gap-1.5 self-start text-sm font-medium text-primary-800 hover:underline"
      >
        <ChevronDown size={16} aria-hidden className={showAll ? "rotate-180" : undefined} />
        {showAll ? <Tr>Show fewer</Tr> : <><Tr>Show all</Tr> {flags.length}</>}
      </button>
    )}
    </div>
  );
}
