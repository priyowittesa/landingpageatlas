import { formatDecimal, formatPace, formatPercent, formatPoints, formatWeekRange } from "../format";
import type { RecoveryRate } from "../types";
import { StatusBadge } from "./StatusBadge";
import { Tr } from "./Tr";

type RecoveryCardProps = {
  recovery: RecoveryRate;
  /** Cumulative actual of the flat period, fraction */
  actual: number | null;
};

/**
 * Recovery run-rate (DP-04): the pace needed to finish on the planned date against the
 * best 4-week rolling average achieved. The best single week is shown second, for context.
 */
export function RecoveryCard({ recovery, actual }: RecoveryCardProps) {
  const isFlat = recovery.flatWeeks >= 2;
  const reachable = recovery.ratioToBestFour !== null && recovery.ratioToBestFour <= 1;
  return (
    <div className="space-y-4">
      {isFlat && (
        <div className="space-y-1">
          <StatusBadge tone="bad" label="No progress" />
          <p className="text-sm">
            <Tr>No progress in</Tr> <Tr>{formatWeekRange(recovery.flatFromWeek ?? 0, recovery.flatToWeek ?? 0)}</Tr>
            {actual !== null && (
              <>
                , <Tr>flat at</Tr> {formatPercent(actual)}
              </>
            )}
            .
          </p>
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground">
          <Tr>To finish on the planned date</Tr>
        </p>
        <p className="text-2xl font-bold">
          {formatDecimal(recovery.requiredPerWeek, 1)} <Tr>points per week</Tr>
        </p>
        <p className="text-sm text-muted-foreground">
          {formatDecimal(recovery.remainingPts, 1)} <Tr>points still to earn in</Tr> {recovery.weeksRemaining}{" "}
          <Tr>weeks</Tr>
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3">
          <dt className="font-medium text-gray-900">
            <Tr>Best 4-week rolling average</Tr>
          </dt>
          <dd className="text-xl font-bold">
            {formatDecimal(recovery.bestFourWeekAvg, 1)} <Tr>points per week</Tr>
          </dd>
          {recovery.ratioToBestFour !== null && (
            <dd className="mt-1">
              <StatusBadge
                tone={reachable ? "good" : "bad"}
                label={reachable ? "Within the demonstrated pace" : "Above the demonstrated pace"}
              />
            </dd>
          )}
          {recovery.ratioToBestFour !== null && (
            <dd className="mt-1 text-xs text-gray-700">
              <Tr>Required pace is</Tr> {formatDecimal(recovery.ratioToBestFour, 1)}x <Tr>this benchmark</Tr>
            </dd>
          )}
        </div>
        <div className="space-y-3 p-3">
          <div>
            <dt className="text-muted-foreground">
              <Tr>Best single week (secondary)</Tr>
            </dt>
            <dd className="font-semibold"><Tr>{formatPoints(recovery.bestPerWeek)}</Tr></dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              <Tr>Last 4 weeks, per week</Tr>
            </dt>
            <dd className="font-semibold"><Tr>{formatPace(recovery.recentPerWeek)}</Tr></dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
