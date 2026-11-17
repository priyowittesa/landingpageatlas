"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const LABOUR_GROUPS_URL = "/v1/construction-labour/groups";
const axios = axiosConfig(env.apiBaseUrl);

export type LabourGroupPayload = {
  capacity: number;
  description: string;
  name: string;
  project_id: string;
  sort_order: number;
};

export type LabourGroup = LabourGroupPayload & {
  id?: string;
};

export type LabourGroupUpdate = {
  id: string;
  payload: {
    name: string;
    project_id: string;
  };
};

export type LabourGroupOrderPayload = {
  end_date: string;
  items: {
    group_id: string;
    position: number;
  }[];
  project_id: string;
  start_date: string;
};

function extractLabourGroup(payload: unknown, fallback: LabourGroupPayload) {
  let current = payload;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    const object = current as Record<string, unknown>;
    const nested = object.data ?? object.group ?? object.item;
    if (!nested || nested === current) break;
    current = nested;
  }

  const group =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};

  return {
    ...fallback,
    id:
      group.id == null &&
      group._id == null &&
      group.group_id == null
        ? undefined
        : String(group.id ?? group._id ?? group.group_id),
    capacity: Number(group.capacity ?? fallback.capacity),
    description: String(group.description ?? fallback.description),
    name: String(group.name ?? group.group_name ?? fallback.name),
    project_id: String(group.project_id ?? fallback.project_id),
    sort_order: Number(
      group.sort_order ?? group.position ?? fallback.sort_order,
    ),
  } satisfies LabourGroup;
}

export function useCreateLabourGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    LabourGroup,
    AxiosError<ApiResponseError>,
    LabourGroupPayload
  >({
    mutationFn: async (payload) => {
      const response = await axios.post(LABOUR_GROUPS_URL, payload);
      return extractLabourGroup(response.data, payload);
    },
    meta: {
      errorMessage: "Failed to create group",
      successMessage: "Group created successfully",
    },
    onSuccess: (_, payload) =>
      queryClient.invalidateQueries({
        queryKey: ["construction-labour-roster-members", payload.project_id],
      }),
  });
}

export function useUpdateLabourGroupOrder() {
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    LabourGroupOrderPayload
  >({
    mutationFn: async (payload) =>
      (await axios.put(`${LABOUR_GROUPS_URL}/order`, payload)).data,
    meta: {
      errorMessage: "Failed to update group order",
      successMessage: "Group order updated successfully",
    },
  });
}

export function useUpdateLabourGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    LabourGroupUpdate
  >({
    mutationFn: async ({ id, payload }) =>
      (await axios.put(`${LABOUR_GROUPS_URL}/${id}`, payload)).data,
    meta: {
      errorMessage: "Failed to update group",
      successMessage: "Group updated successfully",
    },
    onSuccess: (_, { payload }) =>
      queryClient.invalidateQueries({
        queryKey: [
          "construction-labour-roster-members",
          payload.project_id,
        ],
      }),
  });
}

export function useDeleteLabourGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { id: string; projectId: string }
  >({
    mutationFn: async ({ id }) =>
      (await axios.delete(`${LABOUR_GROUPS_URL}/${id}`)).data,
    meta: {
      errorMessage: "Failed to delete group",
      successMessage: "Group deleted successfully",
    },
    onSuccess: (_, { projectId }) =>
      queryClient.invalidateQueries({
        queryKey: ["construction-labour-roster-members", projectId],
      }),
  });
}
