"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { useTemplateGenerateStore } from "@/stores/template-generate-store";
import type { ApiResponseError } from "@/types/api";
import type {
  AssetTemplatePayload,
  AssetTemplateUpdatePayload,
  InspectionTemplateItem,
  ItemControlPoint,
  QualityTemplatePayload,
  QualityTemplateUpdatePayload,
  TemplateListParams,
  TemplateListResponse,
  TemplateStatus,
  TemplateDetail,
  TemplateDetailSection,
  TemplateDetailItem,
  TemplateDetailProduct,
  TemplateDetailReference,
  TemplateVersionHistoryEntry,
} from "./types";
import { STATUS_MAP } from "./types";

const axios = axiosConfig(env.apiBaseUrl);

const TEMPLATES_URL = "/v1/manufacturing/inspection/templates";

const templateKeys = {
  all: ["inspection-templates"] as const,
  list: (params: TemplateListParams) =>
    ["inspection-templates", "list", params] as const,
};

function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "items", "templates", "rows", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeStatus(value: unknown): TemplateStatus | undefined {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (!Number.isNaN(num) && STATUS_MAP[num]) return STATUS_MAP[num];
  const normalized = String(value).toLowerCase();
  if (normalized.includes("draft")) return "Draft";
  if (normalized.includes("published") || normalized.includes("publish"))
    return "Published";
  if (normalized.includes("archived") || normalized.includes("archive"))
    return "Archived";
  return undefined;
}

function normalizeTemplate(raw: unknown, index: number): InspectionTemplateItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const tpl = (row.inspection_template ?? {}) as Record<string, unknown>;
  const equipment = (row.equipment_data ?? null) as Record<string, unknown> | null;
  const productsRaw = row.product_data;

  const products = Array.isArray(productsRaw)
    ? productsRaw.map((p) => {
      const product = (p && typeof p === "object" ? p : {}) as Record<
        string,
        unknown
      >;
      return String(
        product.part_name ?? product.name ?? product.part_number ?? product.id ?? "",
      );
    })
    : undefined;

  const tplId = String(tpl.id ?? "");
  const hasTemplate = tplId !== "";

  return {
    id: hasTemplate ? tplId : String(equipment?.id ?? index),
    familyId: hasTemplate ? String(tpl.family_id ?? "") : undefined,
    code: String(equipment?.code ?? ""),
    name: equipment
      ? String(equipment.name ?? "Untitled")
      : String(tpl.name ?? "Untitled template"),
    templateName: hasTemplate ? String(tpl.name ?? "") : undefined,
    machine: equipment ? String(equipment.name ?? "") : undefined,
    frequency: tpl.frequency ? String(tpl.frequency) : undefined,
    version: tpl.version != null && Number(tpl.version) > 0
      ? `Rev ${tpl.version}`
      : undefined,
    status: normalizeStatus(tpl.status),
    products,
    revision: tpl.version != null && Number(tpl.version) > 0
      ? `Rev ${tpl.version}`
      : undefined,
    category: undefined,
  };
}

export function useTemplateList(params: TemplateListParams = {}) {
  return useQuery<TemplateListResponse, AxiosError<ApiResponseError>>({
    queryKey: templateKeys.list(params),
    queryFn: async () => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "")
          query[key] = String(value);
      }
      const res = await axios.get(TEMPLATES_URL, { params: query });
      const items = findList(res.data).map(normalizeTemplate);
      const data = res.data as Record<string, unknown> | undefined;
      return {
        items,
        next_page_token: String(data?.next_page_token ?? data?.nextPageToken ?? ""),
        total_count: Number(data?.total_count ?? data?.totalCount ?? items.length),
      };
    },
    meta: { errorMessage: "Failed to load inspection templates" },
  });
}

export { templateKeys };

const ASSET_TEMPLATES_URL = "/v1/manufacturing/inspection/templates/assets";
const QUALITY_TEMPLATES_URL = "/v1/manufacturing/inspection/templates/quality";

