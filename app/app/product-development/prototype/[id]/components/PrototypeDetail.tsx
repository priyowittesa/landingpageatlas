"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthMe } from "@/hooks/useAuthMe";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  triggerDocumentDownload,
  useDownloadDocument,
} from "@/app/app/product-development/requests/hooks/useRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  iterationStatusClassMap,
  testStatusClassMap,
  type IterationStatus,
  type PrototypeDecision,
  type TestResult,
  type TestResultStatus,
} from "../../types";
import {
  useAddFeedback,
  useAddTestResult,
  useCreatePrototypeApproval,
  useDeleteFeedback,
  useDeleteTestResult,
  usePrototype,
  usePrototypeFeedbacks,
  usePrototypeTests,
  useUpdateFeedback,
  useUpdateTestResult,
} from "../../hooks/usePrototypes";

const STATUS_LABEL: Record<IterationStatus, string> = {
  draft: "Draft",
  testing: "Testing",
  approved: "Approved",
  rejected: "Rejected",
  on_hold: "On Hold",
};

const TEST_STATUS_LABEL: Record<TestResultStatus, string> = {
  pending: "Pending",
  pass: "Pass",
  fail: "Fail",
  blocked: "Blocked",
};

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPendingTestLabel(results: TestResult[]) {
  const pending = results.find((result) => result.status !== "pass");
  if (pending) return `${pending.test_name} pending`;
  return results.length > 0 ? "All tests completed" : "No test results yet";
}

type TestFormState = {
  name: string;
  expected_result: string;
  actual_result: string;
  description: string;
  status: TestResultStatus;
  tested_by_name: string;
  date: string;
};

type DeleteTarget =
  | { type: "test"; id: string; name: string }
  | { type: "feedback"; id: string };

function emptyTestForm(): TestFormState {
  return {
    name: "",
    expected_result: "",
    actual_result: "",
    description: "",
    status: "pending",
    tested_by_name: "",
    date: "",
  };
}

function toDateInputValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function PrototypeDetail({ iterationId }: { iterationId: string }) {
  const router = useRouter();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: me } = useAuthMe();
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackText, setFeedbackText] = useState("");
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingFeedbackText, setEditingFeedbackText] = useState("");
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [decision, setDecision] = useState<PrototypeDecision>("approve");
  const [decisionNote, setDecisionNote] = useState("");
  const [testForm, setTestForm] = useState<TestFormState>(emptyTestForm);

  const { data: iteration, isLoading } = usePrototype(iterationId);
  const { data: feedbacks = [], isLoading: isLoadingFeedbacks } =
    usePrototypeFeedbacks(iterationId);
  const { data: tests = [], isLoading: isLoadingTests } =
    usePrototypeTests(iterationId);
  const addTestResult = useAddTestResult();
  const updateTestResult = useUpdateTestResult();
  const deleteTestResult = useDeleteTestResult();
  const createApproval = useCreatePrototypeApproval();
  const addFeedback = useAddFeedback();
  const updateFeedback = useUpdateFeedback();
  const deleteFeedback = useDeleteFeedback();
  const downloadDocument = useDownloadDocument();
  const currentTesterName =
    me?.labour?.preferred_name ||
    me?.labour?.full_name ||
    me?.email ||
    "Current user";
  const allTestsPassed =
    tests.length > 0 && tests.every((test) => test.status === "pass");

  useEffect(() => {
    if (!iteration) return;
    setBreadcrumbItems([
      { title: "Product Development" },
      { title: "Prototype", href: "/app/product-development/prototype" },
      { title: iteration.name || "Prototype" },
    ]);
  }, [iteration, setBreadcrumbItems]);

  useEffect(() => {
    return () => clearBreadcrumbs();
  }, [clearBreadcrumbs]);

  if (isLoading || !iteration) {
    return (
      <div className="mx-auto max-w-7xl pb-10 text-xs text-gray-400">
        Loading iteration...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/app/product-development/prototype")}
              className="flex min-w-0 items-center gap-2 text-base font-semibold text-gray-900 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {iteration.revision} - {iteration.name}
              </span>
            </button>
            <Badge
              variant="outline"
              className={`shrink-0 text-[10px] font-medium ${iterationStatusClassMap[iteration.status]}`}
            >
              {STATUS_LABEL[iteration.status]}
            </Badge>
          </div>
          {(iteration.project.project_no ||
            iteration.project.name ||
            iteration.build_method) && (
            <p className="mt-1 pl-6 text-[11px] text-gray-500">
              {iteration.project.project_no || iteration.project.name ? "→ " : ""}
              {iteration.project.project_no} {iteration.project.name}
              {iteration.build_method ? ` · ${iteration.build_method}` : ""}
            </p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-end justify-between border-b border-gray-200">
        <TabsList className="flex h-10 justify-start gap-6 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="h-10 rounded-none border-b-2 border-transparent px-1 text-xs font-medium text-gray-500 shadow-none data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="test-results"
            className="h-10 rounded-none border-b-2 border-transparent px-1 text-xs font-medium text-gray-500 shadow-none data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
          >
            Test Results
          </TabsTrigger>
          <TabsTrigger
            value="feedback"
            className="h-10 rounded-none border-b-2 border-transparent px-1 text-xs font-medium text-gray-500 shadow-none data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
          >
            Feedback
            {feedbacks.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] leading-none text-gray-500">
                {feedbacks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
          {activeTab === "test-results" && (
            <div className="mb-1.5 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-8 bg-gray-900 text-xs text-white hover:bg-gray-800"
                onClick={() => {
                  setEditingTestId(null);
                  setTestForm(emptyTestForm());
                  setIsAddTestOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Test Result
              </Button>
              {allTestsPassed && (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 bg-violet-800 text-xs text-white hover:bg-violet-900"
                  onClick={() => setIsDecisionOpen(true)}
                >
                  Prototype Decision
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-gray-100 px-4 py-3">
                <CardTitle className="text-xs font-semibold">
                  Technical Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-4 text-xs text-gray-700">
                {iteration.technical_notes || "No technical notes defined yet."}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-gray-100 px-4 py-3">
                <CardTitle className="text-xs font-semibold">
                  Build Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4 text-xs text-gray-700">
                <Detail label="BUILD" value={iteration.build_method} />
                <Detail label="STATUS" value={STATUS_LABEL[iteration.status]} />
                <Detail label="CREATED BY" value={iteration.created_by} />
                <Detail
                  label="ASSIGNEE"
                  value={iteration.assignee.name}
                />
                <Detail label="CREATED DATE" value={formatDate(iteration.created_at)} />
                <Detail label="DUE DATE" value={formatDate(iteration.due_date)} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold">
                  Build Reference Files
                </CardTitle>
                <span className="text-[10px] text-gray-400">
                  {iteration.build_reference_files?.length ?? 0} files
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 py-4">
              {iteration.build_reference_files &&
              iteration.build_reference_files.length > 0 ? (
                iteration.build_reference_files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{file.file_name}</p>
                      <p className="text-[10px] text-gray-500">
                        {file.file_size}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={downloadDocument.isPending}
                      onClick={() =>
                        downloadDocument.mutate(file.id, {
                          onSuccess: (url) =>
                            triggerDocumentDownload(
                              { original_name: file.file_name },
                              url
                            ),
                        })
                      }
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">
                  No reference files uploaded.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Test Progress
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#10b981 ${Math.min(100, Math.max(0, iteration.pass_rate))}%, #e5e7eb 0)`,
                  }}
                  aria-label={`${iteration.pass_rate}% of tests passed`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-bold text-gray-800">
                    {iteration.pass_rate}%
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {iteration.tests_passed} of {iteration.tests_total} tests passed
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-gray-500">
                    {getPendingTestLabel(tests)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("test-results")}
                className="mt-4 text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                View all test results →
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test-results" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Test Results & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-4">
              {isLoadingTests ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Loading test results...
                </p>
              ) : tests.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  No test results yet. Add the first one to start tracking.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="bg-gradient-to-r from-violet-950 to-violet-700 px-5 py-4 text-white">
                      <p className="text-sm font-semibold">AI Insight</p>
                      <p className="mt-0.5 text-[10px] text-violet-200">
                        Based on Criteria, Actual Result and Status
                      </p>
                    </div>
                    <div className="grid gap-3 p-4 md:grid-cols-2">
                      {tests.map((result) => (
                        <div
                          key={`summary-${result.id}`}
                          className={`rounded-lg border border-gray-200 border-t-2 bg-white p-3 ${
                            result.status === "pass"
                              ? "border-t-emerald-500"
                              : result.status === "fail"
                                ? "border-t-red-500"
                                : "border-t-amber-500"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-900">
                              {result.test_name}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${testStatusClassMap[result.status]}`}
                            >
                              {TEST_STATUS_LABEL[result.status]}
                            </Badge>
                          </div>
                          <p className="mt-3 text-[11px] leading-5 text-gray-500">
                            {result.actual_result || result.comments || result.criteria}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <TestProgressSummary tests={tests} />

                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <Table className="min-w-150">
                    <TableHeader>
                      <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Test
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Criteria
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Actual Result
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Tested By
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Date
                        </TableHead>
                        <TableHead className="w-20 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tests.map((result) => (
                        <TableRow key={result.id} className="border-gray-100">
                          <TableCell className="text-xs font-medium text-gray-800">
                            {result.test_name}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {result.criteria}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {result.actual_result || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium ${testStatusClassMap[result.status]}`}
                            >
                              {TEST_STATUS_LABEL[result.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {result.tested_by}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {formatDate(result.tested_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-violet-700"
                              aria-label={`Edit ${result.test_name}`}
                              onClick={() => {
                                setEditingTestId(result.id);
                                setTestForm({
                                  name: result.test_name,
                                  expected_result: result.criteria,
                                  actual_result: result.actual_result || "",
                                  description: result.description || "",
                                  status: result.status,
                                  tested_by_name: result.tested_by,
                                  date: toDateInputValue(result.tested_at),
                                });
                                setIsAddTestOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              disabled={deleteTestResult.isPending}
                              aria-label={`Delete ${result.test_name}`}
                              onClick={() =>
                                setDeleteTarget({
                                  type: "test",
                                  id: result.id,
                                  name: result.test_name,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Reviewer & Team Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 py-4">
              {isLoadingFeedbacks ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Loading feedback...
                </p>
              ) : feedbacks.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  No feedback yet.
                </p>
              ) : (
                feedbacks.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-800">
                          {entry.author || "Team member"}
                        </p>
                        <p className="text-[10px] text-gray-400">{entry.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-[10px] text-gray-400">
                          {formatDate(entry.created_at)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-violet-700"
                          onClick={() => {
                            setEditingFeedbackId(entry.id);
                            setEditingFeedbackText(entry.text);
                          }}
                          aria-label="Edit feedback"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          disabled={deleteFeedback.isPending}
                          onClick={() =>
                            setDeleteTarget({ type: "feedback", id: entry.id })
                          }
                          aria-label="Delete feedback"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {editingFeedbackId === entry.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={editingFeedbackText}
                          onChange={(event) => setEditingFeedbackText(event.target.value)}
                          className="min-h-20 resize-y text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFeedbackId(null)}
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!editingFeedbackText.trim() || updateFeedback.isPending}
                            onClick={() =>
                              updateFeedback.mutate(
                                {
                                  id: iteration.id,
                                  feedbackId: entry.id,
                                  payload: {
                                    comment: editingFeedbackText.trim(),
                                    comment_type: entry.category || "general",
                                    source: entry.source || "web",
                                    source_ref_id: entry.source_ref_id || iteration.id,
                                  },
                                },
                                { onSuccess: () => setEditingFeedbackId(null) }
                              )
                            }
                          >
                            {updateFeedback.isPending ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 leading-5 text-gray-700">{entry.text}</p>
                    )}
                    {entry.category && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-primary-400 bg-primary-50 text-[10px] font-medium text-primary-700"
                      >
                        {entry.category}
                      </Badge>
                    )}
                  </div>
                ))
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-semibold text-gray-800">Add Feedback</p>
                <Textarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder="Add your feedback context for the iteration..."
                  className="min-h-24 resize-y text-xs"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    className="bg-gray-900 text-xs text-white hover:bg-gray-800"
                    disabled={!feedbackText.trim() || addFeedback.isPending}
                    onClick={() =>
                      addFeedback.mutate(
                        {
                          id: iteration.id,
                          payload: {
                            comment: feedbackText.trim(),
                            comment_type: "general",
                            source: "web",
                            source_ref_id: iteration.id,
                          },
                        },
                        { onSuccess: () => setFeedbackText("") }
                      )
                    }
                  >
                    {addFeedback.isPending ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDecisionOpen} onOpenChange={setIsDecisionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Prototype Decision</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Choose one
            </p>
            <DecisionOption
              value="approve"
              selected={decision === "approve"}
              title="Approved"
              description="Approved prototype."
              status="APPROVED"
              onSelect={setDecision}
            />
            <DecisionOption
              value="defer"
              selected={decision === "defer"}
              title="Defer"
              description="Stay on testing."
              status="TESTING"
              onSelect={setDecision}
            />
            <DecisionOption
              value="reject"
              selected={decision === "reject"}
              title="Reject"
              description="Reject prototype and need revision."
              status="REJECTED"
              onSelect={setDecision}
            />
            {decision === "reject" && (
              <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                All test results must be redone from the beginning.
              </div>
            )}
            <TestField label="Note" required>
              <Textarea
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder="Add a note for this decision..."
                className="min-h-20 text-xs"
              />
            </TestField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDecisionOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className={
                decision === "reject"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }
              disabled={!decisionNote.trim() || createApproval.isPending}
              onClick={() => {
                const decisionStatus = {
                  approve: "approved",
                  defer: "testing",
                  reject: "rejected",
                }[decision];
                createApproval.mutate(
                  {
                    id: iteration.id,
                    payload: {
                      decided_at: new Date().toISOString(),
                      decision,
                      decision_status: decisionStatus,
                      metadata: {},
                      note: decisionNote.trim(),
                    },
                  },
                  {
                    onSuccess: () => {
                      setIsDecisionOpen(false);
                      setDecisionNote("");
                    },
                  }
                );
              }}
            >
              {createApproval.isPending
                ? "Submitting..."
                : decision === "approve"
                  ? "Approve Prototype"
                  : decision === "defer"
                    ? "Defer Prototype"
                    : "Reject Prototype"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteTestResult.isPending && !deleteFeedback.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {deleteTarget?.type === "test"
                ? "Delete Test Result"
                : "Delete Feedback"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === "test"
                ? `Delete test result “${deleteTarget.name}”? This action cannot be undone.`
                : "Delete this feedback? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteTestResult.isPending || deleteFeedback.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteTestResult.isPending || deleteFeedback.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === "test") {
                  deleteTestResult.mutate(
                    {
                      id: iteration.id,
                      test_result_id: deleteTarget.id,
                    },
                    { onSuccess: () => setDeleteTarget(null) },
                  );
                  return;
                }
                deleteFeedback.mutate(
                  { id: iteration.id, feedbackId: deleteTarget.id },
                  { onSuccess: () => setDeleteTarget(null) },
                );
              }}
            >
              {deleteTestResult.isPending || deleteFeedback.isPending
                ? "Deleting..."
                : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddTestOpen}
        onOpenChange={(open) => {
          setIsAddTestOpen(open);
          if (!open) setEditingTestId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingTestId ? "Edit Test Result" : "Add Test Result"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <TestField label="Test Name" required>
              <Input
                value={testForm.name}
                onChange={(event) =>
                  setTestForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g. Dimension Verification"
                className="h-9 text-xs"
              />
            </TestField>
            <TestField label="Criteria / Expected Result" required>
              <Input
                value={testForm.expected_result}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    expected_result: event.target.value,
                  }))
                }
                placeholder="e.g. Wall thickness ≥3.2mm at all entry points"
                className="h-9 text-xs"
              />
            </TestField>
            <TestField label="Actual Result">
              <Input
                value={testForm.actual_result}
                onChange={(event) =>
                  setTestForm((current) => ({
                    ...current,
                    actual_result: event.target.value,
                  }))
                }
                placeholder="Fill in once the test has been run"
                className="h-9 text-xs"
              />
            </TestField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TestField label="Status">
                <Select
                  value={testForm.status}
                  onValueChange={(value) =>
                    setTestForm((current) => ({
                      ...current,
                      status: value as TestResultStatus,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pass">Passed</SelectItem>
                    <SelectItem value="fail">Failed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </TestField>
              <TestField label="Tested By">
                <Input
                  value={currentTesterName}
                  readOnly
                  className="h-9 bg-gray-50 text-xs"
                />
              </TestField>
              <TestField label="Date">
                <Input
                  type="date"
                  value={testForm.date}
                  onChange={(event) =>
                    setTestForm((current) => ({ ...current, date: event.target.value }))
                  }
                  className="h-9 text-xs"
                />
              </TestField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddTestOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gray-900 text-white hover:bg-gray-800"
              disabled={
                !testForm.name.trim() ||
                !testForm.expected_result.trim() ||
                !me?.user_id ||
                addTestResult.isPending ||
                updateTestResult.isPending
              }
              onClick={() => {
                const payload = {
                  ...testForm,
                  description: testForm.description || testForm.expected_result,
                  tested_by_id: me?.user_id ?? "",
                  tested_by_name: currentTesterName,
                };
                const onSuccess = () => {
                  setIsAddTestOpen(false);
                  setEditingTestId(null);
                  setTestForm(emptyTestForm());
                };

                if (editingTestId) {
                  updateTestResult.mutate(
                    {
                      id: iteration.id,
                      test_result_id: editingTestId,
                      payload,
                    },
                    { onSuccess }
                  );
                  return;
                }

                addTestResult.mutate(
                  { id: iteration.id, payload },
                  { onSuccess }
                );
              }}
            >
              {addTestResult.isPending || updateTestResult.isPending
                ? "Saving..."
                : editingTestId
                  ? "Save Changes"
                  : "Add Test Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DecisionOption({
  value,
  selected,
  title,
  description,
  status,
  onSelect,
}: {
  value: PrototypeDecision;
  selected: boolean;
  title: string;
  description: string;
  status: string;
  onSelect: (value: PrototypeDecision) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
        selected ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <span
        className={`h-3.5 w-3.5 shrink-0 rounded-full border-4 ${
          selected ? "border-violet-600 bg-white" : "border-gray-300 bg-white"
        }`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-gray-900">{title}</span>
        <span className="block text-[10px] text-gray-500">{description}</span>
      </span>
      <Badge variant="outline" className="text-[9px]">
        {status}
      </Badge>
    </button>
  );
}

function TestProgressSummary({ tests }: { tests: TestResult[] }) {
  const passed = tests.filter((test) => test.status === "pass").length;
  const rate = tests.length ? Math.round((passed / tests.length) * 100) : 0;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#10b981 ${rate}%, #e5e7eb 0)` }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-bold text-gray-800">
          {rate}%
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {passed} of {tests.length} tests passed
        </p>
        <p className="mt-0.5 text-[11px] text-gray-500">
          {getPendingTestLabel(tests)}
        </p>
      </div>
    </div>
  );
}

function TestField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-[11px] font-medium text-gray-700">
      <span>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 text-xs font-medium text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}
