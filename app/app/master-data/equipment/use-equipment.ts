"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { EquipmentApiPayload } from "./form-schema";
import type {
  Equipment,
  EquipmentListParams,
  EquipmentListResponse,
  EquipmentOwnership,
  EquipmentStatus,
} from "./types";

const EQUIPMENT_URL = "/v1/construction/equipment";
const EQUIPMENT_CATEGORY_URL = "/v1/construction/equipment-category";
const UNITS_OF_MEASURE_URL = "/v1/construction/units-of-measure";
const DEPARTMENT_URL = "/v1/construction/department";
const COMPANIES_URL = "/v1/construction/companies";
const PROJECT_URL = "/v1/construction/project";
const EQUIPMENT_TYPE_CLASS_URL = "/v1/construction/equipment-type-class";
const FREQUENCY_TYPE_URL = "/v1/construction/frequency-type";
const axios = axiosConfig(env.apiBaseUrl);

const equipmentKeys = {
  all: ["construction-equipment"] as const,
  list: (params: EquipmentListParams) =>
    ["construction-equipment", "list", params] as const,
  detail: (id: string) => ["construction-equipment", id] as const,
};

export type RefOption = { label: string; value: string };

function toRefOptions(payload: unknown): RefOption[] {
  return findList(payload)
    .map((raw) => {
      const item = (raw && typeof raw === "object" ? raw : {}) as Record<
        string,
        unknown
      >;
      const value = String(
        item.id ?? item._id ?? item.uuid ?? item.code ?? "",
      );
      const label = String(
        item.name ??
        item.label ??
        item.title ??
        item.code ??
        item.description ??
        value,
      );
      return { label, value };
    })
    .filter((option) => option.value !== "");
}

function useRefOptions(key: string, url: string) {
  return useQuery<RefOption[], AxiosError<ApiResponseError>>({
    queryKey: ["construction-ref", key],
    queryFn: async () =>
      toRefOptions(
        (await axios.get(url, { params: { page_size: 1000 } })).data,
      ),
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: `Failed to load ${key}` },
  });
}

export function useEquipmentCategories() {
  return useRefOptions("equipment-category", EQUIPMENT_CATEGORY_URL);
}

export function useUnitsOfMeasure() {
  return useRefOptions("units-of-measure", UNITS_OF_MEASURE_URL);
}

export function useDepartments() {
  return useRefOptions("department", DEPARTMENT_URL);
}

export function useCompanies() {
  return useRefOptions("companies", COMPANIES_URL);
}

export function useProjects() {
  return useRefOptions("project", PROJECT_URL);
}

export function useEquipmentTypeClasses(categoryId?: string) {
  return useQuery<RefOption[], AxiosError<ApiResponseError>>({
    queryKey: ["construction-ref", "equipment-type-class", categoryId ?? "all"],
    queryFn: async () => {
      const url = categoryId
        ? `${EQUIPMENT_TYPE_CLASS_URL}?category_id=${encodeURIComponent(categoryId)}`
        : EQUIPMENT_TYPE_CLASS_URL;
      return toRefOptions(
        (await axios.get(url, { params: { page_size: 1000 } })).data,
      );
    },
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load equipment type / class" },
  });
}

export type FrequencyTypeRefOption = RefOption & {
  valueType: string;
  intervalValue: number;
  unitInternalValue: number;
  daysPerUnit: number;
  unitName: string;
};

function frequencyTypeOptions(payload: unknown): FrequencyTypeRefOption[] {
  return findList(payload)
    .map((raw) => {
      const item = raw && typeof raw === "object"
        ? raw as Record<string, unknown>
        : {};
      const category = item.category && typeof item.category === "object"
        ? item.category as Record<string, unknown>
        : {};
      const unit = item.unit && typeof item.unit === "object"
        ? item.unit as Record<string, unknown>
        : {};
      const value = String(item.id ?? item.frequency_type_id ?? "");
      const intervalValue = Number(item.interval_value ?? item.intervalValue ?? 0);
      const unitInternalValue = Number(
        item.unit_internal_value ??
          item.unit_value ??
          unit.internal_value ??
          unit.internalValue ??
          unit.unit_value ??
          0,
      );
      const configuredDays = Number(item.days_per_unit ?? item.daysPerUnit ?? 0);
      const daysPerUnit = configuredDays > 0
        ? configuredDays
        : intervalValue * unitInternalValue;
      const categoryName = String(item.category_name ?? category.name ?? "");
      const unitName = String(item.unit_name ?? unit.name ?? unit.label ?? "");
      const configuredValueType = String(
        item.category_value_type ??
          item.value_type ??
          category.value_type ??
          "",
      );
      const valueType = configuredValueType ||
        (/\b(date|day)\b/i.test(categoryName) ||
        /\b(day|daily|week|weekly|month|monthly|year|yearly)\b/i.test(unitName) ||
        /\b(day|daily|week|weekly|month|monthly|year|yearly)\b/i.test(String(item.name ?? ""))
          ? "date"
          : "");

      return {
        value,
        label: String(item.name ?? item.label ?? item.code ?? value),
        valueType,
        intervalValue: Number.isFinite(intervalValue) ? intervalValue : 0,
        unitInternalValue: Number.isFinite(unitInternalValue) ? unitInternalValue : 0,
        daysPerUnit: Number.isFinite(daysPerUnit) ? daysPerUnit : 0,
        unitName,
      };
    })
    .filter((option) => option.value !== "");
}

