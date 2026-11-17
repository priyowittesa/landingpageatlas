/**
 * Admin API client for the Token Usage module.
 *
 * Covers the Clients list, Client detail (override / revert / bulk update) and
 * Audit Trail endpoints under `/v1/portal/token-usage/*`. The backend returns
 * token counts as decimal strings and uses snake_case fields; these fetchers
 * map the responses into the camelCase UI types consumed by the components.
 */

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";

import { formatShortDate } from "../lib/format";
import type {
  ApiAuditTrailItem,
  ApiAuditTrailResponse,
  ApiChangesResponse,
  ApiClientPolicyDetail,
  ApiClientQuotaItem,
  ApiClientQuotasResponse,
  ApiPolicySummaryResponse,
  ApiTokenBulkUpdateResult,
  ApiTokenOverrideResult,
  ApiTokenRevertResult,
  TokenAuditAction,
  TokenAuditEntry,
  TokenAuditTrail,
  TokenAuditTrailFilter,
  TokenBulkUpdatePayload,
  TokenBulkUpdateResult,
  TokenBulkUpdateResultRow,
  TokenClient,
  TokenClientDetail,
  TokenClientQuotaUpdateItem,
  TokenClientsFilter,
  TokenClientsList,
  TokenDefaultPolicyPayload,
  TokenOverridePayload,
  TokenOverrideResult,
  TokenPolicySummary,
  TokenRevertResult,
  TokenResetPeriod,
  TokenScheduledPolicy,
} from "../types/admin";

const BASE_URL = "/v1/portal/token-usage";
const axios = axiosConfig(env.apiBaseUrl);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clientStatus(
  source: TokenClient["policySource"],
  hasScheduledChange?: boolean,
): TokenClient["status"] {
  if (hasScheduledChange) return "Schedule";
  return source === "override" ? "Custom" : "Default";
}

const RESET_PERIOD_LABELS: Record<TokenResetPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

/** Map a client-quotas row into the UI `TokenClient` shape. */
function toClientFromQuota(raw: ApiClientQuotaItem): TokenClient {
  const quota = toNumber(raw.allowance);
  const used = toNumber(raw.used_tokens);
  const remaining = Math.max(0, quota - used);
  const hasScheduledChange = raw.policy_status === "scheduled";
  const policySource: TokenClient["policySource"] =
    raw.policy_status === "default" ? "default" : "override";
  return {
    id: raw.tenant_id,
    name: raw.client_name,
    email: "",
    policySource,
    status: clientStatus(policySource, hasScheduledChange),
    hasScheduledChange,
    quota,
    used,
    remaining,
    remainingPercent: Math.max(0, 100 - raw.percentage_used),
    resetPeriod: raw.reset_period,
    resetPeriodLabel: RESET_PERIOD_LABELS[raw.reset_period] ?? "",
    nextResetLabel: formatShortDate(raw.next_reset_at),
    plan: raw.package_name ?? "",
    userCount: raw.member_count ?? 0,
    lastUsedAt: "",
  };
}

/**
 * Map a policy-detail response into the UI `TokenClientDetail`.
 *
 * The policy-detail endpoint is flatter than the legacy client detail shape —
 * it does not carry `name`, `email`, or `last_used`. Those default to empty
 * strings so the existing UI and dialogs keep working; the fields that are
 * present drive the display.
 */
function toClientDetailFromPolicy(
  raw: ApiClientPolicyDetail,
): TokenClientDetail {
  const inForceAllowance = toNumber(raw.allowance);
  const defaultAllowance = toNumber(raw.default_allowance);
  const inForceResetPeriod = raw.reset_period;
  const defaultResetPeriod = raw.default_reset_period;

  const hasScheduled = Boolean(raw.pending_reset_at);
  const pendingResetPeriod = raw.pending_reset_period as TokenResetPeriod;

  const scheduledPolicy: TokenScheduledPolicy | undefined = hasScheduled
    ? {
      values: {
        allowance: inForceAllowance,
        resetPeriod: pendingResetPeriod || inForceResetPeriod,
      },
      effectiveAt: raw.pending_reset_at as string,
      status: "pending",
    }
    : undefined;

  return {
    id: raw.tenant_id,
    name: "",
    email: "",
    policySource: raw.policy_status === "default" ? "default" : "override",
    defaultPolicy: {
      allowance: defaultAllowance,
      resetPeriod: defaultResetPeriod,
    },
    inForcePolicy: {
      allowance: inForceAllowance,
      resetPeriod: inForceResetPeriod,
    },
    scheduledPolicy,
    quota: inForceAllowance,
    used: toNumber(raw.used_tokens),
    remaining: toNumber(raw.remaining_tokens),
    remainingPercent: Math.max(0, 100 - raw.percentage_used),
    periodStart: raw.last_reset_at,
    periodEnd: raw.next_reset_at,
    lastUsedAt: "",
  };
}

