import { create } from "zustand";

import type { AiAssistantMessage } from "@/components/ai-assistant/types";

export type PendingSessionRequest = {
  message: AiAssistantMessage;
  userSequence: number;
  jobId?: string;
};

type NewChatRequestDetails = {
  message: AiAssistantMessage;
  title: string;
  projectId: string | null;
  userSequence: number;
};

export type NewChatRequest = NewChatRequestDetails &
  (
    | { status: "pending" }
    | {
      status: "completed";
      sessionId: string;
      folderId: string | null;
      jobId?: string;
    }
  );

type PersistedAiAssistantState = {
  pendingSessionRequests: Record<string, PendingSessionRequest>;
  newChatRequests: Record<string, NewChatRequest>;
};

type AiAssistantState = PersistedAiAssistantState & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  hydratePendingRequests: () => void;
  beginSessionRequest: (
    scope: string,
    sessionId: string,
    message: AiAssistantMessage,
    userSequence: number,
    jobId?: string
  ) => void;
  setSessionRequestJob: (
    scope: string,
    sessionId: string,
    jobId: string
  ) => void;
  endSessionRequest: (scope: string, sessionId: string) => void;
  beginNewChatRequest: (
    scope: string,
    message: AiAssistantMessage,
    title: string,
    projectId: string | null
  ) => void;
  completeNewChatRequest: (
    scope: string,
    sessionId: string,
    folderId: string | null,
    jobId?: string
  ) => void;
  clearNewChatRequest: (scope: string) => void;
};

const STORAGE_KEY = "atlas.ai-assistant.pending-requests";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPendingRequests(): PersistedAiAssistantState {
  if (typeof window === "undefined") {
    return { pendingSessionRequests: {}, newChatRequests: {} };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as
      | Partial<PersistedAiAssistantState>
      | null;
    return {
      pendingSessionRequests: isRecord(parsed?.pendingSessionRequests)
        ? (parsed.pendingSessionRequests as Record<
          string,
          PendingSessionRequest
        >)
        : {},
      newChatRequests: isRecord(parsed?.newChatRequests)
        ? (parsed.newChatRequests as Record<string, NewChatRequest>)
        : {}
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { pendingSessionRequests: {}, newChatRequests: {} };
  }
}

function savePendingRequests(state: PersistedAiAssistantState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { }
}

export function aiAssistantSessionRequestKey(
  scope: string,
  sessionId: string
) {
  return `${scope}:${sessionId}`;
}

/**
 * Global open state for the floating AI assistant so any page or header
 * control can launch it (e.g. a "Ask AI" shortcut) without prop drilling.
 */
export const useAiAssistantStore = create<AiAssistantState>((set) => ({
  isOpen: false,
  pendingSessionRequests: {},
  newChatRequests: {},
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  hydratePendingRequests: () =>
    set((state) => {
      const persisted = readPendingRequests();
      return {
        pendingSessionRequests: {
          ...persisted.pendingSessionRequests,
          ...state.pendingSessionRequests
        },
        newChatRequests: {
          ...persisted.newChatRequests,
          ...state.newChatRequests
        }
      };
    }),
  beginSessionRequest: (scope, sessionId, message, userSequence, jobId) =>
    set((state) => {
      const pendingSessionRequests = {
        ...state.pendingSessionRequests,
        [aiAssistantSessionRequestKey(scope, sessionId)]: {
          message,
          userSequence,
          jobId
        }
      };
      savePendingRequests({
        pendingSessionRequests,
        newChatRequests: state.newChatRequests
      });
      return { pendingSessionRequests };
    }),
  setSessionRequestJob: (scope, sessionId, jobId) =>
    set((state) => {
      const key = aiAssistantSessionRequestKey(scope, sessionId);
      const request = state.pendingSessionRequests[key];
      if (!request) return {};
      const pendingSessionRequests = {
        ...state.pendingSessionRequests,
        [key]: { ...request, jobId }
      };
      savePendingRequests({
        pendingSessionRequests,
        newChatRequests: state.newChatRequests
      });
      return { pendingSessionRequests };
    }),
  endSessionRequest: (scope, sessionId) =>
    set((state) => {
      const pendingSessionRequests = { ...state.pendingSessionRequests };
      delete pendingSessionRequests[
        aiAssistantSessionRequestKey(scope, sessionId)
      ];
      savePendingRequests({
        pendingSessionRequests,
        newChatRequests: state.newChatRequests
      });
      return { pendingSessionRequests };
    }),
  beginNewChatRequest: (scope, message, title, projectId) =>
    set((state) => {
      const newChatRequests = {
        ...state.newChatRequests,
        [scope]: {
          status: "pending" as const,
          message,
          title,
          projectId,
          userSequence: 1
        }
      };
      savePendingRequests({
        pendingSessionRequests: state.pendingSessionRequests,
        newChatRequests
      });
      return { newChatRequests };
    }),
  completeNewChatRequest: (scope, sessionId, folderId, jobId) =>
    set((state) => {
      const request = state.newChatRequests[scope];
      if (!request) {
        if (!jobId) return {};
        const key = aiAssistantSessionRequestKey(scope, sessionId);
        const pendingRequest = state.pendingSessionRequests[key];
        if (!pendingRequest) return {};
        const pendingSessionRequests = {
          ...state.pendingSessionRequests,
          [key]: { ...pendingRequest, jobId }
        };
        savePendingRequests({
          pendingSessionRequests,
          newChatRequests: state.newChatRequests
        });
        return { pendingSessionRequests };
      }
      const newChatRequests = {
        ...state.newChatRequests,
        [scope]: {
          ...request,
          status: "completed" as const,
          sessionId,
          folderId,
          jobId
        }
      };
      savePendingRequests({
        pendingSessionRequests: state.pendingSessionRequests,
        newChatRequests
      });
      return { newChatRequests };
    }),
  clearNewChatRequest: (scope) =>
    set((state) => {
      const newChatRequests = { ...state.newChatRequests };
      delete newChatRequests[scope];
      savePendingRequests({
        pendingSessionRequests: state.pendingSessionRequests,
        newChatRequests
      });
      return { newChatRequests };
    })
}));
