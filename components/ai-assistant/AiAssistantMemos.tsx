"use client";

import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  Bold,
  ChevronDown,
  ChevronLeft,
  FileText,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  MessageSquare,
  NotebookPen,
  Search,
  Trash2,
  Underline
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  useDeleteKnowledgeMemo,
  useGetKnowledgeMemo,
  useGetKnowledgeMemos,
  useUpdateKnowledgeMemo,
  type KnowledgeMemo
} from "./useKnowledgeMemos";
import type { WorkflowChatSession } from "@/app/app/ai-studio/workflow/types";

type MemoTab = "chat" | "memos";

/** "Last modified Today" style label from an ISO timestamp. */
function formatModified(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (date.toDateString() === new Date().toDateString()) return "Today";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

/** Debounces a rapidly changing value (e.g. search input) before a query. */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Download the memo markdown as a .md file (no backend endpoint needed). */
function downloadMemo(memo: { title: string; content: string }) {
  const blob = new Blob([memo.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${memo.title || "memo"}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function MemoList({
  memos,
  isLoading,
  onOpen,
  onDelete
}: {
  memos: KnowledgeMemo[];
  isLoading: boolean;
  onOpen: (memo: KnowledgeMemo) => void;
  onDelete: (memo: KnowledgeMemo) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (memos.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-400">No memos found.</p>
    );
  }
  return (
    <div className="h-full overflow-y-auto px-8 py-5">
      <div className="grid gap-4 md:grid-cols-2">
        {memos.map((memo) => (
          <div
            key={memo.id}
            className="flex min-h-20 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-sm"
          >
            <button
              type="button"
              onClick={() => onOpen(memo)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <FileText className="h-5 w-5 shrink-0 text-gray-700" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {memo.title}
                </span>
                <span className="mt-1 block text-xs text-gray-400">
                  Last modified {formatModified(memo.updated_at)}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label={`Delete ${memo.title}`}
              onClick={() => onDelete(memo)}
              className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const EDITOR_TOOLBAR = [
  { icon: ChevronDown, label: "Block type" },
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Underline, label: "Underline" },
  { icon: List, label: "Bullet list" },
  { icon: ListOrdered, label: "Numbered list" },
  { icon: Link2, label: "Link" },
  { icon: AlignLeft, label: "Align left" },
  { icon: AlignCenter, label: "Align center" },
  { icon: AlignJustify, label: "Justify" },
  { icon: Maximize2, label: "Expand" }
] as const;

/**
 * Memo detail screen: read-only markdown with Edit / Download / Delete, or an
 * inline editor (title input + markdown textarea) while editing.
 */
export function MemoDetail({
  folderId,
  memoId,
  onBack
}: {
  folderId: string | null;
  memoId: string;
  onBack: () => void;
}) {
  const memoQuery = useGetKnowledgeMemo(folderId, memoId);
  const updateMemo = useUpdateKnowledgeMemo(folderId);
  const deleteMemo = useDeleteKnowledgeMemo(folderId);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const memo = memoQuery.data?.data;

  if (!folderId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8">
        <p className="text-sm text-gray-500">
          This memo link does not include a project folder.
        </p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to projects
        </Button>
      </div>
    );
  }

  const startEditing = () => {
    setTitle(memo?.title ?? "");
    setContent(memo?.content ?? "");
    setIsEditing(true);
  };

  const save = () => {
    if (!memo || !title.trim()) return;
    updateMemo.mutate(
      {
        memoId: memo.id,
        title: title.trim(),
        content,
        expected_revision: memo.revision
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  if (memoQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8">
        <p className="text-sm text-gray-500">Memo not found.</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to memos
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 px-8 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to memos"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
          {memo.title}
        </h2>
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={updateMemo.isPending}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateMemo.isPending || !title.trim()}
              onClick={() => void save()}
            >
              {updateMemo.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={startEditing}>
              Edit
            </Button>
            <Button size="sm" onClick={() => downloadMemo(memo)}>
              Download
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {isEditing ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-8 py-5">
          <label className="block shrink-0">
            <span className="text-xs font-medium text-gray-500">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-gray-200 bg-white px-2 py-1.5">
            <span className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600">
              Paragraph
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
            <span className="mx-1.5 h-5 w-px bg-gray-200" />
            {EDITOR_TOOLBAR.map(({ icon: Icon, label }) => (
              <span
                key={label}
                title={label}
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="min-h-0 flex-1 rounded-xl border border-gray-200 bg-white">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              aria-label="Memo content"
              className="h-full min-h-[320px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-gray-800 outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
          <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white px-5 py-4">
            <MarkdownPreview
              content={memo.content}
              className="!text-[15px] !leading-7 text-gray-700"
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMemo.isPending) setConfirmDelete(false);
        }}
        title="Delete memo?"
        description={`Are you sure you want to delete "${memo.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMemo.isPending}
        onConfirm={() => deleteMemo.mutate(memo.id, { onSuccess: onBack })}
      />
    </div>
  );
}

type MemoBrowserProps = {
  folderId: string;
  folderTitle: string;
  initialMemoId?: string | null;
  onOpenMemo?: (memoId: string) => void;
  onCloseMemo?: () => void;
  onBack: () => void;
  onNewChat: () => void;
  /** Chat tab content rendered by the parent panel. */
  chat: React.ReactNode;
  /** Composer shown above the project tabs. */
  projectComposer?: React.ReactNode;
  /** Start on the chat tab when a session is already active. */
  chatTabActive?: boolean;
  /** Folder-scoped chat sessions (GET /workflow/chat/sessions?folder_id=). */
  sessions: WorkflowChatSession[];
  sessionsLoading?: boolean;
  activeSessionId?: string | null;
  onSelectSession: (sessionId: string) => void;
  /** Clears the active session so the chat tab shows the session list again. */
  onExitSession: () => void;
  /**
   * Bumped by the panel whenever a "New Chat" action runs (workspace header
   * or history sidebar) so the conversation view opens from any entry point.
   */
  newChatCount?: number;
};

function SessionList({
  sessions,
  isLoading,
  onOpen
}: {
  sessions: WorkflowChatSession[];
  isLoading: boolean;
  onOpen: (sessionId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-400">
        No conversations yet. Start a new chat to begin.
      </p>
    );
  }
  return (
    <div className="h-full overflow-y-auto px-8 py-5">
      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex min-h-20 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-sm"
          >
            <button
              type="button"
              onClick={() => onOpen(session.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <MessageSquare className="h-5 w-5 shrink-0 text-gray-700" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {session.title || "Untitled Chat"}
                </span>
                <span className="mt-1 block text-xs text-gray-400">
                  Last modified {formatModified(session.updated_at)}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Project workspace for the Synergy Intelligence flow: a Chat / Memos tab bar
 * over the selected knowledge folder. The Chat tab lists the folder's sessions
 * (GET /workflow/chat/sessions?folder_id=) and opens a full-area conversation;
 * the Memos tab lists the folder's memos with a detail view per memo.
 */
export function MemoBrowser({
  folderId,
  folderTitle,
  initialMemoId = null,
  onOpenMemo,
  onCloseMemo,
  onBack,
  onNewChat,
  chat,
  projectComposer,
  chatTabActive = false,
  sessions,
  sessionsLoading = false,
  activeSessionId = null,
  onSelectSession,
  onExitSession,
  newChatCount = 0
}: MemoBrowserProps) {
  const [tab, setTab] = useState<MemoTab>(chatTabActive ? "memos" : "chat");
  const [chatOpen, setChatOpen] = useState(chatTabActive);
  const [search, setSearch] = useState("");
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(
    initialMemoId
  );
  const [deletingMemo, setDeletingMemo] = useState<KnowledgeMemo | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const memosQuery = useGetKnowledgeMemos(folderId, debouncedSearch);
  const deleteMemo = useDeleteKnowledgeMemo(folderId);

  // Opening a session from the left history sidebar jumps straight into the
  // conversation, bypassing the session list.
  useEffect(() => {
    if (chatTabActive)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChatOpen(true);
  }, [chatTabActive]);

  // A "New Chat" action (workspace header or history sidebar) routes straight
  // into the conversation view instead of staying on the session list.
  useEffect(() => {
    if (newChatCount === 0) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setChatOpen(true);
    setTab("chat");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [newChatCount]);

  if (selectedMemoId) {
    return (
      <MemoDetail
        folderId={folderId}
        memoId={selectedMemoId}
        onBack={() => {
          setSelectedMemoId(null);
          onCloseMemo?.();
        }}
      />
    );
  }

  // Open conversation — tabs are hidden, like a regular chat view.
  if (chatOpen) {
    const activeSession = sessions.find(
      (session) => session.id === activeSessionId
    );
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 px-8 pt-5">
          <button
            type="button"
            onClick={() => {
              onExitSession();
              setChatOpen(false);
            }}
            aria-label="Back to conversations"
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
            {activeSession?.title || "New Chat"}
          </h2>
        </div>
        {chat}
      </div>
    );
  }

  const memos = memosQuery.data?.data?.items ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 px-8 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to projects"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
          {folderTitle}
        </h2>
        {tab === "memos" && (
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <span className="sr-only">Search by name</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name"
              className="h-9 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
            />
          </label>
        )}
      </div>

      {projectComposer && (
        <div className="shrink-0 px-8 pb-5 pt-10">{projectComposer}</div>
      )}

      <div className="shrink-0 px-8 pt-4">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(
            [
              { id: "chat", label: "Chat", icon: MessageSquare },
              { id: "memos", label: "Memos", icon: NotebookPen }
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm transition-colors",
                tab === id
                  ? "bg-white font-medium text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "chat" ? (
          <SessionList
            sessions={sessions}
            isLoading={sessionsLoading}
            onOpen={onSelectSession}
          />
        ) : (
          <MemoList
            memos={memos}
            isLoading={memosQuery.isLoading}
            onOpen={(memo) => {
              setSelectedMemoId(memo.id);
              onOpenMemo?.(memo.id);
            }}
            onDelete={(memo) => setDeletingMemo(memo)}
          />
        )}
      </div>

      <ConfirmationModal
        open={Boolean(deletingMemo)}
        onOpenChange={(open) => {
          if (!open && !deleteMemo.isPending) setDeletingMemo(null);
        }}
        title="Delete memo?"
        description={`Are you sure you want to delete "${
          deletingMemo?.title ?? "this memo"
        }"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMemo.isPending}
        onConfirm={() => {
          if (!deletingMemo) return;
          deleteMemo.mutate(deletingMemo.id, {
            onSuccess: () => {
              setDeletingMemo(null);
              if (selectedMemoId === deletingMemo.id) setSelectedMemoId(null);
            }
          });
        }}
      />
    </div>
  );
}
