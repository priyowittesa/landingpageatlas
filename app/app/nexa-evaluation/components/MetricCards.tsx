import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EvaluationMetric } from "../mock-data";

export function MetricCards({
  metrics,
  showComparison
}: {
  metrics: EvaluationMetric[];
  showComparison: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.name} className="min-w-0 rounded-2xl border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold leading-5 text-gray-950">{metric.title}</h3>
          <p className="text-xs leading-4 text-gray-950">{metric.name}</p>
          <div className="my-3 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-semibold leading-8 text-gray-950">{metric.score}%</span>
            <Badge
              variant={metric.score >= 90 ? "green" : "yellow"}
              className="rounded-full border-0 px-2 py-0.5 font-normal"
            >
              {metric.score >= 90 ? "Good" : "Needs attention"}
            </Badge>
          </div>
          <p className="text-xs leading-4 text-gray-950">{metric.flagged}</p>
          {showComparison && <p className="text-xs leading-4 text-green-600">+2 pts since 1 Oct</p>}
        </Card>
      ))}
    </div>
  );
}
