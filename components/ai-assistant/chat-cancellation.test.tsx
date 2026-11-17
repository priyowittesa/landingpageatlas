import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AiAssistantComposer } from "./AiAssistantComposer";
import { AiAssistantMessages } from "./AiAssistantMessages";
import { useCancelWorkflowChatJob } from "./useAiAssistantChat";
import type { AiAssistantMessage, WorkflowChatJob } from "./types";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/lib/axios", () => ({
  axiosConfig: () => ({ post })
}));
vi.mock("@/lib/env", () => ({
  env: { apiBaseUrl: "https://api.example.test" }
}));
vi.mock("@/components/markdown-preview", () => ({
  MarkdownPreview: () => null
}));
vi.mock("./ChatFileChips", () => ({
  ChatFileChips: () => null
}));
vi.mock("./useSpeechToText", () => ({
  useSpeechToText: () => ({})
}));
vi.mock("./useWorkflowSkills", () => ({
  useGetWorkflowSkills: () => ({
    data: {
      data: { items: [{ id: "skill-1", title: "Research", source: "tenant" }] }
    }
  })
}));

const message: AiAssistantMessage = {
  id: "user-1",
  role: "user",
  content: "Review this report",
  createdAt: "2026-10-28T00:00:00Z",
  attachments: [{ id: "file-1", name: "report.pdf", size: 123 }],
  skillIds: ["skill-1"]
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

function cancelButton(markup: string) {
  return markup.match(/<button[^>]*aria-label="Cancel response"[^>]*>/)?.[0];
}

describe("chat cancellation controls", () => {
  it.each(["queued", "running"] as const)(
    "offers cancellation while %s",
    (state) => {
      const markup = renderToStaticMarkup(
        <AiAssistantMessages
          messages={[message]}
          isThinking
          activeJob={{ ...job, state }}
          onCancel={vi.fn()}
          onSelectPrompt={vi.fn()}
        />
      );
      expect(cancelButton(markup)).toBeDefined();
      expect(cancelButton(markup)).not.toContain('disabled=""');
    }
  );

  it("disables cancellation while waiting for the job ID", () => {
    const markup = renderToStaticMarkup(
      <AiAssistantMessages
        messages={[message]}
        isThinking
        onCancel={vi.fn()}
        cancelDisabled
        onSelectPrompt={vi.fn()}
      />
    );
    expect(cancelButton(markup)).toContain('disabled=""');
  });

  it.each([false, true])(
    "shows a disabled cancelling state (server requested: %s)",
    (requested) => {
      const markup = renderToStaticMarkup(
        <AiAssistantMessages
          messages={[message]}
          isThinking
          activeJob={{ ...job, cancel_requested: requested }}
          onCancel={vi.fn()}
          isCancelling={!requested}
          onSelectPrompt={vi.fn()}
        />
      );
      expect(cancelButton(markup)).toContain('disabled=""');
      expect(markup).toContain("Cancelling...");
    }
  );

  it("removes the cancel action when the thinking bubble closes", () => {
    const markup = renderToStaticMarkup(
      <AiAssistantMessages
        messages={[message]}
        isThinking={false}
        activeJob={{ ...job, state: "cancelled" }}
        onCancel={vi.fn()}
        onSelectPrompt={vi.fn()}
      />
    );
    expect(cancelButton(markup)).toBeUndefined();
    expect(markup).toContain(message.content);
  });

  it("restores the prompt, uploaded files and skills in the composer", () => {
    const markup = renderToStaticMarkup(
      <AiAssistantComposer
        initialMessage={message}
        value={message.content}
        onValueChange={vi.fn()}
        onSend={vi.fn()}
        skillsEnabled
      />
    );
    expect(markup).toContain(message.content);
    expect(markup).toContain("report.pdf");
    expect(markup).toContain("Research");
    expect(markup).not.toContain("Uploading");
  });

  it("renders the compact project composer without the footer hint", () => {
    const markup = renderToStaticMarkup(
      <AiAssistantComposer
        compact
        value=""
        onValueChange={vi.fn()}
        onSend={vi.fn()}
      />
    );
    expect(markup).toContain("Ask me anything");
    expect(markup).toContain('aria-label="Start voice input"');
    expect(markup).toContain('aria-label="Send message"');
    expect(markup).not.toContain("Shift + Enter");
  });
});

describe("cancel job API", () => {
  beforeEach(() => {
    post.mockReset();
  });

  function mutation() {
    const client = new QueryClient();
    let result!: ReturnType<typeof useCancelWorkflowChatJob>;
    function Harness() {
      result = useCancelWorkflowChatJob();
      return null;
    }
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>
    );
    return result;
  }

  it("posts to the cancel endpoint without requiring a response body", async () => {
    post.mockResolvedValue({ status: 202 });
    await mutation().mutateAsync("job-1");
    expect(post).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.test/workflow/chat/jobs/job-1/cancel"
    );
  });

  it("encodes the job ID as a path segment", async () => {
    post.mockResolvedValue({ status: 202 });
    await mutation().mutateAsync("job/1");
    expect(post).toHaveBeenCalledWith(
      "https://api.example.test/workflow/chat/jobs/job%2F1/cancel"
    );
  });

  it("rejects when cancellation fails", async () => {
    const error = new Error("Cancellation unavailable");
    post.mockRejectedValue(error);
    await expect(mutation().mutateAsync("job-1")).rejects.toBe(error);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
