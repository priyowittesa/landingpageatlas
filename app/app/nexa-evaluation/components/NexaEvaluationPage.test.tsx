import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEFAULT_OPTIONS, MOCK_RUNS } from "../mock-data";
import { AnswerReviews } from "./AnswerReviews";
import { CheckHistory } from "./CheckHistory";
import { NexaEvaluationPage } from "./NexaEvaluationPage";
import { RunProgress } from "./RunProgress";

describe("NEXA Evaluation UI", () => {
  it("renders the design's history, scores, reviews and local assets", () => {
    const html = renderToStaticMarkup(<NexaEvaluationPage />);
    for (const text of [
      "NEXA Evaluation", "Last checked 7 days ago", "Check Now",
      "Check History", "29 Oct 2026", "15 Oct 2026", "1 Oct 2026", "2 Sep 2026",
      "3 of 5 answers to review", "Resume available", "Hallucination Check",
      "95%", "87%", "77%", "Faithfulness", "Answers relevancy",
      "Check These Answers", "Export to Excel", "UI preview",
      "Sample data only"
    ]) expect(html).toContain(text);
    for (const asset of ["play.svg", "export.svg", "chevron-right.svg"]) {
      expect(html).toContain(`/images/nexa-evaluation/${asset}`);
    }
    expect(html).not.toContain("figma.com");
    expect(html.match(/Open Chat</g)).toHaveLength(5);
  });

  it("keeps history selection keyboard-accessible and marks the selected run", () => {
    const html = renderToStaticMarkup(
      <CheckHistory runs={MOCK_RUNS} selectedId="oct-01" onSelect={() => {}} />
    );
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(3);
    expect(html).toContain("Evaluation check history");
  });

  it("shows an empty review state for an already reviewed run", () => {
    const html = renderToStaticMarkup(
      <AnswerReviews answers={[]} reviews={{}} onReview={() => {}} />
    );
    expect(html).toContain("All answers reviewed");
    expect(html).not.toContain("NEXA is Right");
  });

  it.each(["collecting", "checking", "reporting"] as const)(
    "renders the %s preview phase with a stop action and no real evaluation claim",
    (phase) => {
      const html = renderToStaticMarkup(
        <RunProgress phase={phase} options={DEFAULT_OPTIONS} onStop={() => {}} />
      );
      expect(html).toContain("Stop Check");
      expect(html).toContain("UI preview");
      expect(html).toContain("No chat data is collected or sent");
      expect(html).toContain('role="status"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain(phase === "collecting"
        ? "Collecting..." : phase === "checking" ? "60 of 96 answers" : "Writing the summary...");
    }
  );
});
