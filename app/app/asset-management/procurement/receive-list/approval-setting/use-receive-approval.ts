"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/construction-equipment/procurement-approval-workflows";
const SOURCE_TYPE = "receive_list";

export type ApprovalLevel = {
  approverId: string;
  description: string;
  levelNo: number;
  title: string;
};

export type ApprovalWorkflow = {
  id: string;
  department: string;
  description: string;
  name: string;
  levels: ApprovalLevel[];
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function findList(value: unknown, depth = 0): unknown[] {
  if (Array.isArray(value)) return value;
  if (depth > 6) return [];
  const item = record(value);
  for (const key of ["data", "items", "workflows", "results", "levels"]) {
    if (Array.isArray(item[key])) return item[key] as unknown[];
    if (item[key] && typeof item[key] === "object") {
      const result = findList(item[key], depth + 1);
      if (result.length) return result;
    }
  }
  return [];
}

function normalizeLevel(value: unknown, index: number): ApprovalLevel {
  const item = record(value);
  return {
    approverId: String(item.approver_id ?? item.approverId ?? ""),
    description: String(item.description ?? ""),
    levelNo: Number(item.level_no ?? item.levelNo ?? index + 1),
    title: String(item.title ?? `Level ${index + 1}`),
  };
}

function normalizeWorkflow(value: unknown): ApprovalWorkflow {
  const item = record(value);
  const rawLevels = Array.isArray(item.levels) ? item.levels : [];
  return {
    id: String(item.id ?? item.workflow_id ?? ""),
    department: String(item.department ?? ""),
    description: String(item.description ?? "Approval workflow for receive list"),
    name: String(item.name ?? "Receive List Approval"),
    levels: rawLevels.map(normalizeLevel).sort((a, b) => a.levelNo - b.levelNo),
  };
}

function findWorkflowRecord(value: unknown, depth = 0): Record<string, unknown> {
  const item = record(value);
  if (depth > 6 || "id" in item || "workflow_id" in item) return item;
  for (const key of ["data", "workflow", "item", "result"]) {
    const nested = item[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const match = findWorkflowRecord(nested, depth + 1);
      if (Object.keys(match).length) return match;
    }
  }
  return item;
}

export function useReceiveApprovalWorkflow() {
  return useQuery<ApprovalWorkflow | null, AxiosError<ApiResponseError>>({
    queryKey: ["procurement-approval-workflows", SOURCE_TYPE],
    queryFn: async () => {
      const response = await axios.get(URL, { params: { source_type: SOURCE_TYPE } });
      const rows = findList(response.data);
      const match = rows.map(record).find((item) => String(item.source_type ?? "").toLowerCase() === SOURCE_TYPE) ?? record(rows[0]);
      return Object.keys(match).length ? normalizeWorkflow(match) : null;
    },
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load receive list approval workflow" },
  });
}

function apiLevels(levels: ApprovalLevel[]) {
  return levels
    .filter((level) => level.approverId)
    .map((level, index) => ({ approver_id: level.approverId, description: level.description, level_no: index + 1, title: `Level ${index + 1}` }));
}

export function useSaveReceiveApprovalWorkflow() {
  const queryClient = useQueryClient();
  return useMutation<ApprovalWorkflow, AxiosError<ApiResponseError>, { workflow: ApprovalWorkflow | null; levels: ApprovalLevel[] }>({
    mutationFn: async ({ workflow, levels }) => {
      if (workflow?.id) {
        await axios.put(`${URL}/${workflow.id}/levels`, { levels: apiLevels(levels) });
        return { ...workflow, levels: levels.map((level, index) => ({ ...level, levelNo: index + 1, title: `Level ${index + 1}` })) };
      }
      const response = await axios.post(URL, {
        department: "",
        description: "Approval workflow for receive list",
        is_default: true,
        levels: apiLevels(levels),
        match_priority: 0,
        max_amount: 0,
        min_amount: 0,
        name: "Receive List Approval",
        priority: "normal",
        source_type: SOURCE_TYPE,
      });
      const body = findWorkflowRecord(response.data);
      return { ...normalizeWorkflow(body), levels: levels.map((level, index) => ({ ...level, levelNo: index + 1, title: `Level ${index + 1}` })) };
    },
    onSuccess: (workflow) => queryClient.setQueryData(["procurement-approval-workflows", SOURCE_TYPE], workflow),
    meta: { errorMessage: "Failed to save receive list approval workflow", successMessage: "Approval workflow saved" },
  });
}
