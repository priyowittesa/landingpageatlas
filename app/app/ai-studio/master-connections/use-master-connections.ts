"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { ConnectionFilters, ConnectionListResult, ConnectionPayload, ConnectionStats, MasterConnection } from "./types";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/secrets";
const keys = { all: ["master-connections"] as const, detail: (id: string) => ["master-connections", id] as const };

function unwrapObject(payload: unknown): Record<string, unknown> {
  let current = payload;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    if (!object.data || typeof object.data !== "object" || Array.isArray(object.data)) return object;
    current = object.data;
  }
  return (current && typeof current === "object" ? current : {}) as Record<string, unknown>;
}

function findItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["items", "data", "results"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") { const nested = findItems(value); if (nested.length) return nested; }
  }
  return [];
}

function normalize(raw: unknown, index: number): MasterConnection {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawEnvironment = String(item.environment ?? "development").toLowerCase();
  const environment = rawEnvironment === "production" || rawEnvironment === "staging" ? rawEnvironment : "development";
  return {
    id: String(item.id ?? item.secret_id ?? index),
    name: String(item.name ?? item.display_name ?? "Untitled connection"),
    nodeType: String(item.node_type ?? item.connector_type ?? "unknown"),
    environment,
    status: String(item.status ?? "active").toLowerCase() === "inactive" ? "inactive" : "active",
    createdAt: String(item.created_at ?? ""),
    values: item.values && typeof item.values === "object" ? item.values as Record<string, string> : null,
  };
}

export function useMasterConnections(filters: ConnectionFilters = {}) {
  return useQuery<ConnectionListResult, AxiosError<ApiResponseError>>({
    queryKey: [...keys.all, filters],
    queryFn: async () => {
      const payload = (await axios.get(URL, {
        params: {
          node_type: filters.nodeType || undefined,
          environment: filters.environment || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
          page_size: filters.pageSize,
          page_token: filters.pageToken || undefined,
        },
      })).data;
      const items = findItems(payload).map(normalize);
      let current: unknown = payload;
      let nextPageToken = "";
      let totalCount: number | undefined;
      for (let depth = 0; depth < 4; depth += 1) {
        if (!current || typeof current !== "object" || Array.isArray(current)) break;
        const object = current as Record<string, unknown>;
        const token = object.next_page_token ?? object.nextPageToken;
        const count = object.total_count ?? object.totalCount ?? object.total;
        if (token != null) nextPageToken = String(token);
        if (count != null && Number.isFinite(Number(count))) totalCount = Number(count);
        current = object.data ?? object.result;
      }
      return { items, nextPageToken, totalCount: totalCount ?? items.length };
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load connections" },
  });
}

export function useMasterConnectionStats() {
  return useQuery<ConnectionStats, AxiosError<ApiResponseError>>({
    queryKey: [...keys.all, "stats"],
    queryFn: async () => {
      const data = unwrapObject((await axios.get(`${URL}/stats`)).data);
      const total = Number(data.total_connections ?? data.total ?? data.total_count ?? 0);
      const active = Number(data.active_connections ?? data.active ?? data.active_count ?? 0);
      const inactive = Number(data.inactive_connections ?? data.inactive ?? data.inactive_count ?? Math.max(0, total - active));
      return { total, active, inactive };
    },
    meta: { errorMessage: "Failed to load connection statistics" },
  });
}

export function useMasterConnection(id: string | null) {
  return useQuery<MasterConnection | null, AxiosError<ApiResponseError>>({
    queryKey: keys.detail(id ?? ""),
    queryFn: async () => {
      const response = await axios.get(`${URL}/${id}`);
      return normalize(response.data?.data ?? response.data, 0);
    },
    enabled: Boolean(id),
  });
}

function mutation<T>(method: "post" | "patch", successMessage: string) {
  return function useConnectionMutation() {
    const client = useQueryClient();
    return useMutation<unknown, AxiosError<ApiResponseError>, T>({
      mutationFn: async (input) => method === "post"
        ? (await axios.post(URL, input)).data
        : (await axios.patch(`${URL}/${(input as { id: string }).id}`, (input as { payload: unknown }).payload)).data,
      onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
      meta: { successMessage, errorMessage: `Failed to ${method === "post" ? "create" : "update"} connection` },
    });
  };
}

export const useCreateConnection = mutation<ConnectionPayload>("post", "Connection created successfully");
export const useUpdateConnection = mutation<{ id: string; payload: Partial<ConnectionPayload> & { status?: string } }>("patch", "Connection updated successfully");

export function useDeleteConnection() {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${URL}/${id}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all }),
    meta: { successMessage: "Connection deleted successfully", errorMessage: "Failed to delete connection" },
  });
}
