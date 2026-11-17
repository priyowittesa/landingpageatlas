export type DesignStatus =
  | "draft"
  | "in_review"
  | "on_hold"
  | "deferred"
  | "approved"
  | "rejected"
  | "released";

export type DesignDecision = "accept" | "defer" | "reject";

export interface DesignTeamMember {
  id: string;
  name: string;
  role?: string;
}

export interface DesignRevision {
  id: string;
  version: string;
  uploaded_by: string;
  uploaded_at: string;
  file_size?: string;
  file_name?: string;
  display_name?: string;
  url?: string;
  notes?: string;
}

export interface DesignComment {
  id: string;
  author: string;
  role: string;
  text: string;
  category?: string;
  created_at: string;
  decision?: DesignDecision;
}

export interface DesignProjectRef {
  id: string;
  project_no: string;
  name: string;
}

export interface Design {
  id: string;
  active_version_id: string;
  design_no: string;
  name: string;
  description?: string;
  version: string;
  status: DesignStatus;
  project: DesignProjectRef;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  file_name: string;
  file_size: string;
  reviewed_by?: string;
  approved_by?: string;
  thumbnail_url?: string;
  team_members: DesignTeamMember[];
  revisions: DesignRevision[];
  comments: DesignComment[];
  comment_count: number;
}

export interface DesignFilter {
  status?: DesignStatus | "all";
  search?: string;
  project_id?: string;
  active_only?: boolean;
  page_size?: number;
  page_token?: string;
}

export interface DesignDecisionDto {
  decision: DesignDecision;
  decided_at: string;
  decided_by: string;
  decision_status: string;
  gate_code: string;
  gate_name: string;
  metadata: Record<string, string>;
  note: string;
}

export interface DesignCommentDto {
  text: string;
  commenter_role: string;
}

export interface DesignUploadDto {
  name: string;
  description?: string;
  project_id: string;
  file: File;
  thumbnail?: File;
  team_member_ids?: string[];
}

export interface DesignCreatePayload {
  code: string;
  title: string;
  description?: string;
  project_planning_id: string;
}

export interface DesignCreateDto extends DesignCreatePayload {
  file: File;
}

export const designCodePattern = /^[A-Za-z0-9._-]+$/;

export const designStatusOptions: DesignStatus[] = [
  "draft",
  "in_review",
  "on_hold",
  "deferred",
  "approved",
  "rejected",
  "released",
];

export const statusClassMap: Record<DesignStatus, string> = {
  draft: "border-gray-400 bg-gray-50 text-gray-600",
  in_review: "border-amber-400 bg-amber-50 text-amber-600",
  on_hold: "border-orange-400 bg-orange-50 text-orange-700",
  deferred: "border-orange-400 bg-orange-50 text-orange-700",
  approved: "border-emerald-400 bg-emerald-50 text-emerald-600",
  rejected: "border-red-400 bg-red-50 text-red-600",
  released: "border-primary-400 bg-primary-50 text-primary-700",
};

export const statusLabelMap: Record<DesignStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  on_hold: "On Hold",
  deferred: "Deferred",
  approved: "Approved",
  rejected: "Rejected",
  released: "Released",
};

export const feedbackCategories = [
  "Fit & Finish",
  "Process",
  "Function",
  "Material",
  "Tolerance",
  "Compliance",
] as const;

export const deferralReasonTags = [
  "Out of Scope",
  "No Commercial Case",
  "Duplicate Request",
  "Insufficient Specification",
] as const;
