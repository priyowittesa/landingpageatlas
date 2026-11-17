"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction-equipment/work-orders";

export type WorkOrderPayload = Partial<{
  action_taken: string;
  asset_id: string;
  estimated_return_at: string;
  execution_ended_at: string;
  execution_started_at: string;
  occurred_at: string;
  priority: string;
  problem_description: string;
  problem_found: string;
  recommendation: string;
  result: string;
  root_cause: string;
  source_id: string;
  source_type: string;
  title: string;
}>;

export type PreventiveWorkOrderPayload = {
  estimated_return_at: string;
  occurred_at: string;
  preventive_id: string;
  priority: string;
  problem_description: string;
  title: string;
};

export type WorkOrder = {
  id: string;
  number: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  type: string;
  priority: string;
  status: string;
  technician: string;
  title: string;
  problemDescription: string;
  problemFound: string;
  rootCause: string;
  actionTaken: string;
  recommendation: string;
  result: string;
  occurredAt: string;
  estimatedReturnAt: string;
  executionStartedAt: string;
  executionEndedAt: string;
  sourceId: string;
  sourceType: string;
  createdBy: string;
  createdAt: string;
  attachments: WorkOrderAttachment[];
};

export function isWorkOrderTerminal(order: Pick<WorkOrder, "status">) {
  return ["cancelled", "canceled", "complete", "completed"].includes(
    order.status.trim().toLowerCase().replaceAll("_", " "),
  );
}

export function getWorkOrderSourceHref(type: string, id: string) {
  if (!id || id === "-") return null;
  const normalizedType = type.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (normalizedType.includes("breakdown")) {
    return `/app/asset-management/breakdown-maintenance/${encodeURIComponent(id)}`;
  }
  if (normalizedType.includes("preventive")) {
    return `/app/asset-management/preventive-maintenance/${encodeURIComponent(id)}`;
  }
  return null;
}

export type WorkOrderAttachment = { id: string; name: string; url?: string };

export type WorkOrderFilters = {
  search?: string;
  asset_id?: string;
  priority?: string;
  source_type?: string;
  source_id?: string;
  start_occurred_at?: string;
  end_occurred_at?: string;
  page_size: number;
  page_token?: string;
};

export type WorkOrderAsset = {
  id: string;
  code: string;
  name: string;
  breakdownId: string;
  preventiveId: string;
  sources: string[];
};

export type WorkOrderAssignee = {
  id: string;
  labourId: string;
  name: string;
  role: string;
  avatarUrl?: string;
  rateCardBaseRate: string;
  rateCardCode: string;
  rateCardCurrency: string;
  rateCardName: string;
  rateCardUnit: string;
};

export type WorkOrderSparePart = {
  id: string;
  sparePartId: string;
  number: string;
  name: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
};

export type WorkOrderSparePartInput = {
  spare_part_id: string;
  quantity: number;
  unit_cost: number;
};

function object(value: unknown) {
  return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
}

function unwrap(value: unknown) {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    const row = object(current);
    if (!("data" in row)) break;
    current = row.data;
  }
  return object(current);
}

function text(value: unknown, fallback = "-") {
  if (value && typeof value === "object") {
    const row = object(value);
    return String(row.name ?? row.full_name ?? row.code ?? fallback);
  }
  return value == null || value === "" ? fallback : String(value);
}

function normalize(raw: unknown, index = 0): WorkOrder {
  const row = object(raw);
  const asset = object(row.asset ?? row.equipment);
  const creator = object(row.created_by ?? row.reported_by);
  const rawAttachments = row.attachments ?? row.photos ?? row.files;
  return {
    id: String(row.id ?? row.work_order_id ?? index),
    number: text(row.work_order_code ?? row.work_order_number ?? row.wo_number ?? row.number ?? row.code),
    assetId: String(row.asset_id ?? asset.id ?? ""),
    assetCode: text(row.asset_code ?? asset.asset_code ?? asset.code),
    assetName: text(row.asset_name ?? asset.asset_name ?? asset.name),
    type: text(row.work_order_source_type ?? row.maintenance_type ?? row.type ?? row.source_type),
    priority: text(row.priority),
    status: text(row.status, "open"),
    technician: text(row.technician ?? row.assigned_to),
    title: text(row.title, ""),
    problemDescription: text(row.problem_description, ""),
    problemFound: text(row.problem_found, ""),
    rootCause: text(row.root_cause, ""),
    actionTaken: text(row.action_taken, ""),
    recommendation: text(row.recommendation, ""),
    result: text(row.result, ""),
    occurredAt: text(row.occurred_at, ""),
    estimatedReturnAt: text(row.estimated_return_at, ""),
    executionStartedAt: text(row.execution_started_at, ""),
    executionEndedAt: text(row.execution_ended_at, ""),
    sourceId: String(row.source_id ?? ""),
    sourceType: text(row.source_type, ""),
    createdBy: text(creator.name ?? creator.full_name ?? row.created_by_name ?? row.created_by),
    createdAt: text(row.created_at, ""),
    attachments: Array.isArray(rawAttachments) ? rawAttachments.map((raw, attachmentIndex) => {
      const attachment = object(raw);
      return {
        id: String(attachment.id ?? attachment.attachment_id ?? attachment.file_id ?? attachmentIndex),
        name: text(attachment.original_name ?? attachment.file_name ?? attachment.name, `Photo ${attachmentIndex + 1}`),
        url: attachment.url || attachment.download_url ? String(attachment.url ?? attachment.download_url) : undefined,
      };
    }) : [],
  };
}

