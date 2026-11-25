import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRupiahMillions } from "../format";
import type { PortfolioLifecycleStep } from "../types";
import { Tr } from "./Tr";

/**
 * S1 lifecycle stepper: the eight stages from offer to close, each with its number of
 * projects and their value. A stage with projects is filled; the count is always written out.
 */
export function PortfolioLifecycle({ steps }: { steps: PortfolioLifecycleStep[] }) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8" aria-label="Portfolio lifecycle">
      {steps.map((step, index) => {
        const filled = step.count > 0;
        return (
          <li key={step.label} className="relative">
            {index > 0 && (
              <span aria-hidden className="absolute -left-3 top-5 hidden h-0.5 w-3 bg-primary-200 xl:block" />
            )}
            <div
              className={cn(
                "h-full rounded-xl border p-3",
                filled ? "border-primary-200 bg-primary-50/70" : "border-dashed border-gray-200 bg-white"
              )}
            >
              <p className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    filled ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"
                  )}
                >
                  {index + 1}
                </span>
                <Tr>{step.label}</Tr>
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-gray-950">{step.count}</p>
              <p className="text-xs text-gray-700">
                {filled ? formatRupiahMillions(step.value) : <Tr>No project</Tr>}
              </p>
              {filled && (
                <p className="mt-1.5 flex flex-wrap gap-1">
                  {step.projectIds.map((id) => (
                    <Link
                      key={id}
                      href={`/ptepi/project/${id}`}
                      className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-primary-800 ring-1 ring-inset ring-primary-100 hover:ring-primary-300"
                    >
                      {id}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
