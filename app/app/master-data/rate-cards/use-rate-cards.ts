"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import {
  RATE_CARD_CURRENCIES,
  RATE_CARD_STATUSES,
  RATE_CARD_UNITS,
  type RateCard,
  type RateCardPayload,
  type RoleOption,
} from "./types";

const RATE_CARD_URL = "/v1/construction/rate-card";
const RATE_CARD_DASHBOARD_SUMMARY_URL = `${RATE_CARD_URL}/dashboard-summary`;
const ROLE_URL = "/v1/construction/role";
const axios = axiosConfig(env.apiBaseUrl);

const rateCardKeys = {
  all: ["construction-rate-cards"] as const,
  dashboardSummary: ["construction-rate-cards", "dashboard-summary"] as const,
  detail: (id: string) => ["construction-rate-cards", id] as const,
  roles: ["construction-roles"] as const,
};

function findList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["data", "items", ...keys]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value, keys);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeRole(raw: unknown): RoleOption | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const nestedRole = item.role && typeof item.role === "object"
    ? item.role as Record<string, unknown>
    : undefined;
  const id = item.id ?? item._id ?? item.role_id ?? nestedRole?.id ?? nestedRole?._id;
  const name = item.name ?? item.title ?? item.label ?? item.role_name
    ?? nestedRole?.name ?? nestedRole?.title;
  return id == null || name == null ? null : { id: String(id), name: String(name) };
}

function extractRoles(payload: unknown): RoleOption[] {
  return findList(payload, ["roles"]).flatMap((item) => {
    const role = normalizeRole(item);
    return role ? [role] : [];
  });
}

function oneOf<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]) {
  const match = values.find((item) => item.toLowerCase() === String(value ?? "").toLowerCase());
  return (match ?? fallback) as T[number];
}

function normalizeRateCard(raw: unknown, index: number): RateCard {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawRoles = item.applicable_roles ?? item.roles ?? item.role_ids ?? item.applicable_role_ids;
  const applicableRoles = Array.isArray(rawRoles)
    ? rawRoles.flatMap((role) => {
        if (typeof role === "string" || typeof role === "number") {
          return [{ id: String(role), name: String(role) }];
        }
        const normalized = normalizeRole(role);
        return normalized ? [normalized] : [];
      })
    : [];

  return {
    id: String(item.id ?? item._id ?? item.rate_card_id ?? index),
    code: String(item.code ?? item.rate_card_code ?? ""),
    name: String(item.name ?? item.title ?? item.rate_card_name ?? "Untitled rate card"),
    applicable_roles: applicableRoles,
    role_ids: applicableRoles.map((role) => role.id),
    currency: oneOf(item.currency, RATE_CARD_CURRENCIES, "IDR"),
    base_rate: Number(item.base_rate ?? item.rate ?? 0),
    unit: oneOf(item.unit ?? item.per_unit, RATE_CARD_UNITS, "Hour"),
    status: oneOf(item.status, RATE_CARD_STATUSES, "active"),
  };
}

function extractRateCards(payload: unknown): RateCard[] {
  return findList(payload, ["rate_cards", "rateCards"]).map(normalizeRateCard);
}

function extractRateCard(payload: unknown): RateCard | null {
  if (!payload || typeof payload !== "object") return null;
  let item: unknown = payload;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!item || typeof item !== "object" || Array.isArray(item)) break;
    const object = item as Record<string, unknown>;
    const nested = object.data ?? object.rate_card ?? object.rateCard;
    if (!nested || Array.isArray(nested)) break;
    item = nested;
  }
  return item && typeof item === "object" && !Array.isArray(item)
    ? normalizeRateCard(item, 0)
    : null;
}

export interface RateCardListFilters {
  pageSize?: number;
  pageToken?: string;
  currency?: string;
  unit?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface RateCardListResult {
  items: RateCard[];
  nextPageToken: string;
  totalCount: number;
}

export type RateCardDashboardSummary = Record<string, number>;

function extractRateCardList(payload: unknown): RateCardListResult {
  const items = extractRateCards(payload);
  let current: unknown = payload;
  let nextPageToken = "";
  let totalCount: number | undefined;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const envelope = current as Record<string, unknown>;
    const token = envelope.next_page_token ?? envelope.nextPageToken;
    const count = envelope.total_count ?? envelope.totalCount;
    if (token != null) nextPageToken = String(token);
    if (count != null && Number.isFinite(Number(count))) {
      totalCount = Number(count);
    }
    current = envelope.data ?? envelope.result ?? envelope.rate_cards;
  }

