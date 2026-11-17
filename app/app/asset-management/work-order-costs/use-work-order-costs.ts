"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction-equipment/work-orders/costs";
const WORK_ORDERS_URL = "/v1/construction-equipment/work-orders";

export type WorkOrderCost = {
  id: string; workOrderId: string; workOrderNumber: string; asset: string;
  type: string; status: string; category: string; vendor: string;
  totalCost: number; currency: string;
};
export type WorkOrderCostDetail = WorkOrderCost & {
  assetCode: string;
  assetName: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  partsSubtotal: number;
  laborServiceFee: number;
  disposalLevy: number;
  estimatedTax: number;
};
export type WorkOrderCostAuditLog = {
  id: string;
  itemName: string;
  action: string;
  title: string;
  verb: string;
  details: string[];
  actor: string;
  createdAt: string;
  removed: boolean;
  updated: boolean;
};
export type CostFilters = { search?: string; status?: string; category?: string; vendor?: string; page_size: number; page_token?: string };
export type CostList = { items: WorkOrderCost[]; nextPageToken: string; totalCount: number; statuses: string[]; categories: string[]; vendors: string[] };
export type CostWorkOrder = {
  id: string;
  number: string;
  assetCode: string;
  assetName: string;
  isAlreadyExist: boolean;
};

const object = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
function unwrap(value: unknown): unknown { let current = value; for (let i = 0; i < 4; i++) { const row = object(current); if (!("data" in row)) return current; current = row.data; } return current; }
const text = (value: unknown, fallback = "") => value == null || value === "" ? fallback : String(value);
const list = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

function normalize(raw: unknown, index: number): WorkOrderCost {
  const row = object(raw); const workOrder = object(row.work_order); const asset = object(row.asset ?? workOrder.asset); const vendor = object(row.vendor); const category = object(row.category);
  const assetCode = text(row.asset_code ?? asset.asset_code ?? asset.code);
  const assetName = text(row.asset_name ?? asset.asset_name ?? asset.name ?? workOrder.asset_name);
  return {
    id: text(row.id ?? row.cost_id ?? row.work_order_cost_id, String(index)),
    workOrderId: text(row.work_order_id ?? workOrder.id),
    workOrderNumber: text(row.work_order_code ?? row.work_order_number ?? row.wo_number ?? workOrder.work_order_code ?? workOrder.work_order_number ?? workOrder.number ?? workOrder.code, "-"),
    asset: [assetCode, assetName].filter(Boolean).join(" - ") || "-",
    type: text(row.work_order_source_type ?? row.maintenance_type ?? row.type ?? workOrder.work_order_source_type ?? workOrder.maintenance_type ?? workOrder.type, "-"),
    status: text(row.status ?? workOrder.status, "-"),
    category: text(row.category_name ?? category.name ?? row.category, "-"),
    vendor: text(row.vendor_name ?? vendor.name ?? row.vendor, "-"),
    totalCost: Number(row.total_cost ?? row.total ?? row.amount ?? row.cost ?? 0),
    currency: text(row.currency, "USD"),
  };
}

function normalizeAuditLog(raw: unknown, index: number): WorkOrderCostAuditLog {
  const row = Object.fromEntries(
    Object.entries(object(raw)).map(([key, value]) => [key.trim(), value]),
  );
  const actor = object(row.actor ?? row.user ?? row.created_by);
  const action = text(row.action ?? row.event ?? row.type, "updated").toLowerCase();
  const entityType = text(row.entity_type).replaceAll("_", " ");
  const itemName = text(row.item_name);
  const statusBefore = text(row.status_before);
  const statusAfter = text(row.status_after);
  const amountBefore = Number(row.amount_before ?? 0);
  const amountAfter = Number(row.amount_after ?? 0);
  const amountDelta = Number(row.amount_delta ?? amountAfter - amountBefore);
  const removed = action.includes("remove") || action.includes("delete");
  const updated = action.includes("update") || action.includes("edit") || action.includes("modify");
  const actorName = text(row.actor_name || row.created_by_name || actor.full_name || actor.name);
  const actorRole = text(row.actor_role);
  const verb = removed ? "Removed item" : updated ? "Modified" : "Added";
  const actionLabel = removed ? "Removed" : updated ? "Updated" : "Added";
  const details: string[] = [];
  if (statusBefore || statusAfter) details.push(`Status: ${statusBefore || "-"} → ${statusAfter || "-"}`);
  if (amountBefore !== amountAfter || amountDelta !== 0) details.push(`Amount: ${amountBefore} → ${amountAfter}`);
  return {
    id: text(row.id ?? row.audit_log_id, String(index)),
    itemName: itemName || entityType || "Item",
    action,
    title: `${entityType ? entityType.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Cost Line"} ${actionLabel}`,
    verb,
    details,
    actor: actorName ? `${actorName}${actorRole ? ` (${actorRole})` : ""}` : "",
    createdAt: text(row.created_at ?? row.timestamp, ""),
    removed,
    updated,
  };
}

