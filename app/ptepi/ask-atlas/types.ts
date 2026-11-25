import type { NewEpiAction } from "../store/actions-store";
import type { WeeklyReportDraft } from "../types";
import type { PortfolioReport } from "./report";

export type QuestionId =
  | "behind"
  | "billing"
  | "next"
  | "attention"
  | "bast"
  | "inspections"
  | "rap"
  | "report"
  | "mos"
  | "export";

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
  /** Per point, the 1-based numbers of the sources it cites */
  citations?: number[][];
  sources: AnswerSource[];
  /** True when ATLAS declines because the evidence is missing (NF-04) */
  refused?: boolean;
  /** Template T1 weekly report draft, for the report question */
  report?: WeeklyReportDraft;
  /** A finished report file the reader can download */
  exportReport?: PortfolioReport;
  /** Actions the user can add to the action tracker */
  actions: NewEpiAction[];
  /** Data refresh time: the as-at date of the demo data */
  refreshedAt: string;
};

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "atlas"; text: string; questionId: QuestionId | null };
