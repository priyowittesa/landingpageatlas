"use client";

import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiahMillions } from "../format";
import type { PortfolioLifecycleStep } from "../types";
import { useProjectPreview } from "./ProjectPreview";
import { Tr } from "./Tr";

/** The eight stages fall into three phases of the work. */
const PHASE_OF = ["Winning the work", "Winning the work", "Winning the work", "Delivering the work", "Getting paid", "Getting paid", "Getting paid", "Getting paid"];

/**
 * S1 lifecycle as a table: one row per stage from offer to close, with its phase, project count,
 * contract value (a bar against the largest stage) and its projects as chips that open the
 * project drawer. A stage without projects keeps its row.
 */
export function PortfolioLifecycle({ steps }: { steps: PortfolioLifecycleStep[] }) {
  const preview = useProjectPreview();
  const maxValue = Math.max(1, ...steps.map((step) => step.value));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="ptepi-static w-full min-w-[44rem] text-sm">
          <caption className="sr-only">
            <Tr>Portfolio lifecycle</Tr>
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-600">
              <th scope="col" className="px-3 py-2.5 font-medium"><Tr>Stage</Tr></th>
              <th scope="col" className="px-3 py-2.5 font-medium"><Tr>Phase</Tr></th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium"><Tr>Projects</Tr></th>
              <th scope="col" className="w-[28%] px-3 py-2.5 font-medium"><Tr>Contract value</Tr></th>
              <th scope="col" className="px-3 py-2.5 font-medium"><Tr>Project list</Tr></th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => {
              const filled = step.count > 0;
              const startsPhase = index === 0 || PHASE_OF[index] !== PHASE_OF[index - 1];
              return (
                <tr key={step.label} className={cn("border-b border-border/60 align-middle last:border-0", startsPhase && index > 0 && "border-t border-t-primary-200")}>
                  <th scope="row" className="px-3 py-3 text-left font-semibold text-gray-950">
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          filled ? "bg-primary-700 text-white" : "border border-dashed border-primary-300 text-gray-700"
                        )}
                      >
                        {index + 1}
                      </span>
                      <Tr>{step.label}</Tr>
                    </span>
                  </th>
                  <td className="px-3 py-3 text-gray-700">{startsPhase ? <Tr>{PHASE_OF[index] ?? ""}</Tr> : null}</td>
                  <td className={cn("px-3 py-3 text-right text-lg font-bold tabular-nums", filled ? "text-gray-950" : "text-gray-500")}>{step.count}</td>
                  <td className="px-3 py-3">
                    {filled ? (
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-100/70">
                          <span className="block h-full rounded-full bg-primary-600" style={{ width: `${(step.value / maxValue) * 100}%` }} />
                        </span>
                        <span className="w-24 shrink-0 text-right tabular-nums text-gray-900">{formatRupiahMillions(step.value)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600"><Tr>No project</Tr></span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {filled && (
                      <ul className="flex flex-wrap gap-1.5">
                        {step.projectIds.map((id) => (
                          <li key={id}>
                            <button
                              type="button"
                              onClick={() => preview.open(id, step.label)}
                              className="cursor-pointer rounded-md border border-primary-100 bg-primary-50/60 px-2 py-1 text-xs font-medium text-primary-900 transition-colors hover:border-primary-300 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                            >
                              {id}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-center gap-1.5 border-t border-primary-100/60 pt-3 text-xs text-gray-700">
        <MousePointerClick size={14} aria-hidden className="text-primary-700" />
        <Tr>Bars compare contract value across stages. Click a project to open its summary.</Tr>
      </p>
    </div>
  );
}
