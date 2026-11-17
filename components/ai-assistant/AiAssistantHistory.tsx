"use client";

import {
  Clock2,
  Clock3,
  Folder,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  SquareSlashIcon,
  Trash2
} from "lucide-react";
import { useMemo, useState } from "react";

import type { WorkflowChatSession } from "@/app/app/ai-studio/workflow/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatRelative(iso: string) {
  const diffMinutes = Math.round(
    (Date.now() - new Date(iso).getTime()) / 60_000
  );
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)}h ago`;
  return `${Math.round(diffMinutes / (60 * 24))}d ago`;
}

type AiAssistantHistoryProps = {
  open: boolean;
  sessions: WorkflowChatSession[];
  activeSessionId: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onClose: () => void;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onRename: (sessionId: string, title: string) => void;
  onDelete: (sessionId: string) => void;
  embedded?: boolean;
  responsive?: boolean;
  scheduledActive?: boolean;
  onShowScheduled?: () => void;
  showProjects?: boolean;
  projectsActive?: boolean;
  onShowProjects?: () => void;
  showSkills?: boolean;
  skillsActive?: boolean;
  onShowSkills?: () => void;
};

/**
 * Conversation list that slides over the left edge of the chat panel. Kept
 * inside the panel so the drawer stays a single, self-contained surface.
 */
export function AiAssistantHistory({
  open,
  sessions,
  activeSessionId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onClose,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  embedded = false,
  responsive = false,
  scheduledActive = false,
  onShowScheduled,
  showProjects = false,
  projectsActive = false,
  onShowProjects = () => undefined,
  showSkills = false,
  skillsActive = false,
  onShowSkills = () => undefined
}: AiAssistantHistoryProps) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [readSessionIds, setReadSessionIds] = useState(
    () => new Set(activeSessionId ? [activeSessionId] : [])
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? sessions.filter((session) =>
          session.title.toLowerCase().includes(query)
        )
      : sessions;
  }, [search, sessions]);

  const commitRename = (session: WorkflowChatSession) => {
    const title = draftTitle.trim();
    setEditingId(null);
    if (title && title !== session.title) onRename(session.id, title);
  };

  return (
    <>
      {!embedded && (
        <button
          type="button"
          aria-hidden={!open}
          tabIndex={-1}
          onClick={onClose}
          className={cn(
            "absolute inset-0 z-10 cursor-default bg-gray-900/10 transition-opacity duration-200",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />
      )}

      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out",
          embedded || open ? "translate-x-0" : "-translate-x-full",
          embedded && responsive && "hidden md:flex"
        )}
      >
        <div className="space-y-2 p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-500"
          >
            <Plus className="h-3.5 w-3.5" /> New chat
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              className="h-8 w-full rounded-lg border border-gray-200 pl-8 pr-2 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-300"
            />
          </div>
        </div>

        {(showProjects || showSkills || onShowScheduled) && (
          <div className="space-y-0.5 border-b border-gray-100 px-2 pb-3">
            {showProjects && (
              <button
                type="button"
                onClick={onShowProjects}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50",
                  projectsActive && "bg-gray-100"
                )}
              >
                <Folder className="h-4 w-4" /> Projects
              </button>
            )}
            {showSkills && (
              <button
                type="button"
                onClick={onShowSkills}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50",
                  skillsActive && "bg-gray-100"
                )}
              >
                <SquareSlashIcon className="h-4 w-4" /> Skills
              </button>
            )}
            {onShowScheduled && (
              <button
                type="button"
                onClick={onShowScheduled}
                aria-current={scheduledActive ? "page" : undefined}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50",
                  scheduledActive && "bg-gray-100"
                )}
              >
                <Clock3 className="h-4 w-4" /> Scheduled
              </button>
            )}
          </div>
        )}

        <p className="px-4 pb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Recent
        </p>

        <div
          onScroll={(event) => {
            const { scrollTop, clientHeight, scrollHeight } =
              event.currentTarget;
            if (
              hasMore &&
              !isLoadingMore &&
              scrollTop + clientHeight >= scrollHeight - 120
            ) {
              onLoadMore();
            }
          }}
          className="workflow-chat-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 pb-3"
        >
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-gray-400">
              No conversations found
            </p>
          )}
          {filtered.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center rounded-lg transition-colors hover:bg-gray-50",
                activeSessionId === session.id && "bg-primary-50/70"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setReadSessionIds((previous) =>
                    new Set(previous).add(session.id)
                  );
                  onSelect(session.id);
                }}
                className="min-w-0 flex-1 px-2.5 py-2 text-left"
              >
                {editingId === session.id ? (
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onBlur={() => commitRename(session)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitRename(session);
                      }
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="block h-6 w-full rounded border border-primary-300 px-1 text-xs text-gray-800 outline-none"
                  />
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    {session.is_scheduled_task && (
                      <Clock2
                        className="h-3.5 w-3.5 shrink-0 text-gray-400"
                        aria-label="Scheduled task"
                      />
                    )}
                    <span className="truncate">{session.title}</span>
                  </span>
                )}

                <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-gray-400">
                  <span className="truncate">
                    {session.project_names?.join(", ") || "No project"}
                  </span>
                  <span className="shrink-0">
                    {formatRelative(session.updated_at || session.created_at)}
                  </span>
                </span>
              </button>

              {session.notification &&
                activeSessionId !== session.id &&
                !readSessionIds.has(session.id) && (
                  <span
                    className="mr-1 h-2 w-2 shrink-0 rounded-full bg-red-500"
                    role="img"
                    aria-label="New notification"
                  />
                )}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions for ${session.title}`}
                    className="mr-1 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="start"
                  className="w-36"
                >
                  <DropdownMenuItem
                    onSelect={() => {
                      setDraftTitle(session.title);
                      setEditingId(session.id);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onDelete(session.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {isLoadingMore && (
            <div
              className="flex justify-center py-3"
              role="status"
              aria-label="Loading more conversations"
            >
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
