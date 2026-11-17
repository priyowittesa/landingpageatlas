"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const PROCUREMENT_URL = "/v1/construction-equipment/procurements";

export type ApprovalInboxItem = {
  id: string;
  number: string;
  createdAt: string;
  requester: string;
  workOrder: string;
  priority: string;
  estimatedTotal: number;
  currency: string;
  status: string;
};

export type ProcurementApproval = {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  levelNo: number;
  title: string;
  status: string;
  notes: string;
  isCurrent: boolean;
};

export type ApprovalInboxFilters = { search?: string; pageSize: number; pageToken?: string };
export type ApprovalInboxPage = { items: ApprovalInboxItem[]; totalCount: number; nextPageToken: string };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function label(value: unknown): string {
  const item = record(value);
  return String(item.full_name ?? item.name ?? item.title ?? item.code ?? value ?? "");
}

function findList(value: unknown, keys: string[], depth = 0): unknown[] {
  if (Array.isArray(value)) return value;
  if (depth > 6) return [];
  const item = record(value);
  for (const key of keys) {
    const nested = item[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") {
      const rows = findList(nested, keys, depth + 1);
      if (rows.length) return rows;
    }
  }
  return [];
}

function normalizeInboxItem(value: unknown, index: number): ApprovalInboxItem {
  const item = record(value);
  const procurement = record(item.procurement);
  const currentApproval = record(item.current_approval);
  const requester = item.requester ?? item.requested_by ?? procurement.requester ?? procurement.requested_by;
  const workOrder = record(item.work_order ?? procurement.work_order);
  const approvalStatus = String(currentApproval.decision_status ?? item.approval_status ?? "").toLowerCase();
  return {
    id: String(item.procurement_id ?? procurement.id ?? item.id ?? index),
    number: String(item.pr_number ?? item.procurement_number ?? item.number ?? procurement.code ?? procurement.pr_number ?? procurement.procurement_number ?? procurement.number ?? "-"),
    createdAt: String(item.created_at ?? item.request_date ?? procurement.created_at ?? procurement.request_date ?? ""),
    requester: label(item.requester_name ?? procurement.requester_name ?? requester) || "-",
    workOrder: String(item.work_order_number ?? item.source_number ?? procurement.source_code ?? procurement.work_order_number ?? procurement.source_number ?? workOrder.number ?? workOrder.code ?? "-") || "-",
    priority: String(item.priority ?? procurement.priority ?? "-"),
    estimatedTotal: Number(item.total_cost ?? item.total_amount ?? item.estimated_total ?? procurement.total_cost ?? procurement.total_amount ?? 0),
    currency: String(item.currency ?? procurement.currency ?? "USD"),
    status: approvalStatus === "pending" ? "pending_approval" : String(approvalStatus || item.status || procurement.status || "pending_approval"),
  };
}

export function useApprovalInbox(filters: ApprovalInboxFilters) {
  return useQuery<ApprovalInboxPage, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurements", "for-approval", filters],
    queryFn: async () => {
      const response = await axios.get(`${PROCUREMENT_URL}/for-approval`, { params: { search: filters.search, page_size: filters.pageSize, page_token: filters.pageToken || undefined } });
      const outer = record(response.data);
      const body = record(outer.data ?? outer);
      const rows = findList(response.data, ["data", "items", "procurements", "results"]);
      const items = rows.map(normalizeInboxItem);
      return {
        items,
        totalCount: Number(body.total_count ?? body.totalCount ?? record(body.pagination).total_count ?? items.length),
        nextPageToken: String(body.next_page_token ?? body.nextPageToken ?? ""),
      };
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load approval inbox" },
  });
}

function normalizeApproval(value: unknown, index: number): ProcurementApproval {
  const item = record(value);
  const approver = record(item.approver ?? item.labour ?? item.employee);
  return {
    id: String(item.approval_id ?? item.id ?? index),
    approverId: String(item.approver_id ?? approver.id ?? ""),
    approverName: label(item.approver_name ?? approver) || "Assigned approver",
    approverRole: String(item.approver_role ?? approver.role_name ?? approver.role ?? ""),
    levelNo: Number(item.level_no ?? item.level ?? item.sequence ?? index + 1),
    title: String(item.title ?? item.level_title ?? item.approver_role ?? approver.role_name ?? approver.role ?? `Approval Level ${index + 1}`),
    status: String(item.decision_status ?? item.status ?? "waiting").toLowerCase(),
    notes: String(item.notes ?? item.rejection_reason ?? ""),
    isCurrent: Boolean(item.is_current ?? item.can_approve ?? item.is_actionable ?? false),
  };
}

export function useProcurementApprovals(procurementId: string) {
  return useQuery<ProcurementApproval[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurements", procurementId, "approvals"],
    enabled: Boolean(procurementId),
    queryFn: async () => findList((await axios.get(`${PROCUREMENT_URL}/${procurementId}/approvals`)).data, ["data", "items", "approvals", "results"])
      .map(normalizeApproval)
      .sort((a, b) => a.levelNo - b.levelNo),
    meta: { errorMessage: "Failed to load approval routing" },
  });
}

export function useApprovalAction(procurementId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { approvalId: string; action: "approve" | "reject"; notes: string }>({
    mutationFn: async ({ approvalId, action, notes }) => (await axios.post(`${PROCUREMENT_URL}/approvals/${approvalId}/${action}`, { notes })).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", "for-approval"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", procurementId] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", procurementId, "approvals"] }),
      ]);
    },
  });
}
