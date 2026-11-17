"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const LABOUR_SCHEDULES_URL = "/v1/construction-labour/schedules";
const axios = axiosConfig(env.apiBaseUrl);

export type LabourSchedulePayload = {
  date: string;
  member_id: string;
  shift_id: string;
};

export type LabourScheduleFilters = {
  endDate: string;
  memberId?: string;
  pageSize?: number;
  pageToken?: string;
  projectId?: string;
  startDate: string;
};

export type LabourSchedule = LabourSchedulePayload & {
  id: string;
};

function extractScheduleItems(payload: unknown): unknown[] {
  let current = payload;

  for (let depth = 0; depth < 5; depth += 1) {
    if (Array.isArray(current)) return current;
    if (!current || typeof current !== "object") return [];

    const object = current as Record<string, unknown>;
    if (Array.isArray(object.items)) return object.items;
    if (Array.isArray(object.schedules)) return object.schedules;
    const nested = object.data ?? object.schedules;
    if (!nested || nested === current) return [];
    current = nested;
  }

  return [];
}

function extractLabourSchedules(payload: unknown): LabourSchedule[] {
  return extractScheduleItems(payload).flatMap((raw): LabourSchedule[] => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const member =
      item.member && typeof item.member === "object"
        ? (item.member as Record<string, unknown>)
        : {};
    const shift =
      item.shift && typeof item.shift === "object"
        ? (item.shift as Record<string, unknown>)
        : {};
    const date = item.date ?? item.schedule_date;
    const memberId =
      item.member_id ?? member.id ?? member._id ?? member.member_id;
    const shiftId = item.shift_id ?? shift.id ?? shift._id ?? shift.shift_id;
    if (date == null || memberId == null || shiftId == null) return [];

    return [{
      date: String(date).slice(0, 10),
      id:
        item.id == null && item._id == null
          ? ""
          : String(item.id ?? item._id),
      member_id: String(memberId),
      shift_id: String(shiftId),
    }];
  });
}

export function useLabourSchedules(filters: LabourScheduleFilters) {
  return useQuery<
    LabourSchedule[],
    AxiosError<ApiResponseError>
  >({
    queryKey: ["construction-labour-schedules", filters],
    queryFn: async () => {
      const response = await axios.get(LABOUR_SCHEDULES_URL, {
        params: {
          end_date: filters.endDate,
          member_id: filters.memberId,
          page_size: filters.pageSize,
          page_token: filters.pageToken,
          project_id: filters.projectId,
          start_date: filters.startDate,
        },
      });
      return extractLabourSchedules(response.data);
    },
    enabled: Boolean(
      filters.startDate && filters.endDate,
    ),
    meta: { errorMessage: "Failed to load labour schedules" },
  });
}

export function useBulkSaveLabourSchedules() {
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    LabourSchedulePayload[]
  >({
    mutationFn: async (schedules) =>
      (
        await axios.post(`${LABOUR_SCHEDULES_URL}/bulk`, {
          items: schedules,
        })
      ).data,
    meta: {
      errorMessage: "Failed to save labour schedules",
      successMessage: "Labour schedules saved successfully",
    },
  });
}

export type LabourScheduleDraftRequest = {
  items: { date: string; employee_id: string; shift_id?: string }[];
  project_id: string;
};

export type LabourScheduleDraftResponse = {
  items: LabourSchedulePreviewSuggestion[];
};

export function useDraftLabourSchedules() {
  return useMutation<
    LabourScheduleDraftResponse,
    AxiosError<ApiResponseError>,
    LabourScheduleDraftRequest
  >({
    mutationFn: async (request) =>
      (
        await axios.post(`${LABOUR_SCHEDULES_URL}/draft-preview`, request)
      ).data,
    meta: {
      errorMessage: "Failed to generate draft schedule",
      successMessage: "Draft schedule generated",
    },
  });
}

export function useBulkDeleteLabourSchedules() {
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    string[]
  >({
    mutationFn: async (ids) =>
      (
        await axios.post(`${LABOUR_SCHEDULES_URL}/bulk-delete`, {
          ids,
        })
      ).data,
    meta: {
      errorMessage: "Failed to delete labour schedules",
      successMessage: "Labour schedules deleted successfully",
    },
  });
}

export type LabourSchedulePreviewRuleFlags = {
  cost_efficiency: boolean;
  employee_availability: boolean;
  location_preference: boolean;
  workload_overtime_balance: boolean;
};

export type LabourSchedulePreviewRole = {
  role_id: string;
  total_employee: number;
};

export type LabourSchedulePreviewRequest = {
  end_date: string;
  project_id: string;
  roles: LabourSchedulePreviewRole[];
  rules: LabourSchedulePreviewRuleFlags;
  start_date: string;
};

export type LabourSchedulePreviewSuggestion = {
  date?: string;
  dates?: string[];
  end_date?: string;
  from_date?: string;
  match_score?: number;
  start_date?: string;
  to_date?: string;
  employee_id: string;
  employee_name?: string;
  position_name?: string;
  reasons?: string[];
  role_id: string;
  role_name?: string;
  shift_id: string;
  shift_name?: string;
};

export type LabourSchedulePreviewResponse = {
  end_date?: string;
  project_id?: string;
  request_id?: string;
  rules?: LabourSchedulePreviewRuleFlags;
  start_date?: string;
  suggestions: LabourSchedulePreviewSuggestion[];
  tenant_id?: string;
};

export function useGenerateLabourSchedulePreview() {
  return useMutation<
    LabourSchedulePreviewResponse,
    AxiosError<ApiResponseError>,
    LabourSchedulePreviewRequest
  >({
    mutationFn: async (request) =>
      (
        await axios.post(
          `${LABOUR_SCHEDULES_URL}/generate-preview`,
          request,
          { timeout: 300_000 },
        )
      ).data,
    meta: {
      errorMessage: "Failed to generate AI schedule preview",
      successMessage: "AI schedule preview generated",
    },
  });
}
