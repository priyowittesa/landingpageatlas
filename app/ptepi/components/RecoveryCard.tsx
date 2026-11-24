import { formatDecimal, formatPercent, formatPoints } from "../format";
import type { RecoveryRate } from "../types";
import { StatusBadge } from "./StatusBadge";

type RecoveryCardProps = {
  recovery: RecoveryRate;
  /** Cumulative actual of the flat period, fraction */
  actual: number | null;
};

export function RecoveryCard({ recovery, actual }: RecoveryCardProps) {
  const isFlat = recovery.flatWeeks >= 2;
  return (
    <div className="space-y-4">
      {isFlat && (
        <div className="space-y-1">
          <StatusBadge tone="bad" label="No progress" />
          <p className="text-sm">
            Flat
            {actual !== null && ` at ${formatPercent(actual)}`} in weeks{" "}
            {recovery.flatFromWeek} to {recovery.flatToWeek} ({recovery.flatWeeks} weeks).
          </p>
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground">To finish on the planned date</p>
        <p className="text-2xl font-bold">
          {formatDecimal(recovery.requiredPerWeek, 1)} points per week
        </p>
        <p className="text-sm text-muted-foreground">
          {formatDecimal(recovery.remainingPts, 2)} points still to earn in{" "}
          {recovery.weeksRemaining} weeks
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Best week so far</dt>
          <dd className="font-semibold">{formatPoints(recovery.bestPerWeek)}</dd>
          {recovery.ratioToBest !== null && (
            <dd className="text-xs text-muted-foreground">
              Required is {formatPercent(recovery.ratioToBest, 2)} of it
            </dd>
          )}
        </div>
        <div>
          <dt className="text-muted-foreground">Last 4 weeks, per week</dt>
          <dd className="font-semibold">{formatPoints(recovery.recentPerWeek)}</dd>
        </div>
      </dl>
    </div>
  );
}
