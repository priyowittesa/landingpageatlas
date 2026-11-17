"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const SKILLS_URL = `${env.apiBaseUrl}/workflow/skills`;
const SKILL_URL = (skillId: string) => `${SKILLS_URL}/${skillId}`;

export interface WorkflowSkill {
  id: string;
  title: string;
  description: string;
  revision: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
  source?: string;
  tenant: string;
}

export interface WorkflowSkillDetail extends WorkflowSkill {
  content: string;
}

export interface WorkflowSkillListResponse {
  items: WorkflowSkill[];
  next_page_token: string;
  total_count: number;
}

export interface WorkflowSkillCreateDto {
  content: string;
  description: string;
  source?: string;
  /** @deprecated Prefer `source`; retained for existing Synergy skill creation. */
  tenant?: string;
  title: string;
}

export interface WorkflowSkillUpdateDto {
  content: string;
  description: string;
  expected_revision: number;
  title: string;
}

export const workflowSkillKeys = {
  all: ["workflowSkills"] as const,
  lists: () => [...workflowSkillKeys.all, "list"] as const,
  list: (search: string, pageToken: string) =>
    [...workflowSkillKeys.lists(), search, pageToken] as const,
  details: () => [...workflowSkillKeys.all, "detail"] as const,
  detail: (skillId: string) =>
    [...workflowSkillKeys.details(), skillId] as const
};

export function useGetWorkflowSkills(
  search = "",
  pageToken = "",
  enabled = true
) {
  return useQuery<
    ApiResponse<WorkflowSkillListResponse>,
    AxiosError<ApiResponseError>
  >({
    queryKey: workflowSkillKeys.list(search, pageToken),
    enabled,
    queryFn: async () =>
      (
        await axios.get<ApiResponse<WorkflowSkillListResponse>>(SKILLS_URL, {
          params: {
            page_size: 100,
            ...(search ? { search } : {}),
            ...(pageToken ? { page_token: pageToken } : {})
          }
        })
      ).data,
    placeholderData: (previous) => previous,
    meta: { errorMessage: "Failed to load skills" }
  });
}

export function useGetWorkflowSkill(skillId: string | null) {
  return useQuery<
    ApiResponse<WorkflowSkillDetail>,
    AxiosError<ApiResponseError>
  >({
    queryKey: workflowSkillKeys.detail(skillId ?? ""),
    enabled: Boolean(skillId),
    queryFn: async () =>
      (
        await axios.get<ApiResponse<WorkflowSkillDetail>>(
          SKILL_URL(skillId!)
        )
      ).data,
    meta: { errorMessage: "Failed to load skill" }
  });
}

export function useCreateWorkflowSkill() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<WorkflowSkillDetail>,
    AxiosError<ApiResponseError>,
    WorkflowSkillCreateDto
  >({
    mutationFn: async (payload) =>
      (
        await axios.post<ApiResponse<WorkflowSkillDetail>>(SKILLS_URL, payload)
      ).data,
    onSuccess: (response) => {
      queryClient.setQueryData(
        workflowSkillKeys.detail(response.data.id),
        response
      );
      return queryClient.invalidateQueries({
        queryKey: workflowSkillKeys.lists()
      });
    },
    meta: {
      errorMessage: "Failed to create skill",
      successMessage: "Skill created successfully"
    }
  });
}

export function useUpdateWorkflowSkill() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<WorkflowSkillDetail>,
    AxiosError<ApiResponseError>,
    { skillId: string } & WorkflowSkillUpdateDto
  >({
    mutationFn: async ({ skillId, ...payload }) =>
      (
        await axios.put<ApiResponse<WorkflowSkillDetail>>(
          SKILL_URL(skillId),
          payload
        )
      ).data,
    onSuccess: (response, { skillId }) => {
      queryClient.setQueryData(workflowSkillKeys.detail(skillId), response);
      return queryClient.invalidateQueries({
        queryKey: workflowSkillKeys.lists()
      });
    },
    meta: {
      errorMessage: "Failed to save skill",
      successMessage: "Skill updated successfully"
    }
  });
}

export function useDeleteWorkflowSkill() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<unknown>,
    AxiosError<ApiResponseError>,
    string
  >({
    mutationFn: async (skillId) =>
      (await axios.delete<ApiResponse<unknown>>(SKILL_URL(skillId))).data,
    onSuccess: (_, skillId) => {
      queryClient.removeQueries({
        queryKey: workflowSkillKeys.detail(skillId)
      });
      return queryClient.invalidateQueries({
        queryKey: workflowSkillKeys.lists()
      });
    },
    meta: {
      errorMessage: "Failed to delete skill",
      successMessage: "Skill deleted successfully"
    }
  });
}
