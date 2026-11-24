import { CalendarClock, ClipboardCheck, FileSignature, TriangleAlert } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { KpiCard } from "../components/KpiCard";
import { CoverageCard } from "../components/charts/ScreenCharts";
import { SectionCard } from "../components/SectionCard";
import { ServiceTables } from "../components/ServiceTables";
import { SyntheticDataBadge } from "../components/SyntheticDataBadge";
import { epiData } from "../data";
import { formatPercent } from "../format";
import {
  getCoverageChart,
  getNextInspections,
  getServiceInspectionRows,
  getServiceScopeRows,
  getServiceSummary
} from "../selectors";

export default function ServiceContractsPage() {
  const summary = getServiceSummary(epiData);
  const coverage = getCoverageChart(epiData);
  const next = getNextInspections(epiData);
  const scope = getServiceScopeRows(epiData);
  const inspections = getServiceInspectionRows(epiData);

  return (
    <div className="space-y-8">
      <ScreenHeader
        title="Service contracts"
        subtitle={`Inspections delivered against the contracted scope.`}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Service contracts"
          subtitle="IKT, IPC TPK and PTP"
          value={summary.contractCount}
          icon={FileSignature}
        />
        <KpiCard
          title="Coverage"
          subtitle="Inspections done against required"
          value={formatPercent(summary.coverage, 2)}
          icon={ClipboardCheck}
        />
        <KpiCard
          title="Overdue inspections"
          tone="bad"
          subtitle="Required, period ended, not done"
          value={`${summary.overdueInspections} in ${summary.overdueItems} items`}
          icon={TriangleAlert}
        />
        <KpiCard
          title="Next inspections"
          subtitle="Scheduled after the as-at date"
          value={`${summary.upcomingCount} from ${summary.nextDate ?? "-"}`}
          icon={CalendarClock}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <CoverageCard chart={coverage} badge={<SyntheticDataBadge />} className="xl:col-span-3" />

        <SectionCard
          title="Next inspections"
          subtitle="Soonest first"
          badge={<SyntheticDataBadge />}
          className="xl:col-span-2"
        >
          <ul className="divide-y divide-border rounded-lg border border-border">
            {next.map((row) => (
              <li key={row.inspectionId} className="p-3">
                <p className="text-sm font-medium">
                  {row.inspectionDate}: {row.contractId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.scopeNo}. {row.scopeItem}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Scope and inspections"
        subtitle="The IKT scope items come from the 10 Jun 2025 service minutes. Counts and inspection records are synthetic."
        badge={<SyntheticDataBadge />}
        flush
      >
        <ServiceTables scope={scope} inspections={inspections} />
      </SectionCard>
    </div>
  );
}
