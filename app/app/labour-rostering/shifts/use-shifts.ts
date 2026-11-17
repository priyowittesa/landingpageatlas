"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { Shift, ShiftPayload, ShiftStatus } from "./types";

const SHIFT_URL = "/v1/construction/shift";
const SHIFT_DASHBOARD_SUMMARY_URL = `${SHIFT_URL}/dashboard-summary`;
const axios = axiosConfig(env.apiBaseUrl);

const shiftKeys = {
  all: ["construction-shifts"] as const,
  dashboardSummary: ["construction-shifts", "dashboard-summary"] as const,
  detail: (id: string) => ["construction-shifts", id] as const,
};

function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["data", "items", "shifts", "rows", "results"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return ["true", "1", "yes", "active"].includes(value.toLowerCase());
  return fallback;
}

function timeValue(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : fallback;
}

function statusValue(value: unknown): ShiftStatus {
  if (typeof value === "boolean") return value ? "active" : "inactive";
  const normalized = String(value ?? "active").toLowerCase().replace(/[ -]/g, "_");
  return normalized === "inactive" || normalized === "on_leave" ? normalized : "active";
}

function labelValue(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return String(object.name ?? object.label ?? object.title ?? fallback);
  }
  return value == null || value === "" ? fallback : String(value);
}

function normalizeShift(raw: unknown, index: number): Shift {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: String(item.id ?? item._id ?? item.shift_id ?? index),
    code: String(item.code ?? item.shift_code ?? ""),
    name: String(item.name ?? item.shift_name ?? "Untitled shift"),
    description: String(item.description ?? ""),
    start_time: timeValue(item.start_time ?? item.startTime, "00:00"),
    end_time: timeValue(item.end_time ?? item.endTime, "00:00"),
    is_overnight: booleanValue(item.is_overnight ?? item.isOvernight ?? item.overnight_shift, false),
    break_duration: timeValue(item.break_duration ?? item.breakDuration, "00:00"),
    auto_calculate_working_hours: booleanValue(
      item.auto_calculate_working_hours ?? item.autoCalculateWorkingHours,
      true,
    ),
    working_hours: timeValue(item.working_hours ?? item.workingHours, "00:00"),
    allow_overtime: booleanValue(item.allow_overtime ?? item.allowOvertime, false),
    overtime_threshold: timeValue(item.overtime_threshold ?? item.overtimeThreshold, ""),
    minimum_working_hours: timeValue(item.minimum_working_hours ?? item.minimumWorkingHours, ""),
    maximum_working_hours: timeValue(item.maximum_working_hours ?? item.maximumWorkingHours, ""),
    notes: String(item.notes ?? ""),
    shift_type: labelValue(item.shift_type ?? item.shiftType, "Standard Shift"),
    working_pattern: labelValue(item.working_pattern ?? item.workingPattern, "Not Set"),
    status: statusValue(item.status ?? item.is_active),
  };
}

function extractShift(payload: unknown): Shift | null {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    const nested = object.data ?? object.shift ?? object.item;
    if (!nested || Array.isArray(nested)) break;
    current = nested;
  }
  return current && typeof current === "object" && !Array.isArray(current)
    ? normalizeShift(current, 0)
    : null;
}

export interface ShiftListFilters {
  pageSize?: number;
  pageToken?: string;
  status?: string;
  shiftType?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface ShiftListResult {
  items: Shift[];
  nextPageToken: string;
  totalCount: number;
}

export type ShiftDashboardSummary = Record<string, number>;

function extractShiftList(payload: unknown): ShiftListResult {
  const items = findList(payload).map(normalizeShift);
  let current: unknown = payload;
  let nextPageToken = "";
  let totalCount: number | undefined;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const envelope = current as Record<string, unknown>;
    const token = envelope.next_page_token ?? envelope.nextPageToken;
    const count = envelope.total_count ?? envelope.totalCount;
    if (token != null) nextPageToken = String(token);
    if (count != null && Number.isFinite(Number(count))) {
      totalCount = Number(count);
    }
    current = envelope.data ?? envelope.result ?? envelope.shifts;
  }

  return {
    items,
    nextPageToken,
    totalCount: totalCount ?? items.length,
  };
}

export function useShifts() {
  return useQuery<Shift[], AxiosError<ApiResponseError>>({
    queryKey: shiftKeys.all,
    queryFn: async () => findList((await axios.get(SHIFT_URL)).data).map(normalizeShift),
    meta: { errorMessage: "Failed to load shifts" },
  });
}

export function useShiftList(filters: ShiftListFilters = {}) {
  return useQuery<ShiftListResult, AxiosError<ApiResponseError>>({
    queryKey: [...shiftKeys.all, "list", filters],
    queryFn: async () => {
      const response = await axios.get(SHIFT_URL, {
        params: {
          page_size: filters.pageSize,
          page_token: filters.pageToken || undefined,
          status: filters.status || undefined,
          shift_type: filters.shiftType || undefined,
          search: filters.search || undefined,
          sort_by: filters.sortBy || undefined,
          sort_order: filters.sortDir || undefined,
        },
      });
      return extractShiftList(response.data);
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load shifts" },
  });
}

export function useShiftDashboardSummary() {
  return useQuery<ShiftDashboardSummary, AxiosError<ApiResponseError>>({
    queryKey: shiftKeys.dashboardSummary,
    queryFn: async () => {
      const response = await axios.get(SHIFT_DASHBOARD_SUMMARY_URL);
      let current: unknown = response.data;

      for (let depth = 0; depth < 5; depth += 1) {
        if (!current || typeof current !== "object" || Array.isArray(current)) {
          return {};
        }
        const object = current as Record<string, unknown>;
        const summary = Object.fromEntries(
          Object.entries(object).flatMap(([key, rawValue]) => {
            const count =
              typeof rawValue === "number" ? rawValue : Number(rawValue);
            return Number.isFinite(count) ? [[key, count]] : [];
          })
        );
        if (Object.keys(summary).length) return summary;
        current = object.data ?? object.summary ?? object.result;
      }
      return {};
    },
    meta: { errorMessage: "Failed to load shift dashboard summary" },
  });
}

export function useShift(id: string) {
  return useQuery<Shift | null, AxiosError<ApiResponseError>>({
    queryKey: shiftKeys.detail(id),
    queryFn: async () => extractShift((await axios.get(`${SHIFT_URL}/${id}`)).data),
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load shift details" },
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, ShiftPayload>({
    mutationFn: async (payload) => (await axios.post(SHIFT_URL, payload)).data,
    meta: { errorMessage: "Failed to create shift", successMessage: "Shift created successfully" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { id: string; payload: ShiftPayload }>({
    mutationFn: async ({ id, payload }) => (await axios.put(`${SHIFT_URL}/${id}`, payload)).data,
    meta: { errorMessage: "Failed to update shift", successMessage: "Shift updated successfully" },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(id) });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${SHIFT_URL}/${id}`)).data,
    meta: { errorMessage: "Failed to delete shift", successMessage: "Shift deleted successfully" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shiftKeys.all }),
  });
}
