"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const PACKAGES_URL = "/v1/portal/packages";
const MODULES_URL = "/v1/portal/modules";
const ENUMS_URL = "/v1/construction/enums";
const axios = axiosConfig(env.apiBaseUrl);

const applicationKeys = {
  packagesRoot: ["portal-packages"] as const,
  packages: ["portal-packages", "admin"] as const,
  modulesRoot: ["portal-modules"] as const,
  modules: ["portal-modules", "admin"] as const,
  enums: ["construction-enums", "portal"] as const,
};

export type PortalStatus = string;

export type PortalEnumOption = {
  label: string;
  value: string;
};

export type PortalEnums = {
  portal_module_status: PortalEnumOption[];
  portal_package_status: PortalEnumOption[];
};

export type PortalModule = {
  id: string;
  category: string;
  description: string;
  href: string;
  icon: string;
  is_menu: boolean;
  key: string;
  monthly_price: number;
  monthly_price_idr: number;
  name: string;
  order: number;
  parent_id: string;
  status: PortalStatus;
  version: string;
  yearly_price: number;
  yearly_price_idr: number;
};

export type PortalPackage = {
  id: string;
  description: string;
  icon: string;
  module_ids: string[];
  modules: PortalModule[];
  monthly_price: number;
  monthly_price_idr: number;
  name: string;
  status: PortalStatus;
  version: string;
  updated_at?: unknown;
  yearly_price: number;
  yearly_price_idr: number;
};

export type PortalPackagePayload = {
  description: string;
  icon: string;
  module_ids: string[];
  monthly_price: number;
  name: string;
  status: string;
  version: string;
  yearly_price: number;
};

export type PortalModulePayload = {
  category: string;
  description: string;
  href: string;
  icon: string;
  is_menu: boolean;
  key: string;
  monthly_price: number;
  name: string;
  order: number;
  parent_id: string;
  status: string;
  version: string;
  yearly_price: number;
};

function findList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const object = payload as Record<string, unknown>;
  for (const key of ["items", "data", ...keys]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value, keys);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeStatus(value: unknown): PortalStatus {
  return String(value ?? "active");
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["true", "1", "yes"].includes(String(value ?? "").toLowerCase());
}

function normalizeEnumOptions(value: unknown): PortalEnumOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): PortalEnumOption[] => {
    if (typeof raw === "string" || typeof raw === "number") {
      const option = String(raw);
      return [{ label: option, value: option }];
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const value = item.value ?? item.code ?? item.id;
    if (value == null) return [];
    return [
      {
        label: String(item.label ?? item.name ?? value),
        value: String(value),
      },
    ];
  });
}

function extractPortalEnums(payload: unknown): PortalEnums {
  let current = payload;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      break;
    const object = current as Record<string, unknown>;
    if (
      Array.isArray(object.portal_package_status) ||
      Array.isArray(object.portal_module_status)
    ) {
      return {
        portal_package_status: normalizeEnumOptions(
          object.portal_package_status,
        ),
        portal_module_status: normalizeEnumOptions(object.portal_module_status),
      };
    }
    current = object.data ?? object.enums ?? object.items;
  }
  return { portal_package_status: [], portal_module_status: [] };
}

function normalizeModule(raw: unknown, index: number): PortalModule {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(item.id ?? item._id ?? item.module_id ?? index),
    category: String(item.category ?? "Uncategorized"),
    description: String(item.description ?? ""),
    href: String(item.href ?? ""),
    icon: String(item.icon ?? ""),
    is_menu: normalizeBoolean(item.is_menu),
    key: String(item.key ?? ""),
    monthly_price: Number(item.monthly_price ?? 0),
    monthly_price_idr: Number(item.monthly_price_idr ?? 0),
    name: String(item.name ?? "Untitled module"),
    order: Number(item.order ?? 0),
    parent_id: String(item.parent_id ?? ""),
    status: normalizeStatus(item.status),
    version: String(item.version || "1"),
    yearly_price: Number(item.yearly_price ?? 0),
    yearly_price_idr: Number(item.yearly_price_idr ?? 0),
  };
}

function normalizePackage(raw: unknown, index: number): PortalPackage {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const rawModules = item.included_modules ?? item.modules;
  const modules = Array.isArray(rawModules)
    ? rawModules.map(normalizeModule)
    : [];
  const rawModuleIds = item.module_ids ?? item.included_module_ids;
  const moduleIds = Array.isArray(rawModuleIds)
    ? rawModuleIds.map(String)
    : modules.map((module) => module.id);

  return {
    id: String(item.id ?? item._id ?? item.package_id ?? index),
    description: String(item.description ?? ""),
    icon: String(item.icon ?? ""),
    module_ids: moduleIds,
    modules,
    monthly_price: Number(item.monthly_price ?? 0),
    monthly_price_idr: Number(item.monthly_price_idr ?? 0),
    name: String(item.name ?? "Untitled application"),
    status: normalizeStatus(item.status),
    version: String(item.version || "1"),
    updated_at: item.updated_at,
    yearly_price: Number(item.yearly_price ?? 0),
    yearly_price_idr: Number(item.yearly_price_idr ?? 0),
  };
}