export function useCreateAssetTemplate() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, AssetTemplatePayload>({
    mutationFn: async (payload) =>
      (await axios.post(ASSET_TEMPLATES_URL, payload)).data,
    meta: {
      errorMessage: "Failed to create asset template",
      successMessage: "Asset template created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useCreateQualityTemplate() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, QualityTemplatePayload>({
    mutationFn: async (payload) =>
      (await axios.post(QUALITY_TEMPLATES_URL, payload)).data,
    meta: {
      errorMessage: "Failed to create quality template",
      successMessage: "Quality template created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export interface GenerateTemplatePayload {
  type: "asset" | "quality";
  assetData: string[];
  files: File[];
}

export function useGenerateTemplate() {
  const queryClient = useQueryClient();
  const generateStore = useTemplateGenerateStore();
  return useMutation<unknown, AxiosError<ApiResponseError>, GenerateTemplatePayload>({
    mutationFn: async (payload) => {
      const formData = new FormData();
      formData.append("type", payload.type);
      payload.assetData.forEach((id) => formData.append("asset_data", id));
      payload.files.forEach((file) => formData.append("files", file));
      const res = await axios.post(`${TEMPLATES_URL}/generate`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0,
      });
      return res.data;
    },
    onMutate: (variables) => {
      generateStore.start(variables.type);
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiResponseError>;
      const message = axiosError?.response?.data?.message;
      const text = Array.isArray(message) ? message[0] : message;
      generateStore.fail(text ?? "Failed to generate template");
    },
    onSuccess: () => {
      generateStore.succeed();
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
}

export function useUpdateAssetTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { templateId: string; payload: AssetTemplateUpdatePayload }
  >({
    mutationFn: async ({ templateId, payload }) =>
      (await axios.put(`${ASSET_TEMPLATES_URL}/${templateId}`, payload)).data,
    meta: {
      errorMessage: "Failed to update asset template",
      successMessage: "Asset template updated successfully",
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["inspection-templates", "detail"],
      });
    },
  });
}

export function useUpdateQualityTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { templateId: string; payload: QualityTemplateUpdatePayload }
  >({
    mutationFn: async ({ templateId, payload }) =>
      (await axios.put(`${QUALITY_TEMPLATES_URL}/${templateId}`, payload)).data,
    meta: {
      errorMessage: "Failed to update quality template",
      successMessage: "Quality template updated successfully",
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["inspection-templates", "detail"],
      });
    },
  });
}

function normalizeDetailItem(raw: unknown): TemplateDetailItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawControlPoints = Array.isArray(row.control_points) ? row.control_points : [];
  const cp = (rawControlPoints[0] && typeof rawControlPoints[0] === "object" ? rawControlPoints[0] : {}) as Record<string, unknown>;
  const cpType = String(cp.type ?? "");
  const sortOrder = normalizeSortOrder(row.sort_order ?? row.sortOrder);
  const controlPoints: ItemControlPoint[] = rawControlPoints
    .map((entry) => {
      const point = (entry && typeof entry === "object" ? entry : {}) as Record<
        string,
        unknown
      >;
      const cpId = String(point.control_point_id ?? "");
      if (!cpId) return null;
      return {
        control_point_id: cpId,
        label: String(point.label ?? ""),
        color: String(point.color ?? "#1E2FE9"),
        ...(point.value ? { value: String(point.value) } : {}),
      };
    })
    .filter((p): p is ItemControlPoint => p !== null);
  return {
    id: String(row.id ?? ""),
    label: String(row.description ?? ""),
    type: cpType || String(row.type ?? "") || "pass_fail",
    minValue: String(row.min_value ?? ""),
    maxValue: String(row.max_value ?? ""),
    controlPoints,
    ...(sortOrder !== undefined ? { sortOrder } : {}),
  };
}

function normalizeSortOrder(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const sortOrder = Number(value);
  return Number.isFinite(sortOrder) ? sortOrder : undefined;
}

function sortBySortOrder<T extends { sortOrder?: number }>(items: T[]): T[] {
  if (!items.some((item) => item.sortOrder !== undefined)) return items;

  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        (a.item.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.item.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.index - b.index
    )
    .map(({ item }) => item);
}

