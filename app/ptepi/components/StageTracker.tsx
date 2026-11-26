"use client";

import { Tr } from "./Tr";
import { formatDate } from "../format";
import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
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
import { ATTACHMENT_NOTES, STAGE_STATUS_LABELS } from "../labels";
import { selectOpenMatch, useActionsStore } from "../store/actions-store";
import type { EvidenceStage, EvidenceStatus, SuggestedAction } from "../types";
import { PercentText } from "./PercentText";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

const STATUS = STAGE_STATUS_LABELS;

const STEP_STYLE: Record<EvidenceStatus, string> = {
  earned: "bg-green-700 text-white",
  blocked: "bg-destructive text-white",
  "not-started": "bg-primary-50 text-primary-700"
};

function GateBadge({ stage }: { stage: EvidenceStage }) {
  const status = STATUS[stage.status];
  return <StatusBadge tone={status.tone} label={status.label} />;
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
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
        {stages.map((stage) => (
          <li key={stage.stageNo} className="flex">
            <button
              type="button"
              onClick={() => setSelectedNo(stage.stageNo)}
              aria-label={`Stage ${stage.stageNo} ${stage.label}, ${STATUS[stage.status].label}. Open details`}
              className={cn(
                "flex w-full flex-col gap-3 rounded-xl border bg-background p-4 text-left transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                stage.status === "blocked"
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
                <p className="font-semibold"><Tr>{stage.label}</Tr></p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusBadge
                    tone={STATUS[stage.status].tone}
                    label={STATUS[stage.status].label}
                  />
                </div>
              </div>

              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground"><Tr>Required document</Tr></dt>
                  <dd className="line-clamp-2 font-medium"><Tr>{stage.requiredDocument}</Tr></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground"><Tr>Signer</Tr></dt>
                  <dd className="font-medium">{stage.expectedSigner}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground"><Tr>Signed date</Tr></dt>
                  <dd className="font-medium">{formatDate(stage.signedDate)}</dd>
                </div>
              </dl>

              <div className="mt-auto space-y-1 border-t border-border pt-3">
                <p className="line-clamp-2 text-sm text-gray-700"><Tr>{stage.gate.reason}</Tr></p>
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
  const match = useActionsStore(
    selectOpenMatch({
      source: suggestion?.source ?? "",
      projectId: suggestion?.projectId ?? "",
      issue: suggestion?.issue
    })
  );
  const created = match !== undefined;
  const [createdId, setCreatedId] = useState<string | null>(null);
  const blocked = stage.gate.result === "blocked";

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          <Tr>Stage</Tr> {stage.stageNo}: <Tr>{stage.label}</Tr>
        </DialogTitle>
        <DialogDescription><Tr>{stage.requiredDocument}</Tr></DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <GateBadge stage={stage} />
            <SyntheticDataBadge real={stage.dataOrigin === "real"} />
          </div>
          <p className="text-sm"><Tr>{stage.gate.reason}</Tr></p>
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
                    ? `${unit.baId}, ${unit.documentNo ?? "no number"}, ${unit.status === "earned" ? `signed ${formatDate(unit.documentDate)}` : "not signed"}, signer ${unit.signerRole ?? "-"}`
                    : "No BA in the register"}
                </p>
                {unit.issue && <p className="text-xs text-destructive"><Tr>{unit.issue}</Tr></p>}
                {unit.note && <p className="text-xs text-muted-foreground"><Tr>Register note</Tr>: {unit.note}</p>}
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
            <p className="font-semibold"><Tr>Recommended action</Tr></p>
            <p>{suggestion.title}</p>
            <p className="text-xs text-muted-foreground">
              Owner: {suggestion.ownerRole}. Due {formatDate(suggestion.dueDate)}. Autonomy {suggestion.autonomy},
              recommend only: a person approves and closes.
            </p>
          </div>
        )}
      </div>

      {blocked && suggestion && (
        <DialogFooter className="items-center gap-3 sm:justify-between">
          {created ? (
            <p className="text-sm">
              <Tr>{createdId === match?.id ? "Added as" : "Already tracked as"}</Tr> {createdId === match?.id ? createdId : match?.id}.{" "}
              <Link href="/ptepi/actions" className="font-medium text-primary-700 hover:underline">
                <Tr>View in the action tracker</Tr>
              </Link>
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">
              <Tr>Adds the action to the Action tracker.</Tr>
            </span>
          )}
          <Button
            type="button"
            disabled={created}
            className="bg-primary-700 text-white hover:bg-primary-800"
            onClick={() => setCreatedId(addAction(suggestion).id)}
          >
            {created ? "Already tracked" : "Create action"}
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}
