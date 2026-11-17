// Feature-scoped types for the Token Usage module.
// Imported as:
//   import type { TokenUsageOverview } from "@/app/app/token-usage/types";

/** Status of a single AI request logged against the token quota. */
export type TokenRequestStatus = "completed" | "rejected" | "failed" | "running";

/** Health of a user's remaining token balance, driven by the warning threshold. */
export type TokenUserStatus =
  | "normal"
  | "completed"
  | "running_low"
  | "out_of_tokens";

/** Bucket granularity for the consumption chart / usage history. */
export type TokenUsageGranularity = "daily" | "weekly" | "monthly";

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

/** One bar of the consumption chart. */
export interface TokenConsumptionPoint {
  /** Axis label — day number, ISO week or month depending on granularity. */
  label: string;
  tokens: number;
}

export interface TokenConsumptionSeries {
  granularity: TokenUsageGranularity;
  points: TokenConsumptionPoint[];
  /** Dashed reference line drawn across the chart. */
  average: number;
}

/** A single row of the "Usage by module" breakdown. */
export interface TokenModuleUsage {
  module: string;
  tokens: number;
  /** Share of the period's total consumption, 0-100. */
  percent: number;
}

export interface TokenPeriodBalance {
  remaining: number;
  quota: number;
  used: number;
  /** Share of the quota still available, 0-100. */
  remainingPercent: number;
  periodStart: string;
  periodEnd: string;
  /** Projected exhaustion date, or an empty string when not at risk. */
  projectedRunOutAt: string;
  dailyAverage: number;
  peakDayTokens: number;
}

export interface TokenUsageOverview {
  usedToday: number;
  requestsToday: number;
  /** Change vs. yesterday in percent — negative means a decrease. */
  usedTodayTrendPercent: number;
  /** Total active modules for the tenant, from the API's `active_modules` field. */
  activeModulesCount: number;
  /** Names of modules that consumed tokens in the current period. */
  activeModules: string[];
  warningThresholdPercent: number;
  quotaResetsInDays: number;
  quotaResetsAt: string;
  estimatedRequestsLeft: number;
  estimatedDaysLeft: number;
  balance: TokenPeriodBalance;
  moduleUsage: TokenModuleUsage[];
  consumption: TokenConsumptionSeries;
}

// ---------------------------------------------------------------------------
// Usage history
// ---------------------------------------------------------------------------

/** One logged AI request in the usage history table. */
export interface TokenUsageLogEntry {
  id: string;
  requestId: string;
  occurredAt: string;
  module: string;
  feature: string;
  /** Null when the request was rejected before consuming tokens. */
  tokens: number | null;
  status: TokenRequestStatus;
  /** HTTP-ish code shown next to a rejected status, e.g. "402". */
  statusCode?: string;
}

export interface TokenUsageHistory {
  consumption: TokenConsumptionSeries;
  entries: TokenUsageLogEntry[];
}

