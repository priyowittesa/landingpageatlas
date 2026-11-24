import { MetricLabel } from "./MetricLabel";
import type { CostMargin } from "../types";
import { PercentText } from "./PercentText";
import { RupiahText } from "./RupiahText";

type CostMarginCardProps = {
  money: CostMargin;
  /** Adds the contract value and the margin the RAP budget promises (S5) */
  detailed?: boolean;
};

export function CostMarginCard({ money, detailed = false }: CostMarginCardProps) {
  const overRap = money.rapRemaining < 0;
  return (
    <dl className="grid grid-cols-2 gap-5 text-sm">
      {detailed && (
        <div>
          <dt className="text-muted-foreground">Contract value</dt>
          <dd className="font-semibold">
            <RupiahText value={money.contractValue} />
          </dd>
        </div>
      )}
      {detailed && (
        <div>
          <dt className="text-muted-foreground">
            <MetricLabel metricId="recognisedRevenue" />
          </dt>
          <dd className="font-semibold">
            <RupiahText value={money.recognisedRevenue} />
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">Actual cost</dt>
        <dd className="text-lg font-bold">
          <RupiahText value={money.cost} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">
          <MetricLabel metricId="margin" />
        </dt>
        <dd className="text-lg font-bold">
          <PercentText fraction={money.margin} digits={2} />
        </dd>
        {detailed && money.vendorAdvances > 0 && (
          <dd className="text-xs text-muted-foreground">
            Includes vendor advances (uang muka, SES not issued)
          </dd>
        )}
      </div>
      {detailed && money.vendorAdvances > 0 && (
        <div>
          <dt className="text-muted-foreground">
            <MetricLabel metricId="marginExAdvances" />
          </dt>
          <dd className="text-lg font-bold">
            <PercentText fraction={money.marginExAdvances} digits={2} />
          </dd>
          <dd className="text-xs text-muted-foreground">
            Without <RupiahText value={money.vendorAdvances} millions /> of advances
          </dd>
        </div>
      )}
      {detailed && (
        <div>
          <dt className="text-muted-foreground">Profit to date</dt>
          <dd className="font-semibold">
            <RupiahText value={money.profit} />
          </dd>
        </div>
      )}
      {detailed && (
        <div>
          <dt className="text-muted-foreground">Margin at RAP budget</dt>
          <dd className="font-semibold">
            <PercentText fraction={money.plannedMargin} digits={2} />
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">RAP (budget)</dt>
        <dd className="font-semibold">
          <RupiahText value={money.rapPlanned} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">{overRap ? "Over RAP" : "Left in RAP"}</dt>
        <dd className={overRap ? "font-semibold text-destructive" : "font-semibold"}>
          <RupiahText value={Math.abs(money.rapRemaining)} />
        </dd>
      </div>
      {!detailed && (
        <div>
          <dt className="text-muted-foreground">
            <MetricLabel metricId="recognisedRevenue" />
          </dt>
          <dd className="font-semibold">
            <RupiahText value={money.recognisedRevenue} />
          </dd>
        </div>
      )}
      {!detailed && (
        <div>
          <dt className="text-muted-foreground">Profit to date</dt>
          <dd className="font-semibold">
            <RupiahText value={money.profit} />
          </dd>
        </div>
      )}
    </dl>
  );
}