/** Map a client-quotas audit-trail row into the UI `TokenAuditEntry`. */
function toAuditEntryFromQuota(raw: ApiAuditTrailItem): TokenAuditEntry {
  const allowanceChanged = raw.allowance !== raw.previous_allowance;
  const periodChanged = raw.reset_period !== raw.previous_reset_period;

  const diff: { field: string; old: string; new: string }[] = [];
  if (allowanceChanged) {
    diff.push({
      field: "allowance",
      old: formatShortDate(raw.previous_allowance) || raw.previous_allowance,
      new: formatShortDate(raw.allowance) || raw.allowance,
    });
  }
  if (periodChanged) {
    diff.push({
      field: "reset_period",
      old: raw.previous_reset_period,
      new: raw.reset_period,
    });
  }
  // Always include at least one diff row so the ChangeCell renders.
  if (diff.length === 0) {
    diff.push({
      field: "allowance",
      old: raw.previous_allowance,
      new: raw.allowance,
    });
  }

  const summary =
    raw.action === "schedule"
      ? `Scheduled policy change effective ${formatShortDate(raw.effective_at)}`
      : `Updated policy for ${raw.tenant.name}`;

  return {
    id: raw.id,
    occurredAt: raw.created_at,
    adminName: raw.admin.name,
    adminEmail: "",
    clientId: raw.tenant.id,
    tenantName: raw.tenant.name,
    action: raw.action as TokenAuditAction,
    summary,
    diff,
    undoAvailable: false,
  };
}

function toOverrideResult(raw: ApiTokenOverrideResult): TokenOverrideResult {
  return {
    clientId: raw.client_id,
    affectedClients: raw.affected_clients,
    undoWindowSeconds: raw.undo_window_seconds,
  };
}

function toRevertResult(raw: ApiTokenRevertResult): TokenRevertResult {
  return {
    clientId: raw.client_id,
    undoWindowSeconds: raw.undo_window_seconds,
  };
}

function toBulkResult(raw: ApiTokenBulkUpdateResult): TokenBulkUpdateResult {
  return {
    succeeded: raw.succeeded,
    failed: raw.failed,
    rows: (raw.rows ?? []).map(
      (row): TokenBulkUpdateResultRow => ({
        clientId: row.client_id,
        clientName: row.client_name,
        success: row.success,
        message: row.message,
      }),
    ),
  };
}

// ---------------------------------------------------------------------------
// Clients list
// ---------------------------------------------------------------------------

