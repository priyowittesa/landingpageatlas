"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import {
  type ApiResponse,
  type ApiResponseError,
} from "@/types/api";

const ENTITY_URL = `${env.apiBaseUrl}/strategy-planner`;
const axios = axiosConfig(env.apiBaseUrl);

export const useGetStrategyPlanners = () =>
  useQuery<ApiResponse<unknown[]>, AxiosError<ApiResponseError>>({
    queryKey: ["getStrategyPlanners"] as const,
    queryFn: async () => {
      const response = await axios.get<ApiResponse<unknown[]>>(ENTITY_URL);
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch strategy planners" },
  });

export const useGetStrategyPlanner = (id: string) =>
  useQuery<ApiResponse<unknown>, AxiosError<ApiResponseError>>({
    queryKey: ["getOneStrategyPlanner", id] as const,
    queryFn: async () => {
      const response = await axios.get<ApiResponse<unknown>>(
        `${ENTITY_URL}/${id}`
      );
      return response.data;
    },
    enabled: !!id,
    meta: { errorMessage: "Failed to fetch strategy planner" },
  });