type FrequencyTypeOptionPage = {
  items: FrequencyTypeRefOption[];
  nextPageToken: string;
};

export function useFrequencyTypeOptions(search?: string, enabled = true) {
  const query = useInfiniteQuery<FrequencyTypeOptionPage, AxiosError<ApiResponseError>>({
    queryKey: ["construction-ref", "frequency-type", search ?? ""],
    enabled,
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const response = await axios.get(FREQUENCY_TYPE_URL, {
        params: {
          page_size: 20,
          page_token: pageParam || undefined,
          search: search?.trim() || undefined,
        },
      });
      const payload = response.data as Record<string, unknown>;
      const body = (payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload) as Record<string, unknown>;
      return {
        items: frequencyTypeOptions(response.data),
        nextPageToken: String(body.next_page_token ?? body.nextPageToken ?? ""),
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load frequency types" },
  });

  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    loadMore: query.fetchNextPage,
  };
}

export function useFrequencyTypeOption(id?: string) {
  return useQuery<FrequencyTypeRefOption | null, AxiosError<ApiResponseError>>({
    queryKey: ["construction-ref", "frequency-type", "detail", id ?? ""],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(
        `${FREQUENCY_TYPE_URL}/${encodeURIComponent(id ?? "")}`,
      );
      const payload = response.data as Record<string, unknown>;
      const body = (payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload) as Record<string, unknown>;
      const item = (body.frequency_type && typeof body.frequency_type === "object"
        ? body.frequency_type
        : body) as Record<string, unknown>;
      return frequencyTypeOptions([{
        ...item,
        id: item.id ?? item.frequency_type_id ?? id,
      }])[0] ?? null;
    },
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load selected frequency type" },
  });
}

function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["data", "items", "equipment", "rows", "results"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function statusValue(value: unknown): EquipmentStatus {
  const normalized = String(value ?? "active")
    .toLowerCase()
    .replace(/[ -]/g, "_");
  if (normalized === "under_maintenance" || normalized === "maintenance")
    return "under_maintenance";
  if (normalized === "out_of_service" || normalized === "inactive")
    return "out_of_service";
  return "active";
}

function ownershipValue(value: unknown): EquipmentOwnership {
  const normalized = String(value ?? "owned").toLowerCase();
  if (normalized === "rented" || normalized === "rent") return "rented";
  if (normalized === "leased" || normalized === "lease") return "leased";
  return "owned";
}

function labelValue(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return String(object.name ?? object.label ?? object.title ?? fallback);
  }
  return value == null || value === "" ? fallback : String(value);
}

function normalizeEquipment(raw: unknown, index: number): Equipment {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(item.id ?? item._id ?? item.equipment_id ?? index),
    code: String(item.code ?? item.equipment_code ?? ""),
    name: String(item.name ?? item.equipment_name ?? "Untitled equipment"),
    category: labelValue(item.category ?? item.category_name, ""),
    model: String(item.model ?? ""),
    manufacturer: String(item.manufacturer ?? item.brand ?? ""),
    serial_number: String(item.serial_number ?? item.serialNumber ?? ""),
    status: statusValue(item.status),
    ownership: ownershipValue(item.ownership ?? item.ownership_type),
    location: String(item.location ?? ""),
    notes: String(item.notes ?? ""),
  };
}

function extractEquipment(payload: unknown): Equipment | null {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    const nested = object.data ?? object.equipment ?? object.item;
    if (!nested || Array.isArray(nested)) break;
    current = nested;
  }
  return current && typeof current === "object" && !Array.isArray(current)
    ? normalizeEquipment(current, 0)
    : null;
}

export function useEquipmentList(params: EquipmentListParams = {}) {
  return useQuery<EquipmentListResponse, AxiosError<ApiResponseError>>({
    queryKey: equipmentKeys.list(params),
    queryFn: async () => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "")
          query[key] = String(value);
      }
      const response = (await axios.get(EQUIPMENT_URL, { params: query }))
        .data as EquipmentListResponse;
      return {
        items: Array.isArray(response?.items) ? response.items : [],
        next_page_token: response?.next_page_token ?? "",
        total_count: response?.total_count ?? 0,
      };
    },
    meta: { errorMessage: "Failed to load equipment" },
  });
}

