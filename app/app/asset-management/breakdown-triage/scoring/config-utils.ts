import { format2, round2 } from "../lib/scoring";
import type { Priority, ScoringConfig, ScoringWeights } from "../lib/types";

export const WEIGHT_KEYS: { key: keyof ScoringWeights; code: string; label: string; hint: string }[] = [
  { key: "criticality", code: "S_crit", label: "Criticality", hint: "A 1.0 · B 0.6 · C 0.3" },
  { key: "production", code: "S_prod", label: "Production impact", hint: "Bottleneck 1.0 · other 0.4 · still running × 0.5" },
  { key: "safety", code: "S_safety", label: "Safety", hint: "Signal 1.0 · statutory 0.5 · other 0" },
  { key: "history", code: "S_hist", label: "History", hint: "Repeat 1.0 · > median 0.6 · other 0.2" },
];

/** Starting values for a tenant's first version; the API needs explicit values while no version is active. */
export const DEFAULT_CONFIG: ScoringConfig = {
  weights: { criticality: 0.35, production: 0.25, safety: 0.25, history: 0.15 },
  p1Threshold: 0.75,
  p2Threshold: 0.45,
  safetyKeywords: [],
  slaMinutes: { P1: 30, P2: 240, P3: 1440 },
  autoEscalate: true,
};

export const cloneConfig = (config: ScoringConfig): ScoringConfig => structuredClone(config);
export const sameConfig = (a: ScoringConfig, b: ScoringConfig) => diffConfig(a, b).length === 0;

/** P3 response targets are stored in minutes but edited and displayed in hours. */
export const slaDisplayValue = (config: ScoringConfig, priority: Priority) =>
  priority === "P3" ? config.slaMinutes.P3 / 60 : config.slaMinutes[priority];
export const slaUnit = (priority: Priority) => (priority === "P3" ? "h" : "min");

/** Human-readable list of changes from `from` to `to`, used as the version note. */
export function diffConfig(from: ScoringConfig, to: ScoringConfig): string[] {
  const changes: string[] = [];
  for (const { key, code } of WEIGHT_KEYS) {
    if (from.weights[key] !== to.weights[key]) {
      changes.push(`${code} ${format2(from.weights[key])} → ${format2(to.weights[key])}`);
    }
  }
  if (from.p1Threshold !== to.p1Threshold) {
    changes.push(`P1 threshold ${format2(from.p1Threshold)} → ${format2(to.p1Threshold)}`);
  }
  if (from.p2Threshold !== to.p2Threshold) {
    changes.push(`P2 threshold ${format2(from.p2Threshold)} → ${format2(to.p2Threshold)}`);
  }
  for (const priority of ["P1", "P2", "P3"] as const) {
    if (from.slaMinutes[priority] !== to.slaMinutes[priority]) {
      changes.push(
        `${priority} target ${slaDisplayValue(from, priority)} → ${slaDisplayValue(to, priority)} ${slaUnit(priority)}`
      );
    }
  }
  to.safetyKeywords
    .filter((keyword) => !from.safetyKeywords.includes(keyword))
    .forEach((keyword) => changes.push(`Added keyword “${keyword}”`));
  from.safetyKeywords
    .filter((keyword) => !to.safetyKeywords.includes(keyword))
    .forEach((keyword) => changes.push(`Removed keyword “${keyword}”`));
  if (from.autoEscalate !== to.autoEscalate) {
    changes.push(`Automatic escalation ${to.autoEscalate ? "on" : "off"}`);
  }
  return changes;
}

export interface ConfigValidation {
  weightSum: number;
  weightsValid: boolean;
  thresholdsValid: boolean;
  slaValid: boolean;
  valid: boolean;
}

export function validateConfig(config: ScoringConfig): ConfigValidation {
  const { weights, slaMinutes } = config;
  const weightSum = round2(weights.criticality + weights.production + weights.safety + weights.history);
  const weightsValid = Math.abs(weightSum - 1) < 0.001;
  const thresholdsValid = config.p1Threshold > config.p2Threshold;
  const slaValid = slaMinutes.P1 > 0 && slaMinutes.P2 > slaMinutes.P1 && slaMinutes.P3 > 0;
  return { weightSum, weightsValid, thresholdsValid, slaValid, valid: weightsValid && thresholdsValid && slaValid };
}
