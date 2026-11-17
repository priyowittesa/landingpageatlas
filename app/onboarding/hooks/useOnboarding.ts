"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const TENANT_URL = "/v1/auth/tenant";
const ROLE_URL = "/v1/construction/role";
const LABOUR_URL = "/v1/construction/labour";
const ME_URL = "/v1/auth/me";

export type CreateTenantPayload = {
  user_id: string;
  company_name: string;
  industry: string;
  company_size: string;
  business_priorities: string;
  departments: string;
  tools: string;
  primary_goal: string;
};

export type Tenant = {
  id: string;
  name?: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateRolePayload = {
  name: string;
  description: string;
};

export type SuperadminRole = {
  id: string;
  name: string;
};

export type MeResponse = {
  id: string;
  full_name?: string;
  user_id?: string;
  email?: string;
  auth_user_id?: string;
  type?: string;
};

export type CreateLabourPayload = {
  email: string;
  code?: string;
  full_name: string;
  auth_user_id: string;
  type: string;
  role_id: string;
  temporary_password?: string;
};

export function useCreateTenant() {
  return useMutation<
    ApiResponse<Tenant>,
    AxiosError<ApiResponseError>,
    CreateTenantPayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ApiResponse<Tenant>>(TENANT_URL, payload);
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create workspace",
      successMessage: "Workspace created successfully",
    },
  });
}

export function useCreateRole() {
  return useMutation<
    Role,
    AxiosError<ApiResponseError>,
    CreateRolePayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<Role>(ROLE_URL, payload);
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create role",
      // successMessage: "Role created successfully",
    },
  });
}

export function useCreateLabour() {
  return useMutation<
    ApiResponse<unknown>,
    AxiosError<ApiResponseError>,
    CreateLabourPayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ApiResponse<unknown>>(LABOUR_URL, {
        ...payload,
        temporary_password: payload.temporary_password ?? "Qwerty123*",
      });
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create labour",
      // successMessage: "Labour created successfully",
    },
  });
}

export async function fetchMe(): Promise<MeResponse> {
  const response = await axios.get<ApiResponse<MeResponse>>(ME_URL);
  return response.data.data;
}