/** Removes fields which are absent from the UI instead of serializing undefined/blank values. */
export function compactWorkOrderPayload(values: WorkOrderPayload): WorkOrderPayload {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as WorkOrderPayload;
}

export function useWorkOrders(filters: WorkOrderFilters) {
  return useQuery<{ items: WorkOrder[]; nextPageToken: string; totalCount: number }, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-orders", filters],
    queryFn: async () => {
      const body = unwrap((await axios.get(URL, { params: filters })).data);
      const rows = body.items ?? body.work_orders ?? body.results;
      return {
        items: Array.isArray(rows) ? rows.map(normalize) : [],
        nextPageToken: String(body.next_page_token ?? body.nextPageToken ?? ""),
        totalCount: Number(body.total_count ?? body.totalCount ?? 0),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load work orders" },
  });
}

export function useWorkOrderAssets(search = "") {
  return useQuery<WorkOrderAsset[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-order-assets", search],
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/assets`, {
        params: search.trim() ? { search: search.trim() } : undefined,
      })).data);
      const rows = body.items ?? body.assets ?? body.results;
      return Array.isArray(rows) ? rows.map((raw, index) => {
        const row = object(raw);
        return {
          id: String(row.id ?? row.asset_id ?? row.equipment_id ?? index),
          code: text(row.asset_code ?? row.code),
          name: text(row.asset_name ?? row.name),
          breakdownId: String(row.breakdown_id ?? ""),
          preventiveId: String(row.preventive_id ?? ""),
          sources: Array.isArray(row.sources) ? row.sources.map(String) : [],
        };
      }) : [];
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load work order assets" },
  });
}

export function useWorkOrder(id?: string) {
  return useQuery<WorkOrder, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-orders", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/${id}`)).data);
      return normalize(body.work_order ?? body.item ?? body);
    },
    meta: { errorMessage: "Failed to load work order" },
  });
}

export function useWorkOrderAssignees(workOrderId: string) {
  return useQuery<WorkOrderAssignee[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-orders", workOrderId, "assignees"],
    enabled: Boolean(workOrderId),
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/${workOrderId}/assignees`)).data);
      const rows = body.items ?? body.assignees ?? body.results;
      return Array.isArray(rows) ? rows.map((raw, index) => {
        const row = object(raw); const labour = object(row.labour ?? row.employee ?? row.user);
        return {
          id: String(row.id ?? row.assignee_id ?? index),
          labourId: String(row.labour_id ?? labour.id ?? ""),
          name: text(row.labour_full_name ?? row.labour_name ?? row.name ?? labour.full_name ?? labour.name, "Unnamed employee"),
          role: text(row.labour_role_name ?? row.role_name ?? row.position_name ?? labour.position_name ?? labour.role_name, "-"),
          avatarUrl: row.avatar_url || labour.avatar_url ? String(row.avatar_url ?? labour.avatar_url) : undefined,
          rateCardBaseRate: text(row.rate_card_base_rate, "-"),
          rateCardCode: text(row.rate_card_code, "-"),
          rateCardCurrency: text(row.rate_card_currency, "-"),
          rateCardName: text(row.rate_card_name, "-"),
          rateCardUnit: text(row.rate_card_unit, "-"),
        };
      }) : [];
    },
    meta: { errorMessage: "Failed to load work-order assignees" },
  });
}

export function useAssignWorkOrderAssignees(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string[]>({
    mutationFn: async (labourIds) => Promise.all(labourIds.map((labourId) =>
      axios.post(`${URL}/${workOrderId}/assignees`, { labour_id: labourId })
    )),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId, "assignees"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-order-costs"] }),
      ]);
    },
    meta: { errorMessage: "Failed to assign employee", successMessage: "Employee assigned successfully" },
  });
}

export function useDeleteWorkOrderAssignee(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (assigneeId) => (await axios.delete(`${URL}/assignees/${assigneeId}`)).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId, "assignees"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-order-costs"] }),
      ]);
    },
    meta: { errorMessage: "Failed to remove assignee", successMessage: "Assignee removed successfully" },
  });
}

export function useWorkOrderSpareParts(workOrderId: string) {
  return useQuery<WorkOrderSparePart[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-orders", workOrderId, "spare-parts"],
    enabled: Boolean(workOrderId),
    queryFn: async () => {
      const body = unwrap((await axios.get(`${URL}/${workOrderId}/spare-parts`)).data);
      const rows = body.items ?? body.spare_parts ?? body.results;
      return Array.isArray(rows) ? rows.map((raw, index) => {
        const row = object(raw);
        const sparePart = object(row.spare_part ?? row.part);
        const quantity = Number(row.quantity ?? 0);
        const unitCost = Number(row.unit_cost ?? row.unit_price ?? sparePart.unit_price ?? 0);
        return {
          id: String(row.id ?? row.work_order_spare_part_id ?? row.spare_part_id ?? index),
          sparePartId: String(row.spare_part_id ?? sparePart.id ?? row.id ?? index),
          number: text(row.spare_part_code ?? row.part_number ?? sparePart.code ?? sparePart.part_number, "-"),
          name: text(row.spare_part_name ?? sparePart.name ?? row.name, "Unnamed part"),
          description: text(row.description ?? row.spare_part_description ?? sparePart.description ?? row.spare_part_name ?? sparePart.name ?? row.name, "-"),
          quantity,
          unitCost,
          total: Number(row.total ?? row.total_cost ?? quantity * unitCost),
        };
      }) : [];
    },
    meta: { errorMessage: "Failed to load spare parts" },
  });
}

export function useAddWorkOrderSparePart(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, WorkOrderSparePartInput>({
    mutationFn: async (payload) => (await axios.post(`${URL}/${workOrderId}/spare-parts`, payload)).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId, "spare-parts"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-order-costs"] }),
      ]);
    },
    meta: { errorMessage: "Failed to add spare part", successMessage: "Spare part added successfully" },
  });
}

export function useDeleteWorkOrderSparePart(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (sparePartId) => (await axios.delete(`${URL}/spare-parts/${sparePartId}`)).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId, "spare-parts"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId] }),
        client.invalidateQueries({ queryKey: ["asset-management", "work-order-costs"] }),
      ]);
    },
    meta: { errorMessage: "Failed to delete spare part", successMessage: "Spare part deleted successfully" },
  });
}

export function useChangeWorkOrderStatus(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, "cancelled" | "completed">({
    mutationFn: async (status) => (await axios.post(`${URL}/${workOrderId}/${status}`, {})).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["asset-management", "work-orders"] });
      client.invalidateQueries({ queryKey: ["asset-management", "preventives"] });
    },
    meta: { errorMessage: "Failed to update work-order status", successMessage: "Work-order status updated successfully" },
  });
}

export function useUploadWorkOrderAttachments(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, File[]>({
    mutationFn: async (files) => {
      const data = new FormData(); files.forEach((file) => data.append("files", file));
      return (await axios.post(`${URL}/${workOrderId}/attachments`, data, { headers: { "Content-Type": "multipart/form-data" } })).data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId] }),
    meta: { errorMessage: "Failed to upload attachments", successMessage: "Attachments uploaded successfully" },
  });
}

export function useDeleteWorkOrderAttachment(workOrderId: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (attachmentId) => (await axios.delete(`${URL}/attachments/${attachmentId}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["asset-management", "work-orders", workOrderId] }),
    meta: { errorMessage: "Failed to delete attachment", successMessage: "Attachment deleted successfully" },
  });
}

