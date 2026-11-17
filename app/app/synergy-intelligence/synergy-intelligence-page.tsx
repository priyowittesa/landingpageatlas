"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AiAssistantPanel } from "@/components/ai-assistant/AiAssistantPanel";
import { ScheduledTasks } from "./scheduled-tasks";
import {
  extractFolders,
  useKnowledgeApi
} from "@/app/app/ai-studio/atlas-knowledge-source/use-knowledge";

const SYNERGY_PROMPTS: string[] = [];
const SYNERGY_PATH = "/app/synergy-intelligence";

function routePart(value: string) {
  return encodeURIComponent(value);
}

type SynergyIntelligencePageProps = {
  initialProjectId?: string | null;
  initialSessionId?: string | null;
  initialMemoId?: string | null;
  initialNewChat?: boolean;
  initialSkillsView?: boolean;
  initialScheduledView?: boolean;
  initialScheduledTaskId?: string | null;
};

export function SynergyIntelligencePage({
  initialProjectId = null,
  initialSessionId = null,
  initialMemoId = null,
  initialNewChat = false,
  initialSkillsView = false,
  initialScheduledView = false,
  initialScheduledTaskId = null
}: SynergyIntelligencePageProps = {}) {
  const api = useKnowledgeApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  function selectProject(id: string | null) {
    router.push(id ? `${SYNERGY_PATH}/f/${routePart(id)}` : SYNERGY_PATH);
  }

  const folders = useQuery({
    queryKey: ["synergy-intelligence", "projects"],
    queryFn: async () => extractFolders(await api.getFolders()),
    meta: { errorMessage: "Failed to load projects" }
  });
  const createFolder = useMutation({
    mutationFn: (title: string) => api.createFolder(title),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["synergy-intelligence", "projects"]
      }),
    meta: {
      errorMessage: "Failed to create project",
      successMessage: "Project created successfully"
    }
  });
  const renameFolder = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.renameFolder(id, title),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["synergy-intelligence", "projects"]
      }),
    meta: {
      errorMessage: "Failed to update project",
      successMessage: "Project updated successfully"
    }
  });
  const deleteFolder = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: (_, id) => {
      if (initialProjectId === id) selectProject(null);
      return queryClient.invalidateQueries({
        queryKey: ["synergy-intelligence", "projects"]
      });
    },
    meta: {
      errorMessage: "Failed to delete project",
      successMessage: "Project deleted successfully"
    }
  });

  return (
    <AiAssistantPanel
      open
      embedded
      source="synergy-intelegence"
      title="Synergy Intelligence"
      emptyTitle="What should we work on?"
      emptyDescription="Ask about synergy reports, risks, maintenance, or project performance."
      suggestedPrompts={SYNERGY_PROMPTS}
      projects={folders.data ?? []}
      projectsLoading={folders.isLoading}
      projectIds={initialProjectId ? [initialProjectId] : []}
      initialActiveSessionId={initialSessionId}
      initialMemoId={initialMemoId}
      initialNewChat={initialNewChat}
      initialSkillsView={initialSkillsView}
      workspace={
        initialScheduledView ? (
          <ScheduledTasks
            projects={folders.data ?? []}
            taskId={initialScheduledTaskId}
          />
        ) : undefined
      }
      workspaceFullscreen={Boolean(initialScheduledTaskId)}
      onShowScheduled={() => router.push(`${SYNERGY_PATH}/scheduled`)}
      onSelectProject={selectProject}
      onShowSkills={() => router.push(`${SYNERGY_PATH}/skills`)}
      onOpenSession={(sessionId, folderId, options) => {
        const path = `${SYNERGY_PATH}/c/${routePart(sessionId)}${
          folderId ? `/${routePart(folderId)}` : ""
        }`;
        if (options?.preserveState) {
          if (options.pushState) {
            window.history.pushState(window.history.state, "", path);
          } else {
            window.history.replaceState(window.history.state, "", path);
          }
          return;
        }
        router.push(path);
      }}
      onSessionUnavailable={(folderId) =>
        router.replace(
          folderId ? `${SYNERGY_PATH}/f/${routePart(folderId)}` : SYNERGY_PATH
        )
      }
      onOpenMemo={(memoId, folderId) =>
        router.push(
          `${SYNERGY_PATH}/m/${routePart(memoId)}${
            folderId ? `/${routePart(folderId)}` : ""
          }`
        )
      }
      onOpenNewChat={(folderId) =>
        router.push(
          `${SYNERGY_PATH}/c/new${folderId ? `/${routePart(folderId)}` : ""}`
        )
      }
      onCreateProject={(title) =>
        createFolder.mutateAsync(title).then(() => undefined)
      }
      onRenameProject={(id, title) =>
        renameFolder.mutateAsync({ id, title }).then(() => undefined)
      }
      onDeleteProject={(id) =>
        deleteFolder.mutateAsync(id).then(() => undefined)
      }
    />
  );
}
