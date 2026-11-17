import type { BreakdownReport, Priority, ScoringConfig, SparePart, TriageAsset } from "./types";

export const PRIORITIES: Priority[] = ["P1", "P2", "P3"];

const CRITICALITY_FACTOR = { A: 1, B: 0.6, C: 0.3 } as const;

export const round2 = (value: number) => Math.round((value + 1e-9) * 100) / 100;
export const format2 = (value: number) => round2(value).toFixed(2);

export interface ScoreComponents {
  criticality: number;
  production: number;
  safety: number;
  history: number;
  keywordHits: string[];
}

/** Asset attributes by id; pass the store's assets so manual corrections apply. */
export type AssetMap = Record<string, TriageAsset>;

export function scoreComponents(
  report: BreakdownReport,
  config: ScoringConfig,
  assets: AssetMap
): ScoreComponents {
  const asset = assets[report.assetId];
  let production = asset.bottleneck ? 1 : 0.4;
  if (report.machineStatus === "running") production *= 0.5;
  const description = report.description.toLowerCase();
  const keywordHits = config.safetyKeywords.filter((keyword) => description.includes(keyword));
  // Statutory assets contribute 0.5 (not an automatic P1); only real safety signals force P1.
  const safety = report.safetyFlag || keywordHits.length ? 1 : asset.statutory ? 0.5 : 0;
  const history = report.history === "repeat" ? 1 : report.history === "above" ? 0.6 : 0.2;
  return { criticality: CRITICALITY_FACTOR[asset.criticality], production, safety, history, keywordHits };
}

export interface PriorityResult {
  priority: Priority;
  score: number;
  components: ScoreComponents;
  /** P1 forced by a safety signal even though the score is below the P1 threshold. */
  safetyOverride: boolean;
  safety: boolean;
}

export function computePriority(
  report: BreakdownReport,
  config: ScoringConfig,
  assets: AssetMap
): PriorityResult {
  const components = scoreComponents(report, config, assets);
  const { weights } = config;
  const score = round2(
    components.criticality * weights.criticality +
      components.production * weights.production +
      components.safety * weights.safety +
      components.history * weights.history
  );
  const safety = components.safety === 1;
  const priority: Priority = safety
    ? "P1"
    : score >= config.p1Threshold
      ? "P1"
      : score >= config.p2Threshold
        ? "P2"
        : "P3";
  return { priority, score, components, safetyOverride: safety && score < config.p1Threshold, safety };
}

/** Priority after any supervisor override. */
export function effectivePriority(report: BreakdownReport, config: ScoringConfig, assets: AssetMap): Priority {
  return report.override?.to ?? computePriority(report, config, assets).priority;
}

export const isOpenReport = (report: BreakdownReport) =>
  report.state !== "completed" && report.state !== "cancelled";

/** Top three human-readable reasons behind a report's priority, safety first. */
export function priorityReasons(report: BreakdownReport, config: ScoringConfig, assets: AssetMap): string[] {
  const asset = assets[report.assetId];
  const { components: c } = computePriority(report, config, assets);
  const { weights: w } = config;
  const criticalityText = {
    A: "Criticality A asset",
    B: "Criticality B (medium)",
    C: "Criticality C (low)",
  }[asset.criticality];
  const productionText =
    (asset.bottleneck ? `${asset.line} bottleneck` : "Not a bottleneck") +
    (report.machineStatus === "running" ? " · machine still running" : " · machine stopped");
  const safetyText = c.keywordHits.length
    ? `Safety signal: "${c.keywordHits.join('", "')}"`
    : report.safetyFlag
      ? "Flagged as hazardous by reporter"
      : "Statutory asset";
  const historyText =
    report.history === "repeat"
      ? (report.historyText ?? "Repeat breakdown")
      : report.history === "above"
        ? "Breakdowns above asset-type median"
        : "Normal breakdown history";
  let factors = [
    { key: "safety", value: c.safety * w.safety, text: safetyText },
    { key: "criticality", value: c.criticality * w.criticality, text: criticalityText },
    { key: "production", value: c.production * w.production, text: productionText },
    { key: "history", value: c.history * w.history, text: historyText },
  ]
    .filter((factor) => factor.value > 0)
    .sort((a, b) => b.value - a.value);
  if (c.safety === 1) {
    factors = [
      ...factors.filter((factor) => factor.key === "safety"),
      ...factors.filter((factor) => factor.key !== "safety"),
    ];
  }
  return factors.slice(0, 3).map((factor) => factor.text);
}

export type StockStatus = "out_of_stock" | "low" | "in_stock";

export const stockStatus = (part: SparePart): StockStatus =>
  part.qty === 0 ? "out_of_stock" : part.qty <= part.min ? "low" : "in_stock";

/** Warnings shown above the triage detail, e.g. a P1 that needs out-of-stock parts. */
export function triageWarnings(report: BreakdownReport, config: ScoringConfig, assets: AssetMap): string[] {
  const missing = report.spares.filter((part) => stockStatus(part) === "out_of_stock");
  if (effectivePriority(report, config, assets) !== "P1" || !missing.length) return [];
  const parts = missing.map((part) => `${part.name} (lead time ${part.leadDays} days)`).join(", ");
  return [
    `P1 priority with parts out of stock: ${parts}. Coordinate with the warehouse/purchasing before heading out.`,
  ];
}

export type SlaState =
  | { kind: "responded"; minutes: number }
  | { kind: "scheduled"; label: string }
  | { kind: "completed" }
  | { kind: "none" }
  | { kind: "overdue"; minutes: number }
  | { kind: "remaining"; minutes: number; warning: boolean };

export function slaState(report: BreakdownReport, config: ScoringConfig, assets: AssetMap): SlaState {
  if (report.state === "in_progress") return { kind: "responded", minutes: report.responseMinutes ?? 0 };
  if (report.state === "scheduled") return { kind: "scheduled", label: report.scheduledFor ?? "Scheduled" };
  if (report.state === "completed") return { kind: "completed" };
  if (report.state === "cancelled") return { kind: "none" };
  const sla = config.slaMinutes[effectivePriority(report, config, assets)];
  const remaining = sla - report.minutesAgo;
  if (remaining < 0) return { kind: "overdue", minutes: -remaining };
  return { kind: "remaining", minutes: remaining, warning: remaining <= sla * 0.35 };
}

export function formatDuration(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

/** Relative time for the mock dataset, where "now" is NOW_MINUTES into the shift. */
export function formatAgo(minutes: number, nowMinutes: number): string {
  if (minutes > nowMinutes) {
    const days = Math.ceil((minutes - nowMinutes) / 1440);
    return days === 1 ? "yesterday" : `${days} days ago`;
  }
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`;
}

/** Queue order: open reports first, then by priority, then oldest first. */
export function compareQueue(
  a: BreakdownReport,
  b: BreakdownReport,
  config: ScoringConfig,
  assets: AssetMap
): number {
  const order = { P1: 0, P2: 1, P3: 2 };
  const stateRank = (report: BreakdownReport) =>
    report.state === "cancelled" ? 2 : report.state === "completed" ? 1 : 0;
  return (
    stateRank(a) - stateRank(b) ||
    order[effectivePriority(a, config, assets)] - order[effectivePriority(b, config, assets)] ||
    b.minutesAgo - a.minutesAgo
  );
}
