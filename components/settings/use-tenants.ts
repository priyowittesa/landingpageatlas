"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const TENANTS_URL = "/v1/auth/tenants/all";
const axios = axiosConfig(env.apiBaseUrl);

export type Tenant = {
  id: string;
  companyName: string;
  industry: string;
  companySize: string;
  status: string;
  createdAt?: string;
};

export type TenantFilters = {
  pageSize: number;
  pageToken?: string;
  search?: string;
};

export type TenantList = {
  items: Tenant[];
  nextPageToken?: string;
  totalCount: number;
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(...values: unknown[]) {
  return String(values.find((value) => value !== undefined && value !== null) ?? "");
}

function normalizeTenant(value: unknown, index: number): Tenant | null {
  const item = record(value);
  if (!item) return null;
  const profile = record(item.profile) ?? record(item.company) ?? {};
  const companyName = stringValue(
    item.company_name,
    item.companyName,
    item.name,
    profile.company_name,
    profile.name,
  );

  return {
    id: stringValue(item.id, item.tenant_id, item.uuid, `${companyName}-${index}`),
    companyName: companyName || "Unnamed tenant",
    industry: stringValue(item.industry, profile.industry) || "-",
    companySize: stringValue(item.company_size, item.companySize, profile.company_size) || "-",
    status: stringValue(item.status, item.is_active === false ? "inactive" : "active").toLowerCase(),
    createdAt: stringValue(item.created_at, item.joined_at) || undefined,
  };
}

function normalizeTenantList(payload: unknown): TenantList {
  const root = record(payload) ?? {};
  const data = record(root.data);
  const container = data ?? root;
  const rawItems = Array.isArray(root.data)
    ? root.data
    : Array.isArray(container.items)
      ? container.items
      : Array.isArray(container.tenants)
        ? container.tenants
        : [];
  const items = rawItems.flatMap((item, index) => {
    const tenant = normalizeTenant(item, index);
    return tenant ? [tenant] : [];
  });

  const total = Number(
    container.total_count ?? container.total ?? root.total_count ?? root.total ?? items.length,
  );
  const nextPageToken = stringValue(
    container.next_page_token,
    container.nextPageToken,
    root.next_page_token,
  );

  return {
    items,
    nextPageToken: nextPageToken || undefined,
    totalCount: Number.isFinite(total) ? total : items.length,
  };
}

export function useTenants(filters: TenantFilters) {
  return useQuery<TenantList, AxiosError<ApiResponseError>>({
    queryKey: ["auth-tenants", filters],
    queryFn: async () => {
      const response = await axios.get(TENANTS_URL, {
        params: {
          page_size: filters.pageSize,
          page_token: filters.pageToken,
          search: filters.search,
        },
      });
      return normalizeTenantList(response.data);
    },
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load tenants" },
  });
}
