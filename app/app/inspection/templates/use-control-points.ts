"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  ControlPointCreatePayload,
  ControlPointTag,
  ControlPointUpdatePayload,
} from "./types";

const axios = axiosConfig(env.apiBaseUrl);

const CONTROL_POINT_URL = "/v1/manufacturing/inspection/control-point";

export const controlPointKeys = {
  all: ["inspection-control-points"] as const,
};

export const DEFAULT_TAG_COLOR = "#1E2FE9";

function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["data", "items", "control_points", "rows", "results"]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

export function normalizeControlPoint(raw: unknown): ControlPointTag {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.control_point_id ?? row.id ?? ""),
    label: String(row.label ?? row.name ?? ""),
    color: String(row.color ?? DEFAULT_TAG_COLOR),
    value: row.value ? String(row.value) : undefined,
  };
}

export function useControlPoints() {
  return useQuery<ControlPointTag[], AxiosError<ApiResponseError>>({
    queryKey: controlPointKeys.all,
    queryFn: async () =>
      findList((await axios.get(CONTROL_POINT_URL)).data)
        .map(normalizeControlPoint)
        .filter((tag) => tag.id && tag.label),
    meta: { errorMessage: "Failed to load tags" },
  });
}

export function useCreateControlPoint() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    ControlPointCreatePayload
  >({
    mutationFn: async (payload) =>
      (await axios.post(CONTROL_POINT_URL, payload)).data,
    meta: {
      errorMessage: "Failed to create tag",
      successMessage: "Tag created successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: controlPointKeys.all }),
  });
}

export function useUpdateControlPoint() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    ControlPointUpdatePayload
  >({
    mutationFn: async (payload) =>
      (await axios.put(CONTROL_POINT_URL, payload)).data,
    meta: {
      errorMessage: "Failed to update tag",
      successMessage: "Tag updated successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: controlPointKeys.all }),
  });
}

export function useDeleteControlPoints() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string[]>({
    mutationFn: async (ids) =>
      Promise.all(ids.map((id) => axios.delete(`${CONTROL_POINT_URL}/${id}`))),
    meta: {
      errorMessage: "Failed to delete tag",
      successMessage: "Tag deleted successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: controlPointKeys.all }),
  });
}
