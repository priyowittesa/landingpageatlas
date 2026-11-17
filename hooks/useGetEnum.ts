"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

export interface EnumItem {
  label: string;
  value: string;
}

export function useGetEnum(group: string) {
  return useQuery<EnumItem[], AxiosError<ApiResponseError>>({
    queryKey: ["enum", group],
    enabled: Boolean(group),
    queryFn: async () => {
      const response = await axios.get(`/v1/construction/enums/${group}`);
      const body = response.data;
      // Handle multiple possible response shapes:
      // { items: [...] } | { data: { items: [...] } } | { data: [...] }
      const items =
        body?.items ??
        body?.data?.items ??
        body?.data ??
        [];
      return items as EnumItem[];
    },
    meta: { errorMessage: `Failed to fetch enum: ${group}` },
  });
}
