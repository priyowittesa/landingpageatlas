"use client";

import { useEffect, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getSession, useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";

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
} from "@/app/app/ai-studio/workflow/types";
import type {
  WorkflowChatJob,
  WorkflowChatJobError,
  WorkflowChatJobSubmissionResponse
} from "./types";

interface WorkflowChatJobServerEvents {
  "workflow:chat-job:snapshot": (job: WorkflowChatJob) => void;
  "workflow:chat-job:update": (job: WorkflowChatJob) => void;
  "workflow:chat-job:error": (error: WorkflowChatJobError) => void;
}

interface WorkflowChatJobClientEvents {
  "workflow:chat-job:subscribe": (payload: { job_id: string }) => void;
  "workflow:chat-job:unsubscribe": (payload: { job_id: string }) => void;
}

interface WorkflowChatJobOptions {
  enabled?: boolean;
  onJob?: (job: WorkflowChatJob) => void;
  onError?: (error: WorkflowChatJobError) => void;
}

const axios = axiosConfig(env.apiBaseUrl);
const CHAT_REQUEST_TIMEOUT = 10 * 60 * 1000;

/**
 * Atlas AI — the global assistant. Uses the same chat surface as the in-builder
 * Nexa AI (ChatbotPanel), but without the /workflow/{id} scope: sessions are
 * listed/created against /workflow/chat/sessions directly.
 */
const CHAT_SESSIONS_URL = `${env.apiBaseUrl}/workflow/chat/sessions`;
const CHAT_SESSION_URL = (sessionId: string) =>
  `${env.apiBaseUrl}/workflow/chat/sessions/${sessionId}`;
const CHAT_MESSAGES_URL = (sessionId: string) =>
  `${CHAT_SESSION_URL(sessionId)}/messages`;
const CHAT_JOB_URL = (jobId: string) =>
  `${env.apiBaseUrl}/workflow/chat/jobs/${jobId}`;
const CHAT_UPLOAD_URL_URL = `${env.apiBaseUrl}/workflow/chat/uploads/upload-url`;
const CHAT_UPLOAD_COMPLETE_URL = (fileId: string) =>
  `${env.apiBaseUrl}/workflow/chat/uploads/${fileId}/complete`;

