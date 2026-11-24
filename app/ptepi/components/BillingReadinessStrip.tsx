import { CircleAlert, CircleCheck } from "lucide-react";
import type { BillingSummary } from "../types";
import { RupiahText } from "./RupiahText";

type BillingReadinessStripProps = {
  summary: BillingSummary;
};

export function BillingReadinessStrip({ summary }: BillingReadinessStripProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="ptepi-card ptepi-card--lift p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-green-800">
          <CircleCheck size={16} aria-hidden />
          Billable now
        </div>
        <div className="mt-2 text-2xl font-bold">
          <RupiahText value={summary.billable.amount} millions />
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.billable.count} payment stages ready to invoice
        </p>
      </div>
      <div className="ptepi-card ptepi-card--lift p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <CircleAlert size={16} aria-hidden />
          Blocked
        </div>
        <div className="mt-2 text-2xl font-bold">
          <RupiahText value={summary.blocked.amount} millions />
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.blocked.count} payment stages held by a missing BA or an unmet condition
        </p>
      </div>
    </div>
  );
}
