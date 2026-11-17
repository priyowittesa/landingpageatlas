"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction-equipment/procurements";

export type ProcurementSourceType = "manual" | "work_order";

export type CreateProcurementPayload = {
  department: string;
  notes: string;
  priority: string;
  purpose: string;
  requester_name: string;
  required_delivery_at: string;
  source_id?: string;
  source_type: ProcurementSourceType;
  status?: "draft" | "submit";
};

export type CreateProcurementPart = {
  spare_part_id: string;
  quantity: number;
  price: number;
};

export type UpdateProcurementPart = CreateProcurementPart & {
  id: string;
  use_catalog_price: boolean;
};

export type ProcurementDepartment = { value: string; label: string };

export type ProcurementDetail = {
  id: string;
  number: string;
  department: string;
  departmentId: string;
  notes: string;
  priority: string;
  purpose: string;
  requesterName: string;
  requiredDeliveryAt: string;
  sourceId: string;
  sourceType: string;
  status: string;
  workOrderNumber: string;
};

export type ProcurementSparePart = {
  id: string;
  sparePartId: string;
  number: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
};

export type ProcurementAttachment = {
  id: string;
  name: string;
  size: number;
  url?: string;
};

export type Procurement = {
  id: string;
  number: string;
  description: string;
  quantity: number;
  sparePartCount: number;
  requester: string;
  source: string;
  date: string;
  priority: string;
  totalCost: number;
  currency: string;
  status: string;
};

export type ProcurementFilters = {
  search?: string;
  status?: string;
  priority?: string;
  source_type?: string;
  page_size: number;
  page_token?: string;
};

type ProcurementPage = { items: Procurement[]; totalCount: number; nextPageToken: string };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function label(value: unknown): string {
  const item = record(value);
  return String(item.name ?? item.full_name ?? item.code ?? value ?? "");
}

function normalize(value: unknown, index: number): Procurement {
  const item = record(value);
  const rawItems = item.spare_parts ?? item.items ?? item.lines ?? item.procurement_items;
  const firstItem = Array.isArray(rawItems) ? record(rawItems[0]) : {};
  const source = record(item.source);
  return {
    id: String(item.id ?? item.procurement_id ?? index),
    number: String(item.pr_number ?? item.procurement_number ?? item.code ?? item.number ?? "-"),
    description: String(item.description ?? item.spare_part_name ?? item.part_name ?? firstItem.description ?? firstItem.name ?? "-"),
    quantity: Number(item.quantity ?? firstItem.quantity ?? 0),
    sparePartCount: Array.isArray(rawItems) ? rawItems.length : Number(item.spare_part_count ?? item.spare_parts_count ?? 0),
    requester: label(item.requester ?? item.requested_by ?? item.requester_name),
    source: label(item.source_type ?? source.type ?? item.source ?? "-"),
    date: String(item.request_date ?? item.required_delivery_at ?? item.created_at ?? ""),
    priority: String(item.priority ?? "-"),
    totalCost: Number(item.total_cost ?? item.total_amount ?? item.total_estimated_cost ?? 0),
    currency: String(item.currency ?? "USD"),
    status: String(item.status ?? "-"),
  };
}

export function useProcurements(filters: ProcurementFilters) {
  return useQuery<ProcurementPage, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurements", filters],
    queryFn: async () => {
      const response = await axios.get(URL, { params: filters });
      const outer = record(response.data);
      const body = record(outer.data ?? outer);
      const rawItems = body.items ?? body.procurements ?? body.results;
      const items = Array.isArray(rawItems) ? rawItems.map(normalize) : [];
      return {
        items,
        totalCount: Number(body.total_count ?? body.totalCount ?? record(body.pagination).total_count ?? items.length),
        nextPageToken: String(body.next_page_token ?? body.nextPageToken ?? ""),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load purchase requests" },
  });
}

export function useProcurementDepartments() {
  return useQuery<ProcurementDepartment[], AxiosError<ApiResponseError>>({
    queryKey: ["construction-ref", "department", "procurement"],
    queryFn: async () => {
      const response = await axios.get("/v1/construction/department", { params: { page_size: 1000 } });
      const rows = findNestedList(response.data);
      return rows.map((raw) => {
        const item = record(raw);
        const value = String(item.id ?? item.department_id ?? item.uuid ?? item.code ?? "");
        const label = String(item.name ?? item.department_name ?? item.label ?? item.code ?? value);
        return { value, label };
      }).filter((item) => item.value);
    },
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load departments" },
  });
}