function bearerToken(token: string) {
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

export function useCancelWorkflowChatJob() {
  return useMutation<void, AxiosError<ApiResponseError>, string>({
    mutationFn: async (jobId) => {
      await axios.post(`${CHAT_JOB_URL(encodeURIComponent(jobId))}/cancel`);
    },
    meta: { errorMessage: "Failed to cancel the AI response. Please try again." }
  });
}

export function useWorkflowChatJob(
  jobId: string | null | undefined,
  options: WorkflowChatJobOptions = {}
) {
  const { data: session } = useSession();
  const { enabled = true, onJob, onError } = options;
  const callbacksRef = useRef({ onJob, onError });
  const jobIdRef = useRef(jobId);
  const lastSocketUpdateRef = useRef(0);
  const socketRef = useRef<Socket<
    WorkflowChatJobServerEvents,
    WorkflowChatJobClientEvents
  > | null>(null);

  useEffect(() => {
    callbacksRef.current = { onJob, onError };
  }, [onError, onJob]);

  useEffect(() => {
    jobIdRef.current = jobId;
    lastSocketUpdateRef.current = 0;
  }, [jobId]);

  useEffect(() => {
    const accessToken = session?.accessToken;
    if (!accessToken || !enabled) return;

    let origin = env.socketUrl ?? env.apiBaseUrl ?? "";
    try {
      origin = new URL(origin).origin;
    } catch { }
    if (!origin) return;

    const socket: Socket<
      WorkflowChatJobServerEvents,
      WorkflowChatJobClientEvents
    > = io(`${origin}/workflow-jobs`, {
      path: "/socket.io/",
      transports: ["websocket"],
      auth: { token: bearerToken(accessToken) }
    });
    socketRef.current = socket;
    let disposed = false;
    let refreshInFlight = false;

    const subscribe = () => {
      const currentJobId = jobIdRef.current;
      if (currentJobId) {
        socket.emit("workflow:chat-job:subscribe", { job_id: currentJobId });
      }
    };
    const handleJob = (job: WorkflowChatJob) => {
      if (job.job_id !== jobIdRef.current) return;
      lastSocketUpdateRef.current = Date.now();
      callbacksRef.current.onJob?.(job);
    };
    const handleError = (error: WorkflowChatJobError) => {
      callbacksRef.current.onError?.(error);
    };
    const handleConnectError = () => {
      if (refreshInFlight) return;
      refreshInFlight = true;
      void getSession()
        .then((refreshedSession) => {
          if (disposed || !refreshedSession?.accessToken) return;
          socket.auth = {
            token: bearerToken(refreshedSession.accessToken)
          };
          if (!socket.connected) socket.connect();
        })
        .finally(() => {
          refreshInFlight = false;
        });
    };

    socket.on("connect", subscribe);
    socket.on("connect_error", handleConnectError);
    socket.on("workflow:chat-job:snapshot", handleJob);
    socket.on("workflow:chat-job:update", handleJob);
    socket.on("workflow:chat-job:error", handleError);

    return () => {
      disposed = true;
      socket.off("connect", subscribe);
      socket.off("connect_error", handleConnectError);
      socket.off("workflow:chat-job:snapshot", handleJob);
      socket.off("workflow:chat-job:update", handleJob);
      socket.off("workflow:chat-job:error", handleError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, session?.accessToken]);

  useEffect(() => {
    if (!jobId || !enabled) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit("workflow:chat-job:subscribe", { job_id: jobId });
    return () => {
      if (socket.connected) {
        socket.emit("workflow:chat-job:unsubscribe", { job_id: jobId });
      }
    };
  }, [enabled, jobId]);

  useEffect(() => {
    if (!jobId || !enabled) return;
    let disposed = false;

    const loadJob = async () => {
      try {
        const response = await axios.get<WorkflowChatJob>(CHAT_JOB_URL(jobId));
        if (!disposed && response.data.job_id === jobId) {
          callbacksRef.current.onJob?.(response.data);
        }
      } catch (error) {
        if ((error as AxiosError).response?.status === 404 && !disposed) {
          callbacksRef.current.onError?.({ code: "job_not_found" });
        }
      }
    };

    void loadJob();
    const interval = window.setInterval(() => {
      if (Date.now() - lastSocketUpdateRef.current >= 4_000) {
        void loadJob();
      }
    }, 3_000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [enabled, jobId]);
}

/* -------------------------------------------------------------------------- */
/*                File uploads (API: /workflow/chat/uploads)                   */
/* -------------------------------------------------------------------------- */

/** Payload for POST /workflow/chat/uploads/upload-url. */
export interface ChatUploadUrlDto {
  file_name: string;
  mime_type: string;
}

/** `data` field of the upload-url response. */
export interface ChatUploadUrlResponse {
  expires_at: string;
  file_id: string;
  required_headers: Record<string, string>;
  upload_url: string;
}

/**
 * Step 1 — request a presigned S3 upload URL. Returns the `file_id` that
 * identifies the upload on the backend and the `upload_url` to PUT the file to.
 */
export async function getChatUploadUrl(
  payload: ChatUploadUrlDto
): Promise<ChatUploadUrlResponse> {
  const res = await axios.post<ApiResponse<ChatUploadUrlResponse>>(
    CHAT_UPLOAD_URL_URL,
    payload
  );
  const data =
    (res.data?.data as ChatUploadUrlResponse | undefined) ??
    (res.data as unknown as ChatUploadUrlResponse);
  if (!data?.upload_url || !data?.file_id) {
    throw new Error("Invalid upload URL response");
  }
  return data;
}

/**
 * Step 2 — PUT the file to the presigned S3 URL. Routed through the
 * `/api/upload` Next.js proxy to avoid CORS issues (same pattern as the
 * inspection reference uploads).
 */
export async function uploadChatFileToS3(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  const formData = new FormData();
  formData.append("uploadUrl", uploadUrl);
  formData.append("contentType", contentType);
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "PUT",
    body: formData
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? `Upload proxy failed: ${res.status}`);
  }
}

/** Step 3 — notify the backend that the upload has finished. */
export async function completeChatUpload(fileId: string): Promise<void> {
  await axios.post(CHAT_UPLOAD_COMPLETE_URL(fileId), {});
}

/**
 * Runs the full upload pipeline for a single file and resolves with the
 * `file_id` to reference in the session/message payload.
 */
export async function uploadChatFile(file: File): Promise<string> {
  const mimeType = file.type || "application/octet-stream";
  const { upload_url, file_id, required_headers } = await getChatUploadUrl({
    file_name: file.name,
    mime_type: mimeType
  });
  const contentType = required_headers?.["Content-Type"] ?? mimeType;
  await uploadChatFileToS3(upload_url, file, contentType);
  await completeChatUpload(file_id);
  return file_id;
}

export const aiAssistantChatKeys = {
  sessionsBySource: (source = "ai-assistant") =>
    ["getAiAssistantChatSessions", source] as const,
  sessions: (source = "ai-assistant", folderId?: string | null) =>
    [...aiAssistantChatKeys.sessionsBySource(source), folderId ?? null] as const,
  session: (sessionId: string) =>
    ["getAiAssistantChatSession", sessionId] as const,
  messages: (sessionId: string) =>
    ["getAiAssistantChatMessages", sessionId] as const
};

/**
 * GET /workflow/chat/sessions — list Atlas AI conversations. When `folderId`
 * is provided (project chat), only that knowledge folder's sessions are
 * returned via the `folder_id` param.
 */
export function useGetAiAssistantSessions(
  source = "ai-assistant",
  folderId?: string | null
) {
  return useInfiniteQuery<
    ApiResponse<WorkflowChatSessionListResponse>,
    AxiosError<ApiResponseError>
  >({
    queryKey: aiAssistantChatKeys.sessions(source, folderId),
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const response = await axios.get<
        ApiResponse<WorkflowChatSessionListResponse>
      >(CHAT_SESSIONS_URL, {
        params: {
          page_size: 100,
          source,
          ...(folderId ? { folder_id: folderId } : {}),
          ...(pageParam ? { page_token: pageParam } : {})
        },
        timeout: CHAT_REQUEST_TIMEOUT
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
    meta: { errorMessage: "Failed to load conversations" }
  });
}

export function useGetAiAssistantSession(sessionId: string | null) {
  return useQuery<
    ApiResponse<WorkflowChatSession>,
    AxiosError<ApiResponseError>
  >({
    queryKey: aiAssistantChatKeys.session(sessionId ?? ""),
    enabled: Boolean(sessionId),
    queryFn: async () =>
      (
        await axios.get<ApiResponse<WorkflowChatSession>>(
          CHAT_SESSION_URL(sessionId!)
        )
      ).data,
    retry: (failureCount, error) =>
      error.response?.status !== 404 && failureCount < 2,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: "Failed to load conversation",
      suppressErrorStatuses: [404]
    }
  });
}

function countLoadedMessages(pages: ApiResponse<WorkflowChatMessageListResponse>[]) {
  return new Set(
    pages.flatMap((page) => (page.data?.items ?? []).map((message) => message.id))
  ).size;
}

export function useGetAiAssistantMessages(sessionId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = aiAssistantChatKeys.messages(sessionId ?? "");
  return useInfiniteQuery<
    ApiResponse<WorkflowChatMessageListResponse>,
    AxiosError<ApiResponseError>
  >({
    queryKey,
    enabled: Boolean(sessionId),
    initialPageParam: "",
    queryFn: async ({ pageParam }) => {
      const cached = queryClient.getQueryData<
        InfiniteData<ApiResponse<WorkflowChatMessageListResponse>, string>
      >(queryKey);
      const lastPageIndex = cached?.pageParams.indexOf("") ?? -1;
      const lastPage =
        lastPageIndex >= 0 ? cached?.pages[lastPageIndex]?.data : null;
      const pageToken =
        pageParam ||
        (lastPage
          ? String(
            Math.max(
              0,
              (lastPage.total_count ?? lastPage.items.length) - lastPage.items.length
            )
          )
          : null);
      return (
        await axios.get<ApiResponse<WorkflowChatMessageListResponse>>(
          CHAT_MESSAGES_URL(sessionId!),
          {
            params: {
              page_size: 100,
              ...(pageToken !== null ? { page_token: pageToken } : { last: true })
            }
          }
        )
      ).data;
    },
    getNextPageParam: (lastPage, pages, _, pageParams) => {
      const token = lastPage.data?.next_page_token;
      return token &&
        !pageParams.includes(token) &&
        countLoadedMessages(pages) < (lastPage.data?.total_count ?? 0)
        ? token
        : undefined;
    },
    getPreviousPageParam: (firstPage, pages, _, pageParams) => {
      const token = firstPage.data?.prev_page_token;
      return token &&
        !pageParams.includes(token) &&
        countLoadedMessages(pages) < (firstPage.data?.total_count ?? 0)
        ? token
        : undefined;
    },
    retry: (failureCount, error) =>
      error.response?.status !== 404 && failureCount < 2,
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: "Failed to load messages",
      suppressErrorStatuses: [404]
    }
  });
}

/**
 * POST /workflow/chat/sessions — get-or-create an Atlas AI chat session. The
 * endpoint is idempotent: when a session already exists for the same user it
 * returns it, otherwise it creates one.
 */
export function useCreateAiAssistantSession(source = "ai-assistant") {
  const queryClient = useQueryClient();
  return useMutation<
    WorkflowChatJobSubmissionResponse,
    AxiosError<ApiResponseError>,
    WorkflowChatSessionCreateDto
  >({
    mutationFn: async (payload) =>
      (
        await axios.post<WorkflowChatJobSubmissionResponse>(
          CHAT_SESSIONS_URL,
          payload,
          { headers: { "idempotency-key": crypto.randomUUID() } }
        )
      ).data,
    meta: { errorMessage: "Failed to start conversation" },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: aiAssistantChatKeys.sessionsBySource(source)
      })
  });
}

export function useSendAiAssistantMessage() {
  const queryClient = useQueryClient();
  return useMutation<
    WorkflowChatJobSubmissionResponse,
    AxiosError<ApiResponseError>,
    WorkflowChatMessageCreateDto & { sessionId: string }
  >({
    mutationFn: async ({ sessionId, ...payload }) =>
      (
        await axios.post<WorkflowChatJobSubmissionResponse>(
          CHAT_MESSAGES_URL(sessionId),
          payload,
          {
            headers: { "idempotency-key": crypto.randomUUID() }
          }
        )
      ).data,
    meta: {
      errorMessage: "Failed to send message",
      suppressErrorStatuses: [404]
    },
    onSuccess: (_, { sessionId }) =>
      queryClient.invalidateQueries({
        queryKey: aiAssistantChatKeys.messages(sessionId)
      })
  });
}

export function useUpdateAiAssistantSession(source = "ai-assistant") {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<WorkflowChatSession>,
    AxiosError<ApiResponseError>,
    WorkflowChatSessionUpdateDto & { sessionId: string }
  >({
    mutationFn: async ({ sessionId, ...payload }) =>
      (
        await axios.put<ApiResponse<WorkflowChatSession>>(
          CHAT_SESSION_URL(sessionId),
          payload
        )
      ).data,
    onSuccess: (_, { sessionId }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: aiAssistantChatKeys.session(sessionId)
        }),
        queryClient.invalidateQueries({
          queryKey: aiAssistantChatKeys.sessionsBySource(source)
        })
      ]),
    meta: { errorMessage: "Failed to rename conversation" }
  });
}

export function useDeleteAiAssistantSession(source = "ai-assistant") {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    AxiosError<ApiResponseError>,
    { sessionId: string }
  >({
    mutationFn: async ({ sessionId }) =>
      (await axios.delete(CHAT_SESSION_URL(sessionId))).data,
    onSuccess: (_, { sessionId }) => {
      queryClient.removeQueries({
        queryKey: aiAssistantChatKeys.session(sessionId)
      });
      queryClient.removeQueries({
        queryKey: aiAssistantChatKeys.messages(sessionId)
      });
      return queryClient.invalidateQueries({
        queryKey: aiAssistantChatKeys.sessionsBySource(source)
      });
    },
    meta: { errorMessage: "Failed to delete conversation" }
  });
}
