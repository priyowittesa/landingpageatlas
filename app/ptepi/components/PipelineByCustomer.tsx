"use client";

import { useProjectPreview } from "./ProjectPreview";
import { Hourglass } from "lucide-react";
import { formatRupiahMillions } from "../format";
import type { PipelineCustomer } from "../types";
import { Tr } from "./Tr";

/** S1 pipeline by customer: offers and procurement not yet contracted, largest customer first. */
export function PipelineByCustomer({ customers }: { customers: PipelineCustomer[] }) {
  const preview = useProjectPreview();
  return (
    <ul className="flex h-full flex-col divide-y divide-border">
      {customers.map((customer) => (
        <li key={customer.customer} className="flex flex-1 flex-col justify-center py-3 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-950">{customer.customer}</p>
              <p className="truncate text-xs text-muted-foreground">{customer.customerName}</p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums">{formatRupiahMillions(customer.value)}</p>
          </div>
          <ul className="mt-2 space-y-1">
            {customer.projects.map((project) => (
              <li key={project.projectId} className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => preview.open(project.projectId, `${customer.customer}: ${project.stageLabel}`)}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-primary-800 hover:underline"
                >
                  <Hourglass size={14} aria-hidden />
                  {project.projectId}
                  <span className="text-gray-700">· <Tr>{project.stageLabel}</Tr></span>
                </button>
                <span className="tabular-nums text-gray-700">{formatRupiahMillions(project.value)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
