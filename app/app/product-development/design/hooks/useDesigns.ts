"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  Design,
  DesignComment,
  DesignCommentDto,
  DesignCreateDto,
  DesignDecisionDto,
  DesignFilter,
  DesignRevision,
  DesignUploadDto,
} from "../types";

const axios = axiosConfig(env.apiBaseUrl);

const BASE_URL = "/v1/manufacturing/engineering/designs";
const LEGACY_UPLOAD_URL = "/v1/product-development/designs";
const COMMENTS_URL = `${BASE_URL}/comments`;

export const designKeys = {
  all: ["product-development-designs"] as const,
  list: (params?: DesignFilter) =>
    [...designKeys.all, "list", params] as const,
  detail: (id: string) => [...designKeys.all, "detail", id] as const,
  versions: (id: string) => [...designKeys.all, "versions", id] as const,
  comments: (versionId: string) =>
    [...designKeys.all, "comments-v2", versionId] as const,
};

function formatFileSize(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "number" && !/^\d+(\.\d+)?$/.test(String(value))) {
    return String(value);
  }

  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return String(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function normalizeRevision(raw: unknown): DesignRevision {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  return {
    id: String(row.id ?? ""),
    version: String(
      row.version_label ?? row.version ?? row.version_no ?? row.version_number ?? "v1.0"
    ),
    uploaded_by: String(
      row.uploaded_by ?? row.created_by_name ?? row.created_by ?? ""
    ),
    uploaded_at: String(row.uploaded_at ?? row.created_at ?? ""),
    file_size: formatFileSize(row.file_size ?? row.file_size_bytes ?? row.size),
    file_name: String(row.original_name ?? row.file_name ?? row.filename ?? ""),
    display_name: String(row.display_name ?? ""),
    url: String(
      row.url ?? row.file_url ?? row.download_url ?? row.storage_url ?? ""
    ),
    notes: String(row.notes ?? ""),
  };
}

function displayName(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const person = value as Record<string, unknown>;
    return String(person.name ?? person.full_name ?? person.email ?? person.id ?? "");
  }
  return value == null ? "" : String(value);
}

