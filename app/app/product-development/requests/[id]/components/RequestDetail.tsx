"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type LucideIcon,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Lightbulb,
  MessageSquare,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import {
  classificationLabelMap,
  priorityClassMap,
  statusClassMap,
} from "../../types";
import {
  useAddRequestComment,
  useDeleteRequestComment,
  useRequest,
  useRequestApprovals,
  useRequestComments,
  useDownloadDocument,
  triggerDocumentDownload,
} from "../../hooks/useRequests";
import { formatLongDate, formatLongDateTime } from "../../lib/date";
import { GateDecisionDialog } from "./GateDecisionDialog";

const STAGE_FLOW = [
  { key: "submitted", label: "Submitted", sub: "Request received" },
  { key: "gate_1_review", label: "Gate 1 Review", sub: "PM / Eng. Manager" },
  { key: "approved", label: "Approved", sub: "Ready for project" },
  { key: "in_progress", label: "In Progress", sub: "Project active" },
  { key: "closed", label: "Closed", sub: "Completed / Cancelled" },
] as const;

const DECISION_TO_STAGE: Record<string, (typeof STAGE_FLOW)[number]["key"]> = {
  accept: "approved",
  defer: "gate_1_review",
  reject: "closed",
};

function stageFromApprovals(
  approvals: { decision: string }[] | undefined,
  fallback: string | undefined,
): (typeof STAGE_FLOW)[number]["key"] {
  if (!approvals || approvals.length === 0) {
    return fallback === "gate_1_review" || !fallback
      ? "gate_1_review"
      : (fallback as (typeof STAGE_FLOW)[number]["key"]);
  }
  // Use the most recent decision (last in the list).
  const last = approvals[approvals.length - 1];
  return (
    DECISION_TO_STAGE[last.decision] ??
    (fallback as (typeof STAGE_FLOW)[number]["key"]) ??
    "gate_1_review"
  );
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`;
}

export function RequestDetail({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { data: request, isLoading, error } = useRequest(requestId);
  const { data: commentsData } = useRequestComments(requestId);
  const { data: approvalsData } = useRequestApprovals(requestId);
  const addComment = useAddRequestComment();
  const deleteComment = useDeleteRequestComment();
  const downloadDocument = useDownloadDocument();
  const [comment, setComment] = useState("");
  const [decisionOpen, setDecisionOpen] = useState(false);

  // Comments come from a separate endpoint (`/comments`), not embedded
  // in the request payload. Merge with whatever the detail payload has.
  const comments = commentsData ?? request?.comments ?? [];

  // Current workflow stage derived from latest approval decision.
  const currentStage = stageFromApprovals(approvalsData, request?.workflow_stage);
  const activeStepIndex = STAGE_FLOW.findIndex(
    (step) => step.key === currentStage,
  );

  // Determine whether the Gate 1 decision can still be recorded.
  // The latest decision is what counts: once `accept` or `reject` is on the
  // record, the gate is closed and the button must be hidden. `defer` keeps
  // the gate open (the request stays in the queue and can be re-decided).
  const latestDecision =
    approvalsData && approvalsData.length > 0
      ? approvalsData[approvalsData.length - 1].decision
      : undefined;
  const decisionClosed = latestDecision === "accept" || latestDecision === "reject";
  const decisionStatus = !latestDecision
    ? "No Gate 1 decision yet"
    : latestDecision === "defer"
      ? "Deferred — pending re-review"
      : latestDecision === "accept"
        ? "Approved"
        : "Rejected";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl pb-10 text-xs text-gray-400">
        Loading request...
      </div>
    );
  }

  if (error || !request || !request.id) {
    return (
      <div className="mx-auto max-w-7xl pb-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/app/product-development/requests")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Requests
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          {error
            ? `Failed to load request: ${(error as { message?: string })?.message ?? "unknown error"}`
            : "Request not found."}
        </p>
      </div>
    );
  }

  const submitComment = () => {
    if (!comment.trim()) return;
    addComment.mutate(
      {
        id: request.id,
        payload: {
          comment: comment.trim(),
          comment_type: "review",
          created_by_name: "Current User",
          created_by_role: "Reviewer",
          source: "ui",
        },
      },
      { onSuccess: () => setComment("") }
    );
  };

  const dueDate = formatLongDate(request.due_date_at);
  const submittedAt = formatLongDate(request.created_at);
  const slaLabel = "waiting 20 S4";

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/app/product-development/requests")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> {request.title}
        </button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() =>
              router.push(`/app/product-development/requests/${request.id}/edit`)
            }
            disabled={decisionClosed}
            title={decisionStatus}
          >
            <Pencil className="h-3 w-3" /> Edit
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-primary-700 text-xs hover:bg-primary-800"
            onClick={() => setDecisionOpen(true)}
            disabled={decisionClosed}
            title={decisionStatus}
          >
            {decisionClosed
              ? latestDecision === "accept"
                ? "Approved"
                : "Closed"
              : "Record Gate 1 Decision"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={`text-[10px] font-medium ${statusClassMap[request.status]}`}
        >
          {request.status.replace("_", " ").toUpperCase()}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] font-medium ${priorityClassMap[request.priority]}`}
        >
          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
        </Badge>
        <span className="text-[11px] text-gray-500">
          {request.code} · {request.customer} · Due {dueDate}
        </span>
      </div>

      <Card>
        <CardContent className="px-4 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Request Progress
          </p>
          <div className="mt-5 flex w-full items-start justify-between gap-2 overflow-x-auto sm:gap-4">
            {STAGE_FLOW.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isDone = index < activeStepIndex;
              const isLast = index === STAGE_FLOW.length - 1;
              return (
                <Fragment key={step.key}>
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                        isActive
                          ? "border-primary-700 bg-primary-700 text-white"
                          : isDone
                            ? "border-primary-500 text-primary-500 bg-primary-50"
                            : "border-gray-200 bg-white text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 text-center">
                      <p
                        className={`text-xs font-semibold ${
                          isActive
                            ? "text-primary-700"
                            : isDone
                              ? "text-primary-600"
                              : "text-gray-800"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {step.sub}
                      </p>
                    </div>
                  </div>

                  {/* Horizontal connector between stages.
                      Wrapper is h-7 to match the circle, items-center
                      so the 2px line sits exactly at the circle's
                      vertical midpoint. */}
                  {!isLast && (
                    <div className="flex h-7 w-10 shrink-0 items-center sm:w-16">
                      <div
                        className={`h-0.5 w-full ${
                          isDone ? "bg-primary-500" : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-4 py-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="CUSTOMER" value={request.customer} />
              <Detail
                label="CUSTOMER REF"
                value={request.customer_ref ?? "—"}
              />
              <Detail
                label="CLASSIFICATION"
                value={classificationLabelMap[request.classification]}
              />
              <Detail
                label="PRIORITY"
                value={
                  request.priority.charAt(0).toUpperCase() +
                  request.priority.slice(1)
                }
              />
              <Detail label="DUE DATE" value={dueDate} />
              <Detail label="SUBMITTED DATE" value={submittedAt} />
              <Detail
                label="SUBMITTED BY"
                value={request.created_by || "—"}
              />
              <Detail
                label="WORKFLOW STAGE"
                value="Full 10-stage Lifecycle"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Scope Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-xs text-gray-700">
              {request.scope_summary || "—"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Technical Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-xs text-gray-700">
              {request.notes || "—"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {request.documents.length === 0 ? (
                <p className="text-xs text-gray-400">No attachments yet.</p>
              ) : (
                request.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800">
                        {document.original_name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {request.customer || "—"} ·{" "}
                        {formatLongDate(document.uploaded_at)}
                        {document.file_size_bytes
                          ? ` · ${formatBytes(document.file_size_bytes)}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={downloadDocument.isPending}
                      onClick={() =>
                        downloadDocument.mutate(document.id, {
                          onSuccess: (url) =>
                            triggerDocumentDownload(document, url),
                        })
                      }
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Comments {comments.length > 0 && `(${comments.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No comments yet. Reviewer notes on Defer or Reject land here
                  automatically.
                </p>
              ) : (
                comments.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium text-gray-700">
                        {entry.created_by_name} · {entry.created_by_role}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          deleteComment.mutate({
                            id: request.id,
                            comment_id: entry.id,
                          })
                        }
                        className="text-[10px] text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {formatLongDateTime(entry.created_at)}
                    </p>
                    <p className="mt-1 text-gray-700">{entry.comment}</p>
                  </div>
                ))
              )}
              <div className="space-y-2">
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a review comment or annotation..."
                  rows={3}
                  className="text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setComment("")}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary-700 hover:bg-primary-800"
                    onClick={submitComment}
                    disabled={addComment.isPending || !comment.trim()}
                  >
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Post
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden border-primary-200">
            <CardHeader className="bg-gradient-to-r from-primary-800 to-primary-600 px-4 py-3 text-white">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                AI Insight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 bg-primary-50/30 px-3 py-3">
              <InsightItem icon={Sparkles} title="Request summary">
                <span className="font-medium text-gray-800">{request.title}</span>{" "}
                is a {request.priority} priority request for {request.customer}.
                {request.scope_summary ? ` ${request.scope_summary}` : " Scope details have not been provided."}
              </InsightItem>
              <InsightItem icon={Lightbulb} title="Technical review">
                {request.notes
                  ? request.notes
                  : "No technical notes are available yet. Confirm specifications, standards, and operating constraints before Gate 2."}
              </InsightItem>
              <InsightItem icon={FileText} title="Supporting evidence">
                {request.document_count > 0
                  ? `${request.document_count} supporting file${request.document_count === 1 ? " is" : "s are"} attached. Review the documents against the scope and technical requirements.`
                  : "No supporting files are attached. Request relevant specifications or drawings before approval if required."}
              </InsightItem>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Gate 1 - Approval Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 py-4 text-xs text-gray-700">
              <ChecklistRow
                done={Boolean(request.customer)}
                label="Customer is verified and linked"
                hint={request.customer}
              />
              <ChecklistRow
                done={Boolean(request.scope_summary)}
                label="Project name and scope defined"
                hint={request.scope_summary ? "Scope Summary present" : ""}
              />
              <ChecklistRow
                done={Boolean(request.due_date_at && request.priority)}
                label="Priority and due date set"
                hint={`${request.priority} · ${dueDate}`}
              />
              <ChecklistRow
                done
                label="Classification selected"
                hint={classificationLabelMap[request.classification]}
              />
              <p className="pt-2 text-[10px] text-gray-400">
                All four items auto-check from intake data. The decision is
                still yours.
              </p>
              <Button
                size="sm"
                className="mt-2 w-full bg-primary-700 hover:bg-primary-800"
                onClick={() => setDecisionOpen(true)}
                disabled={decisionClosed}
                title={decisionStatus}
              >
                {decisionClosed
                  ? latestDecision === "accept"
                    ? "Approved"
                    : "Closed"
                  : "Record Gate 1 Decision"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Request Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 text-xs text-gray-700">
              <Detail label="ID" value={request.code} />
              <Detail
                label="STATUS"
                value={request.status.replace("_", " ").toUpperCase()}
              />
              <Detail
                label="CLASSIFICATION"
                value={classificationLabelMap[request.classification]}
              />
              <Detail
                label="ATTACHMENTS"
                value={`${request.document_count} files`}
              />
              <Detail label="SLA" value={slaLabel} />
            </CardContent>
          </Card>
        </div>
      </div>

      <GateDecisionDialog
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        requestId={request.id}
        requestCode={request.code}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 text-xs font-medium text-gray-800">{value || "—"}</div>
    </div>
  );
}

function InsightItem({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-[10px] leading-4 text-gray-600">{children}</p>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({
  done,
  label,
  hint,
}: {
  done: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary-500" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 text-gray-300" />
      )}
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        {hint && <p className="text-[10px] text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}
