import type { WorkflowChatResponseError } from "@/app/app/ai-studio/workflow/types";

export type AiAssistantRole = "assistant" | "user";

export type WorkflowChatJobState =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type WorkflowChatJobStep = {
  seq: number;
  kind: string;
  name?: string;
  at?: string;
  data?: Record<string, unknown>;
};

export type WorkflowChatJob = {
  job_id: string;
  session_id: string;
  workflow_id?: string;
  tenant_id: string;
  user_id: string;
  state: WorkflowChatJobState;
  steps: WorkflowChatJobStep[];
  progress?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: WorkflowChatResponseError;
  cancel_requested: boolean;
  heartbeat_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowChatJobError = {
  code: "invalid_subscription" | "job_not_found";
};

export type WorkflowChatJobSubmissionResponse = {
  status: number;
  job_id: string;
  session_id: string;
  state: WorkflowChatJobState;
};

/**
 * Upload lifecycle for a chat attachment. Files are uploaded immediately on
 * selection through the /workflow/chat/uploads pipeline; the resulting
 * `fileId` is referenced when the message is sent.
 */
export type AiAssistantAttachmentStatus =
  | "idle"
  | "uploading"
  | "complete"
  | "error";

/** A persisted attachment on a rendered message (no upload state). */
export type AiAssistantMessageAttachment = {
  id: string;
  name: string;
  size: number;
};

/** A selectable follow-up choice rendered under an assistant message. */
export type AiAssistantMessageOption = {
  id: string;
  label: string;
  description?: string | null;
  recommended?: boolean;
  /** `choice` renders a pickable answer; `other` defers to free-text input. */
  type?: string;
};

export type AiAssistantMessageMemo = {
  id: string;
  title: string;
  knowledgeFolderId?: string | null;
};

/** In-flight attachment in the composer, tracked through the upload pipeline. */
export type AiAssistantAttachment = {
  /** Local react key. */
  id: string;
  name: string;
  size: number;
  mimeType: string;
  /** Underlying File object — kept for the S3 PUT, dropped once uploaded. */
  file?: File;
  /** File id returned by POST /workflow/chat/uploads/upload-url. */
  fileId?: string;
  status: AiAssistantAttachmentStatus;
  error?: string;
};

export type AiAssistantMessage = {
  id: string;
  role: AiAssistantRole;
  content: string;
  createdAt: string;
  messageType?: string;
  error?: WorkflowChatResponseError;
  replacesMessageIds?: string[];
  skillIds?: string[];
  attachments?: AiAssistantMessageAttachment[];
  options?: AiAssistantMessageOption[];
  memos?: AiAssistantMessageMemo[];
};

export type AiAssistantSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiAssistantMessage[];
};
