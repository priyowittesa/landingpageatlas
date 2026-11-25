"use client";

import { Tr } from "./Tr";
import { useMemo } from "react";
import { MousePointerClick } from "lucide-react";
import { formatRupiahMillions } from "../format";
import { getBillingSummary } from "../selectors";
import { useProjectStore } from "../store/project-store";
import type {
  BillingRow,
  EarningStageChartData,
  EarningStageRow,
  PaymentSchedule,
  ProjectLifecycle,
  WaterfallChartData
} from "../types";
import { BillingReadinessStrip } from "./BillingReadinessStrip";
import { BillingTable } from "./BillingTable";
import { EarningStagesCard, RevenueWaterfallCard } from "./charts/ScreenCharts";
import { EarningRuleTable } from "./EarningRuleTable";
import { PaymentScheduleCard } from "./PaymentScheduleCard";
import { ProjectLifecycleCard } from "./ProjectLifecycleCard";
import { SectionCard } from "./SectionCard";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

export type CommercialProjectView = {
  projectId: string;
  customer: string;
  contractValue: number;
  waterfall: WaterfallChartData;
  stageChart: EarningStageChartData;
  earningStages: EarningStageRow[];
  schedule: PaymentSchedule;
  lifecycle: ProjectLifecycle;
};

type CommercialProjectPanelProps = {
  views: Record<string, CommercialProjectView>;
  rows: BillingRow[];
};

/**
 * Billing readiness, project charts and payment stages. All projects by default;
 * the project filter narrows the readiness strip and the table, and opens the project charts.
 */
export function CommercialProjectPanel({ views, rows }: CommercialProjectPanelProps) {
  const projectId = useProjectStore((state) => state.projectId);
  const view = projectId ? views[projectId] : undefined;
  const badge = <SyntheticDataBadge />;

  const scopedRows = useMemo(
    () => (view ? rows.filter((row) => row.projectId === view.projectId) : rows),
    [rows, view]
  );
  const summary = useMemo(() => getBillingSummary(scopedRows), [scopedRows]);

  return (
    <>
      {scopedRows.length > 0 && <BillingReadinessStrip summary={summary} />}

      {view && view.earningStages.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RevenueWaterfallCard
              chart={view.waterfall}
              title={`${view.customer}, ${view.projectId}: contract value to cash`}
              badge={badge}
            />
            <EarningStagesCard chart={view.stageChart} badge={badge} />
          </div>

          <SectionCard
            title={`Earning rule 15/15/30/30/10: ${view.customer} (${view.projectId})`}
            subtitle={`A stage is earned only when its signed BA is in the register. Stage values use the synthetic ${formatRupiahMillions(view.contractValue)} contract value.`}
            badge={badge}
            flush
          >
            <EarningRuleTable stages={view.earningStages} />
          </SectionCard>
        </>
      ) : view ? (
        <>
          <ProjectLifecycleCard lifecycle={view.lifecycle} />
          {view.schedule.rows.length > 0 && <PaymentScheduleCard schedule={view.schedule} />}
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50/50 px-5 py-4 text-sm text-gray-700">
          <MousePointerClick size={16} aria-hidden className="shrink-0 text-primary-700" />
          <Tr>Showing all projects. Pick a project in the filter above to see its contract-to-cash waterfall and earning stages.</Tr>
        </div>
      )}

      {scopedRows.length > 0 && (
      <SectionCard
        title="Open payment stages"
        subtitle={
          view
            ? `Payment stages of ${view.projectId}. Blocked rows open the evidence gate for that project.`
            : "Blocked rows open the evidence gate for that project."
        }
        badge={badge}
        flush
      >
        <BillingTable rows={scopedRows} />
      </SectionCard>
      )}
    </>
  );
}
