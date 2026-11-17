"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Maximize2,
  Minimize2,
  PanelLeft,
  Plus,
  Sparkles,
  X
} from "lucide-react";

import type { AxiosError } from "axios";

import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  aiAssistantSessionRequestKey,
  useAiAssistantStore
} from "@/stores/ai-assistant-store";
import ConfirmationModal from "@/components/ConfirmationModal";
import { AiAssistantComposer } from "./AiAssistantComposer";
import { AiAssistantHistory } from "./AiAssistantHistory";
import { AiAssistantMessages } from "./AiAssistantMessages";
import { MemoBrowser, MemoDetail } from "./AiAssistantMemos";
import { SkillBrowser } from "./AiAssistantSkills";
import { ASSISTANT_NAME } from "./mock-data";
import type {
  AiAssistantAttachment,
  AiAssistantMessage,
  AiAssistantMessageMemo,
  WorkflowChatJob
} from "./types";
import {
  aiAssistantChatKeys,
  useCancelWorkflowChatJob,
  useCreateAiAssistantSession,
  useDeleteAiAssistantSession,
  useGetAiAssistantMessages,
  useGetAiAssistantSession,
  useGetAiAssistantSessions,
  useSendAiAssistantMessage,
  useUpdateAiAssistantSession,
  useWorkflowChatJob
} from "./useAiAssistantChat";
import type { WorkflowChatMessage } from "@/app/app/ai-studio/workflow/types";
import {
  getChatMessageFiles,
  getChatMessageMemos,
  getChatMessageOptions,
  getChatMessageSkillIds,
  getWorkflowChatResponseError,
  isTextChatMessage
} from "@/app/app/ai-studio/workflow/types";
import type { KnowledgeFolder } from "@/app/app/ai-studio/atlas-knowledge-source/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type AiAssistantPanelProps = {
  open: boolean;
  onClose?: () => void;
  source?: string;
  title?: string;
  embedded?: boolean;
  suggestedPrompts?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  projects?: KnowledgeFolder[];
  projectsLoading?: boolean;
  projectIds?: string[];
  initialActiveSessionId?: string | null;
  initialMemoId?: string | null;
  initialNewChat?: boolean;
  initialSkillsView?: boolean;
  workspace?: ReactNode;
  workspaceFullscreen?: boolean;
  onShowScheduled?: () => void;
  onSelectProject?: (projectId: string | null) => void;
  onShowSkills?: () => void;
  onOpenSession?: (
    sessionId: string,
    folderId: string | null,
    options?: { preserveState?: boolean; pushState?: boolean }
  ) => void;
  onSessionUnavailable?: (folderId: string | null) => void;
  onOpenMemo?: (memoId: string, folderId: string | null) => void;
  onOpenNewChat?: (folderId: string | null) => void;
  onCreateProject?: (title: string) => Promise<void>;
  onRenameProject?: (projectId: string, title: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
};

function normalizeMessage(message: WorkflowChatMessage): AiAssistantMessage {
  const files = getChatMessageFiles(message);
  const options = getChatMessageOptions(message);
  const memos = getChatMessageMemos(message);
  const skillIds = getChatMessageSkillIds(message);
  const regeneratedMessageIds = message.metadata?.regenerated_message_ids;
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
    createdAt: message.created_at ?? new Date().toISOString(),
    messageType: message.message_type,
    error: getWorkflowChatResponseError(message.metadata?.error),
    replacesMessageIds: Array.isArray(regeneratedMessageIds)
      ? regeneratedMessageIds.filter(
          (id): id is string => typeof id === "string"
        )
      : undefined,
    skillIds: skillIds.length ? skillIds : undefined,
    attachments: files.length
      ? files.map((file) => ({
          id: file.file_id ?? file.id ?? "",
          name: file.file_name,
          size: 0
        }))
      : undefined,
    options: options.length ? options : undefined,
    memos: memos.length
      ? memos.map((memo) => ({
          id: memo.id,
          title: memo.title,
          knowledgeFolderId: memo.knowledge_folder_id
        }))
      : undefined
  };
}

