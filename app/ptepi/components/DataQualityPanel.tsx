import Link from "next/link";
import { FileWarning } from "lucide-react";
import type { DataQualityFlag } from "../types";
import { Tr } from "./Tr";

/**
 * S1 data-quality flags in one place: records that need fixing before they can be
 * trusted (copied or incomplete numbers, files on personal drives). Each links to its evidence gate.
 */
export function DataQualityPanel({ flags }: { flags: DataQualityFlag[] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {flags.map((flag) => (
        <li key={`${flag.reference}-${flag.label}`}>
          <Link
            href={`/ptepi/project/${flag.projectId}/evidence`}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-primary-50/50"
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
          </Link>
        </li>
      ))}
    </ul>
  );
}