function normalizeDetail(raw: unknown): WorkOrderCostDetail {
  const row = object(raw);
  const base = normalize(row, 0);
  const createdAt = text(row.created_at);
  const updatedAt = text(row.updated_at);
  const createdBy = text(row.created_by_name ?? row.created_by, "-");
  const updatedBy = text(row.updated_by_name ?? row.updated_by, "-");

  return {
    ...base,
    assetCode: text(row.asset_code),
    assetName: text(row.asset_name),
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    partsSubtotal: Number(row.parts_subtotal ?? row.parts_total ?? 0),
    laborServiceFee: Number(row.labor_service_fee ?? row.labour_service_fee ?? row.labor_total ?? row.labour_total ?? 0),
    disposalLevy: Number(row.disposal_levy ?? row.environmental_levy ?? 0),
    estimatedTax: Number(row.estimated_tax ?? row.tax_total ?? row.tax ?? 0),
  };
}

export function useWorkOrderCostAudits(id: string) {
  return useQuery<WorkOrderCostAuditLog[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-order-costs", id, "audits"],
    enabled: false,
    queryFn: async () => {
      const unwrapped = unwrap((await axios.get(
        `${WORK_ORDERS_URL}/${encodeURIComponent(id)}/audits`,
        { params: { page_size: 100 } },
      )).data);
      const body = object(unwrapped);
      const rows = Array.isArray(unwrapped)
        ? unwrapped
        : body.items ?? body.audits ?? body.audit_logs ?? body.results ?? (body.id ? [body] : []);
      return Array.isArray(rows) ? rows.map(normalizeAuditLog) : [];
    },
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load work order audit log" },
  });
}

export function useWorkOrderCosts(filters: CostFilters) {
  return useQuery<CostList, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-order-costs", filters],
    queryFn: async () => {
      const unwrapped = unwrap((await axios.get(URL, { params: filters })).data);
      const body = object(unwrapped);
      const rows = Array.isArray(unwrapped)
        ? unwrapped
        : body.items ?? body.costs ?? body.work_order_costs ?? body.results ?? (body.id ? [body] : []);
      const items = Array.isArray(rows) ? rows.map(normalize) : [];
      const filtersEnvelope = object(body.filters ?? body.facets);
      return {
        items, nextPageToken: text(body.next_page_token ?? body.nextPageToken),
        totalCount: Number(body.total_count ?? body.totalCount ?? items.length),
        statuses: list(filtersEnvelope.statuses ?? body.statuses),
        categories: list(filtersEnvelope.categories ?? body.categories),
        vendors: list(filtersEnvelope.vendors ?? body.vendors),
      };
    }, placeholderData: (previous) => previous, refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load work order costs" },
  });
}

export function useWorkOrderCost(id: string) {
  return useQuery<WorkOrderCostDetail, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-order-costs", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const unwrapped = unwrap((await axios.get(`${WORK_ORDERS_URL}/${encodeURIComponent(id)}`)).data);
      const body = object(unwrapped);
      const workOrder = object(body.work_order ?? body.item ?? body);
      const costs = Array.isArray(workOrder.costs) ? workOrder.costs : [];
      const cost = object(costs[0]);
      const totalCost = costs.reduce((sum, entry) => sum + Number(object(entry).total_cost ?? 0), 0);
      return normalizeDetail({
        ...cost,
        total_cost: totalCost,
        work_order_id: workOrder.id ?? id,
        work_order_code: workOrder.code ?? workOrder.work_order_code,
        work_order_source_type: workOrder.source_type ?? workOrder.work_order_source_type,
        asset_code: workOrder.asset_code ?? cost.asset_code,
        asset_name: workOrder.asset_name ?? cost.asset_name,
      });
    },
    meta: { errorMessage: "Failed to load work order cost" },
  });
}

export function useCostWorkOrders(search: string, enabled = true) {
  return useQuery<CostWorkOrder[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-orders-for-cost", search],
    enabled,
    staleTime: 0,
    queryFn: async () => {
      const unwrapped = unwrap((await axios.get("/v1/construction-equipment/work-orders/for-cost", { params: search.trim() ? { search: search.trim() } : undefined })).data);
      const body = object(unwrapped);
      const rows = Array.isArray(unwrapped) ? unwrapped : body.items ?? body.work_orders ?? body.results;
      return Array.isArray(rows) ? rows.map((raw, index) => {
        const row = object(raw);
        const asset = object(row.asset);
        return {
          id: text(row.work_order_id ?? row.id, String(index)),
          number: text(
            row.work_order_code ?? row.work_order_number ?? row.number ?? row.code,
            "-",
          ),
          assetCode: text(row.asset_code ?? asset.asset_code ?? asset.code, "-"),
          assetName: text(row.asset_name ?? asset.asset_name ?? asset.name, "-"),
          isAlreadyExist:
            row.is_already_exist === true ||
            String(row.is_already_exist).toLowerCase() === "true",
        };
      }) : [];
    }, placeholderData: (previous) => previous, refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load available work orders" },
  });
}

function useRefreshMutation<T>(fn: (value: T) => Promise<unknown>, successMessage: string) { const client = useQueryClient(); return useMutation<unknown, AxiosError<ApiResponseError>, T>({ mutationFn: fn, onSuccess: () => client.invalidateQueries({ queryKey: ["asset-management", "work-order-costs"] }), meta: { errorMessage: "Work order cost action failed", successMessage } }); }
export const useCreateWorkOrderCost = () => useRefreshMutation<string>(
  async (workOrderId) => (
    await axios.post(`${WORK_ORDERS_URL}/${encodeURIComponent(workOrderId)}/costs`)
  ).data,
  "Work order cost added successfully",
);
export const useDeleteWorkOrderCost = () => useRefreshMutation<string>(async (id) => (await axios.delete(`${URL}/${id}`)).data, "Work order cost deleted successfully");
