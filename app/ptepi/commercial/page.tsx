import {
  CalendarClock,
  FileCheck2,
  Landmark,
  Receipt
} from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { KpiCard } from "../components/KpiCard";
import { ProjectFilter } from "../components/ProjectFilter";
import { RevenueStrip } from "../components/RevenueStrip";
import { AdaptiveRow } from "../components/AdaptiveRow";
import { CarryOverCard } from "../components/CarryOverCard";
import { SyntheticDataBadge } from "../components/SyntheticDataBadge";
import { RetentionAgeingCard } from "../components/charts/ScreenCharts";
import { CommercialProjectPanel, type CommercialProjectView } from "../components/CommercialProjectPanel";
import { epiData } from "../data";
import { formatRupiahMillions } from "../format";
import {
  getBilledByType,
  getBillingRows,
  getEarningStageChart,
  getEarningStages,
  getProjectFilterOptions,
  getPaymentSchedule,
  getProjectInfo,
  getProjectLifecycle,
  getRevenueCarryOver,
  getRetentionAgeing,
  getRevenueTotals,
  getRevenueTrio,
  getRevenueWaterfall
} from "../selectors";

export default function CommercialBillingPage() {
  const billed = getBilledByType(epiData);
  const revenue = getRevenueTotals(epiData);
  const billingRows = getBillingRows(epiData);
  const projectViews: Record<string, CommercialProjectView> = {};
  for (const { projectId } of epiData.projects) {
    const info = getProjectInfo(epiData, projectId);
    projectViews[projectId] = {
      projectId,
      customer: info.customer,
      contractValue: info.contractValue,
      waterfall: getRevenueWaterfall(epiData, projectId),
      stageChart: getEarningStageChart(epiData, projectId),
      earningStages: getEarningStages(epiData, projectId),
      schedule: getPaymentSchedule(epiData, projectId),
      lifecycle: getProjectLifecycle(epiData, projectId)
    };
  }

  return (
    <div className="space-y-8">
      <ScreenHeader
        title="Commercial and billing"
        subtitle={`What can be billed now, what is blocked, and the revenue still expected.`}
        actions={<ProjectFilter options={getProjectFilterOptions(epiData)} allowAll />}
      />

      <RevenueStrip revenue={getRevenueTrio(epiData)} scope="All projects" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tagihan termin"
          subtitle="Uang Muka and Termin invoiced"
          value={formatRupiahMillions(billed.termin)}
          icon={Receipt}
        />
        <KpiCard
          title="Tagihan 95%"
          subtitle="Completion invoiced"
          value={formatRupiahMillions(billed.ninetyFive)}
          icon={FileCheck2}
        />
        <KpiCard
          title="Retensi 5%"
          subtitle="Retensi invoiced"
          value={formatRupiahMillions(billed.retention)}
          icon={Landmark}
        />
        <KpiCard
          title="Taksasi revenue"
          metricId="taksasiRevenue"
          subtitle="Estimate not yet accrued"
          value={formatRupiahMillions(revenue.estimateRemaining)}
          icon={CalendarClock}
        />
      </div>

      <AdaptiveRow>
        <CarryOverCard carryOver={getRevenueCarryOver(epiData)} />
        <RetentionAgeingCard chart={getRetentionAgeing(epiData)} badge={<SyntheticDataBadge />} />
      </AdaptiveRow>

      <CommercialProjectPanel views={projectViews} rows={billingRows} />
    </div>
  );
}
