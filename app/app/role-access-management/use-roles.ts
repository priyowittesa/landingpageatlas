"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { queryKeys, type ApiResponseError } from "@/types/api";
import {
  ROLE_ACCESS_LEVELS,
  type Role,
  type RoleAccess,
  type RoleAccessLevel,
  type RoleAccessPayload,
  type RoleListFilters,
  type RoleListResponse,
  type RolePayload,
} from "./types";

const ROLE_URL = "/v1/construction/role";
const ROLE_ACCESS_URL = "/v1/auth/rbac/role-access";
const axios = axiosConfig(env.apiBaseUrl);

export const roleKeys = {
  all: ["construction-roles"] as const,
  list: (filters: RoleListFilters) => ["construction-roles", "list", filters] as const,
  detail: (id: string) => ["construction-roles", id] as const,
  access: (id: string) => ["role-access", id] as const,
};

function findRoleAccessList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  if (object.module_key || object.key) return [object];
  for (const key of ["items", "data", "role_access", "permissions"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    const nested = findRoleAccessList(value);
    if (nested.length) return nested;
  }
  return [];
}

function normalizeAccessLevel(value: unknown): RoleAccessLevel {
  const level = String(value ?? "no_access")
    .replace(/^ACCESS_LEVEL_/, "")
    .toLowerCase() as RoleAccessLevel;
  return ROLE_ACCESS_LEVELS.includes(level) ? level : "no_access";
}

const ROLE_ACCESS_LEVEL_PREFIX = "ACCESS_LEVEL_";

function serializeAccessLevel(level: RoleAccessLevel): string {
  return `${ROLE_ACCESS_LEVEL_PREFIX}${level.toUpperCase()}`;
}

function extractRoleAccess(payload: unknown, roleId: string): RoleAccess[] {
  return findRoleAccessList(payload).flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const moduleKey = item.module_key ?? item.key;
    if (!moduleKey) return [];
    return [{
      access_level: normalizeAccessLevel(item.access_level),
      module_key: String(moduleKey),
      role_id: String(item.role_id ?? roleId),
    }];
  });
}

export function useRoles(filters: RoleListFilters = {}) {
  return useQuery<RoleListResponse, AxiosError<ApiResponseError>>({
    queryKey: roleKeys.list(filters),
    queryFn: async () => (await axios.get<RoleListResponse>(ROLE_URL, { params: filters })).data,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Failed to load roles" },
  });
}

export function useRole(id: string) {
  return useQuery<Role, AxiosError<ApiResponseError>>({
    queryKey: roleKeys.detail(id),
    queryFn: async () => (await axios.get<Role>(`${ROLE_URL}/${id}`)).data,
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load role details" },
  });
}

export function useRoleAccess(id: string) {
  return useQuery<RoleAccess[], AxiosError<ApiResponseError>>({
    queryKey: roleKeys.access(id),
    queryFn: async () =>
      extractRoleAccess(
        (await axios.get(ROLE_ACCESS_URL, { params: { role_id: id } })).data,
        id,
      ),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useSetRoleAccess() {
  const queryClient = useQueryClient();
  return useMutation<RoleAccess, AxiosError<ApiResponseError>, RoleAccessPayload>({
    mutationFn: async (payload) => {
      const response = await axios.post(ROLE_ACCESS_URL, {
        ...payload,
        access_level: serializeAccessLevel(payload.access_level),
      });
      return extractRoleAccess(response.data, payload.role_id).find(
        (item) => item.module_key === payload.module_key,
      ) ?? { ...payload, access_level: normalizeAccessLevel(payload.access_level) };
    },
    meta: {
      errorMessage: "Failed to update role permission",
    },
    onSuccess: (savedPermission, payload) => {
      queryClient.setQueryData<RoleAccess[]>(
        roleKeys.access(payload.role_id),
        (current = []) => [
          ...current.filter(
            (item) => item.module_key !== savedPermission.module_key,
          ),
          savedPermission,
        ],
      );

      queryClient.invalidateQueries({
        queryKey: roleKeys.access(payload.role_id),
      });

      // Refresh the current user's RBAC modules so access changes are
      // reflected immediately via GET /v1/auth/me.
      return queryClient.invalidateQueries({
        queryKey: queryKeys.user.me(),
      });
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation<Role, AxiosError<ApiResponseError>, RolePayload>({
    mutationFn: async (payload) => (await axios.post<Role>(ROLE_URL, payload)).data,
    meta: { errorMessage: "Failed to create role", successMessage: "Role created successfully" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation<Role, AxiosError<ApiResponseError>, { id: string; payload: RolePayload }>({
    mutationFn: async ({ id, payload }) => (await axios.put<Role>(`${ROLE_URL}/${id}`, payload)).data,
    meta: { errorMessage: "Failed to update role", successMessage: "Role updated successfully" },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (id) => (await axios.delete(`${ROLE_URL}/${id}`)).data,
    meta: { errorMessage: "Failed to delete role", successMessage: "Role deleted successfully" },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}
