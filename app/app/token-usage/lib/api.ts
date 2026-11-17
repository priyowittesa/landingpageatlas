/**
 * Portal token-usage API client.
 *
 * The backend returns token counts as decimal strings and uses snake_case
 * fields. These fetchers call the real endpoints under
 * `/v1/portal/token-usage/*` and map the responses into the camelCase UI types
 * consumed by the components.
 */

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";

import type {
  ApiConsumptionResponse,
  ApiMonitoringResponse,
  ApiOverviewResponse,
  ApiTenantUser,
  ApiTokenQuota,
  ApiTokenRequest,
  ApiTokenRequestsResponse,
  ApiTenantUsersResponse,
  TokenConsumptionPoint,
  TokenConsumptionSeries,
  TokenMonitoring,
  TokenModuleUsage,
  TokenPeriodBalance,
  TokenRequestStatus,
  TokenTenantUser,
  TokenThresholdFormDto,
  TokenUsageGranularity,
  TokenWarningThresholdDto,
  TokenUsageHistory,
  TokenUsageLogEntry,
  TokenUsageOverview,
} from "../types";

const BASE_URL = "/v1/portal/token-usage";
const axios = axiosConfig(env.apiBaseUrl);

/** Query params shared by every token-usage endpoint that accepts a range. */
export interface TokenUsageRangeParams {
  from?: string;
  to?: string;
  module_id?: string;
  page?: number;
  page_size?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a decimal-string token count from the API into a number. */
function toNumber(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Collapse the API's daily consumption series into the requested granularity.
 * The API only returns daily buckets, so weekly / monthly views are aggregated
 * client-side to keep the chart responsive without an extra round-trip.
 */
function toConsumptionSeries(
  response: ApiConsumptionResponse,
  granularity: TokenUsageGranularity,
): TokenConsumptionSeries {
  const daily = response.daily_consumption ?? [];

  if (granularity === "daily") {
    const points: TokenConsumptionPoint[] = daily.map((point) => ({
      label: point.date.slice(5), // MM-DD
      tokens: toNumber(point.tokens),
    }));
    return {
      granularity,
      points,
      average: response.daily_average ?? 0,
    };
  }

  // Weekly / monthly buckets — group consecutive daily points.
  const buckets = new Map<string, { tokens: number }>();
  for (const point of daily) {
    const date = new Date(point.date);
    if (Number.isNaN(date.getTime())) continue;
    let key: string;
    if (granularity === "weekly") {
      // ISO week number — stable grouping within a single period.
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((date.getTime() - yearStart.getTime()) / 86_400_000 +
          yearStart.getDay() +
          1) /
        7,
      );
      key = `W${week}`;
    } else {
      key = date.toLocaleString("en-US", { month: "short" });
    }
    const bucket = buckets.get(key) ?? { tokens: 0 };
    bucket.tokens += toNumber(point.tokens);
    buckets.set(key, bucket);
  }

  const points = Array.from(buckets.entries()).map(([label, value]) => ({
    label,
    tokens: value.tokens,
  }));
  const total = points.reduce((sum, point) => sum + point.tokens, 0);
  return {
    granularity,
    points,
    average: points.length ? Math.round(total / points.length) : 0,
  };
}

/** Map a raw API request row to the UI log entry. */
function toLogEntry(raw: ApiTokenRequest): TokenUsageLogEntry {
  const status: TokenRequestStatus = raw.status;
  const tokens = toNumber(raw.total_tokens);
  return {
    id: raw.id,
    requestId: raw.request_id,
    occurredAt: raw.created_at,
    module: raw.module_name,
    feature: raw.feature,
    // Rejected requests never consume tokens — render an em dash in the table.
    tokens: status === "rejected" || status === "failed" ? null : tokens,
    status,
    statusCode: raw.rejection_reason || undefined,
  };
}

/** Map the tenant balance + period metadata to the UI balance card model. */
function toPeriodBalance(
  balance: ApiOverviewResponse["tenant_balance"],
  percentageLeft: number,
  periodStart: string,
  periodEnd: string,
  estimatedDaysLeft: number,
  dailyAverage: number,
  peakDayTokens: number,
): TokenPeriodBalance {
  const remaining = toNumber(balance.available);
  const quota = toNumber(balance.allowance);
  const used = toNumber(balance.used);

  // Projected run-out date — only meaningful when consumption is trending
  // toward exhaustion. Empty string keeps the UI in its "Not at risk" state.
  let projectedRunOutAt = "";
  if (estimatedDaysLeft > 0 && Number.isFinite(estimatedDaysLeft)) {
    const runOut = new Date();
    runOut.setDate(runOut.getDate() + Math.floor(estimatedDaysLeft));
    projectedRunOutAt = runOut.toISOString();
  }

  return {
    remaining,
    quota,
    used,
    remainingPercent: percentageLeft,
    periodStart,
    periodEnd,
    projectedRunOutAt,
    dailyAverage,
    peakDayTokens,
  };
}

/** Map the per-module totals from /overview into the breakdown rows. */
function toModuleUsage(
  modules: ApiOverviewResponse["modules"],
): TokenModuleUsage[] {
  const total = modules.reduce(
    (sum, module) => sum + toNumber(module.tokens),
    0,
  );
  return modules.map((module) => ({
    module: module.module_name,
    tokens: toNumber(module.tokens),
    percent: total ? Math.round((toNumber(module.tokens) / total) * 100) : 0,
  }));
}

/** Map a tenant user row to the UI model. */
function toTenantUser(raw: ApiTenantUser): TokenTenantUser {
  return {
    id: raw.user_id,
    name: raw.name,
    email: raw.email,
    used_tokens: toNumber(raw.used_tokens),
    filteredTokens: toNumber(raw.filtered_tokens),
    reservedTokens: toNumber(raw.reserved_tokens),
    percentageOfTenantUsage: raw.percentage_of_tenant_usage ?? 0,
    currentMember: raw.current_member ?? true,
    lastUsedAt: raw.last_used ?? "",
  };
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

/** GET /v1/portal/token-usage/consumption */
export async function fetchConsumption(
  params: TokenUsageRangeParams,
  granularity: TokenUsageGranularity = "daily",
): Promise<TokenConsumptionSeries> {
  const { data } = await axios.get<ApiConsumptionResponse>(
    `${BASE_URL}/consumption`,
    { params },
  );
  return toConsumptionSeries(data, granularity);
}

/**
 * GET /v1/portal/token-usage/overview + /consumption.
 *
 * Overview carries the KPIs, balance and module breakdown; the daily
 * consumption series is fetched in parallel so the chart and the balance
 * card's daily-average / peak-day stats stay in sync.
 */
export async function fetchOverview(
  params: TokenUsageRangeParams & { granularity?: TokenUsageGranularity },
): Promise<TokenUsageOverview> {
  const { granularity = "monthly", ...rangeParams } = params;
  const [overviewRes, consumptionRes] = await Promise.all([
    axios.get<ApiOverviewResponse>(`${BASE_URL}/overview`, {
      params: rangeParams,
    }),
    axios.get<ApiConsumptionResponse>(`${BASE_URL}/consumption`, {
      params: rangeParams,
    }),
  ]);
  const overview = overviewRes.data;
  const consumption = consumptionRes.data;

  const dailyPoints = (consumption.daily_consumption ?? []).map((point) =>
    toNumber(point.tokens),
  );
  const peakDayTokens = dailyPoints.length ? Math.max(...dailyPoints) : 0;

  return {
    usedToday: toNumber(overview.used_today),
    requestsToday: toNumber(overview.requests_today),
    usedTodayTrendPercent:
      Math.round(overview.change_from_yesterday_percent * 1000) / 1000,
    activeModulesCount: toNumber(overview.active_modules),
    activeModules: (overview.modules ?? []).map((module) => module.module_name),
    warningThresholdPercent: overview.quota?.warning_threshold ?? 0,
    quotaResetsInDays: toNumber(overview.days_until_reset),
    quotaResetsAt: overview.resets_at,
    estimatedRequestsLeft: toNumber(overview.estimated_requests_left),
    estimatedDaysLeft: overview.estimated_days_left,
    balance: toPeriodBalance(
      overview.tenant_balance,
      overview.percentage_left,
      overview.period_start,
      overview.period_end,
      overview.estimated_days_left,
      consumption.daily_average ?? 0,
      peakDayTokens,
    ),
    moduleUsage: toModuleUsage(overview.modules),
    consumption: toConsumptionSeries(consumption, granularity),
  };
}

/**
 * GET /v1/portal/token-usage/requests + /consumption.
 *
 * The request log is paginated server-side; the consumption chart is fetched
 * alongside so the trend above the table matches the selected granularity.
 */
export async function fetchUsageHistory(
  params: TokenUsageRangeParams & {
    granularity?: TokenUsageGranularity;
  },
): Promise<TokenUsageHistory> {
  const { granularity = "monthly", ...rangeParams } = params;
  const [requestsRes, consumptionRes] = await Promise.all([
    axios.get<ApiTokenRequestsResponse>(`${BASE_URL}/requests`, {
      params: rangeParams,
    }),
    axios.get<ApiConsumptionResponse>(`${BASE_URL}/consumption`, {
      params: rangeParams,
    }),
  ]);

  return {
    consumption: toConsumptionSeries(consumptionRes.data, granularity),
    entries: (requestsRes.data.requests ?? []).map(toLogEntry),
  };
}

/**
 * GET /v1/portal/token-usage/monitoring + /consumption + /users.
 *
 * Monitoring combines the tenant-wide KPIs, the tenant consumption trend and
 * the per-user balance table into a single view.
 */
export async function fetchMonitoring(
  params: TokenUsageRangeParams & {
    granularity?: TokenUsageGranularity;
  },
): Promise<TokenMonitoring> {
  const granularity = params.granularity ?? "daily";
  const [monitoringRes, consumptionRes, usersRes] = await Promise.all([
    axios.get<ApiMonitoringResponse>(`${BASE_URL}/monitoring`, { params }),
    axios.get<ApiConsumptionResponse>(`${BASE_URL}/consumption`, { params }),
    axios.get<ApiTenantUsersResponse>(`${BASE_URL}/users`, { params }),
  ]);

  const monitoring = monitoringRes.data;
  const tenantQuota = toNumber(monitoring.quota?.allowance);

  return {
    tenantQuota,
    activeUsers: toNumber(monitoring.active_users),
    usedThisMonth: toNumber(monitoring.tenant_balance?.used),
    usedPercent: monitoring.percentage_used,
    usersRunningLow: toNumber(monitoring.running_low_users),
    usersBlocked: toNumber(monitoring.blocked_users),
    warningThresholdPercent: monitoring.quota?.warning_threshold ?? 0,
    defaultUserQuota: tenantQuota,
    consumption: toConsumptionSeries(consumptionRes.data, granularity),
    users: (usersRes.data.users ?? []).map((user) => toTenantUser(user)),
  };
}

/** GET /v1/portal/token-usage/settings — seeds the quota dialog. */
export async function fetchSettings(): Promise<TokenThresholdFormDto> {
  const { data } = await axios.get<ApiTokenQuota>(`${BASE_URL}/settings`);
  return {
    allowance: toNumber(data.allowance),
    subscription_id: data.subscription_id,
  };
}

/** GET /v1/portal/token-usage/quota — admin-only quota config. */
export async function fetchQuota(): Promise<TokenThresholdFormDto> {
  const { data } = await axios.get<ApiTokenQuota>(`${BASE_URL}/quota`);
  return {
    allowance: toNumber(data.allowance),
    subscription_id: data.subscription_id,
  };
}

/** PUT /v1/portal/token-usage/quota — update tenant quota. */
export async function updateQuota(payload: TokenThresholdFormDto): Promise<void> {
  await axios.put(`${BASE_URL}/quota`, {
    allowance: payload.allowance,
    subscription_id: payload.subscription_id,
  });
}

/** PUT /v1/portal/token-usage/settings — update the warning threshold. */
export async function updateWarningThreshold(
  payload: TokenWarningThresholdDto,
): Promise<void> {
  await axios.put(`${BASE_URL}/settings`, {
    warning_threshold: payload.warning_threshold,
  });
}

// ---------------------------------------------------------------------------
// Exports (CSV blob downloads)
// ---------------------------------------------------------------------------

/** Trigger a browser download for a blob response. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Extract a filename from the Content-Disposition header, with a fallback. */
function filenameFromDisposition(headers: Record<string, unknown>): string {
  const disposition = String(headers?.["content-disposition"] ?? "");
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match?.[1] ?? "export.csv";
}

/** GET /v1/portal/token-usage/requests/export — CSV of every matching request. */
export async function exportRequestsCsv(
  params: TokenUsageRangeParams,
): Promise<void> {
  const response = await axios.get(`${BASE_URL}/requests/export`, {
    params,
    responseType: "blob",
  });
  const blob = new Blob([response.data as BlobPart], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filenameFromDisposition(response.headers));
}

/** GET /v1/portal/token-usage/users/export — CSV of tenant member usage. */
export async function exportUsersCsv(
  params: TokenUsageRangeParams,
): Promise<void> {
  const response = await axios.get(`${BASE_URL}/users/export`, {
    params,
    responseType: "blob",
  });
  const blob = new Blob([response.data as BlobPart], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filenameFromDisposition(response.headers));
}
