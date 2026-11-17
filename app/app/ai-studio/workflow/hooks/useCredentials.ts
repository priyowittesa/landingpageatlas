"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";
import type { Secret, SecretFormDto, SecretListResponse, MicrosoftSiteListResponse, GoogleDriveFileListResponse } from "../types";

const axios = axiosConfig(env.apiBaseUrl);

export const credentialKeys = {
  secrets: (nodeType: string) => ["getSecrets", nodeType] as const,
};

/** Saved connections (secrets) available for a given node type. */
export const useGetSecrets = (nodeType: string | null | undefined) =>
  useQuery<SecretListResponse, AxiosError<ApiResponseError>>({
    queryKey: credentialKeys.secrets(nodeType ?? ""),
    queryFn: async () => {
      const response = await axios.get<SecretListResponse>("/v1/secrets", {
        params: { node_type: nodeType },
      });
      return response.data;
    },
    enabled: !!nodeType,
    meta: { errorMessage: "Failed to fetch connections" },
  });

export const useCreateSecret = () => {
  return useMutation<
    ApiResponse<Secret>,
    AxiosError<ApiResponseError>,
    SecretFormDto
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ApiResponse<Secret>>(
        "/v1/secrets",
        payload
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to save secret",
      successMessage: "Secret saved successfully",
    },
  });
};

/** Microsoft SharePoint sites available for a given connection (secret). */
export const useGetMicrosoftSites = (secretId: string | null | undefined) =>
  useQuery<MicrosoftSiteListResponse, AxiosError<ApiResponseError>>({
    queryKey: ["microsoftSites", secretId ?? ""],
    queryFn: async () => {
      const response = await axios.get(`/v1/secrets/${secretId}/microsoft/sites`);
      const data = response.data?.data ?? response.data;
      return data as MicrosoftSiteListResponse;
    },
    enabled: !!secretId,
    retry: 0,
    meta: { errorMessage: "Failed to fetch Microsoft sites" },
  });

/** Google Drive files available for a given connection (secret). */
export const useGetGoogleDriveFiles = (secretId: string | null | undefined) =>
  useQuery<GoogleDriveFileListResponse, AxiosError<ApiResponseError>>({
    queryKey: ["googleDriveFiles", secretId ?? ""],
    queryFn: async () => {
      const response = await axios.get(
        `/v1/secrets/${secretId}/google/drive/files`
      );
      const data = response.data?.data ?? response.data;
      return data as GoogleDriveFileListResponse;
    },
    enabled: !!secretId,
    retry: 0,
    meta: { errorMessage: "Failed to fetch Google Drive files" },
  });
