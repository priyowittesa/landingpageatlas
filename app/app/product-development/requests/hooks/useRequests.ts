"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  BulkDeleteDto,
  EngineeringRequest,
  RequestApprovalDto,
  RequestCommentDto,
  RequestFilter,
  RequestFormDto,
  RequestListPagination,
  RequestPayloadDto,
  RequestStatus,
  RequestStatusPatchDto,
  RequestAttachment,
  RequestComment,
  RequestApproval,
} from "../types";
import { toApiDate } from "../lib/date";

const axios = axiosConfig(env.apiBaseUrl);

const BASE_URL = "/v1/manufacturing/engineering/request";

export const requestKeys = {
  all: ["engineering-requests"] as const,
  list: (params?: RequestFilter) =>
    [...requestKeys.all, "list", params] as const,
  detail: (id: string) => [...requestKeys.all, "detail", id] as const,
  approvals: (id: string) => [...requestKeys.all, "approvals", id] as const,
  comments: (id: string) => [...requestKeys.all, "comments", id] as const,
  statusCounts: () => [...requestKeys.all, "status-counts"] as const,
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeDocuments(raw: unknown): RequestAttachment {
  const item = asObject(raw);
  return {
    id: String(item.id ?? ""),
    original_name: String(
      item.original_name ?? item.file_name ?? item.name ?? "",
    ),
    display_name:
      item.display_name != null ? String(item.display_name) : undefined,
    file_extension:
      item.file_extension != null ? String(item.file_extension) : undefined,
    file_type:
      item.file_type != null ? String(item.file_type) : undefined,
    mime_type:
      item.mime_type != null ? String(item.mime_type) : undefined,
    file_size_bytes:
      item.file_size_bytes != null ? Number(item.file_size_bytes) : undefined,
    storage_provider:
      item.storage_provider != null
        ? String(item.storage_provider)
        : undefined,
    storage_bucket:
      item.storage_bucket != null ? String(item.storage_bucket) : undefined,
    storage_key: String(item.storage_key ?? ""),
    checksum_sha256:
      item.checksum_sha256 != null
        ? String(item.checksum_sha256)
        : undefined,
    created_by:
      item.created_by != null ? String(item.created_by) : undefined,
    uploaded_at: String(item.uploaded_at ?? ""),
  };
}

function normalizeComments(raw: unknown): RequestComment {
  const item = asObject(raw);
  return {
    id: String(item.id ?? ""),
    comment: String(item.comment ?? item.text ?? ""),
    comment_type: String(item.comment_type ?? ""),
    created_by_name: String(item.created_by_name ?? item.author ?? ""),
    created_by_role: String(item.created_by_role ?? item.role ?? ""),
    source: String(item.source ?? ""),
    source_ref_id: String(item.source_ref_id ?? ""),
    created_at: String(item.created_at ?? ""),
  };
}

function normalizeApprovals(raw: unknown): RequestApproval {
  const item = asObject(raw);
  return {
    id: String(item.id ?? ""),
    gate_code: String(item.gate_code ?? "G1"),
    decision: String(item.decision ?? "") as RequestApproval["decision"],
    reason: String(item.reason ?? ""),
    note: String(item.note ?? ""),
    decided_by_name: String(item.decided_by_name ?? ""),
    decided_by_role: String(item.decided_by_role ?? ""),
    decided_at: String(item.decided_at ?? ""),
    tags: Array.isArray(item.tags)
      ? item.tags.map((t: unknown) => String(t))
      : [],
  };
}

function normalizeRequest(raw: unknown): EngineeringRequest {
  const row = asObject(raw);

  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? row.request_no ?? ""),
    title: String(row.title ?? row.name ?? ""),
    customer: String(row.customer ?? ""),
    customer_ref: String(row.customer_ref ?? ""),
    submitted_at: String(row.submitted_at ?? ""),
    submitted_by: String(row.submitted_by ?? ""),
    workflow_stage:
      (row.workflow_stage as EngineeringRequest["workflow_stage"]) ??
      "submitted",
    sla: String(row.sla ?? ""),
    classification:
      (row.classification as EngineeringRequest["classification"]) ??
      "new_product_design",
    priority: (row.priority as EngineeringRequest["priority"]) ?? "medium",
    status: (row.status as EngineeringRequest["status"]) ?? "submitted",
    due_date_at: String(row.due_date_at ?? row.due_date ?? ""),
    notes: String(row.notes ?? ""),
    scope_summary: String(row.scope_summary ?? ""),
    documents: Array.isArray(row.documents)
      ? (row.documents as unknown[]).map((d) => normalizeDocuments(d))
      : Array.isArray(row.attachments)
        ? (row.attachments as unknown[]).map((d) => normalizeDocuments(d))
        : [],
    comments: Array.isArray(row.comments)
      ? (row.comments as unknown[]).map((c) => normalizeComments(c))
      : [],
    approvals: Array.isArray(row.approvals)
      ? (row.approvals as unknown[]).map((a) => normalizeApprovals(a))
      : [],
    document_count: Number(
      row.document_count ??
        row.attachment_count ??
        (Array.isArray(row.documents) ? row.documents.length : 0),
    ),
    created_by: String(row.created_by ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function extractList<T>(
  payload: unknown,
  normalizer: (raw: unknown) => T
): { items: T[]; nextPageToken: string } {
  let items: T[] = [];
  let nextPageToken = "";
  let current: unknown = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const envelope = asObject(current);
    const token = envelope.next_page_token ?? envelope.nextPageToken;
    if (token != null) nextPageToken = String(token);
    const value =
      envelope.data ?? envelope.items ?? envelope.requests ?? envelope.results;
    if (Array.isArray(value)) {
      items = value.map(normalizer);
      break;
    }
    current = value;
  }
  if (items.length === 0 && Array.isArray(payload)) {
    items = (payload as unknown[]).map(normalizer);
  }
  return { items, nextPageToken };
}

function buildQuery(params: RequestFilter | undefined): Record<string, string> {
  const query: Record<string, string> = {};
  if (!params) return query;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query[key] = String(value);
  }
  return query;
}

