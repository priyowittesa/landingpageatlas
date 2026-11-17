"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";
import type {
  WorkflowChatSession,
  WorkflowChatSessionCreateDto,
  WorkflowChatSessionListResponse,
  WorkflowChatMessageCreateDto,
  WorkflowChatMessageListResponse,
  WorkflowChatSessionUpdateDto
} from "../types";
import type { WorkflowChatJobSubmissionResponse } from "@/components/ai-assistant/types";
import { aiAssistantChatKeys } from "@/components/ai-assistant/useAiAssistantChat";

const axios = axiosConfig(env.apiBaseUrl);

const CHAT_SESSIONS_URL = (workflowId: string) =>
  `${env.apiBaseUrl}/workflow/${workflowId}/chat/sessions`;
const CHAT_SESSION_URL = (sessionId: string) =>
  `${env.apiBaseUrl}/workflow/chat/sessions/${sessionId}`;
const CHAT_MESSAGES_URL = (sessionId: string) =>
  `${CHAT_SESSION_URL(sessionId)}/messages`;

export const chatKeys = {
  sessions: (workflowId: string) =>
    ["getWorkflowChatSessions", workflowId] as const,
  session: (sessionId: string) => ["getWorkflowChatSession", sessionId] as const,
  messages: (sessionId: string) => ["getWorkflowChatMessages", sessionId] as const
};

export const useGetChatSession = (sessionId: string | null) =>
  useQuery<ApiResponse<WorkflowChatSession>, AxiosError<ApiResponseError>>({
    queryKey: chatKeys.session(sessionId ?? ""),
    enabled: Boolean(sessionId),
    queryFn: async () =>
      (await axios.get<ApiResponse<WorkflowChatSession>>(CHAT_SESSION_URL(sessionId!))).data,
    meta: { errorMessage: "Failed to fetch chat session" }
  });

export const useGetChatMessages = (sessionId: string | null) =>
  useQuery<ApiResponse<WorkflowChatMessageListResponse>, AxiosError<ApiResponseError>>({
    queryKey: chatKeys.messages(sessionId ?? ""),
    enabled: Boolean(sessionId),
    queryFn: async () =>
      (await axios.get<ApiResponse<WorkflowChatMessageListResponse>>(
        CHAT_MESSAGES_URL(sessionId!),
        { params: { page_size: 1000 } }
      )).data,
    meta: { errorMessage: "Failed to fetch chat messages" }
  });

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation<
    WorkflowChatJobSubmissionResponse,
    AxiosError<ApiResponseError>,
    WorkflowChatMessageCreateDto & { sessionId: string }
  >({
    mutationFn: async ({ sessionId, ...payload }) =>
      (await axios.post<WorkflowChatJobSubmissionResponse>(
        CHAT_MESSAGES_URL(sessionId),
        payload,
        { headers: { "idempotency-key": crypto.randomUUID() } }
      )).data,
    meta: { errorMessage: "Failed to send chat message" },
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(sessionId)
      });
      void queryClient.invalidateQueries({
        queryKey: aiAssistantChatKeys.messages(sessionId)
      });
    }
  });
};

export const useUpdateChatSession = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<WorkflowChatSession>,
    AxiosError<ApiResponseError>,
    WorkflowChatSessionUpdateDto & { sessionId: string; workflowId: string }
  >({
    mutationFn: async ({ sessionId, workflowId: _workflowId, ...payload }) => {
      void _workflowId;
      return (await axios.put<ApiResponse<WorkflowChatSession>>(CHAT_SESSION_URL(sessionId), payload)).data;
    },
    onSuccess: (_, { sessionId, workflowId }) => Promise.all([
      queryClient.invalidateQueries({ queryKey: chatKeys.session(sessionId) }),
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(workflowId) })
    ]),
    meta: { errorMessage: "Failed to update chat session" }
  });
};

export const useDeleteChatSession = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, { sessionId: string; workflowId: string }>({
    mutationFn: async ({ sessionId }) => (await axios.delete(CHAT_SESSION_URL(sessionId))).data,
    onSuccess: (_, { workflowId }) =>
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(workflowId) }),
    meta: { errorMessage: "Failed to delete chat session" }
  });
};

/** GET /workflow/{id}/chat/sessions — list chat sessions for a workflow with infinite pagination. */
export const useGetChatSessions = (workflowId: string) =>
  useInfiniteQuery<
    ApiResponse<WorkflowChatSessionListResponse>,
    AxiosError<ApiResponseError>
  >({
    queryKey: chatKeys.sessions(workflowId),
    enabled: Boolean(workflowId),
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const response = await axios.get<
        ApiResponse<WorkflowChatSessionListResponse>
      >(CHAT_SESSIONS_URL(workflowId), {
        params: {
          page_size: 100,
          ...(pageParam ? { page_token: pageParam } : {})
        }
      });
      return response.data;
    },
    getNextPageParam: (lastPage, pages, _, pageParams) => {
      const token = lastPage.data?.next_page_token;
      const loadedCount = new Set(
        pages.flatMap((page) => (page.data?.items ?? []).map((item) => item.id))
      ).size;
      return token &&
        !pageParams.includes(token) &&
        loadedCount < (lastPage.data?.total_count ?? 0)
        ? token
        : undefined;
    },
    staleTime: 0,
    meta: { errorMessage: "Failed to fetch chat sessions" }
  });

/**
 * POST /workflow/{id}/chat/sessions — get-or-create a chat session for the
 * workflow. The endpoint is idempotent: when a session already exists for the
 * same user it returns it, otherwise it creates one.
 */
export const useCreateChatSession = (workflowId: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    WorkflowChatJobSubmissionResponse,
    AxiosError<ApiResponseError>,
    WorkflowChatSessionCreateDto
  >({
    mutationFn: async (payload) => {
      const response = await axios.post<WorkflowChatJobSubmissionResponse>(
        CHAT_SESSIONS_URL(workflowId),
        payload,
        { headers: { "idempotency-key": crypto.randomUUID() } }
      );
      return response.data;
    },
    meta: {
      errorMessage: "Failed to create chat session"
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.sessions(workflowId)
      });
    }
  });
};
