import { TrendingDown } from "lucide-react";
import { formatPoints } from "../format";
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
        Week {week.weekNo}: {week.weekStart} to {week.weekEnd}
      </p>
      <dl className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground">Plan (cumulative)</dt>
          <dd className="text-xl font-bold">
            <PercentText fraction={week.plan} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground">Actual (cumulative)</dt>
          <dd className="text-xl font-bold">
            <PercentText fraction={week.actual} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <dt className="text-sm text-muted-foreground">Deviation</dt>
          <dd
            className={
              alert
                ? "inline-flex items-center gap-1.5 text-xl font-bold text-destructive"
                : "text-xl font-bold"
            }
          >
            {alert && <TrendingDown size={16} aria-hidden />}
            {week.deviationPts === null ? "-" : formatPoints(week.deviationPts)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground">Progress this week</dt>
          <dd className="text-sm font-medium">
            {week.gainPts === null ? "-" : formatPoints(week.gainPts)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
