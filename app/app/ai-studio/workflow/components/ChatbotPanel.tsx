"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";

import type { AxiosError } from "axios";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useCreateChatSession,
  useDeleteChatSession,
  useGetChatSession,
  useGetChatSessions,
  useSendChatMessage,
  useUpdateChatSession
} from "../hooks/useWorkflowChat";
import {
  useGetAiAssistantMessages,
  useWorkflowChatJob
} from "@/components/ai-assistant/useAiAssistantChat";
import type {
  AiAssistantAttachment,
  AiAssistantMessage,
  AiAssistantMessageMemo,
  WorkflowChatJob
} from "@/components/ai-assistant/types";
import { AiAssistantMessages } from "@/components/ai-assistant/AiAssistantMessages";
import { AiAssistantComposer } from "@/components/ai-assistant/AiAssistantComposer";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useGetKnowledgeMemo } from "@/components/ai-assistant/useKnowledgeMemos";
import type { WorkflowChatMessage } from "../types";
import {
  getChatMessageFiles,
  getChatMessageMemos,
  getChatMessageOptions,
  getChatMessageSkillIds,
  getWorkflowChatResponseError,
  isTextChatMessage
} from "../types";

const WORKFLOW_PROMPTS = [
  "Build a new automation workflow",
  "Connect Google Drive to Postgres database",
  "Transform and map Excel columns to Master Data",
  "Explain the current workflow pipeline"
];

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

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

