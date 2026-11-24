"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Clock, FileText, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ATTACHMENT_NOTES } from "../labels";
import { selectHasOpenAction, useActionsStore } from "../store/actions-store";
import type { EvidenceStage, EvidenceStatus, SuggestedAction } from "../types";
import { PercentText } from "./PercentText";
import { RupiahText } from "./RupiahText";
import { StatusBadge, type StatusTone } from "./StatusBadge";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

const STATUS: Record<EvidenceStatus, { tone: StatusTone; label: string }> = {
  complete: { tone: "good", label: "Complete" },
  missing: { tone: "bad", label: "Missing BA" },
  pending: { tone: "watch", label: "Pending" }
};

const STEP_STYLE: Record<EvidenceStatus, string> = {
  complete: "bg-green-700 text-white",
  missing: "bg-destructive text-white",
  pending: "bg-primary-50 text-primary-700"
};

function StepIcon({ status }: { status: EvidenceStatus }) {
  if (status === "complete") return <CircleCheck size={16} aria-hidden />;
  if (status === "missing") return <TriangleAlert size={16} aria-hidden />;
  return <Clock size={16} aria-hidden />;
}

function GateBadge({ stage }: { stage: EvidenceStage }) {
  return stage.gate.result === "can-earn" ? (
    <StatusBadge tone="good" label="Can earn" />
  ) : (
    <StatusBadge tone="bad" label="Blocked: missing BA" />
  );
}

type StageTrackerProps = {
  stages: EvidenceStage[];
  /** Recommended action per stage number, for blocked stages */
  suggestions: Record<number, SuggestedAction>;
};

export function StageTracker({ stages, suggestions }: StageTrackerProps) {
  const [selectedNo, setSelectedNo] = useState<number | null>(null);
  const selected = stages.find((stage) => stage.stageNo === selectedNo) ?? null;

  return (
    <>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stages.map((stage) => (
          <li key={stage.stageNo} className="flex">
            <button
              type="button"
              onClick={() => setSelectedNo(stage.stageNo)}
              aria-label={`Stage ${stage.stageNo} ${stage.label}, ${STATUS[stage.status].label}. Open details`}
              className={cn(
                "flex w-full flex-col gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                stage.gate.result === "blocked" && stage.status === "missing"
                  ? "border-destructive"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    STEP_STYLE[stage.status]
                  )}
                >
                  {stage.stageNo}
                </span>
                <span className="text-sm font-semibold">
                  <PercentText fraction={stage.weight} />
                </span>
              </div>

              <div>
                <p className="font-semibold">{stage.label}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StepIcon status={stage.status} />
                  <StatusBadge
                    tone={STATUS[stage.status].tone}
                    label={STATUS[stage.status].label}
                  />
                </div>
              </div>

              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Required document</dt>
                  <dd className="font-medium">{stage.requiredDocument}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Signer</dt>
                  <dd className="font-medium">{stage.expectedSigner}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Signed date</dt>
                  <dd className="font-medium">{stage.signedDate ?? "-"}</dd>
                </div>
              </dl>

              <div className="mt-auto space-y-1 border-t border-border pt-3">
                <GateBadge stage={stage} />
                <p className="line-clamp-3 text-xs text-muted-foreground">{stage.gate.reason}</p>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedNo(null)}>
        {selected && (
          <StageDialogBody
            stage={selected}
            suggestion={suggestions[selected.stageNo] ?? null}
          />
        )}
      </Dialog>
    </>
  );
}

type StageDialogBodyProps = {
  stage: EvidenceStage;
  suggestion: SuggestedAction | null;
};

function StageDialogBody({ stage, suggestion }: StageDialogBodyProps) {
  const addAction = useActionsStore((state) => state.addAction);
  const created = useActionsStore(selectHasOpenAction(suggestion?.source ?? ""));
  const [createdId, setCreatedId] = useState<string | null>(null);
  const blocked = stage.gate.result === "blocked";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          Stage {stage.stageNo}: {stage.label}
        </DialogTitle>
        <DialogDescription>{stage.requiredDocument}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <GateBadge stage={stage} />
            <SyntheticDataBadge real={stage.dataOrigin === "real"} />
          </div>
          <p className="text-sm">{stage.gate.reason}</p>
          {stage.blockedValue > 0 && (
            <p className="text-sm text-muted-foreground">
              Claimed in the report without a signed BA:{" "}
              <RupiahText value={stage.blockedValue} className="font-semibold text-destructive" />
            </p>
          )}
          {stage.additionalRequirement && (
            <p className="text-xs text-muted-foreground">{stage.additionalRequirement}</p>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            BA records ({stage.expectedSigner} signs)
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {stage.units.map((unit) => (
              <li key={unit.unit} className="space-y-1 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{unit.unit}</span>
                  <StatusBadge
                    tone={STATUS[unit.status].tone}
                    label={STATUS[unit.status].label}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {unit.baId
                    ? `${unit.baId}, ${unit.documentNo ?? "no number"}, ${unit.documentDate ?? "no date"}, signer ${unit.signerRole ?? "-"}`
                    : "No BA in the register"}
                </p>
                {unit.issue && <p className="text-xs text-destructive">{unit.issue}</p>}
                {unit.note && <p className="text-xs text-muted-foreground">Register note: {unit.note}</p>}
                {unit.baId && ATTACHMENT_NOTES[unit.baId] && (
                  <div className="mt-2 rounded-md bg-primary-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <FileText size={16} aria-hidden />
                      Sample attachment: {ATTACHMENT_NOTES[unit.baId]?.file}
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                      {ATTACHMENT_NOTES[unit.baId]?.findings.map((finding) => (
                        <li key={finding}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {blocked && suggestion && (
          <div className="space-y-1 rounded-lg border border-border p-4 text-sm">
            <p className="font-semibold">Recommended action</p>
            <p>{suggestion.title}</p>
            <p className="text-xs text-muted-foreground">
              Owner: {suggestion.ownerRole}. Due {suggestion.dueDate}. Autonomy {suggestion.autonomy},
              recommend only: a person approves and closes.
            </p>
          </div>
        )}
      </div>

      {blocked && suggestion && (
        <DialogFooter className="items-center gap-3 sm:justify-between">
          {created ? (
            <Link
              href="/ptepi/actions"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              {createdId ? `${createdId} added` : "Action already open"}: view in the action tracker
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              Adds the action to the tracker (S8).
            </span>
          )}
          <Button
            type="button"
            disabled={created}
            className="bg-primary-700 text-white hover:bg-primary-800"
            onClick={() => setCreatedId(addAction(suggestion).id)}
          >
            {created ? "Action created" : "Create action"}
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}
