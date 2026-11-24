import { Progress } from "@/components/ui/progress";
import type { WeightRow } from "../types";
import { PercentText } from "./PercentText";

type WeightBreakdownProps = {
  rows: WeightRow[];
};

export function WeightBreakdown({ rows }: WeightBreakdownProps) {
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.component}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium">{row.label}</span>
            <span className="text-sm font-semibold">
              <PercentText fraction={row.weight} />
            </span>
          </div>
          <Progress value={row.weightPts} className="mt-1.5 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            Actual <PercentText fraction={row.actual} /> of the project, plan{" "}
            <PercentText fraction={row.plan} />
          </p>
        </li>
      ))}
    </ul>
  );
}
