"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const NON_CONFORMANCE_URL = "/v1/manufacturing/inspection/non-conformance";

export interface NonConformanceDetailInspection {
  id: string;
  name: string;
  status: string;
  createdBy: string;
  createdAt: string;
  startedAt: string;
  submittedAt: string;
  equipmentId: string;
  productId: string;
}

export interface NonConformanceDetailItem {
  id: string;
  itemId: string;
  inspectionId: string;
  result: string;
  notes: string;
  numberValue: number;
  witnessed: boolean;
  witnessedBy: string;
  holdApproved: boolean;
  holdApprovedBy: string;
  createdBy: string;
}

export interface NonConformanceDetailRecord {
  id: string;
  inspectionId: string;
  itemId: string;
  itemName: string;
  notes: string;
  raisedBy: string;
  raisedByRole: string;
  raisedDate: string;
}

export interface NonConformanceDetail {
  nonConformance: NonConformanceDetailRecord;
  inspection: NonConformanceDetailInspection;
  inspectionItem: NonConformanceDetailItem;
  inspectionItemFiles: string[];
  nonConformanceFiles: string[];
}

function normalizeFileName(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    return String(
      row.file_name ?? row.name ?? row.filename ?? row.storage_key ?? row.id ?? "",
    );
  }
  return "";
}

function normalizeInspection(raw: unknown): NonConformanceDetailInspection {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    status: String(row.status ?? ""),
    createdBy: String(row.created_by ?? ""),
    createdAt: String(row.created_at ?? ""),
    startedAt: String(row.started_at ?? ""),
    submittedAt: String(row.submitted_at ?? ""),
    equipmentId: String(row.equipment_id ?? ""),
    productId: String(row.product_id ?? ""),
  };
}

function normalizeInspectionItem(raw: unknown): NonConformanceDetailItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    itemId: String(row.item_id ?? ""),
    inspectionId: String(row.inspection_id ?? ""),
    result: String(row.result ?? ""),
    notes: String(row.notes ?? ""),
    numberValue: Number(row.number_value ?? 0) || 0,
    witnessed: Boolean(row.witnessed ?? false),
    witnessedBy: String(row.witnessed_by ?? ""),
    holdApproved: Boolean(row.hold_approved ?? false),
    holdApprovedBy: String(row.hold_approved_by ?? ""),
    createdBy: String(row.created_by ?? ""),
  };
}

function normalizeNonConformance(
  raw: unknown,
): NonConformanceDetailRecord {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    inspectionId: String(row.inspection_id ?? ""),
    itemId: String(row.item_id ?? ""),
    itemName: String(row.item_name ?? ""),
    notes: String(row.notes ?? ""),
    raisedBy: String(row.raised_by ?? ""),
    raisedByRole: String(row.raised_by_role ?? ""),
    raisedDate: String(row.raised_date ?? ""),
  };
}

function normalizeDetail(raw: unknown): NonConformanceDetail {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const inspectionItemFiles = Array.isArray(data.inspection_item_files)
    ? (data.inspection_item_files as unknown[]).map(normalizeFileName).filter(Boolean)
    : [];
  const nonConformanceFiles = Array.isArray(data.non_conformance_files)
    ? (data.non_conformance_files as unknown[]).map(normalizeFileName).filter(Boolean)
    : [];
  return {
    nonConformance: normalizeNonConformance(data.non_conformance),
    inspection: normalizeInspection(data.inspection),
    inspectionItem: normalizeInspectionItem(data.inspection_item),
    inspectionItemFiles,
    nonConformanceFiles,
  };
}

export function useNonConformanceDetail(id: string | null | undefined) {
  return useQuery<NonConformanceDetail, AxiosError<ApiResponseError>>({
    queryKey: ["non-conformance-detail", id],
    queryFn: async () => {
      const res = await axios.get(`${NON_CONFORMANCE_URL}/${id}`);
      return normalizeDetail(res.data?.data ?? res.data);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load non-conformance detail" },
  });
}

export interface UpdateNonConformancePayload {
  id: string;
  resolution_note: string;
}

export function useUpdateNonConformance(id: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    UpdateNonConformancePayload
  >({
    mutationFn: async (payload) =>
      (await axios.put(`${NON_CONFORMANCE_URL}/${id}`, payload)).data,
    meta: {
      errorMessage: "Failed to update non-conformance",
      successMessage: "Non-conformance updated successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["non-conformances"] });
      queryClient.invalidateQueries({ queryKey: ["non-conformance-detail", id] });
    },
  });
}

/* ---------- File management ---------- */

export interface NonConformanceFile {
  id: string;
  storage_key: string;
  file_name: string;
  url?: string;
  uploaded_by: string;
  uploaded_at: string;
}

function normalizeFile(raw: unknown): NonConformanceFile {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    storage_key: String(row.storage_key ?? ""),
    file_name: String(row.file_name ?? row.name ?? row.filename ?? ""),
    url: row.url ? String(row.url) : undefined,
    uploaded_by: String(row.uploaded_by ?? ""),
    uploaded_at: String(row.uploaded_at ?? row.created_at ?? ""),
  };
}

const fileQueryKey = (id: string) => ["non-conformance-files", id] as const;

export function useNonConformanceFiles(id: string | null | undefined) {
  return useQuery<NonConformanceFile[], AxiosError<ApiResponseError>>({
    queryKey: fileQueryKey(id ?? ""),
    queryFn: async () => {
      const res = await axios.get(`${NON_CONFORMANCE_URL}/${id}/files`);
      const data = res.data?.data ?? res.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>)?.files)
          ? ((data as Record<string, unknown>).files as unknown[])
          : [];
      return items.map(normalizeFile);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load files" },
  });
}

export interface NonConformanceUploadUrlResponse {
  upload_url: string;
  storage_key: string;
}

export async function getNonConformanceUploadUrl(
  id: string,
  payload: { file_name: string },
): Promise<NonConformanceUploadUrlResponse> {
  const res = await axios.post(
    `${NON_CONFORMANCE_URL}/${id}/upload-url`,
    payload,
  );
  const data = (res.data?.data ?? res.data) as NonConformanceUploadUrlResponse;
  if (!data?.upload_url || !data?.storage_key) {
    throw new Error("Invalid upload URL response");
  }
  return data;
}

export async function uploadNonConformanceFileToS3(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append("uploadUrl", uploadUrl);
  formData.append("contentType", file.type || "application/octet-stream");
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) {
    const { error } = (await res.json()) as { error?: string };
    throw new Error(error ?? `Upload proxy failed: ${res.status}`);
  }
}

export async function registerNonConformanceFile(
  id: string,
  payload: { storage_key: string; uploaded_by: string },
): Promise<void> {
  await axios.post(`${NON_CONFORMANCE_URL}/${id}/files`, payload);
}

export function useDeleteNonConformanceFile(id: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { fileId: string }
  >({
    mutationFn: async ({ fileId }) =>
      (await axios.delete(`${NON_CONFORMANCE_URL}/${id}/files/${fileId}`)).data,
    meta: {
      errorMessage: "Failed to delete file",
      successMessage: "File deleted successfully",
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: fileQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: ["non-conformance-detail", id] });
      }
    },
  });
}

export type FileUploadStatus =
  | "idle"
  | "getting-upload-url"
  | "uploading-s3"
  | "registering"
  | "success"
  | "error";

export interface FileUploadState {
  status: FileUploadStatus;
  error?: string;
  fileName: string;
}
