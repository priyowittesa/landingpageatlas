"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import {
  queryKeys,
  type ApiResponse,
  type ApiResponsePagination,
  type ApiResponseError,
} from "@/types/api";
import type {
  CampaignBrief,
  CampaignBriefFilter,
  CampaignBriefFormDto,
} from "@/types/campaign-brief";

const ENTITY_URL = `${env.apiBaseUrl}/campaign-brief`;
const axios = axiosConfig(env.apiBaseUrl);

export const useGetCampaignBriefs = (filter: CampaignBriefFilter) =>
  useQuery<
    ApiResponsePagination<CampaignBrief[]>,
    AxiosError<ApiResponseError>
  >({
    queryKey: ["getCampaignBrief", filter] as const,
    queryFn: async () => {
      const response =
        await axios.get<ApiResponsePagination<CampaignBrief[]>>(
          ENTITY_URL,
          { params: filter }
        );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch campaign briefs" },
  });

export const useCreateCampaignBrief = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<CampaignBrief>,
    AxiosError<ApiResponseError>,
    CampaignBriefFormDto
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ApiResponse<CampaignBrief>>(
        ENTITY_URL,
        payload
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create campaign brief",
      successMessage: "Campaign brief created successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getCampaignBrief"] });
    },
  });
};
