import { create } from "zustand";
import {
  ASSETS,
  INSIGHTS,
  OVERRIDE_HISTORY,
  REPORTS,
  SCORING_VERSIONS,
  SYNONYMS,
} from "./data";
import type {
  ActivityEntry,
  AiInsight,
  BreakdownReport,
  OverrideRecord,
  Priority,
  ScoringConfig,
  ScoringVersion,
  SynonymEntry,
  TriageAsset,
} from "./types";

/** Display name of the signed-in supervisor in the mock dataset. */
export const CURRENT_USER = "Siti W.";
/** Clock time used for new activity entries in the mock dataset. */
export const MOCK_NOW = "15:18";

const clone = <T,>(value: T): T => structuredClone(value);

function activeConfig(versions: ScoringVersion[]): ScoringConfig {
  return clone((versions.find((version) => version.status === "active") ?? versions[0]).config);
}

interface TriageState {
  reports: BreakdownReport[];
  assets: Record<string, TriageAsset>;
  versions: ScoringVersion[];
  /** Config of the active scoring version, used for every priority calculation. */
  config: ScoringConfig;
  overrides: OverrideRecord[];
  synonyms: SynonymEntry[];
  insights: AiInsight[];

  updateReport: (id: string, patch: Partial<BreakdownReport>, activity?: Omit<ActivityEntry, "time">) => void;
  overridePriority: (id: string, from: Priority, to: Priority, reason: string) => void;
  updateAsset: (id: string, patch: Partial<TriageAsset>) => void;
  /** Adds a scoring version; `active` archives the current one and applies it immediately. */
  addVersion: (version: Omit<ScoringVersion, "version">) => number;
  activateVersion: (version: number) => void;
  removeVersion: (version: number) => void;
  setSynonyms: (update: (synonyms: SynonymEntry[]) => SynonymEntry[]) => void;
  updateInsight: (id: string, patch: Partial<AiInsight>, event?: string) => void;
}

export const useTriageStore = create<TriageState>((set, get) => ({
  reports: clone(REPORTS),
  assets: clone(ASSETS),
  versions: clone(SCORING_VERSIONS),
  config: activeConfig(SCORING_VERSIONS),
  overrides: clone(OVERRIDE_HISTORY),
  synonyms: clone(SYNONYMS),
  insights: clone(INSIGHTS),

  updateReport: (id, patch, activity) =>
    set((state) => ({
      reports: state.reports.map((report) =>
        report.id === id
          ? {
              ...report,
              ...patch,
              log: activity ? [...report.log, { time: MOCK_NOW, ...activity }] : report.log,
            }
          : report
      ),
    })),

  overridePriority: (id, from, to, reason) => {
    const report = get().reports.find((item) => item.id === id);
    if (!report) return;
    const at = `2 Nov, ${MOCK_NOW}`;
    get().updateReport(
      id,
      { override: from === to ? undefined : { from, to, reason, by: CURRENT_USER, at } },
      { icon: "arrow-up-down", text: `Priority changed ${from} → ${to} · ${reason}` }
    );
    set((state) => ({
      overrides: [
        { reportId: id, asset: state.assets[report.assetId].name, from, to, reason, by: CURRENT_USER, at },
        ...state.overrides,
      ],
    }));
  },

  updateAsset: (id, patch) =>
    set((state) => ({ assets: { ...state.assets, [id]: { ...state.assets[id], ...patch } } })),

  addVersion: (version) => {
    const next = Math.max(...get().versions.map((item) => item.version)) + 1;
    set((state) => {
      const versions: ScoringVersion[] = [
        { ...version, version: next },
        ...state.versions.map((item) =>
          version.status === "active" && item.status === "active"
            ? { ...item, status: "archived" as const }
            : item
        ),
      ];
      return { versions, config: activeConfig(versions) };
    });
    return next;
  },

  activateVersion: (version) =>
    set((state) => {
      const versions = state.versions.map((item) => ({
        ...item,
        status:
          item.version === version ? ("active" as const) : item.status === "active" ? ("archived" as const) : item.status,
      }));
      return { versions, config: activeConfig(versions) };
    }),

  removeVersion: (version) =>
    set((state) => ({ versions: state.versions.filter((item) => item.version !== version || item.status === "active") })),

  setSynonyms: (update) => set((state) => ({ synonyms: update(state.synonyms) })),

  updateInsight: (id, patch, event) =>
    set((state) => ({
      insights: state.insights.map((insight) =>
        insight.id === id
          ? {
              ...insight,
              ...patch,
              log: event ? [...insight.log, { event, by: CURRENT_USER, at: `02 Nov ${MOCK_NOW}` }] : insight.log,
            }
          : insight
      ),
    })),
}));