export function useProcurement(id: string) {
  return useQuery<ProcurementDetail, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurements", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(`${URL}/${id}`);
      const body = findProcurementRecord(response.data);
      const source = record(body.source);
      const workOrder = record(body.work_order ?? source.work_order);
      const department = record(body.department);
      const sourceId = String(body.source_id ?? source.id ?? workOrder.id ?? "");
      return {
        id: String(body.id ?? body.procurement_id ?? id),
        number: String(body.pr_number ?? body.procurement_number ?? body.number ?? body.code ?? "-"),
        department: label(body.department_name ?? department.name ?? body.department ?? body.department_id),
        departmentId: String(body.department_id ?? department.id ?? (typeof body.department === "string" ? body.department : "")),
        notes: String(body.notes ?? ""),
        priority: String(body.priority ?? "medium"),
        purpose: String(body.purpose ?? body.description ?? ""),
        requesterName: label(body.requester_name ?? body.requester ?? body.requested_by),
        requiredDeliveryAt: String(body.required_delivery_at ?? body.due_date ?? ""),
        sourceId,
        sourceType: String(body.source_type ?? source.type ?? ""),
        status: String(body.status ?? "draft"),
        workOrderNumber: String(body.work_order_number ?? body.source_number ?? workOrder.work_order_number ?? workOrder.number ?? workOrder.code ?? sourceId ?? "-"),
      };
    },
    meta: { errorMessage: "Failed to load purchase request" },
  });
}

function findNestedList(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value;
  if (depth >= 6) return [];
  const item = record(value);
  for (const key of ["data", "items", "departments", "rows", "results"]) {
    const nested = item[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") {
      const result = findNestedList(nested, depth + 1);
      if (result.length) return result;
    }
  }
  for (const nested of Object.values(item)) {
    if (nested && typeof nested === "object") {
      const result = findNestedList(nested, depth + 1);
      if (result.length) return result;
    }
  }
  return [];
}

function findProcurementRecord(value: unknown, depth = 0): Record<string, unknown> {
  const item = record(value);
  if (depth >= 6) return item;
  if ("required_delivery_at" in item || "source_type" in item || "purpose" in item || "requester_name" in item) return item;
  for (const key of ["data", "procurement", "item", "result"]) {
    const nested = item[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const result = findProcurementRecord(nested, depth + 1);
      if (Object.keys(result).length) return result;
    }
  }
  return item;
}

export function useProcurementSpareParts(id: string) {
  return useQuery<ProcurementSparePart[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurements", id, "spare-parts"],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(`${URL}/${id}/spare-parts`);
      const outer = record(response.data);
      const body = record(outer.data ?? outer);
      const rows = Array.isArray(outer.data) ? outer.data : body.items ?? body.spare_parts ?? body.results;
      if (!Array.isArray(rows)) return [];
      return rows.map((raw, index) => {
        const item = record(raw);
        const part = record(item.spare_part ?? item.part);
        const quantity = Number(item.quantity ?? 0);
        const price = Number(item.price ?? item.unit_price ?? part.unit_price ?? 0);
        return {
          id: String(item.id ?? item.procurement_spare_part_id ?? index),
          sparePartId: String(item.spare_part_id ?? part.id ?? ""),
          number: String(item.spare_part_code ?? item.part_number ?? part.code ?? part.part_number ?? "-"),
          name: String(item.spare_part_name ?? part.name ?? item.name ?? "Unnamed part"),
          description: String(item.description ?? item.spare_part_description ?? part.description ?? item.spare_part_name ?? part.name ?? "-"),
          quantity,
          price,
          total: Number(item.total ?? item.total_cost ?? quantity * price),
        };
      });
    },
    meta: { errorMessage: "Failed to load procurement spare parts" },
  });
}