export type RequestStatusCounts = Partial<Record<RequestStatus | "all", number>>;

function normalizeStatusCounts(raw: unknown): RequestStatusCounts {
  const value = asObject(raw);
  const nested = value.data ?? value.counts ?? value.status_counts ?? value.statusCounts ?? value;
  const data = asObject(nested);
  const counts: RequestStatusCounts = {};
  for (const [key, count] of Object.entries(data)) {
    if (typeof count === "number" || typeof count === "string") {
      const parsed = Number(count);
      if (Number.isFinite(parsed)) {
        const normalizedKey = key.replace(/^count_/, "") as RequestStatus | "all";
        counts[normalizedKey] = parsed;
      }
    }
  }
  if (counts.all === undefined) {
    counts.all = Object.entries(counts)
      .filter(([key]) => key !== "all")
      .reduce((sum, [, count]) => sum + (count ?? 0), 0);
  }
  return counts;
}

export function useRequestStatusCounts() {
  return useQuery<RequestStatusCounts, AxiosError<ApiResponseError>>({
    queryKey: requestKeys.statusCounts(),
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/count-status`);
      return normalizeStatusCounts(res.data);
    },
    meta: { errorMessage: "Failed to load request status counts" },
  });
}

export function useRequestList(params: RequestFilter = {}) {
  return useQuery<RequestListPagination, AxiosError<ApiResponseError>>({
    queryKey: requestKeys.list(params),
    queryFn: async () => {
      const res = await axios.get(BASE_URL, { params: buildQuery(params) });
      const { items, nextPageToken } = extractList(res.data, normalizeRequest);
      return {
        items,
        nextPageToken,
        totalCount: items.length,
      };
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load requests" },
  });
}

export function useRequest(id?: string) {
  return useQuery<EngineeringRequest | null, AxiosError<ApiResponseError>>({
    queryKey: requestKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`${BASE_URL}/${id}`);
      const data = asObject(res.data);
      const raw = data.data ?? data.request ?? res.data;
      if (!raw || typeof raw !== "object") return null;
      return normalizeRequest(raw);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load request" },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, RequestFormDto>({
    mutationFn: async (payload) => {
      const dueDate = toApiDate(payload.due_date_at);
      if (payload.due_date_at && !dueDate) {
        throw new Error("Invalid due date — must be a valid date.");
      }
      const dto: RequestPayloadDto = {
        status: "submitted",
        customer: payload.customer,
        priority: payload.priority,
        title: payload.title,
        due_date_at: dueDate as string,
        notes: payload.notes,
        scope_summary: payload.scope_summary,
        classification: payload.classification,
      };
      const formData = new FormData();
      formData.append("payload", JSON.stringify(dto));
      (payload.attachments ?? []).forEach((file) => {
        formData.append("files", file);
      });
      return (
        await axios.post(BASE_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to create request",
      successMessage: "Request submitted successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    {
      id: string;
      payload: Partial<RequestPayloadDto>;
      attachments?: File[];
    }
  >({
    mutationFn: async ({ id, payload, attachments }) => {
      const body: Partial<RequestPayloadDto> = { ...payload };
      if (payload.due_date_at !== undefined) {
        const dueDate = toApiDate(payload.due_date_at);
        if (payload.due_date_at && !dueDate) {
          throw new Error("Invalid due date — must be a valid date.");
        }
        body.due_date_at = dueDate;
      }
      const response = await axios.put(`${BASE_URL}/${id}`, body);

      if (attachments?.length) {
        const formData = new FormData();
        attachments.forEach((file) => formData.append("files", file));

        await axios.post(`${BASE_URL}/${id}/document`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return response.data;
    },
    meta: {
      errorMessage: "Failed to update request",
      successMessage: "Request updated successfully",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) =>
      (await axios.delete(`${BASE_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete request",
      successMessage: "Request deleted",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useBulkDeleteRequests() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, BulkDeleteDto>({
    mutationFn: async (payload) =>
      (await axios.post(`${BASE_URL}/bulk-delete`, payload)).data,
    meta: {
      errorMessage: "Failed to delete requests",
      successMessage: "Requests deleted",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: RequestStatusPatchDto }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.patch(`${BASE_URL}/${id}/status`, payload)).data,
    meta: {
      errorMessage: "Failed to update status",
      successMessage: "Status updated",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
    },
  });
}

export function useRequestApprovals(id?: string) {
  return useQuery<RequestApproval[], AxiosError<ApiResponseError>>({
    queryKey: requestKeys.approvals(id ?? ""),
    queryFn: async (): Promise<RequestApproval[]> => {
      if (!id) return [];
      const res = await axios.get(`${BASE_URL}/${id}/approvals`);
      return extractList(res.data, normalizeApprovals).items;
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load approvals" },
  });
}

export function useCreateApproval() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: RequestApprovalDto }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.post(`${BASE_URL}/${id}/approvals`, payload)).data,
    meta: {
      errorMessage: "Failed to record Gate 1 decision",
      successMessage: "Gate 1 decision recorded",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.approvals(id) });
    },
  });
}

