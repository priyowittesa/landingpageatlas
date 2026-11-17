export type IterationStatus =
  | "draft"
  | "testing"
  | "approved"
  | "rejected"
  | "on_hold";

export type TestResultStatus = "pending" | "pass" | "fail" | "blocked";

export interface IterationAssignee {
  id: string;
  name: string;
  initials?: string;
}

export interface IterationProjectRef {
  id: string;
  project_no: string;
  name: string;
}

export interface PrototypeIteration {
  id: string;
  iteration_no: string;
  iteration_index: number;
  name: string;
  revision: string;
  description?: string;
  build_method: string;
  status: IterationStatus;
  project: IterationProjectRef;
  assignee: IterationAssignee;
  due_date: string;
  tests_total: number;
  tests_passed: number;
  pass_rate: number;
  test_plan?: string;
  technical_notes?: string;
  requirement_note?: string;
  created_by?: string;
  build_reference_files?: IterationFile[];
  created_at: string;
}

export interface IterationFile {
  id: string;
  file_name: string;
  file_size?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  url?: string;
  file_type?: string;
}

export interface TestResult {
  id: string;
  test_name: string;
  criteria: string;
  actual_result?: string;
  status: TestResultStatus;
  tested_by: string;
  tested_by_id?: string;
  description?: string;
  tested_at: string;
  comments?: string;
}

export interface IterationFeedback {
  id: string;
  author: string;
  role: string;
  text: string;
  category: string;
  source?: string;
  source_ref_id?: string;
  created_at: string;
}

export interface PrototypeIterationDetail extends PrototypeIteration {
  test_results: TestResult[];
  feedback: IterationFeedback[];
}

export interface PrototypeFilter {
  status?: IterationStatus | "all";
  search?: string;
  design_version_id?: string;
  page_size?: number;
  page_token?: string;
}

export interface PrototypeListResult {
  items: PrototypeIteration[];
  next_page_token: string;
  total_count: number;
}

export interface AddTestResultDto {
  actual_result?: string;
  date?: string;
  description?: string;
  expected_result?: string;
  name?: string;
  tested_by_id?: string;
  tested_by_name?: string;
  test_name?: string;
  criteria?: string;
  status: TestResultStatus;
  tested_by?: string;
  tested_at?: string;
}

export interface AddFeedbackDto {
  comment?: string;
  comment_type?: string;
  source?: string;
  source_ref_id?: string;
  category?: string;
  text?: string;
}

export type PrototypeDecision = "approve" | "defer" | "reject";

export interface PrototypeApprovalDto {
  decided_at: string;
  decision: PrototypeDecision;
  decision_status: string;
  metadata: Record<string, string>;
  note: string;
}

export const iterationStatusOptions: IterationStatus[] = [
  "draft",
  "testing",
  "approved",
  "rejected",
  "on_hold",
];

export const testResultStatusOptions: TestResultStatus[] = [
  "pending",
  "pass",
  "fail",
  "blocked",
];

export const iterationStatusClassMap: Record<IterationStatus, string> = {
  draft: "border-gray-400 bg-gray-50 text-gray-600",
  testing: "border-blue-400 bg-blue-50 text-blue-600",
  approved: "border-emerald-400 bg-emerald-50 text-emerald-600",
  rejected: "border-red-400 bg-red-50 text-red-600",
  on_hold: "border-amber-400 bg-amber-50 text-amber-600",
};

export const testStatusClassMap: Record<TestResultStatus, string> = {
  pending: "border-amber-400 bg-amber-50 text-amber-600",
  pass: "border-emerald-400 bg-emerald-50 text-emerald-600",
  fail: "border-red-400 bg-red-50 text-red-600",
  blocked: "border-gray-400 bg-gray-50 text-gray-600",
};

export const feedbackCategories = [
  "Fit & Finish",
  "Process",
  "Function",
  "Material",
  "Tolerance",
  "Compliance",
] as const;
