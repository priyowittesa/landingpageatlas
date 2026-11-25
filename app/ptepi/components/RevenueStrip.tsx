import { CircleDollarSign, FileSignature, TrendingUp } from "lucide-react";
import { formatRupiahMillions } from "../format";
import type { RevenueTrio } from "../types";
import { KpiCard } from "./KpiCard";
import { Tr } from "./Tr";

/** On-screen definition under a revenue figure, so the difference is read, not hovered. */
function Definition({ text }: { text: string }) {
  return (
    <p className="border-t border-primary-100/70 pt-2 text-xs leading-snug text-gray-700">
      <Tr>{text}</Tr>
    </p>
  );
}

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
        footer={<Definition text="All revenue earned since the contract started: final contract value x measured progress." />}
      />
      <KpiCard
        title="Accrual revenue 2026"
        metricId="accrualRevenue"
        value={formatRupiahMillions(revenue.accrualThisYear)}
        subtitle={scope}
        icon={CircleDollarSign}
        footer={<Definition text="Only the part earned this year: recognised revenue minus what was recognised before 1 Jan. Equal to recognised revenue when the project started this year." />}
      />
      <KpiCard
        title="Earned with signed BA"
        metricId="earnedValue"
        value={formatRupiahMillions(revenue.earnedWithSignedBa)}
        subtitle={scope}
        icon={FileSignature}
        footer={<Definition text="Recognised revenue whose earning stage has a signed BA, so it can be billed." />}
      />
    </div>
  );
}