function normalizeDetailSection(raw: unknown): TemplateDetailSection {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(row.items)
    ? sortBySortOrder(row.items.map(normalizeDetailItem))
    : [];
  const sortOrder = normalizeSortOrder(row.sort_order ?? row.sortOrder);
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    items,
    ...(sortOrder !== undefined ? { sortOrder } : {}),
  };
}

function normalizeDetailProduct(raw: unknown): TemplateDetailProduct {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    productId: String(row.product_id ?? row.id ?? ""),
    partName: String(row.part_name ?? ""),
    partNumber: String(row.part_number ?? ""),
  };
}

function normalizeDetailReference(raw: unknown): TemplateDetailReference {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const uploadedAt = row.uploaded_at as Record<string, unknown> | undefined;
  const seconds = uploadedAt?.seconds;
  return {
    id: String(row.id ?? ""),
    url: String(row.url ?? ""),
    storageKey: String(row.storage_key ?? ""),
    uploadedAt: seconds ? new Date(Number(seconds) * 1000).toISOString() : "",
  };
}

export async function fetchTemplateReferences(
  templateId: string,
): Promise<TemplateDetailReference[]> {
  const res = await axios.get(`${TEMPLATES_URL}/${templateId}/reference`);
  const data = res.data?.data ?? res.data;
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.references)
      ? ((data as Record<string, unknown>).references as unknown[])
      : [];
  return rows.map(normalizeDetailReference);
}

export function useTemplateReferences(templateId: string | undefined) {
  return useQuery<TemplateDetailReference[], AxiosError<ApiResponseError>>({
    queryKey: ["inspection-templates", "references", templateId],
    queryFn: () => fetchTemplateReferences(templateId as string),
    enabled: Boolean(templateId),
    meta: { errorMessage: "Failed to load reference files" },
  });
}

function normalizeTemplateDetail(raw: unknown): TemplateDetail {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const tpl = (data.inspection_template ?? {}) as Record<string, unknown>;
  const equipment = (data.equipment_data ?? {}) as Record<string, unknown>;
  const sectionsRaw = Array.isArray(data.inspection_template_sections)
    ? data.inspection_template_sections
    : [];
  const productsRaw = Array.isArray(data.product_data) ? data.product_data : [];
  const versionList = Array.isArray(data.version_list)
    ? data.version_list.map((v) => Number(v))
    : [];
  const hasEquipmentUsage = [
    "current_usage",
    "frequency_type_id",
    "last_usage",
    "last_usage_date",
    "threshold",
  ].some((key) => key in equipment);

  return {
    templateId: String(tpl.id ?? ""),
    familyId: String(tpl.family_id ?? ""),
    name: String(tpl.name ?? ""),
    status: String(tpl.status ?? ""),
    frequency: String(tpl.frequency ?? ""),
    customDays: Number(tpl.custom_days ?? 0),
    isUsageTracking: tpl.is_usage_tracking === true,
    equipmentId: String(tpl.equipment_id ?? equipment.id ?? ""),
    equipmentName: String(equipment.name ?? ""),
    equipmentCode: String(equipment.code ?? ""),
    equipmentUsage: hasEquipmentUsage
      ? {
        currentUsage: String(equipment.current_usage ?? ""),
        frequencyTypeId: String(equipment.frequency_type_id ?? ""),
        lastUsage: String(equipment.last_usage ?? ""),
        lastUsageDate: String(equipment.last_usage_date ?? ""),
        threshold: Number(equipment.threshold ?? 0) || 0,
      }
      : undefined,
    sections: sortBySortOrder(sectionsRaw.map(normalizeDetailSection)),
    products: productsRaw.map(normalizeDetailProduct),
    references: [],
    versionList,
    version: Number(tpl.version ?? 0),
    createdBy: String(tpl.created_by ?? ""),
    updatedBy: String(tpl.updated_by ?? ""),
    createdAt: String(tpl.created_at ?? ""),
    publishedAt: String(tpl.published_at ?? ""),
  };
}

