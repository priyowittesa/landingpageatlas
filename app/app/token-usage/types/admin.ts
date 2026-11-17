// Feature-scoped types for the Token Usage admin pages:
//   - Clients list + Client detail (policy override / revert / bulk update)
//   - Audit Trail
//
// Imported as:
//   import type { TokenClient } from "@/app/app/token-usage/types/admin";

// ---------------------------------------------------------------------------
// Policy primitives
// ---------------------------------------------------------------------------

/** How often a token quota resets. */
export type TokenResetPeriod = "daily" | "weekly" | "monthly" | "quarterly";

/** The concrete values that make up a token policy (default or override). */
export interface TokenPolicyValues {
  /** Token allowance granted per reset cycle. */
  allowance: number;
  /** How often the allowance refills. */
  resetPeriod: TokenResetPeriod;
}

/** Where a client's currently-in-force policy comes from. */
export type TokenPolicySource = "default" | "override";

/**
 * Policy status reported by the client-quotas API. `scheduled` means a pending
 * change is waiting to take effect; the in-force policy is still an override.
 */
export type TokenClientPolicyStatus = "default" | "custom" | "scheduled";

/** Lifecycle status of a per-client override. */
export type TokenOverrideStatus = "active" | "pending" | "cancelled";

// ---------------------------------------------------------------------------
// Clients list
// ---------------------------------------------------------------------------

/** One row of the admin Clients list. */
export interface TokenClient {
  id: string;
  name: string;
  email: string;
  /** Whether the client uses the default policy or a custom override. */
  policySource: TokenPolicySource;
  /** Human label for the policy source — "Default" / "Custom" / "Schedule". */
  status: "Default" | "Custom" | "Schedule";
  /** True when a scheduled (pending) policy change is waiting to take effect. */
  hasScheduledChange: boolean;
  /** Effective date of the pending change, when applicable. */
  scheduledEffectiveAt?: string;
  /** In-force allowance for the current cycle. */
  quota: number;
  used: number;
  remaining: number;
  /** Share of the quota still available, 0-100. */
  remainingPercent: number;
  /** Raw reset period from the API — used to seed the edit dialog. */
  resetPeriod?: TokenResetPeriod;
  /** Human-readable reset period, e.g. "Monthly - day 1". */
  resetPeriodLabel: string;
  /** Human-readable next reset date, e.g. "Monthly - day 1". */
  nextResetLabel: string;
  /** Plan tier shown under the client name, e.g. "Enterprise". */
  plan: string;
  /** Number of users on the plan. */
  userCount: number;
  lastUsedAt: string;
}

export interface TokenClientsList {
  clients: TokenClient[];
  total: number;
  /** Number of clients using the default policy. */
  defaultCount: number;
  /** Number of clients with a custom override. */
  customCount: number;
  /** Number of clients with a pending scheduled change. */
  scheduledCount: number;
}

