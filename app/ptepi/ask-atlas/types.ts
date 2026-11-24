import type { NewEpiAction } from "../store/actions-store";

export type QuestionId =
  | "behind"
  | "billing"
  | "next"
  | "attention"
  | "bast"
  | "inspections"
  | "rap";

/** Where a figure or statement comes from. */
export type AnswerSource = {
  kind: "table" | "document" | "rule";
  label: string;
};

export type AnswerFigure = {
  label: string;
  value: string;
};

/** A scripted answer. Every number in it is read from selectors.ts. */
export type Answer = {
  questionId: QuestionId;
  question: string;
  conclusion: string;
  figures: AnswerFigure[];
  points: string[];
  sources: AnswerSource[];
  /** Actions the user can add to the action tracker */
  actions: NewEpiAction[];
  /** Data refresh time: the as-at date of the demo data */
  refreshedAt: string;
};

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "atlas"; text: string; questionId: QuestionId | null };
