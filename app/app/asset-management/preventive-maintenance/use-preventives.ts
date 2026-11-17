"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  PreventiveListParams,
  PreventiveListResult,
  PreventiveMaintenance,
} from "./types";

const axios = axiosConfig(env.apiBaseUrl);
const PREVENTIVE_URL = "/v1/construction-equipment/preventives";

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = "-") {
  return value == null || value === "" ? fallback : String(value);
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    const milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  const timestamp = objectValue(value);
  const seconds = Number(timestamp.seconds ?? timestamp._seconds);
  if (Number.isFinite(seconds)) {
    const nanoseconds = Number(timestamp.nanos ?? timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0);
    return new Date(seconds * 1000 + nanoseconds / 1_000_000).toISOString();
  }

  return text(timestamp.value ?? timestamp.date, "");
}

function canonicalMeasurementUnit(value: unknown): string {
  const unit = text(value, "").trim();
  const normalized = unit.toLowerCase().replace(/[._-]+/g, " ");

  if (["date", "day", "days", "daily", "week", "weeks", "weekly", "month", "months", "monthly", "year", "years", "yearly"].includes(normalized)) return "days";
  if (["hour", "hours", "hr", "hrs", "hourly"].includes(normalized)) return "hours";
  if (["kilometer", "kilometers", "kilometre", "kilometres", "km", "mileage"].includes(normalized)) return "km";
  if (["meter", "meters", "metre", "metres", "m"].includes(normalized)) return "meters";
  if (["cycle", "cycles"].includes(normalized)) return "cycles";

  return unit;
}

function measurementUnit(
  item: Record<string, unknown>,
  frequency: Record<string, unknown>,
  frequencyName: string,
): string {
  const category = objectValue(frequency.category ?? item.frequency_type_category);
  const unit = objectValue(frequency.unit ?? item.frequency_type_unit);
  const categoryValueType = text(
    item.frequency_type_value_type ??
      item.frequency_category_value_type ??
      frequency.value_type ??
      category.value_type,
    "",
  ).toLowerCase();
  const categoryName = text(
    item.frequency_type_category_name ?? frequency.category_name ?? category.name,
    "",
  );

  if (categoryValueType === "date" || /\b(date|day|daily)\b/i.test(categoryName)) return "days";
  if (/\b(day|daily|week|weekly|month|monthly|year|yearly|date)\b/i.test(frequencyName)) return "days";
  if (/\b(hour|hours|hr|hrs|hourly)\b/i.test(frequencyName)) return "hours";
  if (/\b(km|kilomet(?:er|re)s?|mileage)\b/i.test(frequencyName)) return "km";
  if (/\b(cycle|cycles)\b/i.test(frequencyName)) return "cycles";

  return canonicalMeasurementUnit(
    item.frequency_type_unit_name ??
      item.frequency_unit_name ??
      frequency.unit_name ??
      unit.name ??
      unit.label ??
      item.last_recored_unit ??
      item.last_recorded_unit ??
      item.unit ??
      item.threshold_unit,
  );
}

function workOrderStatus(
  item: Record<string, unknown>,
  workOrder: Record<string, unknown>,
): string {
  const rawStatus = text(
    workOrder.status ?? item.work_order_status ?? item.wo_status,
    "",
  );
  const normalized = rawStatus.toLowerCase().replace(/[.\s-]+/g, "_");
  const hasWorkOrder =
    Object.keys(workOrder).length > 0 ||
    Boolean(item.work_order_id ?? item.latest_work_order_id) ||
    (Boolean(rawStatus) && !["not_yet", "not_created"].includes(normalized));

  return hasWorkOrder ? "WO Created" : "Not Yet";
}

function unwrap(payload: unknown): Record<string, unknown> {
  let current = objectValue(payload);
  for (let depth = 0; depth < 4; depth += 1) {
    const nested = current.data ?? current.result;
    if (!nested || Array.isArray(nested) || typeof nested !== "object") break;
    current = nested as Record<string, unknown>;
  }
  return current;
}

