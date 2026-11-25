import { Tr } from "./Tr";
import { TrendingDown } from "lucide-react";
import { formatDateRange, formatPoints } from "../format";
import { DEVIATION_ALERT_PTS } from "../selectors";
import type { WeekCard as WeekCardData } from "../types";
import { PercentText } from "./PercentText";

type WeekCardProps = {
  week: WeekCardData;
};

export function WeekCard({ week }: WeekCardProps) {
  const alert = week.deviationPts !== null && week.deviationPts <= -DEVIATION_ALERT_PTS;
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        <Tr>Week</Tr> {week.weekNo}: <Tr>{formatDateRange(week.weekStart, week.weekEnd)}</Tr>
      </p>
      <dl className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground"><Tr>Plan (cumulative)</Tr></dt>
          <dd className="text-xl font-bold">
            <PercentText fraction={week.plan} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground"><Tr>Actual (cumulative)</Tr></dt>
          <dd className="text-xl font-bold">
            <PercentText fraction={week.actual} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <dt className="text-sm text-muted-foreground"><Tr>Deviation</Tr></dt>
          <dd
            className={
              alert
                ? "inline-flex items-center gap-1.5 text-xl font-bold text-destructive"
                : "text-xl font-bold"
            }
          >
            {alert && <TrendingDown size={16} aria-hidden />}
            {week.deviationPts === null ? "-" : <Tr>{formatPoints(week.deviationPts)}</Tr>}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground"><Tr>Progress this week</Tr></dt>
          <dd className="text-sm font-medium">
            {week.gainPts === null ? "-" : <Tr>{formatPoints(week.gainPts)}</Tr>}
          </dd>
        </div>
      </dl>
    </div>
  );
}