export function useTemplateDetail(
  familyId: string | undefined,
  templateId: string | undefined,
  category: "asset" | "quality",
  version?: number,
) {
  const detailUrl = category === "asset" ? ASSET_TEMPLATES_URL : QUALITY_TEMPLATES_URL;
  return useQuery<TemplateDetail, AxiosError<ApiResponseError>>({
    queryKey: ["inspection-templates", "detail", familyId, templateId, category, version],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (version !== undefined) params.version = String(version);
      const res = await axios.get(`${detailUrl}/${familyId}`, { params });
      const detail = normalizeTemplateDetail(res.data?.data ?? res.data);

      // Each revision has its own template ID, even within the same family.
      detail.references = await fetchTemplateReferences(detail.templateId);
      return detail;
    },
    enabled: Boolean(familyId) && Boolean(templateId),
    meta: { errorMessage: "Failed to load template detail" },
  });
}

async function fetchTemplateVersionMeta(
  detailUrl: string,
  familyId: string,
  version: number,
): Promise<TemplateVersionHistoryEntry> {
  const res = await axios.get(`${detailUrl}/${familyId}`, {
    params: { version: String(version) },
  });
  const data = (res.data?.data ?? res.data) as Record<string, unknown>;
  const tpl = (data.inspection_template ?? {}) as Record<string, unknown>;
  return {
    version: Number(tpl.version ?? version),
    status: normalizeStatus(tpl.status),
    createdBy: String(tpl.created_by ?? ""),
    updatedBy: String(tpl.updated_by ?? ""),
    createdAt: String(tpl.created_at ?? ""),
    publishedAt: String(tpl.published_at ?? ""),
  };
}

export function useTemplateVersionHistory(
  familyId: string | undefined,
  category: "asset" | "quality",
  versionList: number[],
) {
  const detailUrl = category === "asset" ? ASSET_TEMPLATES_URL : QUALITY_TEMPLATES_URL;
  return useQuery<TemplateVersionHistoryEntry[], AxiosError<ApiResponseError>>({
    queryKey: ["inspection-templates", "version-history", familyId, category, versionList],
    queryFn: async () => {
      const versions = await Promise.all(
        versionList.map((version) =>
          fetchTemplateVersionMeta(detailUrl, familyId as string, version),
        ),
      );
      return versions.sort((a, b) => b.version - a.version);
    },
    enabled: Boolean(familyId) && versionList.length > 0,
    meta: { errorMessage: "Failed to load version history" },
  });
}

export interface ReferenceUploadUrlResponse {
  upload_url: string;
  storage_key: string;
}

export async function getReferenceUploadUrl(
  templateId: string,
  payload: { file_name: string },
): Promise<ReferenceUploadUrlResponse> {
  const res = await axios.post(
    `${TEMPLATES_URL}/${templateId}/reference/upload-url`,
    { file_name: payload.file_name },
  );
  const data = (res.data?.data ?? res.data) as ReferenceUploadUrlResponse;
  if (!data?.upload_url || !data?.storage_key) {
    throw new Error("Invalid upload URL response");
  }
  return data;
}

export async function uploadReferenceToS3(
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

export async function registerReference(
  templateId: string,
  payload: { storage_key: string; uploaded_by: string },
): Promise<void> {
  await axios.post(`${TEMPLATES_URL}/${templateId}/reference`, payload);
}

export function useDeleteTemplateReference() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { templateId: string; referenceId: string }
  >({
    mutationFn: async ({ templateId, referenceId }) =>
      (
        await axios.delete(
          `${TEMPLATES_URL}/${templateId}/reference/${referenceId}`,
        )
      ).data,
    onSuccess: (_data, { templateId }) => {
      queryClient.invalidateQueries({
        queryKey: ["inspection-templates", "references", templateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inspection-templates", "detail"],
      });
    },
    meta: {
      errorMessage: "Failed to delete reference file",
      successMessage: "Reference file deleted successfully",
    },
  });
}

export type AttachmentUploadStatus =
  | "idle"
  | "getting-upload-url"
  | "uploading-s3"
  | "registering"
  | "success"
  | "error";

export interface AttachmentUploadState {
  status: AttachmentUploadStatus;
  error?: string;
  storageKey?: string;
}
