"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

const ASSETS_URL = "/v1/manufacturing/inspection/assets";
const QUALITY_URL = "/v1/manufacturing/inspection/quality";
const INSPECTION_URL = "/v1/manufacturing/inspection";
const EQUIPMENT_URL = "/v1/construction/equipment";
const FREQUENCY_TYPE_URL = "/v1/construction/frequency-type";

export interface InspectionUsageSource {
  currentUsage: string;
  frequencyTypeId: string;
  lastUsage: string;
  lastUsageDate: string;
  threshold: number;
}

export interface InspectionUsageTracking {
  canUpdate: boolean;
  currentUsage: string;
  equipmentStatus: string;
  isDateBased: boolean;
  previousUsage: string;
  previousUsageRecordedAt: string;
  threshold: number;
  unitName: string;
}

export const EMPTY_INSPECTION_USAGE_TRACKING: InspectionUsageTracking = {
  canUpdate: false,
  currentUsage: "",
  equipmentStatus: "",
  isDateBased: false,
  previousUsage: "",
  previousUsageRecordedAt: "",
  threshold: 0,
  unitName: "",
};

function unwrapObject(payload: unknown): Record<string, unknown> {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return {};
    const row = current as Record<string, unknown>;
    const nested = row.data ?? row.result ?? row.item;
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) return row;
    current = nested;
  }
  return current as Record<string, unknown>;
}

export function useInspectionUsageTracking(
  equipmentId: string | null | undefined,
  enabled = true,
  source?: InspectionUsageSource,
) {
  return useQuery<InspectionUsageTracking, AxiosError<ApiResponseError>>({
    queryKey: ["inspection-usage-tracking", equipmentId, source],
    enabled: enabled && Boolean(equipmentId),
    queryFn: async () => {
      const equipment = unwrapObject(
        (await axios.get(`${EQUIPMENT_URL}/${encodeURIComponent(equipmentId ?? "")}`)).data,
      );
      const frequencyTypeId =
        source?.frequencyTypeId || String(equipment.frequency_type_id ?? "");
      const frequency = frequencyTypeId
        ? unwrapObject(
          (await axios.get(`${FREQUENCY_TYPE_URL}/${encodeURIComponent(frequencyTypeId)}`)).data,
        )
        : {};
      const isDateBased = Boolean(source?.lastUsageDate.trim());
      const rawCurrentUsage = source?.currentUsage ?? String(equipment.current_usage ?? "");
      const currentUsage = isDateBased
        ? rawCurrentUsage.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? ""
        : rawCurrentUsage;
      const equipmentStatus = String(equipment.status ?? "");

      return {
        canUpdate: equipmentStatus.toLowerCase() === "active",
        currentUsage,
        equipmentStatus,
        isDateBased,
        previousUsage: source?.lastUsage ?? String(equipment.last_usage ?? equipment.current_usage ?? ""),
        previousUsageRecordedAt:
          source?.lastUsageDate ??
          String(equipment.last_usage_date ?? equipment.current_usage_recorded_at ?? ""),
        threshold:
          source?.threshold ??
          (Number(equipment.threshold ?? equipment.service_interval ?? 0) || 0),
        unitName: String(
          frequency.unit_name ?? equipment.current_usage_unit ?? (isDateBased ? "Days" : ""),
        ),
      };
    },
    meta: { errorMessage: "Failed to load asset usage tracking" },
  });
}

export interface InspectionItemResult {
  template_item_id: string;
  is_pass: boolean;
  notes: string;
  number_value: number;
  file_names: string[];
}

export interface SubmitInspectionPayload {
  created_by: string;
  current_usage?: string;
  is_draft: boolean;
  items: InspectionItemResult[];
  template_id: string;
  product_id?: string;
  filesByItem?: Record<string, File[]>;
}

export interface AvailableProduct {
  id: string;
  label: string;
}

export interface AvailableInspectionItem {
  id: string;
  familyId: string;
  name: string;
  templateName: string;
  code: string;
  status: string;
  isAvailable: boolean;
  version: number;
  revision: string;
  products: AvailableProduct[];
}

