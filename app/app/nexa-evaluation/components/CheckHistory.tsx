import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { remainingReviews, type EvaluationRun } from "../mock-data";

export function CheckHistory({
  runs,
  selectedId,
  onSelect
}: {
  runs: EvaluationRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="border-b border-gray-200 p-5 xl:w-[300px] xl:shrink-0 xl:border-r xl:border-b-0">
      <h2 className="mb-5 text-xl font-bold text-gray-900">Check History</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1" aria-label="Evaluation check history">
        {runs.map((run) => {
          const remaining = remainingReviews(run);
          return (
            <button
              key={run.id}
              type="button"
              aria-pressed={run.id === selectedId}
              onClick={() => onSelect(run.id)}
              className={cn(
                "min-w-0 cursor-pointer rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                run.id === selectedId && "border-2 border-primary-500 p-[11px]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold leading-6 text-gray-950">{run.date}</span>
                <Badge
                  variant={run.status === "failed" ? "red" : "green"}
                  className="rounded-full border-0 px-2 py-0.5 font-normal"
                >
                  {run.status === "failed" ? "Failed" : "Good"}
                </Badge>
              </div>
              <p className="text-xs leading-4 text-gray-500">
                {run.status === "failed"
                  ? "231 of 488 answers checked - service was too busy"
                  : <>{run.period} &middot; {run.answers} answers &middot; {run.cost}</>}
              </p>
              <p className={cn(
                "text-xs leading-4",
                run.status === "failed" ? "text-red-600" : remaining > 0 ? "text-amber-600" : "text-primary-500"
              )}>
                {run.status === "failed"
                  ? "Resume available"
                  : remaining > 0
                    ? `${remaining} of ${run.reviewAnswers.length} answers to review`
                    : "All reviewed"}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