export interface TokenUsageHistoryFilter {
  granularity?: TokenUsageGranularity;
  search?: string;
  module?: string;
  /** Inclusive RFC3339 timestamp sent to the API as `from`. */
  from?: string;
  /** Exclusive RFC3339 timestamp sent to the API as `to`. */
  to?: string;
  /** Module UUID sent to the API as `module_id`. */
  moduleId?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Monitoring (tenant admin)
// ---------------------------------------------------------------------------

/** One row of the tenant-wide per-user monitoring table. */
export interface TokenTenantUser {
  id: string;
  name: string;
  email: string;
  used_tokens: number;
  /** Tokens consumed that matched the active filter, decimal string from API. */
  filteredTokens: number;
  /** Tokens reserved for in-flight requests, decimal string from API. */
  reservedTokens: number;
  /** Share of the tenant's total usage attributed to this user, 0-100. */
  percentageOfTenantUsage: number;
  /** Whether the user is a current member of the tenant. */
  currentMember: boolean;
  lastUsedAt: string;
}

export interface TokenMonitoring {
  tenantQuota: number;
  activeUsers: number;
  usedThisMonth: number;
  /** Share of the tenant quota consumed this month, 0-100. */
  usedPercent: number;
  usersRunningLow: number;
  usersBlocked: number;
  warningThresholdPercent: number;
  defaultUserQuota: number;
  consumption: TokenConsumptionSeries;
  users: TokenTenantUser[];
}

export interface TokenMonitoringFilter {
  search?: string;
  granularity?: TokenUsageGranularity;
  /** Inclusive RFC3339 timestamp sent to the API as `from`. */
  from?: string;
  /** Exclusive RFC3339 timestamp sent to the API as `to`. */
  to?: string;
  /** Module UUID sent to the API as `module_id`. */
  moduleId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Payload for the token quota dialog.
 * Maps to the body of PUT /v1/portal/token-usage/quota.
 */
export interface TokenThresholdFormDto {
  /** Tenant-wide token allowance for the billing period. */
  allowance: number;
  /** Subscription the quota is billed against — sourced from GET /quota. */
  subscription_id: string;
}

/** Payload for PUT /v1/portal/token-usage/settings. */
export interface TokenWarningThresholdDto {
  /** Percentage of remaining quota at which users are warned (1-100). */
  warning_threshold: number;
}

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

export const granularityOptions: TokenUsageGranularity[] = [
  "daily",
  "weekly",
  "monthly",
];

export const granularityLabels: Record<TokenUsageGranularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const requestStatusLabels: Record<TokenRequestStatus, string> = {
  completed: "Completed",
  rejected: "Rejected",
  failed: "Failed",
  running: "Running",
};

export const requestStatusClassMap: Record<TokenRequestStatus, string> = {
  completed: "border-emerald-400 bg-emerald-50 text-emerald-600",
  rejected: "border-red-400 bg-red-50 text-red-600",
  failed: "border-amber-400 bg-amber-50 text-amber-600",
  running: "border-blue-400 bg-blue-50 text-blue-600",
};

export const userStatusLabels: Record<TokenUserStatus, string> = {
  normal: "Normal",
  completed: "Completed",
  running_low: "Running low",
  out_of_tokens: "Out of tokens",
};

export const userStatusClassMap: Record<TokenUserStatus, string> = {
  normal: "border-gray-300 bg-gray-50 text-gray-600",
  completed: "border-emerald-400 bg-emerald-50 text-emerald-600",
  running_low: "border-amber-400 bg-amber-50 text-amber-600",
  out_of_tokens: "border-red-400 bg-red-50 text-red-600",
};

export const userStatusOptions: TokenUserStatus[] = [
  "normal",
  "completed",
  "running_low",
  "out_of_tokens",
];

// ---------------------------------------------------------------------------
// Raw API response shapes (decimal strings from the portal token-usage API).
// Mapped to the UI types above in lib/api.ts.
// ---------------------------------------------------------------------------

export interface ApiTokenQuota {
  allowance: string;
  anchor: string;
  configured: boolean;
  subscription_id: string;
  warning_threshold: number;
}

export interface ApiTokenBalance {
  allowance: string | null;
  available: string;
  overage: string;
  reserved: string;
  used: string;
}

export interface ApiConsumptionPoint {
  date: string;
  tokens: string;
}

export interface ApiConsumptionResponse {
  daily_average: number;
  daily_consumption: ApiConsumptionPoint[];
}

export interface ApiModuleConsumption {
  module_id: string;
  module_name: string;
  tokens: string;
}

export interface ApiModuleConsumptionDay {
  date: string;
  modules: ApiModuleConsumption[];
}

export interface ApiModuleConsumptionResponse {
  daily_module_consumption: ApiModuleConsumptionDay[];
}

export interface ApiTokenRequest {
  created_at: string;
  feature: string;
  id: string;
  input_tokens: string;
  module_id: string;
  module_name: string;
  output_tokens: string;
  period_start: string;
  producer: string;
  rejection_reason: string;
  request_id: string;
  reserved: string;
  status: TokenRequestStatus;
  total_tokens: string;
  updated_at: string;
  user_email: string;
  user_id: string;
  user_name: string;
}

export interface ApiTokenRequestsResponse {
  page: number;
  page_size: number;
  requests: ApiTokenRequest[];
  total_count: string;
}

export interface ApiOverviewResponse {
  active_modules: string;
  change_from_yesterday_percent: number;
  daily_module_consumption: ApiModuleConsumptionDay[];
  days_until_reset: string;
  estimated_days_left: number;
  estimated_requests_left: string;
  modules: ApiModuleConsumption[];
  page: number;
  page_size: number;
  percentage_left: number;
  period_end: string;
  period_start: string;
  quota: ApiTokenQuota;
  requests: ApiTokenRequest[];
  requests_today: string;
  resets_at: string;
  tenant_balance: ApiTokenBalance;
  used_today: string;
}

export interface ApiMonitoringResponse {
  active_users: string;
  blocked_users: string;
  daily_module_consumption: ApiModuleConsumptionDay[];
  page: number;
  page_size: number;
  percentage_used: number;
  period_end: string;
  period_start: string;
  quota: ApiTokenQuota;
  running_low_users: string;
  tenant_balance: ApiTokenBalance;
}

export interface ApiTenantUser {
  current_member: boolean;
  email: string;
  filtered_tokens: string;
  last_used: string | null;
  name: string;
  percentage_of_tenant_usage: number;
  reserved_tokens: string;
  used_tokens: string;
  user_id: string;
}

export interface ApiTenantUsersResponse {
  page: number;
  page_size: number;
  total_count: string;
  users: ApiTenantUser[];
}
