"use client";

import { useState } from "react";
import { Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  deferralReasonTags,
  type GateDecision,
} from "../../types";
import { useCreateApproval } from "../../hooks/useRequests";

const DECISION_OPTIONS: {
  value: GateDecision;
  label: string;
  description: string;
  badgeLabel: string;
  badgeClass: string;
  buttonLabel: string;
  buttonClass: string;
}[] = [
  {
    value: "accept",
    label: "Accept",
    description:
      "Approve intake. Request moves to triage for sizing and scheduling.",
    badgeLabel: "AUTO",
    badgeClass: "border-blue-400 bg-blue-50 text-blue-600",
    buttonLabel: "Approve Gate 1",
    buttonClass: "bg-primary-700 hover:bg-primary-800",
  },
  {
    value: "defer",
    label: "Defer",
    description:
      "Hold intake pending information or capacity. Stays in the Gate 1 queue.",
    badgeLabel: "HOLD",
    badgeClass: "border-amber-400 bg-amber-50 text-amber-600",
    buttonLabel: "Defer Request",
    buttonClass: "bg-amber-500 hover:bg-amber-600",
  },
  {
    value: "reject",
    label: "Reject",
    description:
      "Close intake. Requester is notified with the reason recorded.",
    badgeLabel: "CLOSED",
    badgeClass: "border-red-400 bg-red-50 text-red-600",
    buttonLabel: "Reject Request",
    buttonClass: "bg-red-500 hover:bg-red-600",
  },
];

export function GateDecisionDialog({
  open,
  onOpenChange,
  requestId,
  requestCode,
  gateName = "Gate 1",
  gateCode = "G1",
  gateCodeValue = "g1",
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  requestId: string;
  requestCode?: string;
  gateName?: string;
  gateCode?: string;
  /** The lowercase `gate_name` value sent to the API (e.g. `g1`). */
  gateCodeValue?: string;
}) {
  const [decision, setDecision] = useState<GateDecision>("accept");
  const [reason, setReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const create = useCreateApproval();

  const selected = DECISION_OPTIONS.find((opt) => opt.value === decision)!;
  const requireReason = decision !== "accept";

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  };

  const reset = () => {
    setDecision("accept");
    setReason("");
    setApprovalNote("");
    setTags([]);
  };

  const submit = () => {
    if (!approvalNote.trim() || (requireReason && !reason.trim())) return;
    create.mutate(
      {
        id: requestId,
        payload: {
          gate_code: gateCode,
          gate_name: gateCodeValue,
          decision,
          reason: reason || undefined,
          note: approvalNote.trim(),
          decided_by_name: "Current User",
          decided_by_role: "Eng. Manager",
          tags: tags.length ? tags : undefined,
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="gap-3 pr-8">
          <div>
            <DialogTitle className="text-base font-semibold">
              {gateName} Decision
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-gray-500">
              {requestCode || "Review and record the gate decision"}
            </DialogDescription>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-md border border-gray-100 bg-gray-50/60 px-3 py-2 text-left">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Gate Name
              </p>
              <p className="text-xs font-medium text-gray-800">{gateName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Gate Code
              </p>
              <p className="text-xs font-medium text-gray-800">{gateCode}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Choose One
          </p>

          {DECISION_OPTIONS.map((option) => {
            const isSelected = decision === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDecision(option.value)}
                className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left text-xs transition ${
                  isSelected
                    ? "border-primary-700 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    isSelected
                      ? "border-primary-700 bg-primary-700"
                      : "border-gray-300"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-800">{option.label}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${option.badgeClass}`}
                    >
                      {option.badgeLabel}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}

          {requireReason && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-700">
                Reason for {decision === "defer" ? "Deferral" : "Rejection"} *
              </p>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  decision === "defer"
                    ? "What is missing, and what unblocks this request..."
                    : "Explain the rejection - shared with the requester."
                }
                rows={3}
                className="text-xs"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {deferralReasonTags.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-[10px] transition ${
                        active
                          ? "border-primary-700 bg-primary-50 text-primary-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">
              Decision Note *
            </p>
            <Textarea
              value={approvalNote}
              onChange={(event) => setApprovalNote(event.target.value)}
              placeholder="Add context for the decision audit trail..."
              rows={3}
              className="text-xs"
              required
              aria-required="true"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2 text-[11px] text-gray-500">
            <Circle className="h-3 w-3" />
            Signing as Current User · Eng. Manager
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            className={selected.buttonClass}
            onClick={submit}
            disabled={
              create.isPending ||
              !approvalNote.trim() ||
              (requireReason && !reason.trim())
            }
          >
            {create.isPending ? "Saving..." : selected.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
