"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const USAGE_LOG_URL = "/v1/construction-equipment/usage-log-assets";

export type AssetUsageLogParams = {
  assetId: string;
  search?: string;
  recordedUnit?: string;
  startRecordedAt?: string;
  endRecordedAt?: string;
  pageSize: number;
  pageToken?: string;
};

export type AssetUsageLog = {
  id: string;
  recordedAt: string;
  usageValue: string;
  recordedUnit: string;
  recordedBy: string;
};

type AssetUsageLogResult = {
  items: AssetUsageLog[];
  nextPageToken: string;
  totalCount: number;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = "-") {
  return value == null || value === "" ? fallback : String(value);
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

function normalizeUsageLog(raw: unknown, index: number): AssetUsageLog {
  const item = objectValue(raw);
  const recorder = objectValue(item.recorded_by ?? item.recorder ?? item.created_by);

  return {
    id: text(item.id ?? item.usage_log_id ?? index, String(index)),
    recordedAt: text(item.recorded_at ?? item.created_at, ""),
    usageValue: text(item.usage_value ?? item.value ?? item.current_usage, "0"),
    recordedUnit: text(item.recorded_unit ?? item.unit, ""),
    recordedBy: text(
      item.recorded_by_name ?? recorder.name ?? recorder.full_name ?? item.recorded_by,
    ),
  };
}

export function useAssetUsageLogs(params: AssetUsageLogParams) {
  return useQuery<AssetUsageLogResult, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "asset-usage-logs", params],
    queryFn: async () => {
      const response = await axios.get(USAGE_LOG_URL, {
        params: {
          asset_id: params.assetId,
          search: params.search,
          recorded_unit: params.recordedUnit,
          start_recorded_at: params.startRecordedAt,
          end_recorded_at: params.endRecordedAt,
          page_size: params.pageSize,
          page_token: params.pageToken || undefined,
        },
      });
      const body = unwrap(response.data);
      const rawItems = body.items ?? body.usage_logs ?? body.results ?? [];
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeUsageLog) : [];

      return {
        items,
        nextPageToken: text(body.next_page_token ?? body.nextPageToken, ""),
        totalCount: Number(body.total_count ?? body.totalCount ?? items.length),
      };
    },
    enabled: Boolean(params.assetId),
    placeholderData: (previous) => previous,
    retry: 1,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load asset usage logs" },
  });
}
