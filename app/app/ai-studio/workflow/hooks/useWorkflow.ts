"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";
import type {
  Workflow,
  WorkflowExecutionLogs,
  WorkflowFolder,
  WorkflowFolderFormDto,
  WorkflowFormDto,
  WorkflowUpdateDto,
} from "../types";

const FOLDER_URL = `${env.apiBaseUrl}/folder`;
const WORKFLOW_URL = `${env.apiBaseUrl}/workflow`;
const axios = axiosConfig(env.apiBaseUrl);

export const workflowKeys = {
  folders: () => ["getWorkflowFolders"] as const,
  folder: (id: string) => ["getWorkflowFolder", id] as const,
  workflows: () => ["getWorkflows"] as const,
  workflow: (id: string) => ["getWorkflow", id] as const,
  executionLogs: (id: string) => ["getWorkflowExecutionLogs", id] as const,
};

/* -------------------------------------------------------------------------- */
/*                                  Folders                                   */
/* -------------------------------------------------------------------------- */

export const useGetFolders = () =>
  useQuery<ApiResponse<WorkflowFolder[]>, AxiosError<ApiResponseError>>({
    queryKey: workflowKeys.folders(),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<WorkflowFolder[]>>(
        FOLDER_URL
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch folders" },
  });

export const useGetFolder = (id: string) =>
  useQuery<ApiResponse<WorkflowFolder>, AxiosError<ApiResponseError>>({
    queryKey: workflowKeys.folder(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<WorkflowFolder>>(
        `${FOLDER_URL}/${id}`
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch folder" },
  });

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<WorkflowFolder>,
    AxiosError<ApiResponseError>,
    WorkflowFolderFormDto
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ApiResponse<WorkflowFolder>>(
        FOLDER_URL,
        payload
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create folder",
      successMessage: "Folder created successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.folders() });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<WorkflowFolder>,
    AxiosError<ApiResponseError>,
    { id: string; payload: WorkflowFolderFormDto }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.put<ApiResponse<WorkflowFolder>>(
        `${FOLDER_URL}/${id}`,
        payload
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to update folder",
      successMessage: "Folder updated successfully",
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.folders() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.folder(id) });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    AxiosError<ApiResponseError>,
    string
  >({
    mutationFn: async (id) => {
      const response = await axios.delete<ApiResponse<null>>(
        `${FOLDER_URL}/${id}`
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to delete folder",
      successMessage: "Folder deleted successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.folders() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.workflows() });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                                 Workflows                                  */
/* -------------------------------------------------------------------------- */

export const useGetWorkflows = () =>
  useQuery<ApiResponse<Workflow[]>, AxiosError<ApiResponseError>>({
    queryKey: workflowKeys.workflows(),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<Workflow[]>>(WORKFLOW_URL);
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch workflows" },
  });

export const useGetWorkflow = (id: string) =>
  useQuery<ApiResponse<Workflow>, AxiosError<ApiResponseError>>({
    queryKey: workflowKeys.workflow(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<Workflow>>(
        `${WORKFLOW_URL}/${id}`
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch workflow" },
  });

export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<Workflow>,
    AxiosError<ApiResponseError>,
    WorkflowFormDto
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<ApiResponse<Workflow>>(
        WORKFLOW_URL,
        payload
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create workflow",
      successMessage: "Workflow created successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workflows() });
    },
  });
};

export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<Workflow>,
    AxiosError<ApiResponseError>,
    { id: string; payload: WorkflowUpdateDto }
  >({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.put<ApiResponse<Workflow>>(
        `${WORKFLOW_URL}/${id}`,
        payload
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to save workflow" },
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workflow(id) });
      queryClient.setQueryData<ApiResponse<Workflow[]>>(
        workflowKeys.workflows(),
        (current) =>
          current && {
            ...current,
            data: current.data.map((workflow) =>
              workflow.id === id
                ? { ...workflow, name: response.data.name }
                : workflow
            )
          }
      );
      // Refresh the execution log console whenever the canvas is saved.
      queryClient.invalidateQueries({
        queryKey: workflowKeys.executionLogs(id),
      });
    },
  });
};

export const useRenameWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<Workflow>,
    AxiosError<ApiResponseError>,
    { id: string; name: string }
  >({
    mutationFn: async ({ id, name }) => {
      const currentResponse = await axios.get<ApiResponse<Workflow>>(
        `${WORKFLOW_URL}/${id}`
      );
      const workflow = currentResponse.data.data;
      const response = await axios.put<ApiResponse<Workflow>>(
        `${WORKFLOW_URL}/${id}`,
        {
          name,
          description: workflow.description,
          folder_id: workflow.folder_id,
          canvas: workflow.canvas ?? { nodes: [], edges: [] },
          schedule_config: workflow.schedule_config ?? undefined,
          schedule_cron_expression:
            workflow.schedule_cron_expression ?? undefined,
          schedule_enabled: workflow.schedule_enabled,
          schedule_timezone: workflow.schedule_timezone ?? undefined,
          schedule_type: workflow.schedule_type ?? undefined
        } satisfies WorkflowUpdateDto
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to rename workflow",
      successMessage: "Workflow renamed successfully"
    },
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(workflowKeys.workflow(id), response);
      queryClient.setQueryData<ApiResponse<Workflow[]>>(
        workflowKeys.workflows(),
        (current) =>
          current && {
            ...current,
            data: current.data.map((workflow) =>
              workflow.id === id
                ? { ...workflow, name: response.data.name }
                : workflow
            )
          }
      );
    }
  });
};

export const useGetWorkflowExecutionLogs = (id: string) =>
  useQuery<ApiResponse<WorkflowExecutionLogs>, AxiosError<ApiResponseError>>({
    queryKey: workflowKeys.executionLogs(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get<ApiResponse<WorkflowExecutionLogs>>(
        `${WORKFLOW_URL}/${id}/execution-logs`
      );
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch execution logs" },
  });

export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<null>,
    AxiosError<ApiResponseError>,
    string
  >({
    mutationFn: async (id) => {
      const response = await axios.delete<ApiResponse<null>>(
        `${WORKFLOW_URL}/${id}`
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to delete workflow",
      successMessage: "Workflow deleted successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.workflows() });
    },
  });
};

export const useRunWorkflow = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<unknown>,
    AxiosError<ApiResponseError>,
    string
  >({
    mutationFn: async (id) => {
      const response = await axios.post<ApiResponse<unknown>>(
        `${WORKFLOW_URL}/${id}/run`
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to run workflow",
      successMessage: "Workflow run started successfully",
    },
    onSuccess: (_, id) => {
      // Pull the fresh execution logs into the console after a run kicks off.
      queryClient.invalidateQueries({
        queryKey: workflowKeys.executionLogs(id),
      });
    },
  });
};
