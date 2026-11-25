import { Progress } from "@/components/ui/progress";
import { formatPercent } from "../format";
import type { PortfolioTotals } from "../types";
import { MetricLabel } from "./MetricLabel";
import { Tr } from "./Tr";
import { RupiahText } from "./RupiahText";

type BillingExposureProps = {
  totals: PortfolioTotals;
};

export function BillingExposure({ totals }: BillingExposureProps) {
  return (
    <div className="ptepi-card ptepi-card--lift p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold"><Tr>Billed vs unbilled</Tr></h2>
        <span className="text-xs text-muted-foreground">
          <Tr>Tagihan issued against recognised revenue</Tr>
        </span>
      </div>
      <Progress
        value={totals.billedShare * 100}
        className="mt-4 h-2.5"
        indicatorClassName="bg-primary-700"
      />
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">
            <MetricLabel metricId="recognisedRevenue" />
          </dt>
          <dd className="font-semibold">
            <RupiahText value={totals.recognisedRevenue} millions />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            <Tr>Billed</Tr> ({formatPercent(totals.billedShare, 2)})
          </dt>
          <dd className="font-semibold">
            <RupiahText value={totals.billed} millions />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground"><Tr>Unbilled</Tr></dt>
          <dd className="font-semibold">
            <RupiahText value={totals.unbilled} millions />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            <MetricLabel metricId="retentionHeld" />
          </dt>
          <dd className="font-semibold">
            <RupiahText value={totals.retentionHeld} millions />
          </dd>
        </div>
      </dl>
    </div>
  );
}
