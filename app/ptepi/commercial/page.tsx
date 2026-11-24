import {
  CalendarClock,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  Receipt
} from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { KpiCard } from "../components/KpiCard";
import { ProjectFilter } from "../components/ProjectFilter";
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
  getRevenueTotals,
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
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
          title="Accrual revenue 2026"
          subtitle="Recognised to the as-at date"
          value={formatRupiahMillions(revenue.accruedThisYear)}
          icon={CircleDollarSign}
        />
        <KpiCard
          title="Taksasi revenue"
          subtitle="Estimate not yet accrued"
          value={formatRupiahMillions(revenue.estimateRemaining)}
          icon={CalendarClock}
        />
      </div>

      <CommercialProjectPanel views={projectViews} rows={billingRows} />
    </div>
  );
}