export function useRequestComments(id?: string) {
  return useQuery<RequestComment[], AxiosError<ApiResponseError>>({
    queryKey: requestKeys.comments(id ?? ""),
    queryFn: async (): Promise<RequestComment[]> => {
      if (!id) return [];
      const res = await axios.get(`${BASE_URL}/${id}/comments`);
      return extractList(res.data, normalizeComments).items;
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load comments" },
  });
}

export function useAddRequestComment() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: RequestCommentDto }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.post(`${BASE_URL}/${id}/comments`, payload)).data,
    meta: {
      errorMessage: "Failed to post comment",
      successMessage: "Comment posted",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.comments(id) });
    },
  });
}

export function useDeleteRequestComment() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; comment_id: string }
  >({
    mutationFn: async ({ id, comment_id }) =>
      (await axios.delete(`${BASE_URL}/${id}/comments/${comment_id}`)).data,
    meta: {
      errorMessage: "Failed to delete comment",
      successMessage: "Comment deleted",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.comments(id) });
    },
  });
}

export function useDownloadDocument() {
  return useMutation<string, AxiosError<ApiResponseError>, string>({
    mutationFn: async (documentId) => {
      const res = await axios.get<DocumentDownloadResponse | string>(
        `${BASE_URL}/document/${documentId}/download-url`,
      );
      return extractDocumentDownloadUrl(res.data);
    },
    meta: { errorMessage: "Failed to get document download URL" },
  });
}

interface DocumentDownloadResponse {
  download_url?: string;
  url?: string;
  expires_at?: string;
  data?: DocumentDownloadResponse;
}

function extractDocumentDownloadUrl(
  response: DocumentDownloadResponse | string,
): string {
  if (typeof response === "string") return response;

  const data = asObject(response);
  const nestedData = asObject(data.data);
  const url =
    data.download_url ??
    nestedData.download_url ??
    data.url ??
    nestedData.url;

  return typeof url === "string" ? url : "";
}

/**
 * Fetch a signed download URL for a document. If the backend exposes the
 * `/documents/{document_id}/download-url` endpoint we use it; otherwise we
 * fall back to opening the `storage_key` directly (works for public buckets
 * or signed S3 URLs already embedded in `storage_key`).
 */
export function useDocumentDownloadUrl(
  requestId: string | undefined,
  documentId: string | undefined,
) {
  return useQuery<string, AxiosError<ApiResponseError>>({
    queryKey: [
      ...requestKeys.all,
      "document-download",
      requestId ?? "",
      documentId ?? "",
    ],
    queryFn: async (): Promise<string> => {
      if (!requestId || !documentId) return "";
      const res = await axios.get<DocumentDownloadResponse | string>(
        `${BASE_URL}/document/${documentId}/download-url`,
      );
      return extractDocumentDownloadUrl(res.data);
    },
    enabled: Boolean(requestId && documentId),
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to get document download URL" },
  });
}

/**
 * Trigger a browser download for a document.
 * Priority:
 *   1. Backend-signed download URL (`/documents/{id}/download-url`)
 *   2. Direct `storage_key` URL (works for public S3 buckets)
 *
 * Falls back gracefully if the storage_key is not a URL — opens it as-is.
 */
export function triggerDocumentDownload(
  doc: { storage_key?: string; original_name?: string },
  signedUrl?: string,
) {
  const url = signedUrl || doc.storage_key;
  if (!url) return;

  const anchor = window.document.createElement("a");
  anchor.href = url;
  if (doc.original_name) {
    anchor.download = doc.original_name;
  }
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
}
