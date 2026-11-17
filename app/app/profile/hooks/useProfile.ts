"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import {
  queryKeys,
  type ApiResponse,
  type ApiResponseError
} from "@/types/api";
import type { AuthMeData } from "@/hooks/useAuthMe";

const axios = axiosConfig(env.apiBaseUrl);
const LABOUR_URL = "/v1/construction/labour";
const CHANGE_PASSWORD_URL = "/v1/auth/change-password";

/** Payload accepted by PUT /v1/construction/labour/{id}. */
export type UpdateLabourPayload = {
  address?: string;
  available_shift_ids?: string[];
  contract_end_date?: string;
  date_of_birth?: string;
  department_id?: string;
  email?: string;
  full_name?: string;
  gender?: string;
  note?: string;
  phone_number?: string;
  position_id?: string;
  preferred_name?: string;
  rate_card_id?: string;
  role_id?: string;
  status?: string;
  type?: string;
};

/** Payload accepted by POST /v1/auth/change-password. */
export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

/** Updates the signed-in user's labour record. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; payload: UpdateLabourPayload }
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.put<ApiResponse<unknown>>(`${LABOUR_URL}/${id}`, payload))
        .data,
    meta: {
      errorMessage: "Failed to update profile",
      successMessage: "Profile updated successfully"
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    }
  });
}

/** Changes the signed-in user's password. */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, ChangePasswordPayload>(
    {
      mutationFn: async (payload) =>
        (await axios.post<ApiResponse<unknown>>(CHANGE_PASSWORD_URL, payload))
          .data,
      meta: {
        errorMessage: "Failed to change password",
        successMessage: "Password changed successfully"
      },
      onSuccess: () => {
        // Refresh /v1/auth/me so password_changed_at updates in the UI.
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      }
    }
  );
}

/** Convenience selector for the labour id from the auth/me response. */
export function getLabourId(me?: AuthMeData): string | undefined {
  return me?.labour?.id;
}