function attachmentUrlFromJson(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const row = value as Record<string, unknown>;
  const direct = row.url ?? row.download_url ?? row.file_url ?? row.signed_url;
  if (direct) return String(direct);
  return attachmentUrlFromJson(row.data ?? row.attachment ?? row.file);
}

export function useWorkOrderAttachmentUrl(attachmentId: string, initialUrl?: string) {
  return useQuery<string, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "work-order-attachment", attachmentId],
    enabled: Boolean(attachmentId) && !initialUrl,
    initialData: initialUrl,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const payload = (await axios.get(`${URL}/attachments/${attachmentId}/download`)).data as unknown;
      const url = attachmentUrlFromJson(payload);
      if (!url) throw new Error("Attachment response does not contain a download URL");
      return url;
    },
    meta: { errorMessage: "Failed to load attachment" },
  });
}

function useRefreshMutation<T>(mutationFn: (variables: T) => Promise<unknown>, successMessage: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, T>({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: ["asset-management", "work-orders"] }),
    meta: { errorMessage: "Work order action failed", successMessage },
  });
}

export function useCreateWorkOrder() {
  return useRefreshMutation<WorkOrderPayload>(
    async (payload) => (await axios.post(URL, compactWorkOrderPayload(payload))).data,
    "Work order created successfully"
  );
}

export function useBulkCreateWorkOrders() {
  return useRefreshMutation<WorkOrderPayload[]>(
    async (payloads) => (await axios.post(`${URL}/bulk-create`, {
      payloads: payloads.map(compactWorkOrderPayload),
    })).data,
    "Work orders created successfully"
  );
}

export function useCreatePreventiveWorkOrder() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, PreventiveWorkOrderPayload>({
    mutationFn: async (payload) =>
      (await axios.post(`${URL}/from-preventive`, payload)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["asset-management", "work-orders"] });
      client.invalidateQueries({ queryKey: ["asset-management", "preventives"] });
    },
    meta: {
      errorMessage: "Work order action failed",
      successMessage: "Work order created successfully",
    },
  });
}

export function useEditWorkOrder() {
  return useRefreshMutation<{ id: string; payload: WorkOrderPayload }>(
    async ({ id, payload }) => (await axios.put(`${URL}/${id}`, compactWorkOrderPayload(payload))).data,
    "Work order updated successfully"
  );
}
