"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DEFAULT_OPTIONS, MOCK_ANSWERS, MOCK_METRICS, MOCK_RUNS, mockEstimate, remainingReviews,
  type EvaluationOptions, type EvaluationRun, type ReviewDecision, type RunPhase
} from "../mock-data";
import { AnswerReviews } from "./AnswerReviews";
import { CheckHistory } from "./CheckHistory";
import { MetricCards } from "./MetricCards";
import { RunEvaluationDialog } from "./RunEvaluationDialog";
import { RunProgress } from "./RunProgress";

export function NexaEvaluationPage() {
  const [runs, setRuns] = useState<EvaluationRun[]>(MOCK_RUNS);
  const [selectedId, setSelectedId] = useState(MOCK_RUNS[0].id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [options, setOptions] = useState<EvaluationOptions>(DEFAULT_OPTIONS);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [completedRunId, setCompletedRunId] = useState<string | null>(null);
  const [notice, setNotice] = useState<"initial" | "completed" | "stopped">("initial");
  const selectedRun = runs.find((run) => run.id === selectedId) ?? runs[0];
  const completedRun = runs.find((run) => run.id === completedRunId);
  const running = phase !== "idle";

  // Deliberately local: preview the design's progress states without calling an API.
  useEffect(() => {
    if (phase === "idle") return;
    const timer = setTimeout(() => {
      if (phase === "collecting") {
        setPhase("checking");
      } else if (phase === "checking") {
        setPhase("reporting");
      } else {
        const estimate = mockEstimate(options);
        const reviewAnswers = MOCK_ANSWERS.filter((answer) => options.tenant === "all" || answer.tenant === options.tenant);
        const now = new Date();
        const id = resumeId ?? `preview-${now.getTime()}`;
        const run: EvaluationRun = {
          id,
          date: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          period: options.period === "custom"
            ? `${options.startDate} - ${options.endDate}`
            : options.period === "last-30-days" ? "Last 30 days" : "Since last check",
          answers: estimate.answers,
          cost: estimate.cost,
          status: "good",
          metrics: MOCK_METRICS,
          reviewAnswers,
          reviews: {}
        };
        setRuns((current) => [run, ...current.filter((entry) => entry.id !== id)]);
        setSelectedId(id);
        setCompletedRunId(id);
        setNotice("completed");
        setResumeId(null);
        setPhase("idle");
      }
    }, phase === "checking" ? 3500 : 2000);
    return () => clearTimeout(timer);
  }, [phase, options, resumeId]);

  const startPreview = (nextOptions: EvaluationOptions, failedRunId: string | null = null) => {
    setOptions(nextOptions);
    setResumeId(failedRunId);
    setDialogOpen(false);
    setPhase("collecting");
  };

  const reviewAnswer = (answerId: string, decision: ReviewDecision) => {
    setRuns((current) => current.map((run) => run.id === selectedId
      ? { ...run, reviews: { ...run.reviews, [answerId]: decision } }
      : run));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="NEXA Evaluation"
        subtitle="Check NEXA answers against the tool results they were built on, then confirm which low scores are real."
      />
      {running ? (
        <RunProgress
          phase={phase}
          options={options}
          onStop={() => {
            setPhase("idle");
            setResumeId(null);
            setNotice("stopped");
          }}
        />
      ) : (
        <section className={cn(
          "flex flex-col items-start justify-between gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center",
          notice === "completed" ? "border-green-600 bg-green-50" : "border-primary-500 bg-primary-50"
        )} aria-label="Evaluation status">
          <div className="min-w-0 text-sm leading-5" role="status">
            <p className="text-sm font-medium leading-5 text-gray-950">
              {notice === "completed" ? "Last checked just now" : notice === "stopped" ? "Preview check stopped" : "Last checked 7 days ago"}
            </p>
            <p className="text-sm leading-5 text-gray-600">
              {notice === "completed"
                ? `Sample check complete. ${completedRun ? remainingReviews(completedRun) : 0} answers need your review. No live evaluation was run.`
                : notice === "stopped"
                  ? "Your existing results are unchanged. Start another preview whenever you're ready."
                  : "About 96 new answers since 28 Oct are waiting to be checked. Estimated cost $0.71."}
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-8 shrink-0 rounded-lg bg-primary-500 px-3 text-sm hover:bg-primary-600"
          >
            <Image src="/images/nexa-evaluation/play.svg" width={16} height={16} alt="" />
            Check Now
          </Button>
        </section>
      )}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 xl:flex-row">
        <CheckHistory runs={runs} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="min-w-0 flex-1 space-y-5 p-4 sm:p-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold leading-7 text-gray-900">Hallucination Check</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportOpen(true)}
                disabled={selectedRun.status === "failed"}
                className="h-9 rounded-lg border-gray-200 px-3 text-sm font-medium shadow-xs"
              >
                <Image src="/images/nexa-evaluation/export.svg" width={16} height={16} alt="" />
                Export to Excel
              </Button>
            </div>
            <p className="mt-1 text-sm leading-5 text-gray-500">
              Check whether NEXA&apos;s answers match the data it used, then confirm which problems are real.
            </p>
          </div>
          {selectedRun.status === "failed" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-base font-semibold text-gray-950">This check was interrupted</h3>
              <p className="mt-2 text-sm text-gray-600">231 of 488 answers checked. The checking service was too busy.</p>
              <p className="mt-1 text-xs text-gray-500">Resume the UI preview to see the progress states. No real check will run.</p>
              <Button
                className="mt-4 bg-primary-500 hover:bg-primary-600"
                disabled={running}
                onClick={() => startPreview(DEFAULT_OPTIONS, selectedRun.id)}
              >
                Resume Check
              </Button>
            </div>
          ) : (
            <>
              <MetricCards metrics={selectedRun.metrics} showComparison={selectedRun.id === "oct-29"} />
              <AnswerReviews
                key={selectedRun.id}
                answers={selectedRun.reviewAnswers}
                reviews={selectedRun.reviews}
                onReview={reviewAnswer}
              />
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">UI preview &middot; Sample data only. Changes reset when you leave this page.</p>
      <RunEvaluationDialog open={dialogOpen} onOpenChange={setDialogOpen} onStart={startPreview} />
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to Excel</DialogTitle>
            <DialogDescription>
              Export is not connected yet. This is a UI-only preview with sample evaluation data.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Selected check: {selectedRun.date} &middot; {selectedRun.answers} sample answers.
          </p>
          <Button variant="outline" onClick={() => setExportOpen(false)} className="justify-self-end">Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
