import type { EpiDemoData } from "../types";
import { getSignals, type SignalKind, type SignalLevel, type SignalModule } from "./signals";

/** One AI insight as a dashboard shows it: the headline of a signal, with a way into its drawer. */
export type Insight = {
  /** Signal id; Operations Intelligence opens its drawer from it */
  id: string;
  kind: SignalKind;
  level: SignalLevel;
  module: SignalModule;
  projectId: string;
  title: string;
  summary: string;
  estimated: boolean;
};

/** The Nexa question that explains each module's insights. */
export const INSIGHT_QUESTION: Record<SignalModule, string> = {
  portfolio: "Which projects need attention?",
  cockpit: "Why is Kapasitor Bank (PNP126) behind plan?",
  evidence: "Draft the BAST for PNP126",
  commercial: "What is blocked from billing?",
  cost: "Which projects are over RAP?",
  service: "Which service inspections are overdue?"
};

type InsightScope = {
  /** Modules whose signals belong on the screen; empty means every module */
  modules?: SignalModule[];
  /** Only the signals of one project */
  projectId?: string;
  limit?: number;
};

/**
 * The insights a dashboard shows at the top: the signals ATLAS raised for its module (and
 * project), most severe first. Nothing is added here: the same signals fill Operations
 * Intelligence, so the two never disagree. A screen with no signal shows no insight.
 */
export function getInsights(data: EpiDemoData, { modules = [], projectId, limit = 3 }: InsightScope = {}): Insight[] {
  return getSignals(data)
    .filter((signal) => (modules.length === 0 || modules.includes(signal.module)) && (!projectId || signal.projectId === projectId))
    .slice(0, limit)
    .map((signal) => ({
      id: signal.id,
      kind: signal.kind,
      level: signal.level,
      module: signal.module,
      projectId: signal.projectId,
      title: signal.title,
      summary: signal.summary,
      estimated: signal.estimated
    }));
}
