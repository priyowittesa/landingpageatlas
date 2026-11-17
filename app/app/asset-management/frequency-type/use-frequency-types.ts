"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { FrequencyType, FrequencyTypeAudit, FrequencyTypeOption, FrequencyTypePayload } from "./types";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction/frequency-type";
const CATEGORY_URL = "/v1/construction/frequency-type-category";
const UNIT_URL = "/v1/construction/frequency-type-unit";

const keys = {
  all: ["construction-frequency-types"] as const,
  categories: ["construction-frequency-type-categories"] as const,
  units: ["construction-frequency-type-units"] as const,
  detail: (id: string) => ["construction-frequency-types", id] as const,
  audits: (id: string) => ["construction-frequency-types", id, "audits"] as const,
};

const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback = "") => value == null || value === "" ? fallback : String(value);

function unwrap(value: unknown): unknown {
  let current = value;
  for (let index = 0; index < 4; index += 1) {
    const row = object(current);
    const nested = row.data ?? row.result;
    if (nested == null) break;
    current = nested;
  }
  return current;
}

function rows(value: unknown, names: string[]): unknown[] {
  const body = object(unwrap(value));
  if (Array.isArray(unwrap(value))) return unwrap(value) as unknown[];
  for (const name of ["items", ...names]) if (Array.isArray(body[name])) return body[name] as unknown[];
  return [];
}

function normalizeOption(raw: unknown, index: number): FrequencyTypeOption {
  const row = object(raw);
  const internalValue = Number(row.internal_value ?? row.internalValue ?? row.unit_value ?? row.unitValue ?? 0);
  return {
    id: text(row.id ?? row.category_id ?? row.unit_id, String(index)),
    name: text(row.name ?? row.label, "Untitled"),
    description: text(row.description),
    value_type: text(row.value_type ?? row.valueType),
    internal_value: Number.isFinite(internalValue) ? internalValue : 0,
  };
}

function normalizeFrequencyType(raw: unknown, index: number): FrequencyType {
  const row = object(raw);
  const category = object(row.category);
  const unit = object(row.unit);
  return {
    id: text(row.id ?? row.frequency_type_id, String(index)),
    code: text(row.code),
    name: text(row.name, "Untitled frequency type"),
    category_id: text(row.category_id ?? category.id),
    category_name: text(row.category_name ?? category.name, "-"),
    description: text(row.description),
    unit_id: text(row.unit_id ?? unit.id),
    unit_name: text(row.unit_name ?? unit.name, "-"),
    interval_value: Number(row.interval_value ?? 0),
    status: String(row.status).toLowerCase() === "inactive" ? "inactive" : "active",
    updated_at: text(row.updated_at ?? row.created_at),
  };
}

function normalizeAudit(raw: unknown, index: number): FrequencyTypeAudit {
  const row = Object.fromEntries(Object.entries(object(raw)).map(([key, value]) => [key.trim(), value]));
  const changes = object(row.changes);
  const record = object(changes.record);
  const dataBefore = object(record.old ?? row.data_before);
  const dataAfter = object(record.new ?? row.data_after);
  const action = text(row.activity_type ?? row.action, "updated").toLowerCase();
  return {
    id: text(row.id, String(index)),
    action,
    entityType: text(row.entity_type, "frequency type"),
    actorName: text(row.actor_name, "System"),
    createdAt: text(row.occurred_at ?? row.created_at),
    description: text(row.description ?? row.message),
    statusBefore: text(row.status_before ?? (action === "status_change" ? dataBefore.status : undefined)),
    statusAfter: text(row.status_after ?? (action === "status_change" ? dataAfter.status : undefined)),
    dataBefore,
    dataAfter,
  };
}