/** GET /v1/portal/token-usage/client-quotas */
export async function fetchClients(
  filter: TokenClientsFilter = {},
): Promise<TokenClientsList> {
  const { data } = await axios.get<ApiClientQuotasResponse>(
    `${BASE_URL}/client-quotas`,
    {
      params: {
        search: filter.search || undefined,
        policy_status: filter.status === "all" ? undefined : filter.status,
        reset_period:
          filter.resetPeriod === "all" || !filter.resetPeriod
            ? undefined
            : filter.resetPeriod,
        page: filter.page,
        page_size: filter.pageSize,
      },
    },
  );
  return {
    clients: (data.items ?? []).map(toClientFromQuota),
    total: toNumber(data.total_count),
    defaultCount: 0,
    customCount: 0,
    scheduledCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Client detail
// ---------------------------------------------------------------------------

/** GET /v1/portal/token-usage/client-quotas/policy-detail?tenant_id= */
export async function fetchClientDetail(
  clientId: string,
): Promise<TokenClientDetail> {
  const { data } = await axios.get<ApiClientPolicyDetail>(
    `${BASE_URL}/client-quotas/policy-detail`,
    { params: { tenant_id: clientId } },
  );
  return toClientDetailFromPolicy(data);
}

/** PUT /v1/portal/token-usage/clients/:id/policy */
export async function applyClientOverride(
  clientId: string,
  payload: TokenOverridePayload,
): Promise<TokenOverrideResult> {
  const { data } = await axios.put<ApiTokenOverrideResult>(
    `${BASE_URL}/clients/${clientId}/policy`,
    {
      allowance: payload.allowance,
      reset_period: payload.resetPeriod,
      apply_mode: payload.applyMode,
      effective_at: payload.effectiveAt,
    },
  );
  return toOverrideResult(data);
}

/** DELETE /v1/portal/token-usage/clients/:id/policy — revert to default. */
export async function revertClientOverride(
  clientId: string,
): Promise<TokenRevertResult> {
  const { data } = await axios.delete<ApiTokenRevertResult>(
    `${BASE_URL}/clients/${clientId}/policy`,
  );
  return toRevertResult(data);
}

// ---------------------------------------------------------------------------
// Bulk update
// ---------------------------------------------------------------------------

/** POST /v1/portal/token-usage/clients/bulk */
export async function bulkUpdateClients(
  payload: TokenBulkUpdatePayload,
): Promise<TokenBulkUpdateResult> {
  const { data } = await axios.post<ApiTokenBulkUpdateResult>(
    `${BASE_URL}/clients/bulk`,
    {
      client_ids: payload.clientIds,
      allowance: payload.allowance,
      reset_period: payload.resetPeriod,
      apply_mode: payload.applyMode,
      effective_at: payload.effectiveAt,
    },
  );
  return toBulkResult(data);
}

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------

/** GET /v1/portal/token-usage/client-quotas/audit-trail */
export async function fetchAuditTrail(
  filter: TokenAuditTrailFilter = {},
): Promise<TokenAuditTrail> {
  const { data } = await axios.get<ApiAuditTrailResponse>(
    `${BASE_URL}/client-quotas/audit-trail`,
    {
      params: {
        search: filter.search || undefined,
        tenant_id: filter.clientId,
        admin_id: filter.admin,
        action: filter.action === "all" ? undefined : filter.action,
        from: filter.from,
        to: filter.to,
        page: filter.page,
        page_size: filter.pageSize,
      },
    },
  );
  return {
    entries: (data.items ?? []).map(toAuditEntryFromQuota),
    total: toNumber(data.total_count),
  };
}

// ---------------------------------------------------------------------------
// Upcoming / Recent changes
// ---------------------------------------------------------------------------

/** GET /v1/portal/token-usage/client-quotas/changes */
export async function fetchTokenChanges(
  filter: { tenantId?: string; incoming: boolean } = { incoming: true },
): Promise<ApiChangesResponse> {
  const { data } = await axios.get<ApiChangesResponse>(
    `${BASE_URL}/client-quotas/changes`,
    {
      params: {
        tenant_id: filter.tenantId,
        incoming: filter.incoming,
      },
    },
  );
  return data;
}

// ---------------------------------------------------------------------------
// Policy summary (admin overview)
// ---------------------------------------------------------------------------

/** Map the snake_case policy-summary response into the UI `TokenPolicySummary`. */
function toPolicySummary(raw: ApiPolicySummaryResponse): TokenPolicySummary {
  const dp = raw.default_policy;
  const ps = raw.policy_spread;
  return {
    defaultPolicy: {
      allowance: toNumber(dp.allowance),
      resetPeriod: dp.reset_period,
      updatedAt: dp.updated_at,
      updatedBy: { id: dp.updated_by.id, name: dp.updated_by.name },
    },
    policySpread: {
      clientsOnDefault: toNumber(ps.clients_on_default),
      clientsWithCustomPolicy: toNumber(ps.clients_with_custom_policy),
      committedQuotaPerCycle: toNumber(ps.committed_quota_per_cycle),
      scheduledChangesPending: toNumber(ps.scheduled_changes_pending),
    },
  };
}

/** GET /v1/portal/token-usage/client-quotas/policy-summary */
export async function fetchPolicySummary(): Promise<TokenPolicySummary> {
  const { data } = await axios.get<ApiPolicySummaryResponse>(
    `${BASE_URL}/client-quotas/policy-summary`,
  );
  return toPolicySummary(data);
}

/** PUT /v1/portal/token-usage/default-allowance — update the tenant-wide default policy. */
export async function updateDefaultAllowance(
  payload: TokenDefaultPolicyPayload,
): Promise<void> {
  await axios.put(`${BASE_URL}/default-allowance`, {
    allowance: payload.allowance,
    reset_period: payload.resetPeriod,
  });
}

// ---------------------------------------------------------------------------
// Bulk client-quota update (admin)
// ---------------------------------------------------------------------------

/** PUT /v1/portal/token-usage/client-quotas — set allowance + reset period per tenant. */
export async function updateClientQuotas(
  clients: TokenClientQuotaUpdateItem[],
): Promise<void> {
  await axios.put(`${BASE_URL}/client-quotas`, { clients });
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
  return match?.[1] ?? "audit-trail.csv";
}

/** GET /v1/portal/token-usage/client-quotas/audit-trail/export — CSV of matching entries. */
export async function exportAuditTrailCsv(
  filter: TokenAuditTrailFilter = {},
): Promise<void> {
  const response = await axios.get(`${BASE_URL}/client-quotas/audit-trail/export`, {
    params: {
      search: filter.search || undefined,
      tenant_id: filter.clientId,
      admin_id: filter.admin,
      action: filter.action === "all" ? undefined : filter.action,
      from: filter.from,
      to: filter.to,
    },
    responseType: "blob",
  });
  const blob = new Blob([response.data as BlobPart], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filenameFromDisposition(response.headers));
}

/** GET /v1/portal/token-usage/client-quotas/export — CSV of matching clients. */
export async function exportClientsCsv(
  filter: TokenClientsFilter = {},
): Promise<void> {
  const response = await axios.get(`${BASE_URL}/client-quotas/export`, {
    params: {
      search: filter.search || undefined,
      policy_status: filter.status === "all" ? undefined : filter.status,
      reset_period:
        filter.resetPeriod === "all" || !filter.resetPeriod
          ? undefined
          : filter.resetPeriod,
    },
    responseType: "blob",
  });
  const blob = new Blob([response.data as BlobPart], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filenameFromDisposition(response.headers));
}
