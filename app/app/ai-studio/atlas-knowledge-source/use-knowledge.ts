import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { FolderOrderPayload } from "./types";
import type { KnowledgeFolder, KnowledgeUpload, KnowledgeUploadStatus } from "./types";

const FOLDERS_URL = "/workflow/knowledge/folders";
const UPLOADS_URL = "/workflow/knowledge/uploads";
const axios = axiosConfig(env.apiBaseUrl);

function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["data", "items", "results", "uploads", "folders"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

export function extractFolders(payload: unknown): KnowledgeFolder[] {
  return findList(payload).map((raw, index) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      id: String(item.id ?? item.folder_id ?? index),
      title: String(item.title ?? item.name ?? "Untitled folder"),
      count_file: Number(item.upload_count ?? item.files_count ?? item.count_file ?? 0),
    };
  });
}

export function extractUploads(payload: unknown): KnowledgeUpload[] {
  return findList(payload).map((raw, index) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const fileName = String(
      item.display_name ??
      item.file_name ??
      item.filename ??
      item.name ??
      "Untitled file",
    );
    const rawStatus = String(item.status ?? "failed").toLowerCase();
    const status: KnowledgeUploadStatus =
      rawStatus === "uploaded" ||
        rawStatus === "chunking" ||
        rawStatus === "ready" ||
        rawStatus === "failed"
        ? rawStatus
        : "failed";
    return {
      id: String(item.id ?? item.upload_id ?? index),
      name: fileName,
      type: String(item.file_type ?? String(item.mime_type ?? "").split("/").pop() ?? fileName.split(".").pop() ?? "FILE").toUpperCase(),
      size: Number(item.file_size_bytes ?? item.file_size ?? item.size ?? 0),
      status,
      uploadedAt: String(item.uploaded_at ?? item.created_at ?? item.updated_at ?? ""),
      isContentExtractionKnowledge: item.is_content_extraction_knowledge === true,
      isContentExtractionTable: item.is_content_extraction_table === true,
    };
  });
}

export function unwrapResponse(payload: unknown): Record<string, unknown> {
  let current = payload;
  for (let depth = 0; depth < 2; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    if (!object.data || typeof object.data !== "object") break;
    current = object.data;
  }
  return (current && typeof current === "object" ? current : {}) as Record<string, unknown>;
}

export function formatFileSize(bytes: number) {
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(bytes >= 10_485_760 ? 0 : 1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const knowledgeApi = {
  getFolders: async () => (await axios.get(FOLDERS_URL)).data,
  createFolder: async (title: string) => (await axios.post(FOLDERS_URL, { title })).data,
  renameFolder: async (id: string, title: string) => (await axios.put(`${FOLDERS_URL}/${id}`, { title })).data,
  deleteFolder: async (id: string) => (await axios.delete(`${FOLDERS_URL}/${id}`)).data,
  reorderFolders: async (payload: FolderOrderPayload) => (await axios.put(`${FOLDERS_URL}/order`, payload)).data,
  getUploads: async (params: Record<string, string>) => (await axios.get(UPLOADS_URL, { params })).data,
  uploadFile: async (folderId: string, file: File, onProgress: (progress: number) => void) => {
    const form = new FormData();
    form.append("folder_id", folderId);
    form.append("files", file);
    return (await axios.post(UPLOADS_URL, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    })).data;
  },
  deleteUpload: async (id: string) => (await axios.delete(`${UPLOADS_URL}/${id}`)).data,
  getDownloadUrl: async (id: string) => (await axios.get(`${UPLOADS_URL}/${id}/download-url`)).data,
};

export function useKnowledgeApi() {
  return knowledgeApi;
}
