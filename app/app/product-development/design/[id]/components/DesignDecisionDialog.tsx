"use client";

import { useState } from "react";
import { Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  deferralReasonTags,
  type DesignDecision as DecisionType,
} from "../../types";
import { useRecordDesignDecision } from "../../hooks/useDesigns";

const DECISION_OPTIONS: {
  value: DecisionType;
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
    description: "Approved design and can continue to prototype.",
    badgeLabel: "AUTO",
    badgeClass: "border-blue-400 bg-blue-50 text-blue-600",
    buttonLabel: "Approve Design",
    buttonClass: "bg-primary-700 hover:bg-primary-800",
  },
  {
    value: "defer",
    label: "Defer",
    description: "Hold design, stay on design decision.",
    badgeLabel: "HOLD",
    badgeClass: "border-amber-400 bg-amber-50 text-amber-600",
    buttonLabel: "Defer Design",
    buttonClass: "bg-amber-500 hover:bg-amber-600",
  },
  {
    value: "reject",
    label: "Reject",
    description: "Reject design and need revision.",
    badgeLabel: "CLOSED",
    badgeClass: "border-red-400 bg-red-50 text-red-600",
    buttonLabel: "Reject Design",
    buttonClass: "bg-red-500 hover:bg-red-600",
  },
];

export function DesignDecisionDialog({
  open,
  onOpenChange,
  designId,
  versionId,
  designNo,
  designName,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  designId: string;
  versionId: string;
  designNo?: string;
  designName?: string;
}) {
  const [decision, setDecision] = useState<DecisionType>("accept");
  const [reason, setReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const record = useRecordDesignDecision();

  const selected = DECISION_OPTIONS.find((opt) => opt.value === decision)!;
  const requireReason = decision !== "accept";

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  };

  const reset = () => {
    setDecision("accept");
    setReason("");
    setApprovalNote("");
    setTags([]);
  };

  const submit = () => {
    if (requireReason && !reason.trim()) return;
    if (decision === "accept" && !approvalNote.trim()) return;
    record.mutate(
      {
        designId,
        versionId,
        payload: {
          decision,
          decided_at: new Date().toISOString(),
          decided_by: "Current User",
          decision_status:
            decision === "accept" ? "approved" : decision === "defer" ? "deferred" : "rejected",
          gate_code: "design_decision",
          gate_name: "Design Decision",
          metadata: {
            reason,
            tags: tags.join(", "),
            signed_role: "Eng. Manager",
          },
          note: approvalNote || reason,
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-semibold">
                Design Decision
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {designNo ? `${designNo} · ${designName ?? ""}` : designName}
              </DialogDescription>
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

          {decision === "accept" && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-700">
                Approval Note *
              </p>
              <Textarea
                value={approvalNote}
                onChange={(event) => setApprovalNote(event.target.value)}
                placeholder="Add an approval note for the audit trail..."
                rows={3}
                className="text-xs"
              />
            </div>
          )}

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
              record.isPending ||
              (requireReason && !reason.trim()) ||
              (decision === "accept" && !approvalNote.trim())
            }
          >
            {record.isPending ? "Saving..." : selected.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
