import type { AiAssistantSession } from "./types";

/**
 * Placeholder content so the panel can be reviewed as a pure UI shell. Replace
 * with TanStack Query hooks against the chat endpoints once the API is ready.
 */
const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

export const ASSISTANT_NAME = "ATLAS AI";

export const SUGGESTED_PROMPTS = [
  "Summarize this week's production capacity",
  "Which lines are overloaded right now?",
  "Draft a daily diary from yesterday's activities"
];

export const MOCK_SESSIONS: AiAssistantSession[] = [
  {
    id: "session-1",
    title: "Weekly production summary",
    updatedAt: minutesAgo(4),
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Can you show me the production summary for this week?",
        createdAt: minutesAgo(6)
      },
      {
        id: "m-2",
        role: "assistant",
        content: [
          "Here's your weekly production summary:",
          "",
          "| Metric | Value |",
          "| --- | --- |",
          "| Total Output | 14,200 pcs |",
          "| Line Efficiency | 87.3% |",
          "| Active Lines | 22/24 |",
          "| Quality Rate | 98.1% |",
          "",
          "Would you like me to export this as a PDF or dive deeper into any specific line?"
        ].join("\n"),
        createdAt: minutesAgo(4)
      }
    ]
  },
  {
    id: "session-2",
    title: "NG bottleneck on ASCC 02",
    updatedAt: minutesAgo(180),
    messages: [
      {
        id: "m-3",
        role: "user",
        content: "Why is ASCC 02 flagged as a bottleneck?",
        createdAt: minutesAgo(182)
      },
      {
        id: "m-4",
        role: "assistant",
        content:
          "ASCC 02 is running at **142% of planned capacity** for the Atlas Compressor model. The order volume of 6,400 pcs exceeds the line's daily takt by roughly 1,900 pcs.",
        createdAt: minutesAgo(180)
      }
    ]
  },
  {
    id: "session-3",
    title: "Inspection template help",
    updatedAt: minutesAgo(1500),
    messages: [
      {
        id: "m-5",
        role: "user",
        content: "How do I duplicate an inspection template?",
        createdAt: minutesAgo(1502)
      },
      {
        id: "m-6",
        role: "assistant",
        content:
          "Open **Manufacture → Inspection → Templates**, then use the row actions menu on the template you want and choose *Duplicate*.",
        createdAt: minutesAgo(1500)
      }
    ]
  }
];

/** Canned reply used until the real backend is wired up. */
export const MOCK_REPLY = [
  "This is a mocked response.",


].join("\n");
