"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  classificationLabelMap,
  deferralReasonTags,
  type GateDecision,
} from "../../types";
import {
  useCreateApproval,
  useRequest,
} from "../../hooks/useRequests";

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

export default function GateDecisionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: request, isLoading } = useRequest(params.id);
  const [decision, setDecision] = useState<GateDecision>("accept");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const create = useCreateApproval();

  useEffect(() => {
    if (!isLoading && !request) {
      router.push("/app/product-development/requests");
    }
  }, [isLoading, request, router]);

  if (isLoading || !request) {
    return (
      <div className="mx-auto max-w-3xl pb-10 text-xs text-gray-400">
        Loading request...
      </div>
    );
  }

  const selected = DECISION_OPTIONS.find((opt) => opt.value === decision)!;
  const requireReason = decision !== "accept";

  const toggleTag = (tag: string) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  };

  const submit = () => {
    if (!note.trim() || (requireReason && !reason.trim())) return;
    create.mutate(
      {
        id: request.id,
        payload: {
          gate_code: "G1",
          decision,
          reason: reason || undefined,
          note: note.trim(),
          decided_by_name: "Current User",
          decided_by_role: "Eng. Manager",
          tags,
        },
      },
      {
        onSuccess: () => {
          router.push(`/app/product-development/requests/${request.id}`);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            router.push(`/app/product-development/requests/${params.id}`)
          }
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Request
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            router.push(`/app/product-development/requests/${params.id}`)
          }
        >
          Cancel
        </Button>
      </div>

      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
          Gate 1 Decision
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {request.code} · {classificationLabelMap[request.classification]}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 px-5 py-5">
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
                  className={`mt-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                    isSelected
                      ? "border-primary-700 bg-primary-700"
                      : "border-gray-300"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
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
                    ? "What is missing, and what attributes do you require?"
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
              value={note}
              onChange={(event) => setNote(event.target.value)}
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/app/product-development/requests/${params.id}`)
          }
        >
          Cancel
        </Button>
        <Button
          className={selected.buttonClass}
          onClick={submit}
          disabled={
            create.isPending ||
            !note.trim() ||
            (requireReason && !reason.trim())
          }
        >
          {create.isPending ? "Saving..." : selected.buttonLabel}
        </Button>
      </div>
    </div>
  );
}