export interface AvailableInspectionResponse {
  items: AvailableInspectionItem[];
  nextPageToken: string;
  totalCount: number;
}

function normalizeItem(
  raw: unknown,
  index: number,
): AvailableInspectionItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const tpl = (row.inspection_template ?? {}) as Record<string, unknown>;
  const equipment = (row.equipment_data ?? null) as Record<
    string,
    unknown
  > | null;
  const productsRaw = row.product_data;

  const products: AvailableProduct[] = Array.isArray(productsRaw)
    ? productsRaw.map((p) => {
      const product = (p && typeof p === "object" ? p : {}) as Record<
        string,
        unknown
      >;
      return {
        id: String(product.id ?? ""),
        label: String(
          product.part_name ??
          product.name ??
          product.part_number ??
          product.id ??
          "",
        ),
      };
    })
    : [];

  const version = Number(tpl.version ?? 0);
  const rawAvailability = tpl.is_available ?? row.is_available;
  const isAvailable =
    rawAvailability === true ||
    rawAvailability === 1 ||
    String(rawAvailability).toLowerCase() === "true";

  return {
    id: String(tpl.id ?? equipment?.id ?? index),
    familyId: String(tpl.family_id ?? ""),
    name: equipment
      ? String(equipment.name ?? "Untitled")
      : String(tpl.name ?? "Untitled template"),
    templateName: String(tpl.name ?? ""),
    code: String(equipment?.code ?? ""),
    status: String(tpl.status ?? ""),
    isAvailable,
    version,
    revision: version > 0 ? `Rev ${version}` : "",
    products,
  };
}

export function useAvailableInspections(
  category: "asset" | "quality",
  params?: { page_size?: number; page_token?: string },
) {
  const url = category === "asset" ? ASSETS_URL : QUALITY_URL;
  return useQuery<
    AvailableInspectionResponse,
    AxiosError<ApiResponseError>
  >({
    queryKey: ["available-inspections", category, params],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (params?.page_size)
        query.page_size = String(params.page_size);
      if (params?.page_token) query.page_token = params.page_token;

      const res = await axios.get(url, { params: query });
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const items = rows.map((r, i) => normalizeItem(r, i));

      return {
        items,
        nextPageToken: String(data?.next_page_token ?? ""),
        totalCount: Number(data?.total_count ?? items.length),
      };
    },
    meta: { errorMessage: "Failed to load available inspections" },
  });
}

interface InspectionResponseUploadUrl {
  url: string;
  storage_key: string;
}

interface InspectionResponseItem {
  id: string;
  item_id: string;
  list_upload_url?: InspectionResponseUploadUrl[];
}

interface InspectionResponse {
  inspection?: Record<string, unknown>;
  items?: InspectionResponseItem[];
}

async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("uploadUrl", uploadUrl);
  formData.append("contentType", file.type || "application/octet-stream");
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "PUT", body: formData });
  if (!res.ok) {
    const { error } = (await res.json()) as { error?: string };
    throw new Error(error ?? `Upload proxy failed: ${res.status}`);
  }
}

async function registerItemAttachment(
  itemResultId: string,
  storageKey: string,
  uploadedBy: string,
): Promise<void> {
  await axios.post(`${INSPECTION_URL}/item/${itemResultId}/attachment`, {
    storage_key: storageKey,
    uploaded_by: uploadedBy,
  });
}

async function uploadInspectionAttachments(
  response: unknown,
  filesByItem: Record<string, File[]>,
  uploadedBy: string,
): Promise<void> {
  const data = (response && typeof response === "object"
    ? (response as { data?: unknown }).data ?? response
    : response) as InspectionResponse | undefined;
  const items = Array.isArray(data?.items) ? data.items : [];
  for (const item of items) {
    const files = filesByItem[item.item_id] ?? filesByItem[item.id] ?? [];
    const uploadUrls = Array.isArray(item.list_upload_url)
      ? item.list_upload_url
      : [];
    if (files.length === 0 || uploadUrls.length === 0) continue;
    for (let i = 0; i < files.length && i < uploadUrls.length; i++) {
      const { url, storage_key } = uploadUrls[i];
      await uploadFileToS3(url, files[i]);
      await registerItemAttachment(item.id, storage_key, uploadedBy);
    }
  }
}

