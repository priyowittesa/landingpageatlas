"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { ReceiveListItem } from "./data";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction-equipment/procurement-receivings";

export type ReceiveListFilters = {
  search?: string;
  procurement_id?: string;
  status?: string;
  received_from?: string;
  received_until?: string;
  page_size: number;
  page_token?: string;
};

export type ReceiveListPage = {
  items: ReceiveListItem[];
  totalCount: number;
  nextPageToken: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback = ""): string {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") {
    const item = record(value);
    return text(item.name ?? item.full_name ?? item.number ?? item.code, fallback);
  }
  return String(value);
}

function normalizeReceiving(value: unknown, index: number): ReceiveListItem {
  const item = record(value);
  const procurement = record(item.procurement);
  const receiver = record(item.receiver ?? item.received_by);
  const supplier = record(item.supplier ?? procurement.supplier);
  const rawItems = item.items ?? item.receiving_items ?? item.procurement_receiving_items;
  const rows = Array.isArray(rawItems) ? rawItems : [];
  const received = Number(item.total_received ?? item.received_quantity ?? item.quantity_received ?? rows.reduce((total, row) => total + Number(record(row).received_quantity ?? record(row).quantity ?? 0), 0));
  const expected = Number(item.total_expected ?? item.total_quantity ?? item.ordered_quantity ?? rows.reduce((total, row) => total + Number(record(row).ordered_quantity ?? record(row).quantity ?? 0), 0));

  return {
    id: text(item.id ?? item.procurement_receiving_id, String(index)),
    reference: text(item.receiving_number ?? item.reference_number ?? item.number ?? item.code, "-"),
    dateReceived: text(item.received_at ?? item.received_date ?? item.receiving_date ?? item.created_at),
    receiver: text(item.receiver_name ?? item.received_by_name ?? receiver, "-"),
    supplier: text(item.supplier_name ?? supplier, "-"),
    status: text(item.status, "new").toLowerCase(),
    totalReceived: text(item.total_received_label, `${received}/${expected}`),
  };
}

export function useReceiveList(filters: ReceiveListFilters) {
  return useQuery<ReceiveListPage, AxiosError<ApiResponseError>>({
    queryKey: ["asset-management", "procurement-receivings", filters],
    queryFn: async () => {
      const response = await axios.get(URL, { params: filters });
      const outer = record(response.data);
      const payload = outer.data ?? response.data;
      const body = record(payload);
      const rawItems = Array.isArray(payload) ? payload : body.items ?? body.procurement_receivings ?? body.receivings ?? body.results;
      const items = Array.isArray(rawItems) ? rawItems.map(normalizeReceiving) : [];
      const pagination = record(body.pagination);

      return {
        items,
        totalCount: Number(body.total_count ?? body.totalCount ?? outer.total_count ?? pagination.total_count ?? items.length),
        nextPageToken: text(body.next_page_token ?? body.nextPageToken ?? outer.next_page_token ?? pagination.next_page_token),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load procurement receivings" },
  });
}