export function useProcurementAttachments(id: string) {
  return useQuery<ProcurementAttachment[], AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurements", id, "attachments"],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(`${URL}/${id}/attachments`);
      const rows = findNestedList(response.data);
      return rows.map((raw, index) => {
        const item = record(raw);
        return {
          id: String(item.id ?? item.attachment_id ?? item.file_id ?? index),
          name: String(item.original_name ?? item.file_name ?? item.name ?? `Attachment ${index + 1}`),
          size: Number(item.size ?? item.file_size ?? 0),
          url: item.url || item.download_url ? String(item.url ?? item.download_url) : undefined,
        };
      });
    },
    meta: { errorMessage: "Failed to load procurement attachments" },
  });
}

function attachmentUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const item = record(value);
  const direct = item.url ?? item.download_url ?? item.file_url ?? item.signed_url;
  return direct ? String(direct) : attachmentUrl(item.data ?? item.attachment ?? item.file);
}

export function useProcurementAttachmentUrl(id: string, enabled = true) {
  return useQuery<string, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurement-attachment", id],
    enabled: Boolean(id) && enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const url = attachmentUrl((await axios.get(`${URL}/attachments/${id}/download`)).data);
      if (!url) throw new Error("Attachment response does not include a preview URL.");
      return url;
    },
    meta: { errorMessage: "Failed to load attachment preview" },
  });
}

export function useUpdateProcurement(id: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { payload: CreateProcurementPayload; newParts?: CreateProcurementPart[]; updatedParts?: UpdateProcurementPart[]; deletedPartIds?: string[]; attachments?: File[] }>({
    mutationFn: async ({ payload, newParts = [], updatedParts = [], deletedPartIds = [], attachments = [] }) => {
      const updated = (await axios.put(`${URL}/${id}`, payload)).data;
      await Promise.all([
        ...updatedParts.map(({ id: partId, ...part }) => axios.put(`${URL}/spare-parts/${partId}`, part)),
        ...deletedPartIds.map((partId) => axios.delete(`${URL}/spare-parts/${partId}`)),
      ]);
      if (newParts.length > 0) await axios.post(`${URL}/${id}/bulk-spare-parts`, { payloads: newParts });
      if (attachments.length > 0) {
        const data = new FormData();
        attachments.forEach((file) => data.append("files", file));
        await axios.post(`${URL}/${id}/attachments`, data, { headers: { "Content-Type": "multipart/form-data" } });
      }
      return updated;
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "procurements"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", id] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", id, "spare-parts"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", id, "attachments"] }),
      ]);
    },
    meta: { errorMessage: "Failed to update purchase request", successMessage: "Purchase request updated successfully" },
  });
}

export function useSubmitProcurement(id: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, void>({
    mutationFn: async () => (await axios.put(`${URL}/${id}/status`, { status: "submit" })).data,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["asset-management", "procurements"] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", id] }),
        client.invalidateQueries({ queryKey: ["asset-management", "procurements", id, "approvals"] }),
      ]);
    },
    meta: { errorMessage: "Failed to submit purchase request for approval", successMessage: "Purchase request submitted for approval" },
  });
}

function procurementId(value: unknown): string {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current === "string" || typeof current === "number") return String(current);
    const item = record(current);
    const procurement = record(item.procurement);
    const id = item.id ?? item.procurement_id ?? procurement.id ?? procurement.procurement_id;
    if (id) return String(id);
    current = item.data ?? item.procurement ?? item.item;
  }
  return "";
}

export function useCreateProcurement() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { payload: CreateProcurementPayload; parts: CreateProcurementPart[]; attachments?: File[] }>({
    mutationFn: async ({ payload, parts, attachments = [] }) => {
      const created = (await axios.post(URL, payload)).data;
      const id = procurementId(created);
      if (!id) throw new Error("The procurement response did not include an ID.");
      // Attach all selected parts in one request after the procurement exists.
      if (parts.length > 0) {
        await axios.post(`${URL}/${id}/bulk-spare-parts`, { payloads: parts });
      }
      if (attachments.length > 0) {
        const data = new FormData();
        attachments.forEach((file) => data.append("files", file));
        await axios.post(`${URL}/${id}/attachments`, data, { headers: { "Content-Type": "multipart/form-data" } });
      }
      return created;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["asset-management", "procurements"] }),
    meta: { errorMessage: "Failed to create purchase request", successMessage: "Purchase request created successfully" },
  });
}

export function useDeleteProcurement() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${URL}/${id}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ["asset-management", "procurements"] }),
    meta: { errorMessage: "Failed to delete purchase request", successMessage: "Purchase request deleted successfully" },
  });
}
