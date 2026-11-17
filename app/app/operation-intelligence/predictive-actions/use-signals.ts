"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/pertamina/signals";

export type SignalMetric = {
  label?: string;
  primary?: boolean;
  threshold?: number;
  unit?: string;
  value: number | string;
};

export type SignalEntity = {
  id?: string;
  kind?: string;
  name?: string;
};

export type SignalEvidence = {
  collection?: string;
  count?: number;
  filter?: Record<string, unknown>;
  period?: string;
};

export type SignalMetadata = {
  detector?: string;
  entity?: SignalEntity;
  evidence?: SignalEvidence[];
  first_seen_at?: string;
  is_active?: boolean;
  is_illustrative?: boolean;
  last_seen_at?: string;
  model_version?: string;
  narrative_by?: string;
  priority_score?: number;
  scan_id?: string;
  severity?: "risk" | "watch" | "opportunity" | "info" | string;
  source?: string;
  value_tags?: string[];
  [key: string]: unknown;
};

export type SignalFlag = {
  id: string;
  name: string;
};

export type ApiSignal = {
  id: string;
  code: string;
  title: string;
  description: string;
  reason_nexa: string;
  suggested_action: string;
  type: string;
  status: string;
  module_name: string;
  confidence: number;
  metrics: Record<string, SignalMetric | unknown> | null;
  metadata: SignalMetadata | null;
  flags?: SignalFlag[];
  flag_ids?: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
};

type SignalList = { items: ApiSignal[]; next_page_token: string };
export type SignalFilters = {
  code?: string;
  status?: string;
  type?: string;
  module_name?: string;
  flag_id?: string;
  created_after?: string;
  created_before?: string;
  page_size: number;
};

async function getSignals(filters: SignalFilters, pageToken?: string): Promise<SignalList> {
  const response = await axios.get<SignalList | ApiResponse<SignalList>>(URL, {
    params: { ...filters, ...(pageToken ? { page_token: pageToken } : {}) }
  });
  const body = "data" in response.data ? response.data.data : response.data;
  if (!body || !Array.isArray(body.items)) throw new Error("Invalid signals response");
  return { items: body.items, next_page_token: body.next_page_token ?? "" };
}

export function useSignals(filters: SignalFilters) {
  return useInfiniteQuery<SignalList, AxiosError<ApiResponseError>>({
    queryKey: ["pertamina", "signals", filters],
    initialPageParam: "",
    queryFn: ({ pageParam }) => getSignals(filters, String(pageParam || "")),
    getNextPageParam: (lastPage, _pages, _lastPageParam, pageParams) =>
      lastPage.next_page_token && !pageParams.includes(lastPage.next_page_token)
        ? lastPage.next_page_token
        : undefined,
    meta: { errorMessage: "Failed to load signals" }
  });
}

export type SignalCountByType = {
  insight?: number;
  prediction?: number;
  recommendation?: number;
  [key: string]: number | undefined;
};

async function getSignalCountByType(): Promise<SignalCountByType> {
  const response = await axios.get<SignalCountByType | ApiResponse<SignalCountByType>>(
    "/v1/pertamina/signals/count-by-type"
  );
  const body =
    "data" in response.data &&
    response.data.data &&
    typeof response.data.data === "object"
      ? response.data.data
      : response.data;
  return (body && typeof body === "object" ? body : {}) as SignalCountByType;
}

export function useSignalCountByType() {
  return useQuery<SignalCountByType, AxiosError<ApiResponseError>>({
    queryKey: ["pertamina", "signals", "count-by-type"],
    queryFn: getSignalCountByType,
    meta: { errorMessage: "Failed to load signal counts by type" }
  });
}

export function useSignalSummary() {
  return useQuery<SignalList, AxiosError<ApiResponseError>>({
    queryKey: ["pertamina", "signals", "summary"],
    queryFn: () => getSignals({ page_size: 100 }),
    meta: { errorMessage: "Failed to load signal summary" }
  });
}