export type FrequencyTypeFilters = {
  pageSize: number;
  pageToken?: string;
  search?: string;
  status?: string;
  categoryId?: string;
  unitId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export type FrequencyTypeListResult = { items: FrequencyType[]; nextPageToken: string; totalCount: number };

export function useFrequencyTypeList(filters: FrequencyTypeFilters) {
  return useQuery<FrequencyTypeListResult, AxiosError<ApiResponseError>>({
    queryKey: [...keys.all, "list", filters],
    queryFn: async () => {
      const response = await axios.get(URL, { params: {
        page_size: filters.pageSize,
        page_token: filters.pageToken || undefined,
        search: filters.search || undefined,
        status: filters.status || undefined,
        category_id: filters.categoryId || undefined,
        unit_id: filters.unitId || undefined,
        sort_by: filters.sortBy || undefined,
        sort_order: filters.sortDir || undefined,
      } });
      const payload = unwrap(response.data);
      const body = object(payload);
      const items = rows(response.data, ["frequency_types", "frequencyTypes"]).map(normalizeFrequencyType);
      return {
        items,
        nextPageToken: text(body.next_page_token ?? body.nextPageToken),
        totalCount: Number(body.total_count ?? body.totalCount ?? items.length),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load frequency types" },
  });
}

export function useFrequencyType(id: string) {
  return useQuery<FrequencyType | null, AxiosError<ApiResponseError>>({
    queryKey: keys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const payload = unwrap((await axios.get(`${URL}/${encodeURIComponent(id)}`)).data);
      const body = object(payload);
      const item = body.frequency_type ?? body.item ?? payload;
      return item && typeof item === "object" && !Array.isArray(item) ? normalizeFrequencyType(item, 0) : null;
    },
    meta: { errorMessage: "Failed to load frequency type details" },
  });
}

type AuditPage = { items: FrequencyTypeAudit[]; nextPageToken: string };

type FrequencyTypeAuditFilters = {
  activityType?: string;
  search?: string;
  pageSize?: number;
};

export function useFrequencyTypeAudits(id: string, filters: FrequencyTypeAuditFilters = {}) {
  return useInfiniteQuery<AuditPage, AxiosError<ApiResponseError>>({
    queryKey: [...keys.audits(id), filters],
    enabled: Boolean(id),
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const response = await axios.get(`${URL}/${encodeURIComponent(id)}/audit-logs`, {
        params: {
          page_token: pageParam || undefined,
          activity_type: filters.activityType || undefined,
          search: filters.search?.trim() || undefined,
          page_size: filters.pageSize ?? 10,
        },
      });
      const payload = unwrap(response.data);
      const body = object(payload);
      return {
        items: rows(response.data, ["audits", "audit_logs"]).map(normalizeAudit),
        nextPageToken: text(body.next_page_token ?? body.nextPageToken),
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    meta: { errorMessage: "Failed to load frequency type audit history" },
  });
}

function useOptions(url: string, queryKey: readonly string[], names: string[], errorMessage: string) {
  return useQuery<FrequencyTypeOption[], AxiosError<ApiResponseError>>({
    queryKey,
    queryFn: async () => rows((await axios.get(url, { params: { page_size: 100 } })).data, names).map(normalizeOption),
    meta: { errorMessage },
  });
}

export const useFrequencyTypeCategories = () => useOptions(CATEGORY_URL, keys.categories, ["categories"], "Failed to load frequency type categories");
export const useFrequencyTypeUnits = () => useOptions(UNIT_URL, keys.units, ["units"], "Failed to load frequency type units");

export function useCreateFrequencyType() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, FrequencyTypePayload>({
    mutationFn: async (payload) => (await axios.post(URL, payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
    meta: { errorMessage: "Failed to create frequency type", successMessage: "Frequency type created successfully" },
  });
}

export function useUpdateFrequencyType() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { id: string; payload: FrequencyTypePayload }>({
    mutationFn: async ({ id, payload }) => (await axios.put(`${URL}/${encodeURIComponent(id)}`, payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
    meta: { errorMessage: "Failed to update frequency type", successMessage: "Frequency type updated successfully" },
  });
}

export function useDeleteFrequencyType() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${URL}/${encodeURIComponent(id)}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
    meta: { errorMessage: "Failed to delete frequency type", successMessage: "Frequency type deleted successfully" },
  });
}

function useCreateOption(url: string, queryKey: readonly string[]) {
  const client = useQueryClient();
  return useMutation<FrequencyTypeOption, AxiosError<ApiResponseError>, { name: string; description?: string; value_type?: string; unit_value?: string }>({
    mutationFn: async (payload) => normalizeOption(unwrap((await axios.post(url, payload)).data), 0),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
}

export const useCreateFrequencyTypeCategory = () => useCreateOption(CATEGORY_URL, keys.categories);
export const useCreateFrequencyTypeUnit = () => useCreateOption(UNIT_URL, keys.units);