export function useEquipment(id: string) {
  return useQuery<Equipment | null, AxiosError<ApiResponseError>>({
    queryKey: equipmentKeys.detail(id),
    queryFn: async () =>
      extractEquipment((await axios.get(`${EQUIPMENT_URL}/${id}`)).data),
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load equipment details" },
  });
}

export function useEquipmentDetail(id: string) {
  return useQuery<Record<string, unknown> | null, AxiosError<ApiResponseError>>({
    queryKey: [...equipmentKeys.detail(id), "raw"],
    queryFn: async () => {
      const res = await axios.get(`${EQUIPMENT_URL}/${id}`);
      let data = res.data;
      if (data && typeof data === "object" && "data" in data) {
        const inner = (data as Record<string, unknown>).data;
        if (inner && typeof inner === "object" && !Array.isArray(inner)) {
          data = inner;
        }
      }
      return data as Record<string, unknown>;
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load equipment details" },
  });
}

export interface EquipmentImage {
  id: string;
  storage_key: string;
  sort_order: number;
  url?: string;
}

export function useEquipmentImages(equipmentId: string) {
  return useQuery<EquipmentImage[], AxiosError<ApiResponseError>>({
    queryKey: [...equipmentKeys.detail(equipmentId), "images"],
    queryFn: async () => {
      const res = await axios.get(`${EQUIPMENT_URL}/${equipmentId}/images`);
      const items = findList(res.data) as Record<string, unknown>[];
      return items.map((item, index) => ({
        id: String(item.id ?? item.image_id ?? index),
        storage_key: String(item.storage_key ?? ""),
        sort_order: Number(item.sort_order ?? index),
        url: item.url ? String(item.url) : undefined,
      }));
    },
    enabled: Boolean(equipmentId),
    meta: { errorMessage: "Failed to load equipment images" },
  });
}

export function useDeleteEquipmentImage(equipmentId: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (imageId) =>
      (await axios.delete(`${EQUIPMENT_URL}/images/${imageId}`)).data,
    meta: {
      errorMessage: "Failed to delete image",
      successMessage: "Image deleted successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...equipmentKeys.detail(equipmentId), "images"],
      }),
  });
}

export interface EquipmentCreateResponse {
  id: string;
  [key: string]: unknown;
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation<
    EquipmentCreateResponse,
    AxiosError<ApiResponseError>,
    EquipmentApiPayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post(EQUIPMENT_URL, payload);
      const data = response.data;
      if (data && typeof data === "object" && "id" in data) {
        return data as EquipmentCreateResponse;
      }
      if (data?.data && typeof data.data === "object" && "id" in data.data) {
        return data.data as EquipmentCreateResponse;
      }
      return data as EquipmentCreateResponse;
    },
    meta: {
      errorMessage: "Failed to create equipment",
      successMessage: "Equipment created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["construction-equipment"] }),
  });
}

export interface UploadUrlResponse {
  upload_url: string;
  storage_key: string;
}

export async function getEquipmentImageUploadUrl(
  equipmentId: string,
  payload: { file_name: string },
): Promise<UploadUrlResponse> {
  const res = await axios.post(
    `${EQUIPMENT_URL}/${equipmentId}/images/upload-url`,
    payload,
  );
  const data = (res.data?.data ?? res.data) as UploadUrlResponse;
  if (!data?.upload_url || !data?.storage_key) {
    throw new Error("Invalid upload URL response");
  }
  return data;
}

export async function uploadImageToS3(
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

export async function registerEquipmentImage(
  equipmentId: string,
  payload: { sort_order: number; storage_key: string },
): Promise<void> {
  await axios.post(`${EQUIPMENT_URL}/${equipmentId}/images`, payload);
}

export type ImageUploadStatus =
  | "idle"
  | "getting-upload-url"
  | "uploading-s3"
  | "registering"
  | "success"
  | "error";

export interface ImageUploadState {
  status: ImageUploadStatus;
  error?: string;
  storageKey?: string;
}

export async function uploadEquipmentImage(
  equipmentId: string,
  file: File,
  sortOrder: number,
): Promise<void> {
  const { upload_url, storage_key } = await getEquipmentImageUploadUrl(equipmentId, {
    file_name: file.name,
  });
  await uploadImageToS3(upload_url, file);
  await registerEquipmentImage(equipmentId, {
    sort_order: sortOrder,
    storage_key,
  });
}

export async function uploadEquipmentImages(
  equipmentId: string,
  images: File[],
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    await uploadEquipmentImage(equipmentId, images[i], i);
  }
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: EquipmentApiPayload }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.put(`${EQUIPMENT_URL}/${id}`, payload)).data,
    meta: {
      errorMessage: "Failed to update equipment",
      successMessage: "Equipment updated successfully",
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["construction-equipment"] });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(id) });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${EQUIPMENT_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete equipment",
      successMessage: "Equipment deleted successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["construction-equipment"] }),
  });
}