function normalizePreventive(raw: unknown, index = 0): PreventiveMaintenance {
  const item = objectValue(raw);
  const asset = objectValue(item.asset ?? item.equipment);
  const frequency = objectValue(item.frequency_type ?? item.frequency);
  const workOrder = objectValue(item.work_order ?? item.latest_work_order);
  const usage = objectValue(item.latest_usage ?? item.usage_update);
  const frequencyType = text(
    frequency.name ?? frequency.label ?? item.frequency_type_name ?? item.frequency_type,
    "-",
  );
  const unit = measurementUnit(item, frequency, frequencyType) || "hours";
  const currentUsage = number(item.current_usage ?? asset.current_usage);
  const lastServiceUsage = number(
    item.last_service_usage ?? item.last_service ?? asset.last_service_usage,
  );

  return {
    id: text(item.id ?? item.preventive_id ?? index, String(index)),
    preventiveCode: text(item.preventive_code ?? item.code),
    assetId: text(item.asset_id ?? asset.id, ""),
    assetCode: text(asset.code ?? asset.asset_code ?? item.asset_code),
    assetName: text(asset.name ?? asset.asset_name ?? item.asset_name),
    model: text(asset.model ?? asset.model_type ?? item.asset_model ?? item.model),
    project: text(asset.project_name ?? objectValue(asset.project).name ?? item.project_name),
    frequencyType,
    thresholdValue: number(item.threshold_value ?? item.threshold),
    currentUsage,
    lastServiceUsage,
    usageSinceLastService: number(
      item.usage_since_last_service ?? currentUsage - lastServiceUsage,
    ),
    unit,
    workOrderStatus: workOrderStatus(item, workOrder),
    latestUsage: number(usage.value ?? usage.usage ?? item.latest_usage_value ?? currentUsage),
    latestUsageAt: dateText(
      usage.created_at ?? item.latest_usage_created_at ?? item.created_at,
    ),
    latestUsageBy: text(
      usage.recorded_by_name ??
        usage.recorded_by ??
        item.last_recorded_by ??
        item.usage_recorded_by,
    ),
  };
}

function listResult(payload: unknown): PreventiveListResult {
  const body = unwrap(payload);
  const rawItems = body.items ?? body.preventives ?? body.results ?? [];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizePreventive) : [];
  return {
    items,
    nextPageToken: text(body.next_page_token ?? body.nextPageToken, ""),
    totalCount: number(body.total_count ?? body.totalCount ?? items.length),
  };
}

function detailResult(payload: unknown): PreventiveMaintenance | null {
  const body = unwrap(payload);
  const raw = body.preventive ?? body.item ?? body;
  return Object.keys(objectValue(raw)).length ? normalizePreventive(raw) : null;
}

export function usePreventiveList(params: PreventiveListParams) {
  return useQuery<PreventiveListResult, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "preventives", "list", params],
    queryFn: async () => {
      const response = await axios.get(PREVENTIVE_URL, {
        params: {
          search: params.search,
          asset_id: params.assetId,
          status: params.status,
          frequency_type: params.frequencyType,
          page_size: params.pageSize,
          page_token: params.pageToken || undefined,
        },
      });
      return listResult(response.data);
    },
    placeholderData: (previous) => previous,
    retry: 1,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load preventive maintenance" },
  });
}

export function usePreventive(id: string) {
  return useQuery<PreventiveMaintenance | null, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "preventives", "detail", id],
    queryFn: async () => detailResult((await axios.get(`${PREVENTIVE_URL}/${id}`)).data),
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load preventive maintenance details" },
  });
}

export type PreventiveBreakdownPayload = {
  preventive_id: string;
  asset_id: string;
  breakdown_description: string;
  severity: "low" | "medium" | "high" | "critical";
  impact_description: string;
  occurred_at: string;
  estimated_return_at: string;
};

export type CreatePreventivePayload = {
  asset_id: string;
  current_usage: number;
  frequency_type: string;
  last_service_usage: number;
  threshold_value: number;
};

export function useCreatePreventive() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, CreatePreventivePayload>({
    mutationFn: async (payload) => (await axios.post(PREVENTIVE_URL, payload)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["asset-management", "preventives"],
      }),
    meta: {
      errorMessage: "Failed to create preventive maintenance",
      successMessage: "Preventive maintenance created successfully",
    },
  });
}

export function useReportPreventiveBreakdown() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { payload: PreventiveBreakdownPayload; files: File[] }
  >({
    mutationFn: async ({ payload, files }) => {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      files.forEach((file) => formData.append("files", file));
      return (
        await axios.post(
          "/v1/construction-equipment/breakdowns/from-preventive",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        )
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-management", "preventives"],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-management", "breakdowns"],
      });
    },
    meta: {
      errorMessage: "Failed to report breakdown",
      successMessage: "Breakdown reported successfully",
    },
  });
}
