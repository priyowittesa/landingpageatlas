"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import type { ApiResponseError } from "@/types/api";
import { useAuthMe } from "@/hooks/useAuthMe";
import {
  exportRequestsCsv,
  exportUsersCsv,
  fetchMonitoring,
  fetchOverview,
  fetchSettings,
  fetchUsageHistory,
  updateQuota,
  updateWarningThreshold,
  type TokenUsageRangeParams,
} from "../lib/api";
import type {
  TokenMonitoring,
  TokenMonitoringFilter,
  TokenThresholdFormDto,
  TokenUsageHistory,
  TokenUsageHistoryFilter,
  TokenUsageGranularity,
  TokenUsageOverview,
  TokenWarningThresholdDto,
} from "../types";

export const tokenUsageKeys = {
  all: ["token-usage"] as const,
  overview: (params?: TokenUsageRangeParams) =>
    [...tokenUsageKeys.all, "overview", params] as const,
  history: (params?: TokenUsageHistoryFilter) =>
    [...tokenUsageKeys.all, "history", params] as const,
  monitoring: (params?: TokenMonitoringFilter) =>
    [...tokenUsageKeys.all, "monitoring", params] as const,
  settings: () => [...tokenUsageKeys.all, "settings"] as const,
};

/** Strip the client-only filter fields before sending the query to the API. */
function toRangeParams(
  filter: TokenUsageHistoryFilter | TokenMonitoringFilter,
): TokenUsageRangeParams {
  return {
    from: filter.from,
    to: filter.to,
    module_id: filter.moduleId,
    page: filter.page,
    page_size: filter.pageSize,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Personal token balance, per-module breakdown and daily consumption. */
export function useTokenUsageOverview(
  params: TokenUsageRangeParams & {
    granularity?: TokenUsageGranularity;
  } = {},
) {
  return useQuery<TokenUsageOverview, AxiosError<ApiResponseError>>({
    queryKey: tokenUsageKeys.overview(params),
    queryFn: () => fetchOverview(params),
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load token usage" },
  });
}

/**
 * Consumption trend plus the request-level log. `granularity` swaps the chart
 * buckets; filtering of the log rows happens client-side in the component so
 * the search box stays responsive.
 */
export function useTokenUsageHistory(filter: TokenUsageHistoryFilter = {}) {
  return useQuery<TokenUsageHistory, AxiosError<ApiResponseError>>({
    queryKey: tokenUsageKeys.history(filter),
    queryFn: () =>
      fetchUsageHistory({
        ...toRangeParams(filter),
        granularity: filter.granularity,
      }),
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load usage history" },
  });
}

/** Tenant-wide quota, per-user balances and the tenant consumption trend. */
export function useTokenMonitoring(filter: TokenMonitoringFilter = {}) {
  return useQuery<TokenMonitoring, AxiosError<ApiResponseError>>({
    queryKey: tokenUsageKeys.monitoring(filter),
    queryFn: () =>
      fetchMonitoring({
        ...toRangeParams(filter),
        granularity: filter.granularity,
      }),
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load token monitoring" },
  });
}

/** Current warning threshold + quota — seeds the settings dialog. */
export function useTokenUsageSettings() {
  return useQuery<TokenThresholdFormDto, AxiosError<ApiResponseError>>({
    queryKey: tokenUsageKeys.settings(),
    queryFn: fetchSettings,
    meta: { errorMessage: "Failed to load token usage settings" },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Persist the tenant-wide quota allowance. */
export function useUpdateTokenQuota() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    AxiosError<ApiResponseError>,
    TokenThresholdFormDto
  >({
    mutationFn: updateQuota,
    meta: {
      errorMessage: "Failed to update token allowance",
      successMessage: "Token allowance updated",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenUsageKeys.all });
    },
  });
}

/** Persist the tenant-wide warning threshold via PUT /settings. */
export function useUpdateWarningThreshold() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    AxiosError<ApiResponseError>,
    TokenWarningThresholdDto
  >({
    mutationFn: updateWarningThreshold,
    meta: {
      errorMessage: "Failed to update warning threshold",
      successMessage: "Warning threshold updated",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenUsageKeys.all });
    },
  });
}

/** Download every matching request as a CSV via /requests/export. */
export function useExportTokenRequests() {
  return useMutation<void, AxiosError<ApiResponseError>, TokenUsageRangeParams>({
    mutationFn: exportRequestsCsv,
    meta: { errorMessage: "Failed to export request history" },
  });
}

/** Download tenant member usage as a CSV via /users/export. */
export function useExportTokenUsers() {
  return useMutation<void, AxiosError<ApiResponseError>, TokenUsageRangeParams>({
    mutationFn: exportUsersCsv,
    meta: { errorMessage: "Failed to export user usage" },
  });
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/**
 * Token Usage is only available to tenants with at least one subscription on
 * GET /v1/auth/me. The admin pages (Monitoring, Clients, Audit Trail) only
 * require `is_admin === true` — they are not gated by subscription status.
 */
export function useTokenUsageAccess() {
  const { data: me, isLoading, isError } = useAuthMe();

  return useMemo(() => {
    const subscriptions = me?.subscription ?? [];
    const hasSubscription =
      me?.has_subscription === true || subscriptions.length > 0;
    const isAdmin = me?.is_admin === true;

    return {
      isLoading,
      isError,
      /** Grants access to Overview and Usage History. */
      canViewTokenUsage: hasSubscription,
      /** Grants access to admin pages (Monitoring, Clients, Audit Trail). */
      isAdmin,
      /** Grants access to Monitoring. */
      canViewMonitoring: isAdmin,
      subscriptionExpired: me?.subscription_expired === true,
    };
  }, [me, isLoading, isError]);
}
