import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { WorkflowChatSession } from "@/app/app/ai-studio/workflow/types";
import { AiAssistantHistory } from "./AiAssistantHistory";

const session: WorkflowChatSession = {
  id: "session-1",
  user_id: "user-1",
  title: "Report review",
  metadata: {},
  created_at: "2026-11-03T00:00:00Z",
  updated_at: "2026-11-03T00:00:00Z",
  notification: true
};

function renderHistory(
  notification: boolean | undefined,
  activeSessionId: string | null = null
) {
  return renderToStaticMarkup(
    <AiAssistantHistory
      open
      sessions={[{ ...session, notification }]}
      activeSessionId={activeSessionId}
      hasMore={false}
      isLoadingMore={false}
      onLoadMore={vi.fn()}
      onClose={vi.fn()}
      onSelect={vi.fn()}
      onNewChat={vi.fn()}
      onRename={vi.fn()}
      onDelete={vi.fn()}
    />
  );
}

describe("conversation history notifications", () => {
  it("shows the red dot for an unopened conversation with a notification", () => {
    expect(renderHistory(true)).toContain('aria-label="New notification"');
  });

  it("hides the red dot when the conversation is already open", () => {
    expect(renderHistory(true, session.id)).not.toContain(
      'aria-label="New notification"'
    );
    expect(session.notification).toBe(true);
  });

  it("keeps notifications on other conversations when one is open", () => {
    expect(renderHistory(true, "session-2")).toContain(
      'aria-label="New notification"'
    );
  });

  it.each([false, undefined])(
    "does not show a red dot when notification is %s",
    (notification) => {
      expect(renderHistory(notification)).not.toContain(
        'aria-label="New notification"'
      );
    }
  );
});