export function useSubmitInspection(category: "asset" | "quality") {
  const queryClient = useQueryClient();
  const url = category === "asset" ? ASSETS_URL : QUALITY_URL;
  return useMutation<unknown, AxiosError<ApiResponseError>, SubmitInspectionPayload>({
    mutationFn: async (payload) => {
      const { filesByItem, ...rest } = payload;
      const res = await axios.post(url, rest);
      if (filesByItem) {
        await uploadInspectionAttachments(res.data, filesByItem, rest.created_by);
      }
      return res.data;
    },
    meta: {
      errorMessage: "Failed to submit inspection",
      successMessage: "Inspection submitted successfully",
    },
    onSuccess: () => {
      // The submit dialog navigates back to the run-inspection list. Invalidate
      // its cache as well as the start-new availability list.
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["available-inspections"] });
    },
  });
}

export interface InspectionDetailAttachment {
  id: string;
  url: string;
  storageKey: string;
  uploadedAt: string;
  name: string;
}

export interface InspectionDetailItem {
  id: string;
  itemId: string;
  result: string;
  notes: string;
  itemType: string;
  numberValue: number;
  itemMinValue: number;
  itemMaxValue: number;
  attachments: InspectionDetailAttachment[];
  witnessed: boolean;
  witnessedBy: string;
  holdApproved: boolean;
  holdApprovedBy: string;
  createdBy: string;
  label: string;
  section: string;
  expectedRange: string;
}

export interface InspectionDetail {
  id: string;
  name: string;
  category: "asset" | "quality";
  status: string;
  templateId: string;
  templateFamilyId: string;
  templateVersion: number;
  equipmentId: string;
  equipmentName: string;
  completedAt: string;
  currentUsage: string;
  inspector: string;
  isUsageTracking: boolean;
  templateName: string;
  items: InspectionDetailItem[];
}

function normalizeAttachment(raw: unknown): InspectionDetailAttachment | null {
  if (typeof raw === "string") {
    return {
      id: raw,
      url: raw,
      storageKey: raw,
      uploadedAt: "",
      name: raw.split("/").pop() ?? raw,
    };
  }
  if (raw && typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    const storageKey = String(row.storage_key ?? "");
    const url = String(row.url ?? row.presigned_url ?? "");
    if (!url && !storageKey) return null;
    return {
      id: String(row.id ?? storageKey ?? url),
      url,
      storageKey,
      uploadedAt: String(row.uploaded_at ?? ""),
      name: String(
        row.file_name ??
        row.name ??
        row.filename ??
        (storageKey ? storageKey.split("/").pop() : url.split("/").pop()) ??
        "",
      ),
    };
  }
  return null;
}

function normalizeInspectionDetailItem(
  raw: unknown,
  index: number,
): InspectionDetailItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const attachmentsRaw = Array.isArray(row.attachments) ? row.attachments : [];
  return {
    id: String(row.id ?? index),
    itemId: String(row.item_id ?? row.id ?? index),
    result: String(row.result ?? "null"),
    notes: String(row.notes ?? ""),
    itemType: String(row.item_type ?? "pass_fail"),
    numberValue: Number(row.number_value ?? 0) || 0,
    itemMinValue: Number(row.item_min_value ?? 0) || 0,
    itemMaxValue: Number(row.item_max_value ?? 0) || 0,
    attachments: attachmentsRaw
      .map(normalizeAttachment)
      .filter((att): att is InspectionDetailAttachment => att !== null),
    witnessed: Boolean(row.witnessed ?? false),
    witnessedBy: String(row.witnessed_by ?? ""),
    holdApproved: Boolean(row.hold_approved ?? false),
    holdApprovedBy: String(row.hold_approved_by ?? ""),
    createdBy: String(row.created_by ?? ""),
    label: String(row.item_name ?? row.name ?? (row.template_item_data as Record<string, unknown> | undefined)?.name ?? `Checklist item ${index + 1}`),
    section: String(row.section_name ?? row.section ?? (row.template_item_data as Record<string, unknown> | undefined)?.section_name ?? "Checklist items"),
    expectedRange: String(row.expected_range ?? (row.template_item_data as Record<string, unknown> | undefined)?.expected_range ?? ""),
  };
}

