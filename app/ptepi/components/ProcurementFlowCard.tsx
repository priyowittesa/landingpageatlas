import { ArrowRight, CircleAlert, CircleCheck, Clock, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatRupiah, formatRupiahMillions } from "../format";
import type { ProcurementFlow, ProcurementStepState } from "../types";
import { SectionCard } from "./SectionCard";
import { SyntheticDataBadge } from "./SyntheticDataBadge";
import { Tr } from "./Tr";

const STATE: Record<ProcurementStepState, { label: string; Icon: LucideIcon; className: string }> = {
  done: { label: "On file", Icon: CircleCheck, className: "bg-green-50 text-green-800 ring-green-200" },
  advance: { label: "Advance, not settled", Icon: Clock, className: "bg-amber-50 text-amber-900 ring-amber-200" },
  missing: { label: "Missing", Icon: CircleAlert, className: "bg-red-50 text-red-700 ring-red-200" },
  "not-applicable": { label: "Petty cash", Icon: Minus, className: "bg-gray-50 text-gray-700 ring-gray-200" }
};

/** S5: every cost line through PR, PO, service entry sheet and payment, with its SAP numbers. */
export function ProcurementFlowCard({ projectId, flow }: { projectId: string; flow: ProcurementFlow }) {
  return (
    <SectionCard
      title={`Procurement flow: ${projectId}`}
      subtitle="PR, PO, service entry sheet and payment per cost line, with the SAP numbers on file"
      badge={<SyntheticDataBadge />}
    >
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {flow.stages.map((stage, index) => (
          <li key={stage.key} className="relative rounded-xl border border-primary-100 bg-primary-50/50 p-4">
            {index > 0 && (
              <ArrowRight size={16} aria-hidden className="absolute -left-3.5 top-1/2 hidden -translate-y-1/2 text-primary-400 xl:block" />
            )}
            <p className="text-xs font-medium text-gray-700">
              {index + 1}. <Tr>{stage.label}</Tr>
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-gray-950">
              {stage.reached} / {stage.applicable}
            </p>
            <p className="text-xs text-gray-700">
              <Tr>cost lines</Tr> · {formatRupiahMillions(stage.amount)}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-5 overflow-x-auto">
        <table className="ptepi-static w-full min-w-[53.75rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium"><Tr>Cost line</Tr></th>
              {flow.stages.map((stage) => (
                <th key={stage.key} className="px-3 py-2 font-medium"><Tr>{stage.label}</Tr></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flow.lines.map((line) => (
              <tr key={line.lineNo} className="border-b border-border/60 align-top last:border-0">
                <td className="px-3 py-3">
                  <span className="block max-w-56 font-medium text-gray-950">{line.item}</span>
                  <span className="block text-xs text-muted-foreground">
                    {line.vendor} · {formatRupiah(line.amount)}
                  </span>
                </td>
                {line.steps.map((step) => {
                  const state = STATE[step.state];
                  return (
                    <td key={step.key} className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ring-1 ring-inset", state.className)}>
                        <state.Icon size={12} aria-hidden />
                        <Tr>{state.label}</Tr>
                      </span>
                      {step.number && <span className="mt-1 block font-mono text-xs text-gray-900">{step.number}</span>}
                      {step.date && <span className="block text-xs text-muted-foreground">{formatDate(step.date)}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