function MemoPreviewDialog({
  memo,
  fallbackFolderId,
  onClose
}: {
  memo: AiAssistantMessageMemo | null;
  fallbackFolderId: string | null;
  onClose: () => void;
}) {
  const folderId = memo?.knowledgeFolderId || fallbackFolderId;
  const memoQuery = useGetKnowledgeMemo(folderId, memo?.id ?? null);
  if (!memo) return null;

  return (
    <Dialog open={Boolean(memo)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-6">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-semibold text-gray-900">
            {memo.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Knowledge Memo Reference
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pt-4">
          {memoQuery.isLoading ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Loading memo content...
            </div>
          ) : memoQuery.isError ? (
            <div className="py-8 text-center text-xs text-red-600">
              Unable to load memo content.
            </div>
          ) : (
            <MarkdownPreview
              content={memoQuery.data?.data?.content ?? ""}
              compact={false}
              className="text-xs text-gray-700"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ChatbotPanelProps {
  workflowId: string;
  onClose?: () => void;
}

/**
 * Nexa AI workflow chatbot panel.
 * Maintains Nexa Bot's distinctive dark-themed workflow UI (dark header, dark collapsible sidebar),
 * while integrating the shared AiAssistantMessages and AiAssistantComposer components so all
 * features from Synergy Intelligence (interactive options, memos, skills, attachments, etc.)
 * stay shared and synchronized.
 */
export function ChatbotPanel({ workflowId, onClose }: ChatbotPanelProps) {
  const { user } = useCurrentUser();
  const [expanded, setExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedMemo, setSelectedMemo] =
    useState<AiAssistantMessageMemo | null>(null);
  const [optimisticMessage, setOptimisticMessage] =
    useState<AiAssistantMessage | null>(null);
  const [createdSessionMessages, setCreatedSessionMessages] = useState<
    WorkflowChatMessage[]
  >([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [activeChatJob, setActiveChatJob] = useState<WorkflowChatJob | null>(
    null
  );
  const [pendingRequest, setPendingRequest] = useState<{
    message: AiAssistantMessage;
    userSequence: number;
    jobId?: string;
  } | null>(null);
  const lastSessionCountRef = useRef<number>(-1);

  const sessionsQuery = useGetChatSessions(workflowId);
  const createSession = useCreateChatSession(workflowId);
  const sessionQuery = useGetChatSession(activeSessionId);
  const messagesQuery = useGetAiAssistantMessages(activeSessionId);
  const sendMessage = useSendChatMessage();
  const updateSession = useUpdateChatSession();
  const deleteSession = useDeleteChatSession();

  const isThinking =
    createSession.isPending ||
    sendMessage.isPending ||
    Boolean(pendingJobId) ||
    Boolean(pendingRequest);

  const handleChatJob = (job: WorkflowChatJob) => {
    if (!activeSessionId || job.session_id !== activeSessionId) return;
    setActiveChatJob(job);
    if (
      job.state !== "succeeded" &&
      job.state !== "failed" &&
      job.state !== "cancelled"
    ) {
      return;
    }
    if (job.state === "succeeded") {
      void Promise.all([
        messagesQuery.refetch(),
        sessionQuery.refetch(),
        sessionsQuery.refetch()
      ]).finally(() => {
        setPendingRequest(null);
        setPendingJobId(null);
        setActiveChatJob(null);
        setOptimisticMessage(null);
        setCreatedSessionMessages([]);
      });
      return;
    }
    void messagesQuery.refetch().finally(() => {
      setPendingRequest(null);
      setPendingJobId(null);
      setActiveChatJob(null);
      setOptimisticMessage(null);
    });
    if (job.state === "failed") {
      toast.error(
        job.error?.message || "The AI response failed. Please try again."
      );
    } else {
      toast.error("The AI response was cancelled.");
    }
  };

  useWorkflowChatJob(pendingJobId ?? pendingRequest?.jobId, {
    enabled: Boolean(activeSessionId),
    onJob: handleChatJob,
    onError: (error) => {
      setPendingRequest(null);
      setPendingJobId(null);
      setActiveChatJob(null);
      setOptimisticMessage(null);
      void messagesQuery.refetch();
      toast.error(
        error.code === "job_not_found"
          ? "The AI response job could not be found."
          : "Unable to watch the AI response."
      );
    }
  });

  const rawSessions = useMemo(() => {
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

  const sessions = useMemo(() => {
    return [...rawSessions].sort((a, b) => {
      const aTime = a.updated_at || a.created_at || "";
      const bTime = b.updated_at || b.created_at || "";
      return bTime.localeCompare(aTime);
    });
  }, [rawSessions]);

  useEffect(() => {
    if (sessions.length === 0) {
      lastSessionCountRef.current = 0;
      return;
    }
    if (lastSessionCountRef.current === sessions.length) return;
    lastSessionCountRef.current = sessions.length;
    if (!activeSessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSessionId(sessions[0]?.id ?? null);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const sessionNotFound =
      (sessionQuery.error as AxiosError | undefined)?.response?.status === 404;
    const messagesNotFound =
      (messagesQuery.error as AxiosError | undefined)?.response?.status === 404;
    if (!activeSessionId || (!sessionNotFound && !messagesNotFound)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSessionId(null);
    setCreatedSessionMessages([]);
    setPendingRequest(null);
    setPendingJobId(null);
    setActiveChatJob(null);
    setOptimisticMessage(null);
  }, [activeSessionId, sessionQuery.error, messagesQuery.error]);

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

  const serverMessages = useMemo(() => {
    const list =
      fetchedMessages && fetchedMessages.length > 0
        ? fetchedMessages
        : createdSessionMessages;
    return [...list]
      .filter(isTextChatMessage)
      .sort((a, b) => {
        const aSeq = a.sequence ?? 0;
        const bSeq = b.sequence ?? 0;
        if (aSeq !== bSeq) return aSeq - bSeq;
        return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      })
      .map(normalizeMessage);
  }, [fetchedMessages, createdSessionMessages]);

  const messages = useMemo(() => {
    const list = [...serverMessages];
    if (optimisticMessage) {
      list.push(optimisticMessage);
    }
    const replacedMessageIds = new Set(
      list.flatMap((message) => message.replacesMessageIds ?? [])
    );
    return list.filter((message) => !replacedMessageIds.has(message.id));
  }, [serverMessages, optimisticMessage]);

  const filteredSessions = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      (session.title || "Untitled Chat").toLowerCase().includes(query)
    );
  }, [historySearch, sessions]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setCreatedSessionMessages([]);
    setPendingRequest(null);
    setPendingJobId(null);
    setActiveChatJob(null);
    setOptimisticMessage(null);
    setInput("");
  };

  const handleSend = async (
    content?: string,
    attachments?: AiAssistantAttachment[],
    skillIds?: string[],
    replacesMessageIds?: string[]
  ) => {
    const textToSend = (content ?? input).trim();
    if (!textToSend || isThinking) return;

    const uploadedFiles = (attachments ?? [])
      .filter((file) => file.fileId && file.status === "complete")
      .map((file) => ({
        file_id: file.fileId as string,
        file_name: file.name
      }));
    const fileIds = uploadedFiles.map((file) => file.file_id);

    const userMessage: AiAssistantMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
      messageType: "text",
      attachments: (attachments ?? []).map((file) => ({
        id: file.fileId ?? file.id,
        name: file.name,
        size: file.size
      })),
      skillIds: skillIds?.length ? skillIds : undefined,
      replacesMessageIds
    };

    setOptimisticMessage(userMessage);
    if (!content) setInput("");

    try {
      if (!activeSessionId) {
        const title = textToSend.slice(0, 80);
        setPendingRequest({
          message: userMessage,
          userSequence: 1
        });
        const response = await createSession.mutateAsync({
          title,
          message: textToSend,
          user_id: user?.id ?? "",
          metadata: { source: "workflow-builder", workflow_id: workflowId },
          user_prompt: textToSend,
          files: fileIds.length > 0 ? fileIds : undefined,
          skill_ids: skillIds?.length ? skillIds : undefined
        });

        const createdId = response.session_id;
        const jobId = response.job_id;
        const createdAt = new Date().toISOString();
        const initialMessages: WorkflowChatMessage[] = [
          {
            id: `created-user-${createdId}`,
            session_id: createdId,
            role: "user",
            content: textToSend,
            sequence: 1,
            user_id: user?.id ?? "",
            message_type: "text",
            created_at: createdAt,
            skill_ids: skillIds?.length ? skillIds : undefined,
            files: uploadedFiles
          }
        ];
        setActiveSessionId(createdId);
        setCreatedSessionMessages(initialMessages);
        setPendingJobId(jobId);
        setPendingRequest({
          message: userMessage,
          userSequence: 1,
          jobId
        });
        setOptimisticMessage(null);
        return;
      }

      const nextSequence = serverMessages.length + 1;
      setPendingRequest({
        message: userMessage,
        userSequence: nextSequence
      });

      const response = await sendMessage.mutateAsync({
        sessionId: activeSessionId,
        content: textToSend,
        role: "user",
        sequence: nextSequence,
        user_id: user?.id ?? "",
        message_type: "text",
        ...(replacesMessageIds?.length ? { retry: true } : {}),
        metadata: {
          source: "workflow-builder",
          workflow_id: workflowId,
          ...(replacesMessageIds?.length
            ? { regenerated_message_ids: replacesMessageIds }
            : {})
        },
        files: fileIds.length > 0 ? fileIds : undefined,
        skill_ids: skillIds?.length ? skillIds : undefined
      });

      setPendingJobId(response.job_id);
      setPendingRequest({
        message: userMessage,
        userSequence: nextSequence,
        jobId: response.job_id
      });
      setOptimisticMessage(null);
    } catch (err) {
      setOptimisticMessage(null);
      setPendingRequest(null);
      setPendingJobId(null);
      const message =
        (err as AxiosError<{ message?: string }>)?.response?.data?.message ||
        "Failed to send message";
      toast.error(message);
    }
  };

  const handleRegenerate = () => {
    const lastMessage = messages[messages.length - 1];
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((message) => message.role === "user");
    if (!activeSessionId || !lastUserMessage || isThinking) {
      return;
    }
    const replaces = [
      lastUserMessage.id,
      ...(lastMessage && lastMessage.id !== lastUserMessage.id
        ? [lastMessage.id]
        : [])
    ];
    const attachmentItems: AiAssistantAttachment[] = (
      lastUserMessage.attachments ?? []
    ).map((file) => ({
      id: file.id,
      fileId: file.id,
      name: file.name,
      size: file.size,
      mimeType: "",
      status: "complete"
    }));
    void handleSend(
      lastUserMessage.content,
      attachmentItems,
      lastUserMessage.skillIds ?? [],
      replaces
    );
  };

  const commitRename = (session: { id: string; title: string }) => {
    const trimmed = editingTitle.trim();
    setEditingSessionId(null);
    if (!trimmed || trimmed === session.title) return;
    updateSession.mutate({
      sessionId: session.id,
      workflowId,
      title: trimmed,
      status: "active",
      metadata: { source: "workflow-builder", workflow_id: workflowId },
      user_id: user?.id ?? ""
    });
  };

  const removeSession = (session: { id: string }) => {
    deleteSession.mutate(
      { sessionId: session.id, workflowId },
      {
        onSuccess: () => {
          if (activeSessionId === session.id) {
            startNewChat();
          }
        }
      }
    );
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden bg-white text-slate-800",
        expanded && "h-72",
        isFullscreen &&
          "fixed inset-3 z-50 !h-auto !w-auto rounded-xl border border-slate-300 shadow-2xl"
      )}
    >
      {/* Header — Nexa Bot distinct dark styling */}
      <div className="flex h-12 shrink-0 items-center gap-3 bg-[#090909] px-3 text-white">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Bot className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold leading-5">
              Nexa AI
            </span>
            <span className="truncate text-xs font-normal leading-5 text-slate-200">
              Agent Interface
            </span>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setIsFullscreen((current) => !current);
            }}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen chat"}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <span
            className="h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
            title="Online"
          />
          <button
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
                return;
              }
              setExpanded(false);
            }}
            title={onClose ? "Close chat" : "Minimize chat"}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex min-h-0 flex-1">
          {/* History Sidebar — Nexa Bot distinct dark collapsible styling */}
          <aside
            className={cn(
              "relative flex shrink-0 flex-col border-r border-slate-700 bg-[#111] px-3 py-2 text-white transition-[width] duration-200",
              historyOpen ? "w-56" : "w-11 items-center"
            )}
          >
            <button
              type="button"
              onClick={() => setHistoryOpen((value) => !value)}
              title={historyOpen ? "Collapse history" : "Expand history"}
              className="absolute -right-3 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary-400 text-white shadow-md hover:bg-primary-500"
            >
              {historyOpen ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {historyOpen ? (
              <>
                <Button
                  type="button"
                  onClick={startNewChat}
                  className="mb-3 w-full justify-start gap-2 bg-primary-600 text-xs text-white hover:bg-primary-500"
                >
                  <Plus className="h-4 w-4" /> New Chat
                </Button>
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    placeholder="Search"
                    className="h-8 w-full rounded border border-slate-600 bg-white pl-7 pr-2 text-xs text-slate-900 outline-none focus:border-primary-500"
                  />
                </div>
                <p className="mb-1 px-1 text-[10px] uppercase tracking-wide text-slate-400">
                  Recent
                </p>
                <div
                  onScroll={(event) => {
                    const target = event.currentTarget;
                    if (
                      target.scrollHeight - target.scrollTop <=
                        target.clientHeight + 40 &&
                      sessionsQuery.hasNextPage &&
                      !sessionsQuery.isFetchingNextPage
                    ) {
                      void sessionsQuery.fetchNextPage();
                    }
                  }}
                  className="workflow-chat-scroll workflow-chat-history-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain"
                >
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex w-full items-center rounded hover:bg-white/10",
                        activeSessionId === session.id && "bg-white/10"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCreatedSessionMessages([]);
                          setActiveSessionId(session.id);
                          setPendingRequest(null);
                          setPendingJobId(null);
                          setActiveChatJob(null);
                          setOptimisticMessage(null);
                        }}
                        className="min-w-0 flex-1 px-2 py-2 text-left"
                      >
                        {editingSessionId === session.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => commitRename(session)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(session);
                              if (e.key === "Escape") setEditingSessionId(null);
                            }}
                            className="h-6 w-full rounded border border-primary-500 bg-slate-800 px-1 text-xs text-white outline-none"
                          />
                        ) : (
                          <div className="truncate text-xs font-medium text-slate-100">
                            {session.title || "Untitled Chat"}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatTime(session.updated_at || session.created_at)}
                        </span>
                      </button>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-32 border-slate-700 bg-slate-900 text-white"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingSessionId(session.id);
                              setEditingTitle(session.title || "Untitled Chat");
                            }}
                            className="cursor-pointer text-xs hover:bg-slate-800 focus:bg-slate-800"
                          >
                            <Pencil className="mr-2 h-3 w-3" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeSession(session)}
                            className="cursor-pointer text-xs text-red-400 hover:bg-slate-800 focus:bg-slate-800"
                          >
                            <Trash2 className="mr-2 h-3 w-3" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  {sessionsQuery.isFetchingNextPage && (
                    <div className="flex items-center justify-center py-2 text-[10px] text-slate-400">
                      Loading more...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  title="New chat"
                  className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="my-1 h-px w-5 bg-slate-700" />
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  title="View history"
                  className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            )}
          </aside>

          {/* Main Chat Area — Reusing shared AiAssistantMessages and AiAssistantComposer */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
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
              activeJob={activeChatJob ?? undefined}
              onRegenerate={handleRegenerate}
              compact={true}
              onSelectOption={(option) => void handleSend(option.label)}
              onSendOther={(content) => void handleSend(content)}
              onOpenMemo={(memo) => setSelectedMemo(memo)}
              isLoading={
                sessionsQuery.isLoading ||
                (Boolean(activeSessionId) &&
                  createdSessionMessages.length === 0 &&
                  (sessionQuery.isLoading || messagesQuery.isLoading))
              }
              onSelectPrompt={(prompt) => void handleSend(prompt)}
              emptyTitle="Nexa AI Workflow Assistant"
              emptyDescription="Ask me to generate nodes, automate tasks, or connect services."
              suggestedPrompts={WORKFLOW_PROMPTS}
            />

            <AiAssistantComposer
              value={input}
              onValueChange={setInput}
              onSend={(content, attachments, _, skillIds) =>
                void handleSend(content, attachments, skillIds)
              }
              disabled={isThinking}
              skillsEnabled={true}
              projectSelectionEnabled={false}
            />
          </div>
        </div>
      )}

      {/* Standalone Memo Preview Dialog */}
      <MemoPreviewDialog
        memo={selectedMemo}
        fallbackFolderId={sessionQuery.data?.data?.projects?.[0] ?? null}
        onClose={() => setSelectedMemo(null)}
      />
    </div>
  );
}
