import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EvaluationOptions, RunPhase } from "../mock-data";
import { mockEstimate } from "../mock-data";

export function RunProgress({
  phase,
  options,
  onStop
}: {
  phase: Exclude<RunPhase, "idle">;
  options: EvaluationOptions;
  onStop: () => void;
}) {
  const estimate = mockEstimate(options);
  const collected = phase !== "collecting";
  const checked = phase === "reporting";
  const steps = [
    {
      title: "Collect chats",
      detail: collected
        ? `${estimate.messages} chat messages found, ${estimate.answers} answers to check`
        : "Reading chat history...",
      status: collected ? "Done" : "Collecting...",
      progress: collected ? 100 : 75
    },
    {
      title: "Check answers",
      detail: !collected ? "Starts after chats are collected" : `${checked ? estimate.answers : Math.round(estimate.answers * 0.625)} of ${estimate.answers} answers`,
      status: checked ? `Done - ${estimate.cost}` : collected ? `about 9s left - ${estimate.cost} estimated` : "Waiting...",
      progress: checked ? 100 : collected ? 63 : 0
    },
    {
      title: "Prepare report",
      detail: checked ? "Writing the summary..." : "Summary of what was found",
      status: checked ? "Almost done..." : "Waiting...",
      progress: checked ? 75 : 0
    }
  ];

  return (
    <section className="space-y-3 rounded-xl border border-primary-500 p-4" aria-label="Simulated evaluation progress">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-950">Checking answers &middot; UI preview</p>
          <p className="text-xs text-gray-500">Simulated progress only. No chat data is collected or sent.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onStop} className="rounded-lg">
          Stop Check
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3" role="status" aria-live="polite">
        {steps.map((step) => (
          <Card key={step.title} className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border-gray-200 p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-gray-950">{step.title}</h3>
              <p className="text-xs leading-4 text-gray-950">{step.detail}</p>
            </div>
            <div>
              {step.progress > 0 && <Progress value={step.progress} indicatorClassName="bg-primary-500" />}
              <p className="mt-1 text-xs leading-4 text-primary-500">{step.status}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