export function AiAssistantPanel({
  open,
  onClose = () => undefined,
  source = "ai-assistant",
  title = ASSISTANT_NAME,
  embedded = false,
  suggestedPrompts,
  emptyTitle,
  emptyDescription,
  projects,
  projectsLoading = false,
  projectIds = [],
  initialActiveSessionId = null,
  initialMemoId = null,
  initialNewChat = false,
  initialSkillsView = false,
  workspace,
  workspaceFullscreen = false,
  onShowScheduled,
  onSelectProject,
  onShowSkills,
  onOpenSession,
  onSessionUnavailable,
  onOpenMemo,
  onOpenNewChat,
  onCreateProject,
  onRenameProject,
  onDeleteProject
}: AiAssistantPanelProps) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const requestScope = `${user?.id ?? "anonymous"}:${source}`;
  const [historyOpen, setHistoryOpen] = useState(embedded);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draft, setDraft] = useState("");
  const [restoredComposer, setRestoredComposer] = useState<{
    sessionId: string;
    jobId: string;
    message: AiAssistantMessage;
    userSequence: number;
  } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialActiveSessionId
  );
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null
  );
  const [optimisticMessage, setOptimisticMessage] =
    useState<AiAssistantMessage | null>(null);
  const [activeChatJob, setActiveChatJob] = useState<WorkflowChatJob | null>(
    null
  );
  const [createdSessionMessages, setCreatedSessionMessages] = useState<
    WorkflowChatMessage[]
  >([]);
  const [newChatCount, setNewChatCount] = useState(initialNewChat ? 1 : 0);
  const [projectsViewOpen, setProjectsViewOpen] = useState(
    Boolean(projects) &&
      projectIds.length === 0 &&
      !initialActiveSessionId &&
      !initialNewChat &&
      !initialSkillsView
  );
  const [skillsViewOpen, setSkillsViewOpen] = useState(initialSkillsView);
  const lastSessionCountRef = useRef<number>(-1);
  const mountedRef = useRef(true);
  const activeSessionIdRef = useRef(activeSessionId);
  const settledJobIdsRef = useRef(new Set<string>());
  const cancellingJobIdRef = useRef<string | null>(null);
  const pendingSessionRequest = useAiAssistantStore((state) =>
    activeSessionId
      ? state.pendingSessionRequests[
          aiAssistantSessionRequestKey(requestScope, activeSessionId)
        ]
      : undefined
  );
  const newChatRequest = useAiAssistantStore(
    (state) => state.newChatRequests[requestScope]
  );
  const hydratePendingRequests = useAiAssistantStore(
    (state) => state.hydratePendingRequests
  );
  const beginSessionRequest = useAiAssistantStore(
    (state) => state.beginSessionRequest
  );
  const setSessionRequestJob = useAiAssistantStore(
    (state) => state.setSessionRequestJob
  );
  const endSessionRequest = useAiAssistantStore(
    (state) => state.endSessionRequest
  );
  const beginNewChatRequest = useAiAssistantStore(
    (state) => state.beginNewChatRequest
  );
  const completeNewChatRequest = useAiAssistantStore(
    (state) => state.completeNewChatRequest
  );
  const clearNewChatRequest = useAiAssistantStore(
    (state) => state.clearNewChatRequest
  );

  // The knowledge folder currently opened in the project workspace (Synergy
  // Intelligence flow). Drives the Chat / Memos tabbed view and scopes the
  // session list to that folder via GET /workflow/chat/sessions?folder_id=.
  const selectedProjectId = projectIds[0] ?? null;
  const activeProject = projects?.find(
    (project) => project.id === selectedProjectId
  );

  const sessionsQuery = useGetAiAssistantSessions(source, selectedProjectId);
  const sessions = useMemo(() => {
    const seen = new Set<string>();
    return (
      sessionsQuery.data?.pages.flatMap((page) =>
        (page.data?.items ?? []).filter((session) => {
          if (seen.has(session.id)) return false;
          seen.add(session.id);
          return true;
        })
      ) ?? []
    );
  }, [sessionsQuery.data]);
  const sessionListComplete = Boolean(
    sessionsQuery.data &&
    !sessionsQuery.hasNextPage &&
    (sessionsQuery.data.pages.at(-1)?.data?.total_count ?? 0) <= sessions.length
  );
  const activeSessionIsListed = sessions.some(
    (session) => session.id === activeSessionId
  );
  const validatedActiveSessionId =
    sessionsQuery.isError ||
    (sessionsQuery.isSuccess && (!sessionListComplete || activeSessionIsListed))
      ? activeSessionId
      : null;
  const createSession = useCreateAiAssistantSession(source);
  const sessionQuery = useGetAiAssistantSession(validatedActiveSessionId);
  const messagesQuery = useGetAiAssistantMessages(validatedActiveSessionId);
  const sendMessage = useSendAiAssistantMessage();
  const cancelChatJob = useCancelWorkflowChatJob();
  const updateSession = useUpdateAiAssistantSession(source);
  const deleteSession = useDeleteAiAssistantSession(source);
  const refetchSessions = sessionsQuery.refetch;
  const refetchMessages = messagesQuery.refetch;

  const restoreCancelledRequest = (jobId: string, sessionId: string) => {
    const request =
      useAiAssistantStore.getState().pendingSessionRequests[
        aiAssistantSessionRequestKey(requestScope, sessionId)
      ];
    if (request?.jobId !== jobId || settledJobIdsRef.current.has(jobId)) return;
    settledJobIdsRef.current.add(jobId);
    endSessionRequest(requestScope, sessionId);
    if (!mountedRef.current || activeSessionIdRef.current !== sessionId) return;
    setDraft(request.message.content);
    setRestoredComposer({
      sessionId,
      jobId,
      message: request.message,
      userSequence: request.userSequence
    });
    setOptimisticMessage(null);
    setActiveChatJob(null);
    toast.info("Response cancelled. You can edit or resend your message.");
  };

  const handleChatJob = (job: WorkflowChatJob) => {
    const request =
      useAiAssistantStore.getState().pendingSessionRequests[
        aiAssistantSessionRequestKey(requestScope, job.session_id)
      ];
    if (
      !activeSessionId ||
      job.session_id !== activeSessionId ||
      request?.jobId !== job.job_id ||
      settledJobIdsRef.current.has(job.job_id)
    )
      return;
    if (job.state === "cancelled") {
      restoreCancelledRequest(job.job_id, job.session_id);
      return;
    }
    setActiveChatJob(job);
    if (job.state !== "succeeded" && job.state !== "failed") {
      return;
    }
    settledJobIdsRef.current.add(job.job_id);
    const endJobRequest = () => {
      const currentRequest =
        useAiAssistantStore.getState().pendingSessionRequests[
          aiAssistantSessionRequestKey(requestScope, job.session_id)
        ];
      if (currentRequest?.jobId === job.job_id) {
        endSessionRequest(requestScope, job.session_id);
      }
    };
    setOptimisticMessage(null);
    if (job.state === "succeeded") {
      void Promise.all([
        refetchMessages(),
        sessionQuery.refetch(),
        refetchSessions()
      ]).finally(endJobRequest);
      return;
    }
    void refetchMessages().finally(endJobRequest);
    if (job.state === "failed") {
      toast.error(
        job.error?.message || "The AI response failed. Please try again."
      );
    }
  };

  const handleCancel = () => {
    const jobId = pendingSessionRequest?.jobId;
    if (!activeSessionId || !jobId || cancellingJobIdRef.current) return;
    const sessionId = activeSessionId;
    cancellingJobIdRef.current = jobId;
    void cancelChatJob
      .mutateAsync(jobId)
      .then(() => restoreCancelledRequest(jobId, sessionId))
      .catch(() => {
        // The mutation error toast explains the failure; keep watching the job.
      })
      .finally(() => {
        cancellingJobIdRef.current = null;
      });
  };

  useWorkflowChatJob(pendingSessionRequest?.jobId, {
    enabled: open,
    onJob: handleChatJob,
    onError: (error) => {
      if (!activeSessionId) return;
      endSessionRequest(requestScope, activeSessionId);
      void refetchMessages();
      toast.error(
        error.code === "job_not_found"
          ? "The AI response job could not be found."
          : "Unable to watch the AI response."
      );
    }
  });

  useEffect(() => {
    hydratePendingRequests();
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [hydratePendingRequests]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    if (newChatRequest?.status !== "completed") return;
    if (activeSessionId === newChatRequest.sessionId) {
      clearNewChatRequest(requestScope);
      return;
    }
    if (!initialNewChat) return;
    beginSessionRequest(
      requestScope,
      newChatRequest.sessionId,
      newChatRequest.message,
      newChatRequest.userSequence,
      newChatRequest.jobId
    );
    clearNewChatRequest(requestScope);
    onOpenSession?.(newChatRequest.sessionId, newChatRequest.folderId);
  }, [
    activeSessionId,
    beginSessionRequest,
    clearNewChatRequest,
    initialNewChat,
    newChatRequest,
    onOpenSession,
    requestScope
  ]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (historyOpen) setHistoryOpen(false);
      else if (isFullscreen) setIsFullscreen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [historyOpen, isFullscreen, onClose, open]);

  useEffect(() => {
    if (!initialNewChat || newChatRequest?.status !== "pending") return;
    const startedAt = Date.parse(newChatRequest.message.createdAt);
    const recoveredSession = sessions.find(
      (session) =>
        session.title === newChatRequest.title &&
        Date.parse(session.created_at) >= startedAt - 60_000 &&
        (!newChatRequest.projectId ||
          session.projects?.includes(newChatRequest.projectId))
    );
    if (!recoveredSession) return;
    completeNewChatRequest(
      requestScope,
      recoveredSession.id,
      recoveredSession.projects?.[0] ?? newChatRequest.projectId
    );
  }, [
    completeNewChatRequest,
    initialNewChat,
    newChatRequest,
    requestScope,
    sessions
  ]);

  useEffect(() => {
    if (!initialNewChat || newChatRequest?.status !== "pending") return;
    const interval = window.setInterval(() => {
      void refetchSessions();
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [initialNewChat, newChatRequest, refetchSessions]);

  const fetchedMessages = useMemo(() => {
    const seen = new Set<string>();
    return messagesQuery.data?.pages.flatMap((page) =>
      (page.data?.items ?? []).filter((message) => {
        if (seen.has(message.id)) return false;
        seen.add(message.id);
        return true;
      })
    );
  }, [messagesQuery.data]);
  const additionalMessageIds = useMemo(() => {
    const anchor = Math.max(0, messagesQuery.data?.pageParams.indexOf("") ?? 0);
    return new Set(
      messagesQuery.data?.pages.flatMap((page, index) =>
        index === anchor
          ? []
          : (page.data?.items ?? []).map((message) => message.id)
      ) ?? []
    );
  }, [messagesQuery.data]);

  const pendingUserMessage =
    pendingSessionRequest?.message ??
    (!activeSessionId ? newChatRequest?.message : undefined);
  const pendingUserSequence =
    pendingSessionRequest?.userSequence ??
    (!activeSessionId ? newChatRequest?.userSequence : undefined);

  const messages = useMemo(() => {
    const serverMessages = fetchedMessages ?? createdSessionMessages;
    const normalized = serverMessages
      .filter(isTextChatMessage)
      .map(normalizeMessage);
    const localMessage = pendingUserMessage ?? optimisticMessage;
    const localMessageIsStored =
      localMessage &&
      serverMessages.some(
        (message) =>
          message.role === "user" &&
          !localMessage.replacesMessageIds?.includes(message.id) &&
          ((pendingUserSequence !== undefined &&
            message.sequence === pendingUserSequence) ||
            (message.sequence === undefined &&
              message.content === localMessage.content))
      );
    if (localMessage && !localMessageIsStored) normalized.push(localMessage);
    const replacedMessageIds = new Set([
      ...normalized.flatMap((message) => message.replacesMessageIds ?? []),
      ...(localMessage?.replacesMessageIds ?? [])
    ]);
    const requestSignature = (message: AiAssistantMessage) =>
      JSON.stringify([
        message.content.trim(),
        [...(message.skillIds ?? [])].sort(),
        (message.attachments ?? []).map((file) => file.id).sort()
      ]);
    normalized.forEach((message, index) => {
      if (message.role !== "user") return;
      const response = normalized[index + 1];
      const failedResponse =
        response?.role === "assistant" && response.error?.retryable
          ? response
          : undefined;
      const replacement = normalized[index + (failedResponse ? 2 : 1)];
      if (
        (message.error?.retryable || failedResponse) &&
        replacement?.role === "user" &&
        requestSignature(message) === requestSignature(replacement)
      ) {
        replacedMessageIds.add(message.id);
        if (failedResponse) replacedMessageIds.add(failedResponse.id);
      }
    });
    return normalized.filter((message) => !replacedMessageIds.has(message.id));
  }, [
    createdSessionMessages,
    fetchedMessages,
    optimisticMessage,
    pendingUserMessage,
    pendingUserSequence
  ]);

  // Once the GET /messages request for a newly-created session resolves, use
  // it as the source of truth and release the response snapshot.
  useEffect(() => {
    if (!activeSessionId || !messagesQuery.data) return;
    const serverMessages = fetchedMessages ?? [];
    const pendingUserIndex = pendingSessionRequest
      ? serverMessages.findIndex(
          (message) =>
            message.role === "user" &&
            (message.sequence === pendingSessionRequest.userSequence ||
              message.content === pendingSessionRequest.message.content)
        )
      : -1;
    const hasAssistantResponse =
      pendingSessionRequest &&
      serverMessages.some(
        (message, index) =>
          message.role === "assistant" &&
          ((message.sequence !== undefined &&
            message.sequence > pendingSessionRequest.userSequence) ||
            (message.sequence === undefined &&
              ((pendingUserIndex >= 0 && index > pendingUserIndex) ||
                Date.parse(message.created_at ?? "") >=
                  Date.parse(pendingSessionRequest.message.createdAt))))
      );
    const hasResponseError =
      pendingSessionRequest &&
      serverMessages.some(
        (message) =>
          message.role === "user" &&
          getWorkflowChatResponseError(message.metadata?.error) &&
          (message.sequence !== undefined
            ? message.sequence === pendingSessionRequest.userSequence
            : message.content === pendingSessionRequest.message.content &&
              Date.parse(message.created_at ?? "") >=
                Date.parse(pendingSessionRequest.message.createdAt))
      );
    if (hasAssistantResponse || hasResponseError) {
      endSessionRequest(requestScope, activeSessionId);
    }
    // The server response replaces the optimistic snapshot after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCreatedSessionMessages([]);
    setOptimisticMessage(null);
  }, [
    activeSessionId,
    endSessionRequest,
    fetchedMessages,
    messagesQuery.data,
    pendingSessionRequest,
    requestScope
  ]);

  useEffect(() => {
    if (
      !activeSessionId ||
      !pendingSessionRequest ||
      pendingSessionRequest.jobId
    ) {
      return;
    }
    const interval = window.setInterval(() => {
      void refetchMessages();
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [activeSessionId, pendingSessionRequest, refetchMessages]);

  // Auto-select the most recent session the first time it lands.
  useEffect(() => {
    if (sessions.length === 0) {
      lastSessionCountRef.current = 0;
      return;
    }
    if (lastSessionCountRef.current === sessions.length) return;
    lastSessionCountRef.current = sessions.length;
    if (!activeSessionId && !projects) {
      // Preserve the legacy assistant behavior outside project mode.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSessionId(sessions[0]?.id ?? null);
    }
  }, [sessions, activeSessionId, projects]);

  // Recover from a stale session: the panel stays mounted across idle
  // periods, so a chat session can be pruned server-side (TTL) or deleted
  // in another tab while activeSessionId is still held in memory. When the
  // session/messages fetch 404s, drop the stale id so the next interaction
  // starts a fresh conversation instead of erroring with
  // "workflow chat session not found".
  useEffect(() => {
    const sessionNotFound =
      (sessionQuery.error as AxiosError | undefined)?.response?.status === 404;
    const messagesNotFound =
      (messagesQuery.error as AxiosError | undefined)?.response?.status === 404;
    const sessionMissingFromList =
      sessionsQuery.isSuccess &&
      !sessionsQuery.isFetching &&
      sessionListComplete &&
      !activeSessionIsListed;
    if (
      !activeSessionId ||
      (!sessionNotFound && !messagesNotFound && !sessionMissingFromList)
    ) {
      return;
    }
    endSessionRequest(requestScope, activeSessionId);
    void queryClient.cancelQueries({
      queryKey: aiAssistantChatKeys.session(activeSessionId)
    });
    void queryClient.cancelQueries({
      queryKey: aiAssistantChatKeys.messages(activeSessionId)
    });
    queryClient.removeQueries({
      queryKey: aiAssistantChatKeys.session(activeSessionId)
    });
    queryClient.removeQueries({
      queryKey: aiAssistantChatKeys.messages(activeSessionId)
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSessionId(null);
    setCreatedSessionMessages([]);
    setOptimisticMessage(null);
    onSessionUnavailable?.(selectedProjectId);
  }, [
    activeSessionId,
    activeSessionIsListed,
    endSessionRequest,
    messagesQuery.error,
    onSessionUnavailable,
    queryClient,
    requestScope,
    selectedProjectId,
    sessionListComplete,
    sessionQuery.error,
    sessionsQuery.isFetching,
    sessionsQuery.isSuccess
  ]);

  const isThinking =
    createSession.isPending ||
    sendMessage.isPending ||
    Boolean(pendingSessionRequest) ||
    (!activeSessionId && newChatRequest?.status === "pending");
  const visibleChatJob =
    activeChatJob &&
    activeChatJob.session_id === activeSessionId &&
    (!pendingSessionRequest ||
      activeChatJob.job_id === pendingSessionRequest.jobId)
      ? activeChatJob
      : undefined;
  const cancelDisabled =
    !pendingSessionRequest?.jobId ||
    createSession.isPending ||
    sendMessage.isPending ||
    Boolean(
      visibleChatJob &&
      visibleChatJob.state !== "queued" &&
      visibleChatJob.state !== "running"
    );
  const restoredMessage =
    restoredComposer?.sessionId === activeSessionId
      ? restoredComposer.message
      : undefined;

  // Project already assigned to the active session (GET /workflow/chat/
  // sessions/{id} → project_names). Shown as a locked badge in the composer.
  const assignedProjectName =
    sessionQuery.data?.data?.project_names?.[0] ??
    (!activeSessionId ? (activeProject?.title ?? null) : null);

  const startNewChat = () => {
    setActiveSessionId(null);
    setHistoryOpen(false);
    setDraft("");
    setRestoredComposer(null);
    setOptimisticMessage(null);
    setCreatedSessionMessages([]);
    setActiveChatJob(null);
  };

  // "New Chat" from any entry point — clears the session and routes the
  // project workspace into the conversation view.
  const openNewChat = (folderId: string | null = null) => {
    startNewChat();
    setProjectsViewOpen(false);
    setSkillsViewOpen(false);
    setNewChatCount((count) => count + 1);
    onOpenNewChat?.(folderId);
  };

  const openSession = (sessionId: string) => {
    const folderId =
      sessions.find((session) => session.id === sessionId)?.projects?.[0] ??
      null;
    setCreatedSessionMessages([]);
    setOptimisticMessage(null);
    setProjectsViewOpen(false);
    setSkillsViewOpen(false);
    setActiveSessionId(sessionId);
    setRestoredComposer(null);
    setActiveChatJob(null);
    onOpenSession?.(sessionId, folderId, {
      preserveState: true,
      pushState: true
    });
  };

  const openMemo = (memo: AiAssistantMessageMemo) => {
    const folderId =
      memo.knowledgeFolderId ?? sessionQuery.data?.data?.projects?.[0] ?? null;
    onOpenMemo?.(memo.id, folderId);
  };

  const handleSend = (
    content: string,
    attachments: AiAssistantAttachment[],
    composerProjectId?: string | null,
    skillIds: string[] = [],
    replacesMessageIds?: string[]
  ) => {
    const trimmed = content.trim();
    if (!trimmed || isThinking) return;
    const projectId = selectedProjectId ?? composerProjectId ?? null;
    setActiveChatJob(null);

    const uploadedFiles = attachments
      .filter((item) => item.status === "complete" && item.fileId)
      .map((item) => ({ fileId: item.fileId as string, name: item.name }));
    const fileIds = uploadedFiles.map((item) => item.fileId);

    const userMessage: AiAssistantMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      messageType: "text",
      replacesMessageIds,
      skillIds: skillIds.length > 0 ? skillIds : undefined,
      attachments: uploadedFiles.map((item) => ({
        id: item.fileId,
        name: item.name,
        size: 0
      }))
    };
    setOptimisticMessage(userMessage);
    setDraft("");

    const title =
      sessions.find((session) => session.id === activeSessionId)?.title ||
      trimmed.slice(0, 80);
    const requestSessionId = activeSessionId;
    const serverMessages = fetchedMessages ?? createdSessionMessages;
    const nextSequence =
      serverMessages.reduce(
        (maximum, message) => Math.max(maximum, message.sequence ?? 0),
        // Cancellation can finish before the sent user message is fetched.
        restoredComposer?.sessionId === requestSessionId
          ? restoredComposer.userSequence
          : 0
      ) + 1;
    if (requestSessionId) {
      beginSessionRequest(
        requestScope,
        requestSessionId,
        userMessage,
        nextSequence
      );
    } else {
      beginNewChatRequest(requestScope, userMessage, title, projectId);
    }

    void (async () => {
      try {
        if (!requestSessionId) {
          const response = await createSession.mutateAsync({
            message: trimmed,
            user_id: user?.id ?? "",
            title,
            metadata: { source },
            user_prompt: trimmed,
            files: fileIds.length > 0 ? fileIds : undefined,
            skill_ids: skillIds.length > 0 ? skillIds : undefined,
            // A session may be created without a project — only include one
            // when the user picked it in the composer.
            projects: projectId ? [projectId] : undefined
          });
          const createdSessionId = response.session_id;
          const createdFolderId = projectId;
          const jobId = response.job_id;
          const createdAt = new Date().toISOString();
          const createdMessages: WorkflowChatMessage[] = [
            {
              id: `created-user-${createdSessionId}`,
              session_id: createdSessionId,
              role: "user",
              content: trimmed,
              sequence: 1,
              user_id: user?.id ?? "",
              message_type: "text",
              skill_ids: skillIds.length > 0 ? skillIds : undefined,
              created_at: createdAt,
              files: uploadedFiles.map((item) => ({
                file_id: item.fileId,
                file_name: item.name
              }))
            }
          ];
          if (mountedRef.current) {
            beginSessionRequest(
              requestScope,
              createdSessionId,
              userMessage,
              1,
              jobId
            );
            clearNewChatRequest(requestScope);
            setActiveSessionId(createdSessionId);
            setCreatedSessionMessages(createdMessages);
            setOptimisticMessage(null);
            // The panel already has the new session state. Update the URL
            // without starting another Next.js route transition, which would
            // remount the chat and look like a page refresh.
            onOpenSession?.(createdSessionId, createdFolderId, {
              preserveState: true
            });
          } else {
            completeNewChatRequest(
              requestScope,
              createdSessionId,
              createdFolderId,
              jobId
            );
          }
          return;
        }
        const response = await sendMessage.mutateAsync({
          sessionId: requestSessionId,
          content: trimmed,
          ...(replacesMessageIds?.length ? { retry: true } : {}),
          message_type: "text",
          metadata: {
            source,
            ...(replacesMessageIds?.length
              ? { regenerated_message_ids: replacesMessageIds }
              : {})
          },
          role: "user",
          sequence: nextSequence,
          user_id: user?.id ?? "",
          files: fileIds.length > 0 ? fileIds : undefined,
          skill_ids: skillIds.length > 0 ? skillIds : undefined
        });
        setSessionRequestJob(requestScope, requestSessionId, response.job_id);
        if (mountedRef.current) setOptimisticMessage(null);
      } catch (err) {
        if (!requestSessionId) clearNewChatRequest(requestScope);
        else endSessionRequest(requestScope, requestSessionId);
        if (mountedRef.current) {
          setDraft(trimmed);
          setOptimisticMessage(null);
          // If the active session was pruned server-side (e.g. after being
          // idle), sending to it 404s. Drop the stale id so the next send
          // creates a fresh conversation instead of repeatedly failing.
          if ((err as AxiosError | undefined)?.response?.status === 404) {
            setActiveSessionId(null);
            setCreatedSessionMessages([]);
            onSessionUnavailable?.(selectedProjectId);
          }
        }
      }
    })();
  };

  const handleRegenerate = () => {
    const lastMessage = messages[messages.length - 1];
    const error =
      lastMessage?.error ??
      (visibleChatJob?.state === "failed" ? visibleChatJob.error : undefined);
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((message) => message.role === "user");
    if (
      !activeSessionId ||
      !error?.retryable ||
      !lastUserMessage ||
      isThinking
    ) {
      return;
    }
    handleSend(
      lastUserMessage.content,
      (lastUserMessage.attachments ?? []).map((file) => ({
        ...file,
        mimeType: "",
        fileId: file.id,
        status: "complete"
      })),
      undefined,
      lastUserMessage.skillIds,
      lastMessage.role === "assistant"
        ? [lastUserMessage.id, lastMessage.id]
        : [lastUserMessage.id]
    );
  };

  const renameSession = (sessionId: string, title: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;
    updateSession.mutate({
      sessionId,
      metadata: session.metadata ?? {},
      status: session.status ?? "active",
      title,
      user_id: session.user_id || user?.id || ""
    });
  };

  const removeSession = (sessionId: string) => {
    setDeletingSessionId(sessionId);
  };

  const confirmRemoveSession = () => {
    if (!deletingSessionId) return;
    const sessionId = deletingSessionId;
    deleteSession.mutate(
      { sessionId },
      {
        onSuccess: () => {
          setDeletingSessionId(null);
          if (activeSessionId === sessionId) {
            endSessionRequest(requestScope, sessionId);
            setActiveSessionId(null);
            setCreatedSessionMessages([]);
            setOptimisticMessage(null);
            onSessionUnavailable?.(selectedProjectId);
          }
        }
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-label={`${title} assistant`}
      aria-hidden={!open}
      className={cn(
        "flex w-full flex-col overflow-hidden bg-white",
        embedded
          ? "relative h-full"
          : "fixed inset-y-0 right-0 border-l border-gray-200 shadow-2xl shadow-gray-900/10",
        !embedded && isFullscreen
          ? "z-100 sm:w-full sm:border-l-0"
          : !embedded && "z-40 sm:w-100",
        "transition-[transform,width] duration-300 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-full"
      )}
    >
      {!embedded && (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-100 px-3">
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            aria-label="Toggle conversation history"
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-primary-400 to-primary-700 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold text-gray-900">
            {title}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <BadgeCheck className="h-3 w-3" /> Agent
            </span>
            {!embedded && (
              <button
                type="button"
                onClick={startNewChat}
                aria-label="New chat"
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            {!embedded && (
              <button
                type="button"
                onClick={() => setIsFullscreen((value) => !value)}
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Open fullscreen"
                }
                aria-pressed={isFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {!workspaceFullscreen && (
          <AiAssistantHistory
            open={historyOpen}
            sessions={sessions}
            activeSessionId={activeSessionId}
            hasMore={sessionsQuery.hasNextPage}
            isLoadingMore={sessionsQuery.isFetchingNextPage}
            onLoadMore={() => {
              if (!sessionsQuery.isFetching) void sessionsQuery.fetchNextPage();
            }}
            onClose={() => setHistoryOpen(false)}
            onSelect={(sessionId) => {
              openSession(sessionId);
              setHistoryOpen(false);
            }}
            onNewChat={() => openNewChat()}
            onRename={renameSession}
            onDelete={removeSession}
            embedded={embedded}
            responsive={Boolean(workspace)}
            onShowScheduled={onShowScheduled}
            scheduledActive={Boolean(workspace)}
            showProjects={Boolean(projects)}
            projectsActive={Boolean(projects) && projectsViewOpen && !workspace}
            onShowProjects={() => {
              setSkillsViewOpen(false);
              setProjectsViewOpen(true);
              setNewChatCount(0);
              setActiveSessionId(null);
              setCreatedSessionMessages([]);
              setOptimisticMessage(null);
              onSelectProject?.(null);
            }}
            showSkills={Boolean(projects)}
            skillsActive={Boolean(projects) && skillsViewOpen && !workspace}
            onShowSkills={() => {
              setProjectsViewOpen(false);
              setSkillsViewOpen(true);
              setNewChatCount(0);
              setActiveSessionId(null);
              setCreatedSessionMessages([]);
              setOptimisticMessage(null);
              onShowSkills?.();
            }}
          />
        )}

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-[margin] duration-200",
            embedded &&
              !workspaceFullscreen &&
              (workspace ? "md:ml-64" : "ml-64")
          )}
        >
          {workspace ? (
            workspace
          ) : projects && skillsViewOpen && !activeSessionId ? (
            <SkillBrowser />
          ) : projects &&
            projectsViewOpen &&
            projectIds.length === 0 &&
            !activeSessionId ? (
            <ProjectGrid
              projects={projects}
              loading={projectsLoading}
              onSelect={(id) => {
                startNewChat();
                setNewChatCount(0);
                setProjectsViewOpen(false);
                onSelectProject?.(id);
              }}
              onCreate={onCreateProject}
              onRename={onRenameProject}
              onDelete={onDeleteProject}
            />
          ) : initialMemoId ? (
            <MemoDetail
              folderId={selectedProjectId}
              memoId={initialMemoId}
              onBack={() => onSelectProject?.(selectedProjectId)}
            />
          ) : activeProject ? (
            <MemoBrowser
              key={activeProject.id}
              folderId={activeProject.id}
              folderTitle={activeProject.title}
              initialMemoId={initialMemoId}
              onOpenMemo={(memoId) => onOpenMemo?.(memoId, activeProject.id)}
              onCloseMemo={() => onSelectProject?.(activeProject.id)}
              onBack={() => {
                startNewChat();
                setNewChatCount(0);
                setProjectsViewOpen(true);
                onSelectProject?.(null);
              }}
              onNewChat={() => openNewChat(activeProject.id)}
              newChatCount={newChatCount}
              chatTabActive={Boolean(activeSessionId)}
              sessions={sessions}
              sessionsLoading={sessionsQuery.isLoading}
              activeSessionId={activeSessionId}
              onSelectSession={openSession}
              onExitSession={() => {
                startNewChat();
                onSelectProject?.(activeProject.id);
              }}
              chat={
                <>
                  <AiAssistantMessages
                    key={activeSessionId ?? "new"}
                    messages={messages}
                    additionalMessageIds={additionalMessageIds}
                    loadedPageCount={messagesQuery.data?.pages.length ?? 0}
                    hasMoreMessages={messagesQuery.hasPreviousPage}
                    isLoadingMore={messagesQuery.isFetchingPreviousPage}
                    onLoadMore={() => void messagesQuery.fetchPreviousPage()}
                    hasNewerMessages={messagesQuery.hasNextPage}
                    isLoadingNewer={messagesQuery.isFetchingNextPage}
                    onLoadNewer={() => messagesQuery.fetchNextPage()}
                    isThinking={isThinking}
                    activeJob={visibleChatJob}
                    onCancel={handleCancel}
                    isCancelling={cancelChatJob.isPending}
                    cancelDisabled={cancelDisabled}
                    onRegenerate={handleRegenerate}
                    compact={source === "synergy-intelegence"}
                    onSelectOption={(option) => handleSend(option.label, [])}
                    onSendOther={(content) => handleSend(content, [])}
                    onOpenMemo={openMemo}
                    isLoading={
                      sessionsQuery.isLoading ||
                      (Boolean(activeSessionId) &&
                        createdSessionMessages.length === 0 &&
                        (sessionQuery.isLoading || messagesQuery.isLoading))
                    }
                    onSelectPrompt={setDraft}
                    emptyTitle={emptyTitle}
                    emptyDescription={emptyDescription}
                    suggestedPrompts={suggestedPrompts}
                  />
                  <AiAssistantComposer
                    key={restoredMessage ? restoredComposer?.jobId : "composer"}
                    initialMessage={restoredMessage}
                    value={draft}
                    onValueChange={setDraft}
                    onSend={handleSend}
                    disabled={isThinking}
                    projects={projects}
                    skillsEnabled={source === "synergy-intelegence"}
                    lockedProjectName={assignedProjectName}
                    projectSelectionEnabled={!activeSessionId && !isThinking}
                  />
                </>
              }
            />
          ) : (
            <>
              <AiAssistantMessages
                key={activeSessionId ?? "new"}
                messages={messages}
                additionalMessageIds={additionalMessageIds}
                loadedPageCount={messagesQuery.data?.pages.length ?? 0}
                hasMoreMessages={messagesQuery.hasPreviousPage}
                isLoadingMore={messagesQuery.isFetchingPreviousPage}
                onLoadMore={() => void messagesQuery.fetchPreviousPage()}
                hasNewerMessages={messagesQuery.hasNextPage}
                isLoadingNewer={messagesQuery.isFetchingNextPage}
                onLoadNewer={() => messagesQuery.fetchNextPage()}
                isThinking={isThinking}
                activeJob={visibleChatJob}
                onCancel={handleCancel}
                isCancelling={cancelChatJob.isPending}
                cancelDisabled={cancelDisabled}
                onRegenerate={handleRegenerate}
                compact={source === "synergy-intelegence"}
                onSelectOption={(option) => handleSend(option.label, [])}
                onSendOther={(content) => handleSend(content, [])}
                onOpenMemo={openMemo}
                isLoading={
                  sessionsQuery.isLoading ||
                  (Boolean(activeSessionId) &&
                    createdSessionMessages.length === 0 &&
                    (sessionQuery.isLoading || messagesQuery.isLoading))
                }
                onSelectPrompt={setDraft}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                suggestedPrompts={suggestedPrompts}
              />
              <AiAssistantComposer
                key={restoredMessage ? restoredComposer?.jobId : "composer"}
                initialMessage={restoredMessage}
                value={draft}
                onValueChange={setDraft}
                onSend={handleSend}
                disabled={isThinking}
                projects={projects}
                skillsEnabled={source === "synergy-intelegence"}
                lockedProjectName={assignedProjectName}
                projectSelectionEnabled={!activeSessionId && !isThinking}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        open={Boolean(deletingSessionId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deleteSession.isPending) setDeletingSessionId(null);
        }}
        title="Delete conversation?"
        description={`Are you sure you want to delete \"${
          sessions.find((session) => session.id === deletingSessionId)?.title ||
          "Untitled Chat"
        }\"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteSession.isPending}
        onConfirm={confirmRemoveSession}
      />
    </div>
  );
}

function ProjectGrid({
  projects,
  loading,
  onSelect,
  onCreate,
  onRename,
  onDelete
}: {
  projects: KnowledgeFolder[];
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate?: (title: string) => Promise<void>;
  onRename?: (id: string, title: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ id?: string; title: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<KnowledgeFolder | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const filtered = projects.filter((project) =>
    project.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  async function save() {
    const title = editor?.title.trim();
    if (!editor || !title) return;
    setSaving(true);
    try {
      if (editor.id) await onRename?.(editor.id, title);
      else await onCreate?.(title);
      setEditor(null);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          <div className="flex gap-2">
            <label className="relative w-64">
              <span className="sr-only">Search projects</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary-400"
              />
            </label>
            {onCreate && (
              <Button size="sm" onClick={() => setEditor({ title: "" })}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">
            Loading projects...
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            No projects found.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="flex min-h-20 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onSelect(project.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Folder className="h-5 w-5 shrink-0 text-gray-700" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {project.title}
                    </span>
                    <span className="mt-1 block text-xs text-gray-400">
                      {project.count_file} files
                    </span>
                  </span>
                </button>
                <div className="flex items-center">
                  {onRename && (
                    <button
                      type="button"
                      aria-label={`Edit ${project.title}`}
                      onClick={() =>
                        setEditor({ id: project.id, title: project.title })
                      }
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      aria-label={`Delete ${project.title}`}
                      onClick={() => setDeleting(project)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => !open && !saving && setEditor(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              {editor?.id
                ? "Update the project folder name."
                : "Create a folder for a new Synergy project."}
            </DialogDescription>
          </DialogHeader>
          <label className="text-sm font-medium">
            Project Name
            <input
              autoFocus
              value={editor?.title ?? ""}
              onChange={(event) =>
                setEditor((current) =>
                  current ? { ...current, title: event.target.value } : null
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save();
                }
              }}
              placeholder="Enter project name"
              className="mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary-400"
            />
          </label>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setEditor(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={saving || !editor?.title.trim()}
              onClick={() => void save()}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  {editor?.id ? "Save" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && !deletePending && setDeleting(null)}
        title="Delete project?"
        description={`Are you sure you want to delete “${deleting?.title ?? "this project"}”? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deletePending}
        onConfirm={() => {
          if (!deleting || !onDelete) return;
          setDeletePending(true);
          void onDelete(deleting.id)
            .then(() => setDeleting(null))
            .finally(() => setDeletePending(false));
        }}
      />
    </div>
  );
}
