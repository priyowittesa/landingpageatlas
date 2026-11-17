"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";

import type { ApiResponseError } from "@/types/api";
import {
  mockClients,
} from "../lib/admin-mock-data";
import {
  exportAuditTrailCsv,
  exportClientsCsv,
  fetchAuditTrail,
  fetchClientDetail,
  fetchClients,
  fetchPolicySummary,
  fetchTokenChanges,
  updateClientQuotas,
  updateDefaultAllowance,
} from "../lib/admin-api";
import type {
  ApiChangesResponse,
  TokenAuditAction,
  TokenAuditTrail,
  TokenAuditTrailFilter,
  TokenBulkUpdatePayload,
  TokenBulkUpdateResult,
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
} from "../types/admin";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const tokenAdminKeys = {
  all: ["token-usage-admin"] as const,
  clients: (filter: TokenClientsFilter) =>
    [...tokenAdminKeys.all, "clients", filter] as const,
  clientDetail: (clientId: string) =>
    [...tokenAdminKeys.all, "client-detail", clientId] as const,
  auditTrail: (filter: TokenAuditTrailFilter) =>
    [...tokenAdminKeys.all, "audit-trail", filter] as const,
  changes: (filter: { tenantId?: string; incoming: boolean }) =>
    [...tokenAdminKeys.all, "changes", filter] as const,
  policySummary: () => [...tokenAdminKeys.all, "policy-summary"] as const,
};

// ---------------------------------------------------------------------------
// Clients list (react-query — GET /v1/portal/token-usage/client-quotas)
// ---------------------------------------------------------------------------