export interface TokenClientsFilter {
  search?: string;
  /** Policy status filter — matches the `policy_status` query param. */
  status?: TokenClientPolicyStatus | "all";
  /** Reset period filter — matches the `reset_period` query param. */
  resetPeriod?: TokenResetPeriod | "all";
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Client detail
// ---------------------------------------------------------------------------

/** A scheduled policy change shown on the client detail banner. */
export interface TokenScheduledPolicy {
  values: TokenPolicyValues;
  /** When the scheduled change takes effect (RFC3339). */
  effectiveAt: string;
  status: TokenOverrideStatus;
}

/** Full client detail — compares the default policy against the in-force one. */
export interface TokenClientDetail {
  id: string;
  name: string;
  email: string;
  policySource: TokenPolicySource;
  /** The tenant-wide default policy (baseline). */
  defaultPolicy: TokenPolicyValues;
  /** The policy currently in effect for this client. */
  inForcePolicy: TokenPolicyValues;
  /** A pending scheduled change, when present. */
  scheduledPolicy?: TokenScheduledPolicy;
  quota: number;
  used: number;
  remaining: number;
  remainingPercent: number;
  periodStart: string;
  periodEnd: string;
  lastUsedAt: string;
}

/** Payload for creating/updating a client override. */
export interface TokenOverridePayload {
  allowance: number;
  resetPeriod: TokenResetPeriod;
  /** "immediate" applies now; "scheduled" stores a pending change. */
  applyMode: "immediate" | "scheduled";
  /** Required when applyMode === "scheduled". */
  effectiveAt?: string;
}

/** Result returned after applying an override — drives the undo toast. */
export interface TokenOverrideResult {
  clientId: string;
  affectedClients?: number;
  /** Seconds the change can be undone, when an undo window is offered. */
  undoWindowSeconds?: number;
}

/** Result of a revert-to-default — drives the undo toast. */
export interface TokenRevertResult {
  clientId: string;
  undoWindowSeconds?: number;
}

/** Payload for updating the tenant-wide default policy. */
export interface TokenDefaultPolicyPayload {
  allowance: number;
  resetPeriod: TokenResetPeriod;
}

/** One client's update inside PUT /v1/portal/token-usage/client-quotas. */
export interface TokenClientQuotaUpdateItem {
  tenant_id: string;
  allowance: number;
  reset_period: TokenResetPeriod;
}

// ---------------------------------------------------------------------------
// Bulk update
// ---------------------------------------------------------------------------

/** Payload for a bulk policy update across multiple clients. */
export interface TokenBulkUpdatePayload {
  clientIds: string[];
  allowance: number;
  resetPeriod: TokenResetPeriod;
  applyMode: "immediate" | "scheduled";
  effectiveAt?: string;
}

/** One client's outcome in a bulk update. */
export interface TokenBulkUpdateResultRow {
  clientId: string;
  clientName: string;
  success: boolean;
  message?: string;
}

export interface TokenBulkUpdateResult {
  succeeded: number;
  failed: number;
  rows: TokenBulkUpdateResultRow[];
}

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------

/** The kind of policy action recorded in the audit trail. */
export type TokenAuditAction =
  | "create"
  | "update"
  | "apply"
  | "schedule"
  | "revert";

/** A single field-level change inside an audit entry. */
export interface TokenAuditDiff {
  field: string;
  old: string;
  new: string;
}

/** One row of the Audit Trail. */
export interface TokenAuditEntry {
  id: string;
  occurredAt: string;
  adminName: string;
  adminEmail: string;
  clientId?: string;
  /** The tenant / client the change applies to, or "Default policy". */
  tenantName: string;
  action: TokenAuditAction;
  summary: string;
  diff: TokenAuditDiff[];
  /** Whether the change can still be undone (5-minute window). */
  undoAvailable: boolean;
}

export interface TokenAuditTrail {
  entries: TokenAuditEntry[];
  total: number;
}

export interface TokenAuditTrailFilter {
  search?: string;
  clientId?: string;
  /** Admin display name, matched against the "All admins" dropdown. */
  admin?: string;
  action?: TokenAuditAction | "all";
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

export const resetPeriodLabels: Record<TokenResetPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const resetPeriodOptions: TokenResetPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
];

export const auditActionLabels: Record<TokenAuditAction, string> = {
  create: "Create",
  update: "Update",
  apply: "Apply",
  schedule: "Schedule",
  revert: "Revert",
};

/** Actions offered in the audit-trail filter dropdown (matches the API). */
export const auditActionOptions: TokenAuditAction[] = [
  "create",
  "update",
  "schedule",
];

/** Soft pill colours matching the design's POLICY column. */
export const auditActionClassMap: Record<TokenAuditAction, string> = {
  create: "border-transparent bg-rose-100 text-rose-700",
  update: "border-transparent bg-blue-100 text-blue-700",
  apply: "border-transparent bg-emerald-100 text-emerald-700",
  schedule: "border-transparent bg-violet-100 text-violet-700",
  revert: "border-transparent bg-amber-100 text-amber-700",
};

// ---------------------------------------------------------------------------
// Raw API response shapes (snake_case from the portal token-usage API).
// Mapped to the UI types above in lib/admin-api.ts.
// ---------------------------------------------------------------------------

export interface ApiPolicyValues {
  allowance: string;
  reset_period: TokenResetPeriod;
  reset_day: number;
  carry_over: boolean;
}

export interface ApiTokenClient {
  id: string;
  name: string;
  email: string;
  policy_source: TokenPolicySource;
  has_scheduled_change: boolean;
  scheduled_effective_at?: string;
  balance: {
    allowance: string;
    used: string;
    available: string;
  };
  remaining_percent: number;
  reset_period_label?: string;
  next_reset_label?: string;
  plan?: string;
  user_count?: number;
  last_used: string;
}

export interface ApiTokenClientsResponse {
  clients: ApiTokenClient[];
  total: number;
  default_count: number;
  custom_count: number;
  scheduled_count: number;
}

/** One row of GET /v1/portal/token-usage/client-quotas. */
export interface ApiClientQuotaItem {
  tenant_id: string;
  client_name: string;
  package_name: string;
  member_count: number;
  policy_status: TokenClientPolicyStatus;
  reset_period: TokenResetPeriod;
  /** Token allowance per cycle, decimal string. */
  allowance: string;
  /** Tokens used this cycle, decimal string. */
  used_tokens: string;
  /** Share of the allowance already used, 0-100. */
  percentage_used: number;
  /** RFC3339 timestamp of the next scheduled reset. */
  next_reset_at: string;
}

/** Response of GET /v1/portal/token-usage/client-quotas. */
export interface ApiClientQuotasResponse {
  items: ApiClientQuotaItem[];
  page: number;
  page_size: number;
  /** Total row count, returned as a decimal string. */
  total_count: string;
}

/** Response of GET /v1/portal/token-usage/client-quotas/policy-detail. */
export interface ApiClientPolicyDetail {
  tenant_id: string;
  /** In-force allowance per cycle, decimal string. */
  allowance: string;
  /** Default (baseline) allowance, decimal string. */
  default_allowance: string;
  /** In-force reset period. */
  reset_period: TokenResetPeriod;
  /** Default reset period. */
  default_reset_period: TokenResetPeriod;
  /** Tokens used this cycle, decimal string. */
  used_tokens: string;
  /** Tokens remaining this cycle, decimal string. */
  remaining_tokens: string;
  /** Share of allowance used, 0-100. */
  percentage_used: number;
  /** "default" | "custom" | "scheduled". */
  policy_status: TokenClientPolicyStatus;
  /** RFC3339 timestamp of the last reset. */
  last_reset_at: string;
  /** RFC3339 timestamp of the next scheduled reset. */
  next_reset_at: string;
  /** RFC3339 timestamp of a pending scheduled change, or null. */
  pending_reset_at: string | null;
  /** Reset period of a pending scheduled change, or "". */
  pending_reset_period: string;
}

export interface ApiTokenClientDetail {
  id: string;
  name: string;
  email: string;
  policy_source: TokenPolicySource;
  default_policy: ApiPolicyValues;
  in_force_policy: ApiPolicyValues;
  scheduled_policy?: {
    values: ApiPolicyValues;
    effective_at: string;
    status: TokenOverrideStatus;
  };
  balance: {
    allowance: string;
    used: string;
    available: string;
  };
  remaining_percent: number;
  period_start: string;
  period_end: string;
  last_used: string;
}

export interface ApiTokenOverrideResult {
  client_id: string;
  affected_clients?: number;
  undo_window_seconds?: number;
}

export interface ApiTokenRevertResult {
  client_id: string;
  undo_window_seconds?: number;
}

export interface ApiTokenBulkUpdateResultRow {
  client_id: string;
  client_name: string;
  success: boolean;
  message?: string;
}

export interface ApiTokenBulkUpdateResult {
  succeeded: number;
  failed: number;
  rows: ApiTokenBulkUpdateResultRow[];
}

export interface ApiTokenAuditDiff {
  field: string;
  old: string;
  new: string;
}

/** One row of GET /v1/portal/token-usage/client-quotas/audit-trail. */
export interface ApiAuditTrailItem {
  id: string;
  /** "create" | "update" | "schedule". */
  action: TokenAuditAction;
  /** When the audit entry was recorded (RFC3339). */
  created_at: string;
  /** When the policy change takes/took effect (RFC3339). */
  effective_at: string;
  /** New allowance, decimal string. */
  allowance: string;
  /** Previous allowance, decimal string. */
  previous_allowance: string;
  /** New reset period. */
  reset_period: string;
  /** Previous reset period. */
  previous_reset_period: string;
  /** Admin who made the change. */
  admin: {
    id: string;
    name: string;
  };
  /** Tenant the change applies to. */
  tenant: {
    id: string;
    name: string;
  };
}

/** Response of GET /v1/portal/token-usage/client-quotas/audit-trail. */
export interface ApiAuditTrailResponse {
  items: ApiAuditTrailItem[];
  page: number;
  page_size: number;
  /** Total row count, returned as a decimal string. */
  total_count: string;
}

/** One row of GET /v1/portal/token-usage/client-quotas/changes. */
export interface ApiChangeItem {
  id: string;
  /** Who made the change. */
  actor: string;
  /** Tenant the change applies to. */
  tenant_id: string;
  /** New allowance, decimal string. */
  allowance: string;
  /** Previous allowance, decimal string. */
  previous_allowance: string;
  /** New reset period. */
  reset_period: string;
  /** Previous reset period. */
  previous_reset_period: string;
  /** When the change was recorded (RFC3339). */
  created_at: string;
  /** When the change takes/took effect (RFC3339). */
  effective_at: string;
}

/** Response of GET /v1/portal/token-usage/client-quotas/changes. */
export interface ApiChangesResponse {
  changes: ApiChangeItem[];
  page: number;
  page_size: number;
  /** Total row count, returned as a decimal string. */
  total_count: string;
}

// ---------------------------------------------------------------------------
// Policy summary (admin overview)
// ---------------------------------------------------------------------------

/** Admin who last updated the default policy. */
export interface ApiPolicySummaryActor {
  id: string;
  name: string;
}

/** The `default_policy` block of the policy-summary response. */
export interface ApiPolicySummaryDefault {
  /** Default allowance per cycle, decimal string. */
  allowance: string;
  reset_period: TokenResetPeriod;
  /** RFC3339 timestamp of the last edit. */
  updated_at: string;
  updated_by: ApiPolicySummaryActor;
}

/** The `policy_spread` block of the policy-summary response. */
export interface ApiPolicySummarySpread {
  /** Clients on the default policy, decimal string. */
  clients_on_default: string;
  /** Clients with a custom override, decimal string. */
  clients_with_custom_policy: string;
  /** Total committed quota per cycle, decimal string. */
  committed_quota_per_cycle: string;
  /** Pending scheduled changes, decimal string. */
  scheduled_changes_pending: string;
}

/** Response of GET /v1/portal/token-usage/client-quotas/policy-summary. */
export interface ApiPolicySummaryResponse {
  default_policy: ApiPolicySummaryDefault;
  policy_spread: ApiPolicySummarySpread;
}

/** UI shape for the policy-summary, mapped from the snake_case API response. */
export interface TokenPolicySummary {
  defaultPolicy: {
    allowance: number;
    resetPeriod: TokenResetPeriod;
    updatedAt: string;
    updatedBy: { id: string; name: string };
  };
  policySpread: {
    clientsOnDefault: number;
    clientsWithCustomPolicy: number;
    committedQuotaPerCycle: number;
    scheduledChangesPending: number;
  };
}
