import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { formatPointsUnsigned } from "../format";
import type { CriticalItem } from "../types";
import { PercentText } from "./PercentText";

type CriticalItemCalloutProps = {
  projectId: string;
  item: CriticalItem;
};

export function CriticalItemCallout({ projectId, item }: CriticalItemCalloutProps) {
  return (
    <Link
      href={`/ptepi/project/${projectId}/evidence`}
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive bg-gradient-to-r from-red-50 to-background p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert size={16} className="mt-1 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="font-semibold">Critical item: {item.label}</p>
          <p className="text-sm text-gray-700">
            <PercentText fraction={item.weight} /> of the project weight, {formatPointsUnsigned(item.behindPts)}{" "}
            behind plan
            {item.claimedStage && `, claimed stage: ${item.claimedStage}`}.
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700">
        Open evidence gate
        <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
