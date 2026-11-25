import { MetricLabel } from "./MetricLabel";
import { Tr } from "./Tr";
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
          <dt className="text-muted-foreground"><Tr>Contract value</Tr></dt>
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
        <dt className="text-muted-foreground"><Tr>Actual cost</Tr></dt>
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
            <Tr>Includes vendor advances (uang muka, SES not issued)</Tr>
          </dd>
        )}
      </div>
      {detailed && money.vendorAdvances > 0 && (
        <div className="col-span-2 rounded-lg bg-amber-50/60 p-3">
          <dt className="text-muted-foreground">
            <MetricLabel metricId="advancesNoSes" />
          </dt>
          <dd className="text-lg font-bold">
            <RupiahText value={money.vendorAdvances} millions />{" "}
            <span className="text-sm font-medium text-muted-foreground">
              (<PercentText fraction={money.advancesShareOfCost} digits={1} /> <Tr>of realised cost</Tr>)
            </span>
          </dd>
          <dd className="text-xs text-muted-foreground">
            <Tr>Not a margin: revenue is progress-based while material cost is only recognised on SES.</Tr>
          </dd>
        </div>
      )}
      {detailed && (
        <div>
          <dt className="text-muted-foreground"><Tr>Profit to date</Tr></dt>
          <dd className="font-semibold">
            <RupiahText value={money.profit} />
          </dd>
        </div>
      )}
      {detailed && (
        <div>
          <dt className="text-muted-foreground"><Tr>Margin at RAP budget</Tr></dt>
          <dd className="font-semibold">
            <PercentText fraction={money.plannedMargin} digits={2} />
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground"><Tr>RAP (budget)</Tr></dt>
        <dd className="font-semibold">
          <RupiahText value={money.rapPlanned} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground"><Tr>{overRap ? "Over RAP" : "Left in RAP"}</Tr></dt>
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
          <dt className="text-muted-foreground"><Tr>Profit to date</Tr></dt>
          <dd className="font-semibold">
            <RupiahText value={money.profit} />
          </dd>
        </div>
      )}
    </dl>
  );
}
