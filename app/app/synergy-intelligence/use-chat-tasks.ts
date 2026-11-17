"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";
import type {
  WorkflowChatTask,
  WorkflowChatTaskPayload
} from "./scheduled-data";

const axios = axiosConfig(env.apiBaseUrl);
const TASKS_URL = "/workflow/chat/tasks";
const taskUrl = (id: string) => `${TASKS_URL}/${encodeURIComponent(id)}`;
type TaskError = AxiosError<ApiResponseError> | Error;
type TaskListResponse = ApiResponse<{ items: WorkflowChatTask[] }>;
type TaskSaveResponse = ApiResponse<WorkflowChatTask | null>;

export const chatTaskKeys = {
  all: (userId: string) => ["workflow-chat-tasks", userId] as const,
  list: (userId: string) => [...chatTaskKeys.all(userId), "list"] as const,
  detail: (userId: string, id: string) =>
    [...chatTaskKeys.all(userId), "detail", id] as const
};

function checkedResponse<T>(response: ApiResponse<T>) {
  if (!response.status)
    throw new Error(response.message || "The task request failed.");
  return response;
}

export function useGetChatTasks() {
  const { user, isAuthenticated } = useCurrentUser();
  return useQuery<TaskListResponse, TaskError>({
    queryKey: chatTaskKeys.list(user?.id ?? ""),
    enabled: isAuthenticated,
    queryFn: async ({ signal }) =>
      checkedResponse(
        (await axios.get<TaskListResponse>(TASKS_URL, { signal })).data
      ),
    meta: { errorMessage: "Failed to load tasks" }
  });
}

export function useGetChatTask(id: string | null) {
  const { user, isAuthenticated } = useCurrentUser();
  return useQuery<ApiResponse<WorkflowChatTask>, TaskError>({
    queryKey: chatTaskKeys.detail(user?.id ?? "", id ?? ""),
    enabled: isAuthenticated && Boolean(id),
    queryFn: async ({ signal }) =>
      checkedResponse(
        (
          await axios.get<ApiResponse<WorkflowChatTask>>(taskUrl(id!), {
            signal
          })
        ).data
      ),
    retry: (count, error) =>
      (error as AxiosError).response?.status !== 404 && count < 2,
    meta: { errorMessage: "Failed to load task", suppressErrorStatuses: [404] }
  });
}

export function useCreateChatTask() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  return useMutation<TaskSaveResponse, TaskError, WorkflowChatTaskPayload>({
    mutationFn: async (payload) =>
      checkedResponse(
        (await axios.post<TaskSaveResponse>(TASKS_URL, payload)).data
      ),
    onSuccess: async (response) => {
      if (response.data?.id && response.data.name)
        queryClient.setQueryData(
          chatTaskKeys.detail(userId, response.data.id),
          response
        );
      await queryClient.invalidateQueries({
        queryKey: chatTaskKeys.list(userId)
      });
    },
    meta: {
      errorMessage: "Failed to create task",
      successMessage: "Task created successfully"
    }
  });
}

export function useUpdateChatTask() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  return useMutation<
    TaskSaveResponse,
    TaskError,
    { id: string; payload: WorkflowChatTaskPayload }
  >({
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: chatTaskKeys.detail(userId, id)
      });
    },
    mutationFn: async ({ id, payload }) =>
      checkedResponse(
        (await axios.put<TaskSaveResponse>(taskUrl(id), payload)).data
      ),
    onSuccess: async (response, { id }) => {
      if (response.data?.id && response.data.name)
        queryClient.setQueryData(chatTaskKeys.detail(userId, id), response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatTaskKeys.list(userId) }),
        queryClient.invalidateQueries({
          queryKey: chatTaskKeys.detail(userId, id)
        })
      ]);
    },
    meta: {
      errorMessage: "Failed to update task",
      successMessage: "Task updated successfully"
    }
  });
}

export function useDeleteChatTask() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  return useMutation<void, TaskError, string>({
    mutationFn: async (id) => {
      const response = await axios.delete<ApiResponse<unknown> | undefined>(
        taskUrl(id)
      );
      if (response.data) checkedResponse(response.data);
    },
    onSuccess: async (_, id) => {
      await queryClient.cancelQueries({
        queryKey: chatTaskKeys.detail(userId, id)
      });
      queryClient.removeQueries({
        queryKey: chatTaskKeys.detail(userId, id),
        exact: true
      });
      await queryClient.invalidateQueries({
        queryKey: chatTaskKeys.list(userId)
      });
    },
    meta: {
      errorMessage: "Failed to delete task",
      successMessage: "Task deleted successfully"
    }
  });
}