  return {
    items,
    nextPageToken,
    totalCount: totalCount ?? items.length,
  };
}

export function useRateCards() {
  return useQuery<RateCard[], AxiosError<ApiResponseError>>({
    queryKey: rateCardKeys.all,
    queryFn: async () => extractRateCards((await axios.get(RATE_CARD_URL)).data),
    meta: { errorMessage: "Failed to load rate cards" },
  });
}

export function useRateCardList(filters: RateCardListFilters = {}) {
  return useQuery<RateCardListResult, AxiosError<ApiResponseError>>({
    queryKey: [...rateCardKeys.all, "list", filters],
    queryFn: async () => {
      const response = await axios.get(RATE_CARD_URL, {
        params: {
          page_size: filters.pageSize,
          page_token: filters.pageToken || undefined,
          currency: filters.currency || undefined,
          unit: filters.unit || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined,
          sort_by: filters.sortBy || undefined,
          sort_order: filters.sortDir || undefined,
        },
      });
      return extractRateCardList(response.data);
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load rate cards" },
  });
}

export function useRateCardDashboardSummary() {
  return useQuery<RateCardDashboardSummary, AxiosError<ApiResponseError>>({
    queryKey: rateCardKeys.dashboardSummary,
    queryFn: async () => {
      const response = await axios.get(RATE_CARD_DASHBOARD_SUMMARY_URL);
      let current: unknown = response.data;

      for (let depth = 0; depth < 5; depth += 1) {
        if (!current || typeof current !== "object" || Array.isArray(current)) {
          return {};
        }
        const object = current as Record<string, unknown>;
        const summary = Object.fromEntries(
          Object.entries(object).flatMap(([key, rawValue]) => {
            const count =
              typeof rawValue === "number" ? rawValue : Number(rawValue);
            return Number.isFinite(count) ? [[key, count]] : [];
          }),
        );
        if (Object.keys(summary).length) return summary;
        current = object.data ?? object.summary ?? object.result;
      }
      return {};
    },
    meta: { errorMessage: "Failed to load rate card dashboard summary" },
  });
}

export function useRateCard(id: string) {
  return useQuery<RateCard | null, AxiosError<ApiResponseError>>({
    queryKey: rateCardKeys.detail(id),
    queryFn: async () => extractRateCard((await axios.get(`${RATE_CARD_URL}/${id}`)).data),
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load rate card details" },
  });
}

export function useRateCardRoles() {
  return useQuery<RoleOption[], AxiosError<ApiResponseError>>({
    queryKey: rateCardKeys.roles,
    queryFn: async () => extractRoles((await axios.get(ROLE_URL)).data),
    meta: { errorMessage: "Failed to load applicable roles" },
  });
}

export function useCreateRateCard() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, RateCardPayload>({
    mutationFn: async (payload) => (await axios.post(RATE_CARD_URL, payload)).data,
    meta: { errorMessage: "Failed to create rate card", successMessage: "Rate card created successfully" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rateCardKeys.all }),
  });
}

export function useUpdateRateCard() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { id: string; payload: RateCardPayload }>({
    mutationFn: async ({ id, payload }) => (await axios.put(`${RATE_CARD_URL}/${id}`, payload)).data,
    meta: { errorMessage: "Failed to update rate card", successMessage: "Rate card updated successfully" },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rateCardKeys.all });
      queryClient.invalidateQueries({ queryKey: rateCardKeys.detail(id) });
    },
  });
}

export function useDeleteRateCard() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${RATE_CARD_URL}/${id}`)).data,
    meta: { errorMessage: "Failed to delete rate card", successMessage: "Rate card deleted successfully" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rateCardKeys.all }),
  });
}
