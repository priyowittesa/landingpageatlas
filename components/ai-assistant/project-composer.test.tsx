import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { MemoBrowser } from "./AiAssistantMemos";

vi.mock("@/components/ConfirmationModal", () => ({ default: () => null }));
vi.mock("@/components/markdown-preview", () => ({
  MarkdownPreview: () => null
}));
vi.mock("./useKnowledgeMemos", () => ({
  useGetKnowledgeMemos: () => ({ data: { data: { items: [] } } }),
  useDeleteKnowledgeMemo: () => ({ isPending: false }),
  useGetKnowledgeMemo: () => ({}),
  useUpdateKnowledgeMemo: () => ({})
}));

function renderProject(chatTabActive = false) {
  return renderToStaticMarkup(
    <MemoBrowser
      folderId="project-1"
      folderTitle="Project A"
      onBack={vi.fn()}
      onNewChat={vi.fn()}
      chat={<div>Conversation composer</div>}
      projectComposer={<div>Project composer</div>}
      chatTabActive={chatTabActive}
      sessions={[]}
      onSelectSession={vi.fn()}
      onExitSession={vi.fn()}
    />
  );
}

describe("project overview composer", () => {
  it("appears after the project heading and before the tabs", () => {
    const markup = renderProject();
    expect(markup.indexOf("Project A")).toBeLessThan(
      markup.indexOf("Project composer")
    );
    expect(markup.indexOf("Project composer")).toBeLessThan(
      markup.indexOf('aria-pressed="true"')
    );
    expect(markup).not.toContain("Conversation composer");
  });

  it("only shows the conversation composer when a chat is open", () => {
    const markup = renderProject(true);
    expect(markup).toContain("Conversation composer");
    expect(markup).not.toContain("Project composer");
  });
});
