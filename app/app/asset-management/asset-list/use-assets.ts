"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { Asset, AssetStatus } from "./data";

const axios = axiosConfig(env.apiBaseUrl);
const ASSET_URL = "/v1/construction/equipment";

export type AssetListParams = {
  search?: string;
  status?: string;
  frequency_type?: string;
  project_id?: string;
  page_size: number;
  page_token?: string;
};

type AssetListResponse = {
  items: Asset[];
  nextPageToken: string;
  totalCount: number;
};

function unwrap(payload: unknown): Record<string, unknown> {
  let value = payload;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) break;
    const object = value as Record<string, unknown>;
    if (!object.data || typeof object.data !== "object") break;
    value = object.data;
  }
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
}

function statusValue(value: unknown): AssetStatus {
  const normalized = String(value ?? "active").toLowerCase();
  if (normalized.includes("breakdown")) return "Breakdown";
  if (normalized.includes("preventive") || normalized.includes("maintenance")) return "Preventive";
  return "Active";
}

function label(value: unknown, fallback = "-") {
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return String(item.name ?? item.label ?? item.code ?? fallback);
  }
  return value == null || value === "" ? fallback : String(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function canonicalMeasurementUnit(value: unknown): string {
  const unit = label(value, "").trim();
  const normalized = unit.toLowerCase().replace(/[._-]+/g, " ");

  if (["date", "day", "days", "daily"].includes(normalized)) return "days";
  if (["hour", "hours", "hr", "hrs", "hourly"].includes(normalized)) return "hours";
  if (["kilometer", "kilometers", "kilometre", "kilometres", "km", "mileage"].includes(normalized)) return "km";
  if (["meter", "meters", "metre", "metres", "m"].includes(normalized)) return "meters";
  if (["cycle", "cycles"].includes(normalized)) return "cycles";

  return unit;
}

function measurementUnit(item: Record<string, unknown>, frequencyName: string): string {
  const frequency = objectValue(item.frequency_type ?? item.frequency);
  const category = objectValue(frequency.category ?? item.frequency_type_category);
  const unit = objectValue(frequency.unit ?? item.frequency_type_unit);
  const categoryValueType = label(
    item.frequency_type_value_type ??
      item.frequency_category_value_type ??
      frequency.value_type ??
      category.value_type,
    "",
  ).toLowerCase();
  const categoryName = label(
    item.frequency_type_category_name ?? frequency.category_name ?? category.name,
    "",
  );

  // Date-based thresholds are stored as a number of days, regardless of
  // whether the display frequency is daily, weekly, monthly, or yearly.
  if (categoryValueType === "date" || /\b(date|day|daily)\b/i.test(categoryName)) {
    return "days";
  }

  const configuredUnit =
    item.frequency_type_unit_name ??
    item.frequency_unit_name ??
    frequency.unit_name ??
    unit.name ??
    unit.label;
  const explicitUnit = canonicalMeasurementUnit(configuredUnit);
  if (explicitUnit) return explicitUnit;

  // Some equipment-list responses only include the frequency name. Infer the
  // base threshold unit from it before falling back to the usage unit.
  if (/\b(day|daily|week|weekly|month|monthly|year|yearly|date)\b/i.test(frequencyName)) return "days";
  if (/\b(hour|hours|hr|hrs|hourly)\b/i.test(frequencyName)) return "hours";
  if (/\b(km|kilomet(?:er|re)s?|mileage)\b/i.test(frequencyName)) return "km";
  if (/\b(cycle|cycles)\b/i.test(frequencyName)) return "cycles";

  return canonicalMeasurementUnit(item.current_usage_unit);
}

function normalizeAsset(raw: unknown, index: number): Asset {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const frequencyObject = objectValue(item.frequency_type);
  const frequency = label(item.frequency_type_name ?? frequencyObject.name, "-");
  const usageUnit = measurementUnit(item, frequency);
  const currentUsage = Number(item.current_usage ?? 0);
  const warningThreshold = Number(item.warning_threshold ?? 0);
  // The equipment list API exposes this value as `service_internal`.
  // Keep the older spelling as a fallback for detail/API compatibility.
  const serviceInterval = Number(item.service_internal ?? item.service_interval ?? 0);
  const measurement = (value: unknown, unit: string) => `${label(value, "0")}${unit ? ` ${unit}` : ""}`;
  return {
    id: String(item.id ?? item.asset_id ?? item.equipment_id ?? index),
    code: label(item.asset_code ?? item.code),
    name: label(item.asset_name ?? item.name),
    model: label(item.model_type ?? item.model),
    status: statusValue(item.status),
    project: label(item.project_name || item.project || item.project_id || item.site_location),
    frequency,
    frequencyTypeId: String(item.frequency_type_id ?? ""),
    threshold: measurement(item.warning_threshold, usageUnit),
    usage: measurement(item.current_usage, usageUnit),
    usageNumber: currentUsage,
    lastServiceUsage: label(item.usage_since_last_service_display ?? item.usage_since_last_service),
    serviceInterval,
    warningThreshold,
    usageUnit,
    autoCreateWorkOrder: Boolean(item.is_auto_create_work_order),
  };
}

export function useAssetList(params: AssetListParams) {
  return useQuery<AssetListResponse, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "assets", params],
    queryFn: async () => {
      const response = await axios.get(ASSET_URL, { params });
      const body = unwrap(response.data);
      const rawItems = (body.items ?? body.assets ?? body.results ?? []) as unknown[];
      return {
        items: Array.isArray(rawItems) ? rawItems.map(normalizeAsset) : [],
        nextPageToken: String(body.next_page_token ?? body.nextPageToken ?? ""),
        totalCount: Number(body.total_count ?? body.totalCount ?? 0),
      };
    },
    placeholderData: (previous) => previous,
    retry: 1,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load assets" },
  });
}

export function useAssetDetail(id: string) {
  return useQuery<Asset, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "assets", "detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(`${ASSET_URL}/${encodeURIComponent(id)}`);
      const body = unwrap(response.data);
      const raw = body.asset ?? body.equipment ?? body.item ?? body;
      return normalizeAsset(raw, 0);
    },
    retry: 1,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load asset detail" },
  });
}

export type BreakdownPayload = {
  asset_id: string;
  breakdown_description: string;
  severity: "low" | "medium" | "high" | "critical";
  impact_description: string;
  occurred_at: string;
  estimated_return_at: string;
};

export function useReportBreakdown() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { payload: BreakdownPayload; files: File[] }>({
    mutationFn: async ({ payload, files }) => {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      files.forEach((file) => formData.append("files", file));
      return (
        await axios.post("/v1/construction-equipment/breakdowns", formData, {
          // Override the axios instance's application/json default. Axios's
          // browser adapter adds the required multipart boundary.
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-management", "assets"] }),
    meta: { errorMessage: "Failed to report breakdown", successMessage: "Breakdown reported successfully" },
  });
}