function normalizeComment(raw: unknown): DesignComment {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    author: String(
      row.commenter_name ?? row.created_by_name ?? row.author ?? row.created_by ?? ""
    ),
    role: String(row.commenter_role ?? row.role ?? row.created_by_role ?? ""),
    text: String(row.comment ?? row.text ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

function extractComments(payload: unknown): DesignComment[] {
  if (Array.isArray(payload)) return payload.map(normalizeComment);
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "comments", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizeComment);
    if (value && typeof value === "object") {
      const nested = extractComments(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function extractRevisions(payload: unknown): DesignRevision[] {
  if (Array.isArray(payload)) return payload.map(normalizeRevision);
  if (!payload || typeof payload !== "object") return [];

  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "versions", "revisions", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizeRevision);
    if (value && typeof value === "object") {
      const nested = extractRevisions(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeDesign(raw: unknown): Design {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string, unknown
  >;
  const project = (row.project ?? {}) as Record<string, unknown>;
  const activeVersion = (row.active_version ?? {}) as Record<string, unknown>;
  const revisions = Array.isArray(row.revisions) ? row.revisions : [];
  const comments = Array.isArray(row.comments) ? row.comments : [];
  const team = Array.isArray(row.team_members) ? row.team_members : [];

  const projectId = String(
    project.id ?? row.project_planning_id ?? row.project_id ?? ""
  );
  const projectNo = String(
    project.project_no ?? row.project_planning_code ?? ""
  );
  const projectName = String(
    project.name ?? row.project_planning_title ?? ""
  );
  const countVersions = Number(row.count_versions ?? 0);

  return {
    id: String(row.id ?? ""),
    active_version_id: String(activeVersion.id ?? ""),
    design_no: String(row.design_no ?? row.code ?? ""),
    name: String(row.name ?? row.title ?? ""),
    description: String(row.description ?? ""),
    version: String(
      activeVersion.version_label ?? row.version ??
      (countVersions > 0 ? `v${(countVersions + 1).toFixed(1)}` : "v1.0")
    ),
    status: ((activeVersion.status === "under_review"
      ? "in_review"
      : activeVersion.status === "defer"
        ? "deferred"
        : activeVersion.status ?? row.status ?? "draft") as Design["status"]),
    project: {
      id: projectId,
      project_no: projectNo,
      name: projectName,
    },
    uploaded_by: String(row.uploaded_by ?? row.created_by ?? ""),
    uploaded_at: String(activeVersion.created_at ?? row.uploaded_at ?? row.created_at ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
    file_name: String(activeVersion.original_name ?? row.file_name ?? ""),
    file_size: formatFileSize(
      activeVersion.file_size_bytes ?? activeVersion.file_size ?? row.file_size
    ),
    reviewed_by: String(row.reviewed_by ?? ""),
    approved_by: displayName(row.decided_by),
    thumbnail_url: String(row.thumbnail_url ?? ""),
    team_members: team.map((member) => {
      const m = (member ?? {}) as Record<string, unknown>;
      return {
        id: String(m.id ?? ""),
        name: String(m.name ?? ""),
        role: String(m.role ?? ""),
      };
    }),
    revisions: revisions.map(normalizeRevision),
    comments: comments.map((c) => {
      const item = (c ?? {}) as Record<string, unknown>;
      return {
        id: String(item.id ?? ""),
        author: String(item.commenter_name ?? item.author ?? item.created_by ?? ""),
        role: String(item.commenter_role ?? item.role ?? ""),
        text: String(item.comment ?? item.text ?? ""),
        category: String(item.category ?? ""),
        created_at: String(item.created_at ?? ""),
        decision: item.decision as Design["comments"][number]["decision"],
      };
    }),
    comment_count: Number(row.comment_count ?? row.count_comments ?? comments.length),
  };
}

function extractList(payload: unknown): Design[] {
  if (Array.isArray(payload)) return payload.map(normalizeDesign);
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "designs", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value.map(normalizeDesign);
    if (value && typeof value === "object") {
      const nested = extractList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function extractListMeta(payload: unknown): { nextPageToken: string; totalCount: number } {
  if (!payload || typeof payload !== "object") return { nextPageToken: "", totalCount: 0 };
  const obj = payload as Record<string, unknown>;
  const nextPageToken = String(obj.next_page_token ?? obj.nextPageToken ?? "");
  const totalCount = Number(obj.total_count ?? obj.totalCount ?? obj.count ?? 0);
  if (nextPageToken || totalCount) return { nextPageToken, totalCount };
  for (const key of ["data", "pagination", "meta"]) {
    const nested = extractListMeta(obj[key]);
    if (nested.nextPageToken || nested.totalCount) return nested;
  }
  return { nextPageToken: "", totalCount: 0 };
}

export interface DesignListResult {
  items: Design[];
  nextPageToken: string;
  totalCount: number;
}

export function useDesignList(params: DesignFilter = {}) {
  return useQuery<DesignListResult, AxiosError<ApiResponseError>>({
    queryKey: designKeys.list(params),
    queryFn: async () => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "" && value !== "all")
          query[key] = String(value);
      }
      const res = await axios.get(BASE_URL, { params: query });
      const items = extractList(res.data);
      const meta = extractListMeta(res.data);
      return { items, nextPageToken: meta.nextPageToken, totalCount: meta.totalCount || items.length };
    },
    meta: { errorMessage: "Failed to load designs" },
  });
}

export function useDesign(id?: string) {
  return useQuery<Design | null, AxiosError<ApiResponseError>>({
    queryKey: designKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`${BASE_URL}/${id}`);
      const data = res.data as Record<string, unknown>;
      const raw =
        data?.data ?? data?.design ?? data?.result ?? data?.payload ?? data;
      if (!raw || typeof raw !== "object") return null;
      return normalizeDesign(raw);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load design" },
  });
}

export function useDesignVersions(id?: string, enabled = true) {
  return useQuery<DesignRevision[], AxiosError<ApiResponseError>>({
    queryKey: designKeys.versions(id ?? ""),
    queryFn: async () => {
      if (!id) return [];
      const res = await axios.get(`${BASE_URL}/${id}/versions`);
      return extractRevisions(res.data);
    },
    enabled: Boolean(id) && enabled,
    meta: { errorMessage: "Failed to load revision history" },
  });
}

export async function getDesignVersionDownloadUrl(versionId: string) {
  const res = await axios.get(`${BASE_URL}/versions/${versionId}/download-url`);
  const payload = res.data as Record<string, unknown>;
  const nested = (payload.data ?? payload.result ?? payload.payload ?? {}) as Record<
    string,
    unknown
  >;
  const url =
    payload.download_url ?? payload.url ?? nested.download_url ?? nested.url;

  if (typeof url !== "string" || !url) {
    throw new Error("Download URL was not returned");
  }
  return url;
}

export function useDesignComments(versionId?: string) {
  return useQuery<DesignComment[], AxiosError<ApiResponseError>>({
    queryKey: designKeys.comments(versionId ?? ""),
    queryFn: async () => {
      if (!versionId) return [];
      const res = await axios.get(COMMENTS_URL, {
        params: { design_version_id: versionId },
      });
      return extractComments(res.data);
    },
    enabled: Boolean(versionId),
    meta: { errorMessage: "Failed to load comments" },
  });
}

export function useUploadDesign() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, DesignUploadDto>({
    mutationFn: async (payload) => {
      const formData = new FormData();
      formData.append("name", payload.name);
      if (payload.description) formData.append("description", payload.description);
      formData.append("project_id", payload.project_id);
      formData.append("file", payload.file);
      if (payload.thumbnail) formData.append("thumbnail", payload.thumbnail);
      (payload.team_member_ids ?? []).forEach((id) => {
        formData.append("team_member_ids[]", id);
      });
      return (
        await axios.post(LEGACY_UPLOAD_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to upload design",
      successMessage: "Design uploaded successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designKeys.all });
    },
  });
}

export function useCreateDesign() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, DesignCreateDto>({
    mutationFn: async ({ file, ...payload }) => {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      formData.append("file", file);
      return (
        await axios.post(BASE_URL, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to create project design",
      successMessage: "Project design created",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designKeys.all });
    },
  });
}

export function useUpdateDesign() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: Partial<DesignUploadDto> }
  >({
    mutationFn: async ({ id, payload }) => {
      if (!payload.file) {
        return (await axios.put(`${BASE_URL}/${id}`, payload)).data;
      }
      const formData = new FormData();
      if (payload.name !== undefined) formData.append("name", payload.name);
      if (payload.description !== undefined)
        formData.append("description", payload.description);
      if (payload.project_id !== undefined)
        formData.append("project_id", payload.project_id);
      if (payload.thumbnail) formData.append("thumbnail", payload.thumbnail);
      formData.append("file", payload.file);
      (payload.team_member_ids ?? []).forEach((memberId) => {
        formData.append("team_member_ids[]", memberId);
      });
      return (
        await axios.put(`${BASE_URL}/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to update design",
      successMessage: "Design updated successfully",
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.all });
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });
    },
  });
}

export function useSaveDesignRevision() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { designId: string; versionId: string; file: File }
  >({
    mutationFn: async ({ versionId, file }) => {
      const formData = new FormData();
      formData.append(
        "payload",
        JSON.stringify({ status: "in_review", is_active: true })
      );
      formData.append("file", file);
      return (
        await axios.put(`${BASE_URL}/versions/${versionId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    meta: {
      errorMessage: "Failed to save revision for review",
      successMessage: "Revision saved for review",
    },
    onSuccess: (_data, { designId }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.detail(designId) });
      queryClient.invalidateQueries({ queryKey: designKeys.versions(designId) });
    },
  });
}

export function useDeleteDesign() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${BASE_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete design",
      successMessage: "Design deleted successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designKeys.all });
    },
  });
}

export function useRecordDesignDecision() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { designId: string; versionId: string; payload: DesignDecisionDto }
  >({
    mutationFn: async ({ versionId, payload }) =>
      (await axios.post(`${BASE_URL}/versions/${versionId}/approval`, payload)).data,
    meta: {
      errorMessage: "Failed to record design decision",
      successMessage: "Design decision recorded",
    },
    onSuccess: (_data, { designId }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.all });
      queryClient.invalidateQueries({ queryKey: designKeys.detail(designId) });
    },
  });
}

export function useAddDesignComment() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { designId: string; versionId: string; payload: DesignCommentDto }
  >({
    mutationFn: async ({ versionId, payload }) =>
      (await axios.post(COMMENTS_URL, {
        comment: payload.text,
        design_version_id: versionId,
        commenter_role: payload.commenter_role,
      })).data,
    meta: {
      errorMessage: "Failed to post comment",
      successMessage: "Comment posted",
    },
    onSuccess: (_data, { designId, versionId }) => {
      queryClient.invalidateQueries({ queryKey: designKeys.comments(versionId) });
      queryClient.invalidateQueries({ queryKey: designKeys.detail(designId) });
    },
  });
}

export function useSendDesignForReview() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) =>
      (await axios.post(`${BASE_URL}/${id}/send-for-review`)).data,
    meta: {
      errorMessage: "Failed to send for review",
      successMessage: "Sent for review",
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: designKeys.all });
      queryClient.invalidateQueries({ queryKey: designKeys.detail(id) });
    },
  });
}
