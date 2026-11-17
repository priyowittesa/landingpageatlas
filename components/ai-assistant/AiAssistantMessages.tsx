"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  FileText,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Square
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ChatFileChips } from "./ChatFileChips";
import { useGetWorkflowSkills } from "./useWorkflowSkills";
import { ASSISTANT_NAME, SUGGESTED_PROMPTS } from "./mock-data";
import type {
  AiAssistantMessage,
  AiAssistantMessageMemo,
  AiAssistantMessageOption,
  WorkflowChatJob,
  WorkflowChatJobStep
} from "./types";

function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

function AttachmentChips({
  attachments,
  isUser
}: {
  attachments: NonNullable<AiAssistantMessage["attachments"]>;
  isUser?: boolean;
}) {
  return (
    <ChatFileChips
      isUser={isUser}
      files={attachments.map((file) => ({
        fileId: file.id,
        fileName: file.name
      }))}
    />
  );
}

function SkillChips({
  skillIds,
  skillTitles,
  isUser = false
}: {
  skillIds: NonNullable<AiAssistantMessage["skillIds"]>;
  skillTitles: ReadonlyMap<string, string>;
  isUser?: boolean;
}) {
  const visibleSkillIds = skillIds.filter((skillId) =>
    skillTitles.has(skillId)
  );
  if (visibleSkillIds.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {visibleSkillIds.map((skillId) => (
        <span
          key={skillId}
          className={cn(
            "inline-flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-3",
            isUser ? "bg-white/20 text-white" : "bg-primary-50 text-primary-700"
          )}
        >
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          <span className="break-words">{skillTitles.get(skillId)}</span>
        </span>
      ))}
    </div>
  );
}

function MemoCards({
  memos,
  onOpen
}: {
  memos: NonNullable<AiAssistantMessage["memos"]>;
  onOpen?: (memo: AiAssistantMessageMemo) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {memos.map((memo) => (
        <button
          key={memo.id}
          type="button"
          onClick={() => onOpen?.(memo)}
          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
            <FileText className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-900">
              {memo.title}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Memo · Ready to review
            </span>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-800">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </button>
      ))}
    </div>
  );
}

