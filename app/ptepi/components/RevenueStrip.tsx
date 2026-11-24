import { CircleDollarSign, FileSignature, TrendingUp } from "lucide-react";
import { formatRupiahMillions } from "../format";
import type { RevenueTrio } from "../types";
import { KpiCard } from "./KpiCard";

type RevenueStripProps = {
  revenue: RevenueTrio;
  /** "All projects" or a project id, shown under each figure */
  scope: string;
};

/** The three revenue KPIs. Labels and formula tooltips come from metrics.ts, identical on S1, S2 and S3. */
export function RevenueStrip({ revenue, scope }: RevenueStripProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <KpiCard
        title="Recognised revenue"
        metricId="recognisedRevenue"
        value={formatRupiahMillions(revenue.recognisedRevenue)}
        subtitle={scope}
        icon={TrendingUp}
      />
      <KpiCard
        title="Accrual revenue 2026"
        metricId="accrualRevenue"
        value={formatRupiahMillions(revenue.accrualThisYear)}
        subtitle={scope}
        icon={CircleDollarSign}
      />
      <KpiCard
        title="Earned with signed BA"
        metricId="earnedValue"
        value={formatRupiahMillions(revenue.earnedWithSignedBa)}
        subtitle={scope}
        icon={FileSignature}
      />
    </div>
  );
}
