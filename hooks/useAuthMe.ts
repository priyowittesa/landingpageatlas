"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { queryKeys, type ApiResponse, type ApiResponseError } from "@/types/api";
import type { RbacModule } from "@/components/layout/dasbhoard/navigation";

const axios = axiosConfig(env.apiBaseUrl);
const ME_URL = "/v1/auth/me";

export type AuthMeLabour = {
  id: string;
  code?: string;
  full_name?: string;
  preferred_name?: string;
  email?: string;
  phone_number?: string;
  status?: string;
  type?: string;
  role_id?: string;
  role_name?: string;
  position_id?: string;
  position_name?: string;
  department_id?: string;
  department_name?: string;
};

export type AuthMeCompany = {
  id: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  business_priorities?: string;
};

export type AuthMeRbac = {
  role_id: string;
  modules: RbacModule[];
};

export type AuthMeSubscription = {
  id: string;
  tenant_id: string;
  package_id: string;
  promo_code_id?: string;
  status: string;
  billing_cycle: string;
  discount_amount: number;
  final_price: number;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type AuthMeAddon = {
  id: string;
  tenant_id: string;
  module_id: string;
  promo_code_id?: string;
  status: string;
  billing_cycle: string;
  discount_amount: number;
  final_price: number;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type AuthMeData = {
  user_id: string;
  is_admin?: boolean;
  keycloak_subject?: string;
  name?: string;
  username?: string;
  roles?: string[];
  email?: string;
  email_verified?: boolean;
  last_login_at?: string;
  password_changed_at?: string;
  tenant_id?: string;
  labour?: AuthMeLabour;
  company?: AuthMeCompany;
  rbac?: AuthMeRbac | null;
  subscription?: AuthMeSubscription[];
  addons?: AuthMeAddon[];
  has_subscription?: boolean;
  subscription_expired?: boolean;
};

/** Fetches the current user's profile and RBAC modules from GET /v1/auth/me. */
export function useAuthMe(accessPath?: string) {
  return useQuery<AuthMeData, AxiosError<ApiResponseError>>({
    queryKey: accessPath
      ? [...queryKeys.user.me(), "route-access", accessPath]
      : queryKeys.user.me(),
    ...(accessPath ? { staleTime: 0, refetchOnMount: "always" as const } : {}),
    queryFn: async () => {
      const res = await axios.get<ApiResponse<AuthMeData>>(ME_URL);
      return res.data.data;
    },
    meta: { errorMessage: "Failed to load your access" },
  });
}