function humanizeStep(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function recordText(
  record: Record<string, unknown> | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function stepLabel(step: WorkflowChatJobStep) {
  return step.name?.trim() || humanizeStep(step.kind) || "Processing";
}

function progressPercentage(progress?: Record<string, unknown>) {
  const direct = progress?.percentage ?? progress?.percent;
  if (typeof direct === "number" && Number.isFinite(direct)) {
    return Math.round(
      Math.min(100, Math.max(0, direct <= 1 ? direct * 100 : direct))
    );
  }
  const current = progress?.current;
  const total = progress?.total;
  if (
    typeof current === "number" &&
    typeof total === "number" &&
    Number.isFinite(current) &&
    Number.isFinite(total) &&
    total > 0
  ) {
    return Math.round(Math.min(100, Math.max(0, (current / total) * 100)));
  }
  return null;
}

function ThinkingBubble({
  job,
  compact = false,
  onCancel,
  isCancelling = false,
  cancelDisabled = false
}: {
  job?: WorkflowChatJob;
  compact?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
  cancelDisabled?: boolean;
}) {
  const steps = job?.steps.slice(-5) ?? [];
  const percentage = progressPercentage(job?.progress);
  const progressText = recordText(job?.progress, [
    "message",
    "current_step",
    "description",
    "detail",
    "status"
  ]);
  const queued = job?.state === "queued";

  return (
    <div className="space-y-1.5" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <AssistantAvatar />
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {ASSISTANT_NAME}
        </span>
      </div>
      <div
        className={cn(
          "ml-8 w-[min(100%,32rem)] rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-sm",
          compact ? "text-[11px]" : "text-xs"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-600" />
            <span
              className={cn(
                "truncate font-semibold text-gray-900",
                compact ? "text-[11px]" : "text-xs"
              )}
            >
              {progressText ??
                (queued ? "Waiting to start" : "Working on your response")}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
            {percentage !== null
              ? `${percentage}%`
              : queued
                ? "Queued"
                : "In progress"}
          </span>
        </div>

        {percentage !== null ? (
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary-600 transition-[width] duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        ) : null}

        <ol className="mt-3">
          {steps.length > 0 ? (
            steps.map((step, index) => {
              const active = index === steps.length - 1;
              const description = recordText(step.data, [
                "message",
                "description",
                "detail",
                "status"
              ]);
              return (
                <li key={`${step.seq}-${step.kind}`} className="flex gap-2.5">
                  <div className="flex w-4 shrink-0 flex-col items-center">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full",
                        active
                          ? "bg-primary-100 text-primary-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {active ? (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      ) : (
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      )}
                    </span>
                    {index < steps.length - 1 ? (
                      <span className="my-1 min-h-3 w-px flex-1 bg-gray-200" />
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      index < steps.length - 1 && "pb-2.5"
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-medium leading-4",
                        active ? "text-gray-900" : "text-gray-500"
                      )}
                    >
                      {stepLabel(step)}
                    </p>
                    {description ? (
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-gray-400">
                        {description}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })
          ) : job ? (
            <>
              <li className="flex gap-2.5">
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  <span className="my-1 min-h-3 w-px flex-1 bg-gray-200" />
                </div>
                <span className="pb-2.5 text-[11px] font-medium leading-4 text-gray-500">
                  Job accepted
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-[11px] font-medium text-gray-900">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                </span>
                {queued ? "Waiting for a worker" : "Processing your response"}
              </li>
            </>
          ) : (
            <li className="flex items-center gap-2.5 text-[11px] text-gray-500">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              </span>
              Connecting to job updates
            </li>
          )}
        </ol>
        {onCancel ? (
          <div className="mt-3 flex justify-end border-t border-gray-100 pt-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={cancelDisabled || isCancelling || job?.cancel_requested}
              aria-label="Cancel response"
              className="h-7 gap-1.5 rounded-lg px-2.5 text-[11px]"
            >
              {isCancelling || job?.cancel_requested ? (
                <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
              ) : (
                <Square aria-hidden="true" className="h-3 w-3" />
              )}
              {isCancelling || job?.cancel_requested
                ? "Cancelling..."
                : "Cancel"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MessagesLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading conversation">
      <span className="sr-only">Loading conversation</span>
      <div className="animate-pulse space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gray-100" />
          <div className="h-2.5 w-16 rounded bg-gray-100" />
        </div>
        <div className="ml-8 space-y-2 rounded-xl bg-gray-50 px-3.5 py-3">
          <div className="h-3 w-4/5 rounded bg-gray-200/80" />
          <div className="h-3 w-3/5 rounded bg-gray-200/80" />
        </div>
      </div>
      <div className="flex animate-pulse justify-end">
        <div className="h-10 w-2/5 rounded-xl bg-primary-100" />
      </div>
      <div className="animate-pulse space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gray-100" />
          <div className="h-2.5 w-16 rounded bg-gray-100" />
        </div>
        <div className="ml-8 space-y-2 rounded-xl bg-gray-50 px-3.5 py-3">
          <div className="h-3 w-11/12 rounded bg-gray-200/80" />
          <div className="h-3 w-2/3 rounded bg-gray-200/80" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onSelectPrompt,
  title = "How can I help you today?",
  description = "Ask about production, inspections or your daily diaries.",
  suggestedPrompts = SUGGESTED_PROMPTS
}: {
  onSelectPrompt: (prompt: string) => void;
  title?: string;
  description?: string;
  suggestedPrompts?: string[];
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-md shadow-primary-500/25">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      <div className="mt-5 w-full space-y-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-800"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageOptions({
  options,
  disabled,
  selectedId,
  onSelect,
  onSendOther
}: {
  options: NonNullable<AiAssistantMessage["options"]>;
  disabled?: boolean;
  selectedId?: string;
  onSelect?: (option: AiAssistantMessageOption) => void;
  onSendOther?: (content: string) => void;
}) {
  const [otherOptionId, setOtherOptionId] = useState<string | null>(null);
  const [otherDraft, setOtherDraft] = useState("");
  const otherInputRef = useRef<HTMLTextAreaElement>(null);

  const sendOther = () => {
    const trimmed = otherDraft.trim();
    if (!trimmed || disabled) return;
    onSendOther?.(trimmed);
    setOtherDraft("");
    setOtherOptionId(null);
  };

  return (
    <div className="mt-3 space-y-2">
      {options.map((option) => {
        const isOther = option.type === "other";
        const selected =
          option.id === selectedId ||
          (isOther && !selectedId && option.id === otherOptionId);
        return (
          <div key={option.id}>
            <button
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => {
                if (isOther) {
                  setOtherOptionId(option.id);
                  window.requestAnimationFrame(() =>
                    otherInputRef.current?.focus()
                  );
                  return;
                }
                setOtherOptionId(null);
                onSelect?.(option);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-2 border-primary-600 shadow-sm"
                  : "border border-gray-200",
                !disabled &&
                  !selected &&
                  "hover:border-primary-300 hover:bg-primary-50/60",
                disabled && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                  selected
                    ? "bg-primary-600 text-white"
                    : "border border-gray-200 bg-gray-50 text-gray-700"
                )}
              >
                {option.id}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[13px] font-semibold",
                    isOther && !selected ? "text-gray-400" : "text-gray-900"
                  )}
                >
                  {option.label}
                </span>
                {option.description ? (
                  <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {option.recommended ? (
                <span className="shrink-0 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Recommended
                </span>
              ) : null}
            </button>
            {isOther && selected && (
              <div className="ml-8 flex items-end gap-2 rounded-lg border border-primary-200 bg-white p-2 shadow-sm">
                <textarea
                  ref={otherInputRef}
                  value={otherDraft}
                  onChange={(event) => setOtherDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendOther();
                    }
                  }}
                  disabled={disabled}
                  rows={2}
                  placeholder="Type your answer..."
                  aria-label="Type your answer"
                  className="min-h-12 flex-1 resize-none bg-transparent px-1 py-1 text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-default"
                />
                <button
                  type="button"
                  onClick={sendOther}
                  disabled={disabled || !otherDraft.trim()}
                  aria-label="Send answer"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-500 disabled:bg-primary-100"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type AiAssistantMessagesProps = {
  messages: AiAssistantMessage[];
  additionalMessageIds?: ReadonlySet<string>;
  loadedPageCount?: number;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  hasNewerMessages?: boolean;
  isLoadingNewer?: boolean;
  onLoadNewer?: () => Promise<unknown>;
  isThinking: boolean;
  activeJob?: WorkflowChatJob;
  onCancel?: () => void;
  isCancelling?: boolean;
  cancelDisabled?: boolean;
  isLoading?: boolean;
  onSelectPrompt: (prompt: string) => void;
  onSelectOption?: (option: AiAssistantMessageOption) => void;
  onSendOther?: (content: string) => void;
  onOpenMemo?: (memo: AiAssistantMessageMemo) => void;
  onRegenerate?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  suggestedPrompts?: string[];
  compact?: boolean;
};

function isVisibleTextMessage(message: AiAssistantMessage): boolean {
  if ((message.role as string) === "tool") {
    return false;
  }
  const rawType = message.messageType;
  if (rawType) {
    const normalized = rawType.toLowerCase().trim();
    if (normalized.includes("tool") || normalized !== "text") {
      return false;
    }
  }
  return true;
}

export function AiAssistantMessages({
  messages,
  additionalMessageIds,
  loadedPageCount = 0,
  hasMoreMessages,
  isLoadingMore,
  onLoadMore,
  hasNewerMessages,
  isLoadingNewer,
  onLoadNewer,
  isThinking,
  activeJob,
  onCancel,
  isCancelling,
  cancelDisabled,
  isLoading,
  onSelectPrompt,
  onSelectOption,
  onSendOther,
  onOpenMemo,
  onRegenerate,
  emptyTitle,
  emptyDescription,
  suggestedPrompts,
  compact = false
}: AiAssistantMessagesProps) {
  const visibleMessages = useMemo(
    () => messages.filter(isVisibleTextMessage),
    [messages]
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const skipBottomScrollRef = useRef(false);
  const previousScrollTopRef = useRef(0);
  const scrollSnapshotRef = useRef<{
    height: number;
    top: number;
    pageCount: number;
  } | null>(null);
  const lastMessage = visibleMessages[visibleMessages.length - 1];
  const responseError =
    lastMessage?.error ??
    (lastMessage?.role === "user" && activeJob?.state === "failed"
      ? activeJob.error
      : undefined);
  const canRegenerate =
    responseError?.retryable === true &&
    visibleMessages.some((message) => message.role === "user") &&
    Boolean(onRegenerate);
  const skillsQuery = useGetWorkflowSkills(
    "",
    "",
    visibleMessages.some((message) => Boolean(message.skillIds?.length))
  );
  const skillTitles = useMemo(
    () =>
      new Map(
        skillsQuery.data?.data.items
          .filter((skill) => skill.source === "tenant")
          .map((skill) => [skill.id, skill.title]) ?? []
      ),
    [skillsQuery.data]
  );

  const loadMore = () => {
    const container = scrollRef.current;
    if (
      !container ||
      !hasMoreMessages ||
      isLoadingMore ||
      loadingMoreRef.current
    )
      return;
    scrollSnapshotRef.current = {
      height: container.scrollHeight,
      top: container.scrollTop,
      pageCount: loadedPageCount
    };
    loadingMoreRef.current = true;
    onLoadMore?.();
  };

  const loadNewer = () => {
    if (
      !hasNewerMessages ||
      isLoadingNewer ||
      loadingNewerRef.current ||
      !onLoadNewer
    )
      return;
    loadingNewerRef.current = true;
    void onLoadNewer().finally(() => {
      loadingNewerRef.current = false;
    });
  };

  useLayoutEffect(() => {
    const snapshot = scrollSnapshotRef.current;
    if (!snapshot || isLoadingMore) return;
    const container = scrollRef.current;
    if (container && loadedPageCount > snapshot.pageCount) {
      container.scrollTop =
        snapshot.top + container.scrollHeight - snapshot.height;
      previousScrollTopRef.current = container.scrollTop;
    }
    scrollSnapshotRef.current = null;
    loadingMoreRef.current = false;
    skipBottomScrollRef.current = true;
  }, [isLoadingMore, loadedPageCount]);

  useEffect(() => {
    if (loadingMoreRef.current || skipBottomScrollRef.current) {
      skipBottomScrollRef.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [
    activeJob?.steps.length,
    activeJob?.updated_at,
    isLoadingMore,
    isThinking,
    lastMessage?.id,
    responseError
  ]);

  if (isLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
        <MessagesLoading />
      </div>
    );
  }

  if (visibleMessages.length === 0 && !isThinking) {
    return (
      <div className="min-h-0 flex-1 px-4 py-4">
        <EmptyState
          onSelectPrompt={onSelectPrompt}
          title={emptyTitle}
          description={emptyDescription}
          suggestedPrompts={suggestedPrompts}
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const top = event.currentTarget.scrollTop;
          if (top < previousScrollTopRef.current && top <= 120) loadMore();
          if (
            top > previousScrollTopRef.current &&
            top + event.currentTarget.clientHeight >=
              event.currentTarget.scrollHeight - 120
          )
            loadNewer();
          previousScrollTopRef.current = top;
        }}
        className="workflow-chat-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [overflow-anchor:none]"
      >
        {hasMoreMessages && onLoadMore ? (
          <div className="mb-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingMore}
              onClick={loadMore}
              className="gap-2 rounded-full text-xs"
            >
              {isLoadingMore && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {isLoadingMore
                ? "Loading older messages..."
                : "Load older messages"}
            </Button>
          </div>
        ) : null}
        {visibleMessages.map((message, index) => {
          if (message.role === "user") {
            return (
              <div
                key={message.id}
                className={cn(
                  "mb-4 flex justify-end",
                  additionalMessageIds?.has(message.id) &&
                    "animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl bg-primary-600 px-3.5 py-2.5 text-white shadow-sm",
                    compact
                      ? "text-[11px] leading-relaxed"
                      : "text-sm leading-6"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-[14px]">
                    {message.content}
                  </p>
                  {message.skillIds?.length ? (
                    <SkillChips
                      skillIds={message.skillIds}
                      skillTitles={skillTitles}
                      isUser
                    />
                  ) : null}
                  {message.attachments?.length ? (
                    <AttachmentChips attachments={message.attachments} isUser />
                  ) : null}
                </div>
              </div>
            );
          }

          // Options stay clickable only while they are the live question; once
          // any newer message exists the card becomes a read-only record.
          const answered = visibleMessages
            .slice(index + 1)
            .some((item) => item.role === "user");
          const selectedOptionId = answered
            ? message.options?.find(
                (option) =>
                  option.label ===
                  visibleMessages
                    .slice(index + 1)
                    .find((item) => item.role === "user")
                    ?.content.trim()
              )?.id
            : undefined;

          return (
            <div
              key={message.id}
              className={cn(
                "mb-4 space-y-1.5",
                (additionalMessageIds?.has(message.id) ||
                  index === visibleMessages.length - 1) &&
                  "animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
              )}
            >
              <div className="flex items-center gap-2">
                <AssistantAvatar />
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {ASSISTANT_NAME}
                </span>
              </div>
              <div className="ml-8 rounded-xl bg-gray-50 px-3.5 py-2.5">
                <MarkdownPreview
                  content={message.content}
                  compact={compact}
                  className={cn(
                    "text-gray-700",
                    compact
                      ? "!text-[14px] !leading-relaxed"
                      : "!text-sm !leading-6"
                  )}
                />
                {message.skillIds?.length ? (
                  <SkillChips
                    skillIds={message.skillIds}
                    skillTitles={skillTitles}
                  />
                ) : null}
                {message.attachments?.length ? (
                  <AttachmentChips attachments={message.attachments} />
                ) : null}
                {message.memos?.length ? (
                  <MemoCards memos={message.memos} onOpen={onOpenMemo} />
                ) : null}
                {message.options?.length ? (
                  <MessageOptions
                    options={message.options}
                    disabled={isThinking || answered}
                    selectedId={selectedOptionId}
                    onSelect={onSelectOption}
                    onSendOther={onSendOther}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
        {hasNewerMessages && onLoadNewer ? (
          <div className="mb-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingNewer}
              onClick={loadNewer}
              className="gap-2 rounded-full text-xs"
            >
              {isLoadingNewer && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {isLoadingNewer
                ? "Loading newer messages..."
                : "Load newer messages"}
            </Button>
          </div>
        ) : null}
        <div
          aria-hidden={!isThinking}
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-500 ease-out",
            isThinking
              ? "mb-4 grid-rows-[1fr] opacity-100"
              : "mb-0 grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={cn(
                "transition-transform duration-500 ease-out",
                isThinking ? "translate-y-0" : "translate-y-2"
              )}
            >
              <ThinkingBubble
                job={activeJob}
                compact={compact}
                onCancel={isThinking ? onCancel : undefined}
                isCancelling={isCancelling}
                cancelDisabled={cancelDisabled}
              />
            </div>
          </div>
        </div>
        <div ref={bottomRef} className="h-px" aria-hidden="true" />
      </div>
      {!isThinking && responseError ? (
        <div
          role="alert"
          className="mx-4 mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-red-600 bg-red-600/10 p-3 text-xs leading-4 text-red-600"
        >
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 space-y-0.5 wrap-break-word">
            <p className="text-xs font-medium leading-4">
              There was an error generating a response
            </p>
            <p className="text-xs leading-4 opacity-80">
              {responseError.message ||
                (canRegenerate
                  ? "Retry to send it again or regenerate response."
                  : "Please try sending a new message.")}
            </p>
          </div>
          {canRegenerate ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRegenerate}
              className="h-7 gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-normal leading-4 text-white hover:bg-red-700"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Regenerate Response
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
