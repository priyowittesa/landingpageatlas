import { Tr } from "./Tr";
import { CircleAlert, CircleCheck, Hourglass } from "lucide-react";
import type { BillingSummary } from "../types";
import { RupiahText } from "./RupiahText";

type BillingReadinessStripProps = {
  summary: BillingSummary;
};

export function BillingReadinessStrip({ summary }: BillingReadinessStripProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div className="ptepi-card ptepi-card--lift p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-green-800">
          <CircleCheck size={16} aria-hidden />
          <Tr>Billable now</Tr>
        </div>
        <div className="mt-2 text-2xl font-bold">
          <RupiahText value={summary.billable.amount} millions />
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.billable.count} payment {summary.billable.count === 1 ? "stage" : "stages"} with the condition met and the BA signed
        </p>
      </div>
      <div className="ptepi-card ptepi-card--lift p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
          <Hourglass size={16} aria-hidden />
          <Tr>Due, awaiting BAST II</Tr>
        </div>
        <div className="mt-2 text-2xl font-bold">
          <RupiahText value={summary["awaiting-bast"].amount} millions />
        </div>
        <p className="text-sm text-muted-foreground">
          {summary["awaiting-bast"].count} Retensi 5% {summary["awaiting-bast"].count === 1 ? "stage" : "stages"} due, not billable until BAST II is signed
        </p>
      </div>
      <div className="ptepi-card ptepi-card--lift p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <CircleAlert size={16} aria-hidden />
          <Tr>Blocked</Tr>
        </div>
        <div className="mt-2 text-2xl font-bold">
          <RupiahText value={summary.blocked.amount} millions />
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.blocked.count} payment {summary.blocked.count === 1 ? "stage" : "stages"} held by a missing BA or an unmet condition
        </p>
      </div>
    </div>
  );
}
