import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Criticality, TriageAsset } from "../lib/types";

const CRITICALITY_CLASSES: Record<Criticality, string> = {
  A: "bg-red-100 text-red-700",
  B: "bg-amber-100 text-amber-800",
  C: "bg-indigo-100 text-indigo-800",
};

export function CriticalityTag({ value, faded }: { value: Criticality; faded?: boolean }) {
  return (
    <span
      title={`Criticality ${value}`}
      className={cn(
        "inline-grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-[11px] font-bold",
        CRITICALITY_CLASSES[value],
        faded && "opacity-45"
      )}
    >
      {value}
    </span>
  );
}

/** Current criticality, showing the overridden LLM value for manual corrections. */
export function CriticalityCell({ asset }: { asset: TriageAsset }) {
  if (asset.source === "manual" && asset.llm && asset.llm.criticality !== asset.criticality) {
    return (
      <span className="inline-flex items-center gap-1">
        <CriticalityTag value={asset.llm.criticality} faded />
        <ArrowRight className="h-3 w-3 text-gray-500" />
        <CriticalityTag value={asset.criticality} />
      </span>
    );
  }
  return <CriticalityTag value={asset.criticality} />;
}

export const yesNo = (value: boolean) => (value ? "Yes" : "No");

export function BottleneckCell({ asset }: { asset: TriageAsset }) {
  if (asset.source === "manual" && asset.llm && asset.llm.bottleneck !== asset.bottleneck) {
    return (
      <span className="text-sm">
        <span className="text-gray-500 line-through">{yesNo(asset.llm.bottleneck)}</span> {yesNo(asset.bottleneck)}
      </span>
    );
  }
  return <span className="text-sm">{yesNo(asset.bottleneck)}</span>;
}