export function useTokenClients(filter: TokenClientsFilter = {}) {
  const query = useQuery<TokenClientsList, AxiosError<ApiResponseError>>({
    queryKey: tokenAdminKeys.clients(filter),
    queryFn: () => fetchClients(filter),
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load clients" },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

// ---------------------------------------------------------------------------
// Client detail (react-query — GET /v1/portal/token-usage/client-quotas/policy-detail)
// ---------------------------------------------------------------------------

export function useTokenClientDetail(clientId: string) {
  const query = useQuery<TokenClientDetail, AxiosError<ApiResponseError>>({
    queryKey: tokenAdminKeys.clientDetail(clientId),
    queryFn: () => fetchClientDetail(clientId),
    enabled: Boolean(clientId),
    meta: { errorMessage: "Failed to load client detail" },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

// ---------------------------------------------------------------------------
// Audit trail (react-query — GET /v1/portal/token-usage/client-quotas/audit-trail)
// ---------------------------------------------------------------------------

export function useTokenAuditTrail(filter: TokenAuditTrailFilter = {}) {
  const query = useQuery<TokenAuditTrail, AxiosError<ApiResponseError>>({
    queryKey: tokenAdminKeys.auditTrail(filter),
    queryFn: () => fetchAuditTrail(filter),
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load audit trail" },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}

// ---------------------------------------------------------------------------
// Upcoming / Recent changes (react-query — GET /v1/portal/token-usage/client-quotas/changes)
// ---------------------------------------------------------------------------

/** Scheduled (incoming) policy changes. */
export function useScheduledChanges(tenantId?: string) {
  const query = useQuery<ApiChangesResponse, AxiosError<ApiResponseError>>({
    queryKey: tokenAdminKeys.changes({ tenantId, incoming: true }),
    queryFn: () => fetchTokenChanges({ tenantId, incoming: true }),
    meta: { errorMessage: "Failed to load scheduled changes" },
  });

  return {
    data: query.data?.changes ?? [],
    total: query.data ? Number(query.data.total_count) : 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/** Already-effective (recently applied) policy changes. */
export function useRecentlyAppliedChanges(tenantId?: string) {
  const query = useQuery<ApiChangesResponse, AxiosError<ApiResponseError>>({
    queryKey: tokenAdminKeys.changes({ tenantId, incoming: false }),
    queryFn: () => fetchTokenChanges({ tenantId, incoming: false }),
    meta: { errorMessage: "Failed to load recently applied changes" },
  });

  return {
    data: query.data?.changes ?? [],
    total: query.data ? Number(query.data.total_count) : 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

// ---------------------------------------------------------------------------
// Policy summary (react-query — GET /v1/portal/token-usage/client-quotas/policy-summary)
// ---------------------------------------------------------------------------

/** Tenant-wide default policy + policy spread for the admin overview. */
export function usePolicySummary() {
  const query = useQuery<TokenPolicySummary, AxiosError<ApiResponseError>>({
    queryKey: tokenAdminKeys.policySummary(),
    queryFn: () => fetchPolicySummary(),
    meta: { errorMessage: "Failed to load policy summary" },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

// ---------------------------------------------------------------------------
// Default policy mutation (PUT /v1/portal/token-usage/default-allowance)
// ---------------------------------------------------------------------------

/** Update the tenant-wide default policy via PUT /default-allowance. */
export function useUpdateDefaultPolicy() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiResponseError>, TokenDefaultPolicyPayload>({
    mutationFn: updateDefaultAllowance,
    meta: {
      errorMessage: "Failed to update default policy",
      successMessage: "Default policy updated",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenAdminKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Bulk client-quota update (PUT /v1/portal/token-usage/client-quotas)
// ---------------------------------------------------------------------------

/** Set allowance + reset period for one or more tenants via PUT /client-quotas. */
export function useUpdateClientQuotas() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    AxiosError<ApiResponseError>,
    TokenClientQuotaUpdateItem[]
  >({
    mutationFn: updateClientQuotas,
    meta: {
      errorMessage: "Failed to update client quotas",
      successMessage: "Client quotas updated",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tokenAdminKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations (mock — simulate success with toast)
// ---------------------------------------------------------------------------

export function useApplyClientOverride(clientId: string) {
  return {
    mutateAsync: async (
      payload: TokenOverridePayload,
    ): Promise<TokenOverrideResult> => {
      const result: TokenOverrideResult = {
        clientId,
        affectedClients: 1,
        undoWindowSeconds: 300,
      };
      if (payload.applyMode === "immediate") {
        toast.success("Policy override applied", {
          description: "The client is now on a custom policy.",
          action: {
            label: "Undo",
            onClick: () => toast.info("Undo triggered — revert the override."),
          },
          duration: 300_000,
        });
      } else {
        toast.success("Scheduled change created", {
          description: `Pending until ${payload.effectiveAt}. Old policy stays in force.`,
        });
      }
      return result;
    },
    isPending: false,
  };
}

export function useRevertClientOverride(clientId: string) {
  return {
    mutateAsync: async (): Promise<TokenRevertResult> => {
      const result: TokenRevertResult = {
        clientId,
        undoWindowSeconds: 300,
      };
      toast.success("Reverted to default policy", {
        description: "The client is now using the default policy.",
        action: {
          label: "Undo",
          onClick: () => toast.info("Undo triggered — restore the override."),
        },
        duration: 300_000,
      });
      return result;
    },
    isPending: false,
  };
}

export function useBulkUpdateClients() {
  return {
    mutateAsync: async (
      payload: TokenBulkUpdatePayload,
    ): Promise<TokenBulkUpdateResult> => {
      const rows = payload.clientIds.map((id, index) => {
        const client = mockClients.find((c) => c.id === id);
        return {
          clientId: id,
          clientName: client?.name ?? `Client ${index + 1}`,
          success: index % 7 !== 0,
          message:
            index % 7 === 0
              ? "Client has a pending scheduled change"
              : undefined,
        };
      });
      const result = {
        succeeded: rows.filter((r) => r.success).length,
        failed: rows.filter((r) => !r.success).length,
        rows,
      };
      toast.success("Bulk update complete", {
        description: `${result.succeeded} succeeded, ${result.failed} failed.`,
      });
      return result;
    },
    isPending: false,
  };
}

export function useExportAuditTrail() {
  const [isPending, setIsPending] = useState(false);
  const mutate = useCallback(async (filter: TokenAuditTrailFilter) => {
    setIsPending(true);
    try {
      await exportAuditTrailCsv(filter);
    } finally {
      setIsPending(false);
    }
  }, []);
  return { mutate, isPending };
}

/** Download the filtered clients list as a CSV via /client-quotas/export. */
export function useExportClients() {
  const [isPending, setIsPending] = useState(false);
  const mutate = useCallback(async (filter: TokenClientsFilter) => {
    setIsPending(true);
    try {
      await exportClientsCsv(filter);
    } finally {
      setIsPending(false);
    }
  }, []);
  return { mutate, isPending };
}

export type { TokenClient, TokenClientDetail, TokenAuditAction };
