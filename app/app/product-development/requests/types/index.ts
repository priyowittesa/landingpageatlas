export type RequestStatus =
  | "submitted"
  | "approved"
  | "in_progress"
  | "rejected"
  | "done";

export type RequestPriority = "low" | "medium" | "high" | "critical";

export type RequestClassification =
  | "new_product_design"
  | "product_modification"
  | "prototype_development";

export type GateDecision = "accept" | "defer" | "reject";

export type WorkflowStage =
  | "submitted"
  | "gate_1_review"
  | "approved"
  | "in_progress"
  | "closed";

export interface RequestAttachment {
  id: string;
  original_name: string;
  display_name?: string;
  file_extension?: string;
  file_type?: string;
  mime_type?: string;
  file_size_bytes?: number;
  storage_provider?: string;
  storage_bucket?: string;
  storage_key: string;
  checksum_sha256?: string;
  created_by?: string;
  uploaded_at: string;
}

export interface RequestComment {
  id: string;
  comment: string;
  comment_type?: string;
  created_by_name: string;
  created_by_role?: string;
  source?: string;
  source_ref_id?: string;
  created_at: string;
}

export interface RequestApproval {
  id: string;
  gate_code: string;
  decision: GateDecision | string;
  reason?: string;
  note?: string;
  decided_by_name: string;
  decided_by_role?: string;
  decided_at: string;
  tags?: string[];
}

export interface EngineeringRequest {
  id: string;
  code: string;
  title: string;
  customer: string;
  customer_ref?: string;
  classification: RequestClassification;
  priority: RequestPriority;
  status: RequestStatus;
  due_date_at: string;
  notes?: string;
  scope_summary?: string;
  documents: RequestAttachment[];
  comments?: RequestComment[];
  approvals?: RequestApproval[];
  document_count: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  submitted_by?: string;
  workflow_stage?: WorkflowStage;
  sla?: string;
}

export interface RequestListPagination {
  items: EngineeringRequest[];
  nextPageToken: string;
  totalCount: number;
}

export interface RequestFilter {
  status?: RequestStatus | "all" | string;
  priority?: RequestPriority | string;
  search?: string;
  page_size?: number;
  page_token?: string;
}

export interface RequestPayloadDto {
  status?: string;
  customer: string;
  priority: RequestPriority;
  title: string;
  due_date_at: string;
  notes?: string;
  scope_summary?: string;
  classification: RequestClassification;
}

export interface RequestFormDto {
  customer: string;
  title: string;
  scope_summary: string;
  priority: RequestPriority;
  due_date_at: string;
  classification: RequestClassification;
  notes: string;
  attachments?: File[];
}

export interface RequestApprovalDto {
  gate_code: string;
  gate_name?: string;
  decision: GateDecision;
  reason?: string;
  note?: string;
  decided_by_name: string;
  decided_by_role: string;
  tags?: string[];
}

export interface RequestCommentDto {
  comment: string;
  comment_type?: string;
  created_by_name?: string;
  created_by_role?: string;
  source?: string;
  source_ref_id?: string;
}

export interface RequestStatusPatchDto {
  status: RequestStatus;
}

export interface BulkDeleteDto {
  ids: string[];
}

export const requestStatusOptions: RequestStatus[] = [
  "submitted",
  "approved",
  "in_progress",
  "rejected",
  "done",
];

export const priorityOptions: RequestPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const classificationOptions: RequestClassification[] = [
  "new_product_design",
  "product_modification",
  "prototype_development",
];

export const deferralReasonTags = [
  "Out of Scope",
  "File Commercial Case",
  "Duplicate Request",
  "Insufficient Specification",
] as const;

export const statusClassMap: Record<RequestStatus, string> = {
  submitted: "border-emerald-400 bg-emerald-50 text-emerald-600",
  approved: "border-blue-400 bg-blue-50 text-blue-600",
  in_progress: "border-amber-400 bg-amber-50 text-amber-600",
  rejected: "border-red-400 bg-red-50 text-red-600",
  done: "border-gray-400 bg-gray-50 text-gray-600",
};

export const priorityClassMap: Record<RequestPriority, string> = {
  low: "border-gray-300 bg-gray-50 text-gray-500",
  medium: "border-emerald-400 bg-emerald-50 text-emerald-600",
  high: "border-amber-400 bg-amber-50 text-amber-600",
  critical: "border-red-400 bg-red-50 text-red-600",
};

export const classificationLabelMap: Record<RequestClassification, string> = {
  new_product_design: "New Product Design",
  product_modification: "Product Modification",
  prototype_development: "Prototype Development",
};