function extractPackage(payload: unknown): PortalPackage | null {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      break;
    const object = current as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(object, "data") &&
      object.data == null
    ) {
      return null;
    }
    const nested = object.data ?? object.item ?? object.package;
    if (!nested || Array.isArray(nested)) break;
    current = nested;
  }
  return current && typeof current === "object" && !Array.isArray(current)
    ? normalizePackage(current, 0)
    : null;
}

function extractModule(payload: unknown): PortalModule | null {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current))
      break;
    const object = current as Record<string, unknown>;
    if (
      Object.prototype.hasOwnProperty.call(object, "data") &&
      object.data == null
    ) {
      return null;
    }
    const nested = object.data ?? object.item ?? object.module;
    if (!nested || Array.isArray(nested)) break;
    current = nested;
  }
  return current && typeof current === "object" && !Array.isArray(current)
    ? normalizeModule(current, 0)
    : null;
}

export function usePortalPackages() {
  return useQuery<PortalPackage[], AxiosError<ApiResponseError>>({
    queryKey: applicationKeys.packages,
    queryFn: async () =>
      findList((await axios.get(PACKAGES_URL)).data, ["packages"]).map(
        normalizePackage,
      ),
    meta: { errorMessage: "Failed to load applications" },
  });
}

export function usePortalModules() {
  return useQuery<PortalModule[], AxiosError<ApiResponseError>>({
    queryKey: applicationKeys.modules,
    queryFn: async () =>
      findList((await axios.get(MODULES_URL)).data, ["modules"]).map(
        normalizeModule,
      ),
    meta: { errorMessage: "Failed to load portal modules" },
  });
}

export function usePortalEnums() {
  return useQuery<PortalEnums, AxiosError<ApiResponseError>>({
    queryKey: applicationKeys.enums,
    queryFn: async () => extractPortalEnums((await axios.get(ENUMS_URL)).data),
    meta: { errorMessage: "Failed to load portal status options" },
  });
}

export function useCreatePortalPackage() {
  const queryClient = useQueryClient();
  return useMutation<
    PortalPackage | null,
    AxiosError<ApiResponseError>,
    PortalPackagePayload
  >({
    mutationFn: async (payload) =>
      extractPackage((await axios.post(PACKAGES_URL, payload)).data),
    meta: {
      errorMessage: "Failed to create application",
      successMessage: "Application created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.packagesRoot }),
  });
}

export function useUpdatePortalPackage() {
  const queryClient = useQueryClient();
  return useMutation<
    PortalPackage | null,
    AxiosError<ApiResponseError>,
    { id: string; payload: PortalPackagePayload }
  >({
    mutationFn: async ({ id, payload }) =>
      extractPackage((await axios.put(`${PACKAGES_URL}/${id}`, payload)).data),
    meta: {
      errorMessage: "Failed to update application",
      successMessage: "Application updated successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.packagesRoot }),
  });
}

export function useSyncPortalPackageModules() {
  const queryClient = useQueryClient();
  return useMutation<
    PortalPackage | null,
    AxiosError<ApiResponseError>,
    { id: string; payload: PortalPackagePayload }
  >({
    mutationFn: async ({ id, payload }) =>
      extractPackage((await axios.put(`${PACKAGES_URL}/${id}`, payload)).data),
    meta: {
      errorMessage: "Failed to sync package modules",
      successMessage: "Package modules synced successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.packagesRoot }),
  });
}

export function useDeletePortalPackage() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) =>
      (await axios.delete(`${PACKAGES_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete application",
      successMessage: "Application deleted successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.packagesRoot }),
  });
}

export function useUpdatePortalModule() {
  const queryClient = useQueryClient();
  return useMutation<
    PortalModule | null,
    AxiosError<ApiResponseError>,
    { id: string; payload: PortalModulePayload }
  >({
    mutationFn: async ({ id, payload }) =>
      extractModule((await axios.put(`${MODULES_URL}/${id}`, payload)).data),
    meta: {
      errorMessage: "Failed to update module",
      successMessage: "Module updated successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.modulesRoot }),
  });
}

export function useCreatePortalModule() {
  const queryClient = useQueryClient();
  return useMutation<
    PortalModule | null,
    AxiosError<ApiResponseError>,
    PortalModulePayload
  >({
    mutationFn: async (payload) =>
      extractModule((await axios.post(MODULES_URL, payload)).data),
    meta: {
      errorMessage: "Failed to create module",
      successMessage: "Module created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: applicationKeys.modulesRoot }),
  });
}

export function useDeletePortalModule() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${MODULES_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete module",
      successMessage: "Module deleted successfully",
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: applicationKeys.modulesRoot,
        }),
        queryClient.invalidateQueries({
          queryKey: applicationKeys.packagesRoot,
        }),
      ]);
    },
  });
}