function normalizeInspectionDetail(raw: unknown): InspectionDetail {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const category = String(row.category ?? "asset").toLowerCase();
  const equipment = (row.equipment_data ?? {}) as Record<string, unknown>;
  const template = (row.inspection_template ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const usageTracking = row.is_usage_tracking ?? template.is_usage_tracking;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    category: category === "quality" ? "quality" : "asset",
    status: String(row.status ?? ""),
    templateId: String(row.template_id ?? template.id ?? ""),
    templateFamilyId: String(row.template_family_id ?? template.family_id ?? ""),
    templateVersion: Number(row.template_version ?? template.version ?? 0) || 0,
    equipmentId: String(row.equipment_id ?? equipment.id ?? template.equipment_id ?? ""),
    equipmentName: String(equipment.name ?? ""),
    completedAt: String(row.completed_at ?? row.updated_at ?? row.created_at ?? ""),
    currentUsage: String(row.current_usage ?? ""),
    inspector: String(row.inspector_name ?? row.created_by ?? row.updated_by ?? ""),
    isUsageTracking:
      usageTracking === true || String(usageTracking).toLowerCase() === "true",
    templateName: String(row.template_name ?? template.name ?? row.name ?? ""),
    items: itemsRaw.map(normalizeInspectionDetailItem),
  };
}

export function useInspectionDetail(id: string | null | undefined) {
  return useQuery<InspectionDetail, AxiosError<ApiResponseError>>({
    queryKey: ["inspection-detail", id],
    queryFn: async () => {
      const res = await axios.get(`${INSPECTION_URL}/${id}`);
      return normalizeInspectionDetail(res.data?.data ?? res.data);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load inspection detail" },
  });
}

export interface UpdateInspectionItemPayload {
  is_pass: boolean;
  item_id: string;
  notes: string;
  number_value: number;
  status: string;
  template_item_id: string;
}

export interface UpdateInspectionPayload {
  current_usage?: string;
  is_draft: boolean;
  is_usage_tracking?: boolean;
  items: UpdateInspectionItemPayload[];
  updated_by: string;
  filesByItem?: Record<string, File[]>;
}

export interface VerifyInspectionPayload {
  approval_by: string;
}

export function useVerifyInspection(id: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    VerifyInspectionPayload
  >({
    mutationFn: async (payload) => {
      const res = await axios.post(`${INSPECTION_URL}/${id}/verify`, payload);
      return res.data;
    },
    meta: {
      errorMessage: "Failed to verify inspection",
      successMessage: "Inspection verified successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["inspection-detail", id] });
      // Verification changes whether the template can be started again.
      // Mark both asset and quality availability queries stale so the New
      // Inspection page always fetches current results on return.
      queryClient.invalidateQueries({ queryKey: ["available-inspections"] });
    },
  });
}

export interface DeclineInspectionItemReject {
  item_id: string;
  reason: string;
}

export interface DeclineInspectionPayload {
  approval_by: string;
  is_general: boolean;
  reason: string;
  item_rejects: DeclineInspectionItemReject[];
}

export function useDeclineInspection(id: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    DeclineInspectionPayload
  >({
    mutationFn: async (payload) => {
      const res = await axios.post(
        `${INSPECTION_URL}/${id}/decline`,
        payload,
      );
      return res.data;
    },
    meta: {
      errorMessage: "Failed to reject inspection",
      successMessage: "Inspection rejected",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["inspection-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["available-inspections"] });
    },
  });
}

export function useUpdateInspection(id: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    UpdateInspectionPayload
  >({
    mutationFn: async (payload) => {
      const { filesByItem, ...rest } = payload;
      const res = await axios.put(`${INSPECTION_URL}/${id}`, rest);
      if (filesByItem) {
        await uploadInspectionAttachments(res.data, filesByItem, rest.updated_by);
      }
      return res.data;
    },
    meta: {
      errorMessage: "Failed to update inspection",
      successMessage: "Inspection updated successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["inspection-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["available-inspections"] });
    },
  });
}
