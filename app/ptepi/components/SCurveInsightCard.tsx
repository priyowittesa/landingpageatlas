import Link from "next/link";
import { ArrowRight, Calendar, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRange, formatDecimal, formatPace, formatPercent, formatPoints } from "../format";
import { DEVIATION_ALERT_PTS } from "../selectors";
import type { RecoveryRate, WeekCard } from "../types";
import { Chip } from "../operations/components/SignalRow";
import { Tr } from "./Tr";

type SCurveInsightCardProps = {
  week: WeekCard;
  recovery: RecoveryRate | null;
  /** Badge for the data origin (synthetic or actual) */
  badge: React.ReactNode;
  /** Operations Intelligence link for Take action */
  actionHref: string;
  className?: string;
};

const widthOf = (fraction: number | null) => `${Math.max(0, Math.min(1, fraction ?? 0)) * 100}%`;

/**
 * What ATLAS reads from the S-curve and the current week, in one advisory card: the gap to plan,
 * the pace needed to close it against the pace the project has shown, and the week's own gain.
 */
export function SCurveInsightCard({ week, recovery, badge, actionHref, className }: SCurveInsightCardProps) {
  const behind = week.deviationPts !== null && week.deviationPts <= -DEVIATION_ALERT_PTS;
  const required = recovery?.requiredPerWeek ?? null;
  const best = recovery?.bestFourWeekAvg ?? null;
  const paceMax = Math.max(required ?? 0, best ?? 0);
  const reachable = recovery?.ratioToBestFour != null && recovery.ratioToBestFour <= 1;

  return (
    <section
      aria-label="S-curve and current week insight"
      className={cn("flex flex-col overflow-hidden rounded-xl border border-primary-300 bg-background shadow-sm", className)}
    >
      <div aria-hidden className="h-1 w-full bg-gradient-to-r from-primary-700 via-primary-500 to-primary-300" />
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip className="bg-primary-700 text-white ring-primary-700">
            <Lightbulb size={12} aria-hidden />
            <Tr>Insight</Tr>
          </Chip>
          <Chip className="bg-white text-primary-900 ring-primary-200">
            <Tr>Advisory</Tr>
          </Chip>
          <Chip className={behind ? "bg-red-50 text-red-900 ring-red-200" : "bg-green-50 text-green-900 ring-green-200"}>
            {behind ? <TrendingDown size={12} aria-hidden /> : <TrendingUp size={12} aria-hidden />}
            <Tr>{behind ? "Risk" : "On plan"}</Tr>
          </Chip>
          <span className="ml-auto">{badge}</span>
        </div>

        <p className="inline-flex items-center gap-1.5 text-xs text-gray-700">
          <Calendar size={12} aria-hidden />
          <Tr>Week</Tr> {week.weekNo}: <Tr>{formatDateRange(week.weekStart, week.weekEnd)}</Tr>
        </p>

        <div>
          <h3 className="text-lg font-semibold leading-snug text-gray-950">
            <Tr>{behind ? "The S-curve is behind plan" : "The S-curve is on plan"}</Tr>
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">
            <Tr>Actual progress is</Tr> <strong>{week.actual === null ? "-" : formatPercent(week.actual)}</strong>{" "}
            <Tr>against a plan of</Tr> <strong>{week.plan === null ? "-" : formatPercent(week.plan)}</strong>
            {week.deviationPts !== null && (
              <>
                , <Tr>a gap of</Tr> <strong className={behind ? "text-red-700" : undefined}><Tr>{formatPoints(week.deviationPts)}</Tr></strong>
              </>
            )}
            . <Tr>This week gained</Tr> <strong>{week.gainPts === null ? "-" : <Tr>{formatPoints(week.gainPts)}</Tr>}</strong>.
          </p>
        </div>

        <div>
          <ul className="space-y-2.5" aria-label="Plan against actual">
            {(
              [
                { label: "Plan", value: week.plan, bar: "bg-primary-300" },
                { label: "Actual", value: week.actual, bar: "bg-primary-700" }
              ] as const
            ).map((row) => (
              <li key={row.label} className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 text-xs text-gray-800">
                <span><Tr>{row.label}</Tr></span>
                <span className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <span className={cn("block h-full rounded-full", row.bar)} style={{ width: widthOf(row.value) }} />
                </span>
                <span className="text-right font-semibold tabular-nums text-gray-950">{row.value === null ? "-" : formatPercent(row.value)}</span>
              </li>
            ))}
          </ul>
        </div>

        {recovery && required !== null && best !== null && (
          <div className="space-y-2 rounded-lg border border-primary-100 bg-primary-50/50 p-3">
            <p className="text-xs font-semibold text-gray-900">
              <Tr>{reachable ? "Pace needed is within what the project has shown" : "Pace needed is above what the project has shown"}</Tr>
            </p>
            <ul className="space-y-2">
              {(
                [
                  { label: "Needed to finish on time", value: required, bar: reachable ? "bg-green-700" : "bg-red-700" },
                  { label: "Best 4-week average", value: best, bar: "bg-primary-700" }
                ] as const
              ).map((row) => (
                <li key={row.label} className="text-xs text-gray-800">
                  <span className="flex items-baseline justify-between gap-2">
                    <Tr>{row.label}</Tr>
                    <span className="font-semibold tabular-nums text-gray-950"><Tr>{formatPace(row.value)}</Tr></span>
                  </span>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-primary-100">
                    <span
                      className={cn("block h-full rounded-full", row.bar)}
                      style={{ width: paceMax > 0 ? `${(row.value / paceMax) * 100}%` : "0%" }}
                    />
                  </span>
                </li>
              ))}
            </ul>
            {recovery.ratioToBestFour !== null && (
              <p className="text-xs text-gray-700">
                <Tr>Required pace is</Tr> {formatDecimal(recovery.ratioToBestFour, 1)}x <Tr>this benchmark</Tr>
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-primary-100 pt-3">
          <p className="text-xs text-gray-700">
            <Tr>ATLAS-estimated. People decide; nothing runs on its own.</Tr>
          </p>
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
          >
            <Tr>Take action</Tr>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
