import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiAssistantPanel } from "./AiAssistantPanel";
import { useAiAssistantStore } from "@/stores/ai-assistant-store";
import type { AiAssistantMessage, WorkflowChatJob } from "./types";

const {
  cancel,
  captureMessages,
  captureMemoBrowser,
  createSession,
  watchJob,
  info
} = vi.hoisted(() => ({
  cancel: vi.fn(),
  captureMessages: vi.fn<
    (props: { onCancel: () => void; isThinking: boolean }) => null
  >(() => null),
  captureMemoBrowser: vi.fn<
    (props: {
      projectComposer: React.ReactElement<{
        compact: boolean;
        projectSelectionEnabled: boolean;
        onSend: (
          content: string,
          attachments: unknown[],
          projectId: string | null,
          skillIds: string[]
        ) => void;
      }>;
    }) => null
  >(() => null),
  createSession: vi.fn(() => new Promise(() => {})),
  watchJob:
    vi.fn<
      (
        jobId: string,
        options: { onJob: (job: WorkflowChatJob) => void }
      ) => void
    >(),
  info: vi.fn()
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: "user-1" } })
}));
vi.mock("@/stores/ai-assistant-store", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/stores/ai-assistant-store")>();
  return {
    ...actual,
    useAiAssistantStore: Object.assign(
      (
        selector: (
          state: ReturnType<typeof actual.useAiAssistantStore.getState>
        ) => unknown
      ) => selector(actual.useAiAssistantStore.getState()),
      actual.useAiAssistantStore
    )
  };
});
vi.mock("sonner", () => ({ toast: { info, error: vi.fn() } }));
vi.mock("@/components/ConfirmationModal", () => ({ default: () => null }));
vi.mock("./AiAssistantHistory", () => ({ AiAssistantHistory: () => null }));
vi.mock("./AiAssistantMemos", () => ({
  MemoBrowser: captureMemoBrowser,
  MemoDetail: () => null
}));
vi.mock("./AiAssistantSkills", () => ({ SkillBrowser: () => null }));
vi.mock("./AiAssistantMessages", () => ({
  AiAssistantMessages: captureMessages
}));
vi.mock("./AiAssistantComposer", () => ({ AiAssistantComposer: () => null }));
vi.mock("./useAiAssistantChat", () => {
  const refetch = () => Promise.resolve({});
  const mutation = () => ({ isPending: false });
  return {
    aiAssistantChatKeys: {},
    useCancelWorkflowChatJob: () => ({ mutateAsync: cancel, isPending: false }),
    useCreateAiAssistantSession: () => ({
      mutateAsync: createSession,
      isPending: false
    }),
    useSendAiAssistantMessage: mutation,
    useUpdateAiAssistantSession: mutation,
    useDeleteAiAssistantSession: mutation,
    useGetAiAssistantSession: () => ({ refetch }),
    useGetAiAssistantSessions: () => ({
      data: {
        pages: [{ data: { items: [{ id: "session-1" }], total_count: 1 } }]
      },
      isSuccess: true,
      refetch
    }),
    useGetAiAssistantMessages: () => ({ refetch }),
    useWorkflowChatJob: watchJob
  };
});

const scope = "user-1:synergy-intelegence";
const message: AiAssistantMessage = {
  id: "message-1",
  role: "user",
  content: "Review the report",
  createdAt: "2026-10-28T00:00:00Z"
};
const job: WorkflowChatJob = {
  job_id: "job-1",
  session_id: "session-1",
  tenant_id: "tenant-1",
  user_id: "user-1",
  state: "running",
  steps: [],
  cancel_requested: false
};

function renderPanel() {
  renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <AiAssistantPanel
        open
        embedded
        source="synergy-intelegence"
        initialActiveSessionId="session-1"
      />
    </QueryClientProvider>
  );
  return captureMessages.mock.lastCall![0];
}

function pendingRequest() {
  return useAiAssistantStore.getState().pendingSessionRequests[
    `${scope}:session-1`
  ];
}

function deferredCancel() {
  let resolve!: () => void;
  cancel.mockReturnValue(
    new Promise<void>((done) => {
      resolve = done;
    })
  );
  return resolve;
}

describe("panel cancellation lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cancel.mockReset();
    useAiAssistantStore.setState({
      pendingSessionRequests: {},
      newChatRequests: {}
    });
    useAiAssistantStore
      .getState()
      .beginSessionRequest(scope, "session-1", message, 1, "job-1");
  });

  it("clears the pending request only after cancellation succeeds", async () => {
    const resolve = deferredCancel();
    renderPanel().onCancel();
    expect(cancel).toHaveBeenCalledExactlyOnceWith("job-1");
    expect(pendingRequest()).toBeDefined();
    resolve();
    await vi.waitFor(() => expect(pendingRequest()).toBeUndefined());
    expect(info).toHaveBeenCalledOnce();
    expect(renderPanel().isThinking).toBe(false);
  });

  it("keeps the chat requesting after a failed cancellation", async () => {
    cancel.mockRejectedValue(new Error("Network unavailable"));
    renderPanel().onCancel();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(pendingRequest()?.jobId).toBe("job-1");
    expect(info).not.toHaveBeenCalled();
    expect(renderPanel().isThinking).toBe(true);
  });

  it("does not submit duplicate cancellation requests", () => {
    deferredCancel();
    const { onCancel } = renderPanel();
    onCancel();
    onCancel();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("handles a cancelled socket event before the HTTP response only once", async () => {
    const resolve = deferredCancel();
    renderPanel().onCancel();
    watchJob.mock.lastCall![1].onJob({ ...job, state: "cancelled" });
    expect(pendingRequest()).toBeUndefined();
    resolve();
    await new Promise<void>((done) => setTimeout(done, 0));
    expect(info).toHaveBeenCalledOnce();
  });

  it("does not clear a newer request when an old cancel response arrives", async () => {
    const resolve = deferredCancel();
    renderPanel().onCancel();
    watchJob.mock.lastCall![1].onJob({ ...job, state: "cancelled" });
    useAiAssistantStore
      .getState()
      .beginSessionRequest(scope, "session-1", message, 2, "job-2");
    resolve();
    await new Promise<void>((done) => setTimeout(done, 0));
    expect(pendingRequest()?.jobId).toBe("job-2");
    expect(info).toHaveBeenCalledOnce();
  });

  it("keeps a completed response when completion wins the cancellation race", async () => {
    const resolve = deferredCancel();
    renderPanel().onCancel();
    watchJob.mock.lastCall![1].onJob({ ...job, state: "succeeded" });
    resolve();
    await vi.waitFor(() => expect(pendingRequest()).toBeUndefined());
    expect(info).not.toHaveBeenCalled();
  });
});

describe("project overview composer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiAssistantStore.setState({
      pendingSessionRequests: {},
      newChatRequests: {}
    });
  });

  it("starts a chat in the selected project with attachments and skills", () => {
    renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <AiAssistantPanel
          open
          embedded
          source="synergy-intelegence"
          projects={[{ id: "project-1", title: "Project A", count_file: 0 }]}
          projectIds={["project-1"]}
        />
      </QueryClientProvider>
    );

    const composer = captureMemoBrowser.mock.lastCall![0].projectComposer.props;
    expect(composer.compact).toBe(true);
    expect(composer.projectSelectionEnabled).toBe(false);
    composer.onSend(
      "Review the report",
      [{ id: "file-1", name: "report.pdf", status: "complete", fileId: "file-1" }],
      null,
      ["skill-1"]
    );

    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Review the report",
        projects: ["project-1"],
        files: ["file-1"],
        skill_ids: ["skill-1"]
      })
    );
  });
});
