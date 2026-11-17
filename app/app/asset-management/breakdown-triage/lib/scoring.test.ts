import { describe, expect, it } from "vitest";
import { ASSETS, REPORTS, SCORING_VERSIONS } from "./data";
import {
  compareQueue,
  computePriority,
  effectivePriority,
  priorityReasons,
  slaState,
  triageWarnings,
} from "./scoring";
import type { BreakdownReport, ScoringConfig } from "./types";

const config: ScoringConfig = SCORING_VERSIONS.find((version) => version.status === "active")!.config;
const report = (id: string): BreakdownReport => REPORTS.find((item) => item.id === id)!;

describe("computePriority", () => {
  it.each([
    ["BR-2026-1102-014", "P1", 0.8],
    ["BR-2026-1102-012", "P1", 0.69],
    ["BR-2026-1102-009", "P2", 0.52],
    ["BR-2026-1102-006", "P2", 0.46],
    ["BR-2026-1102-004", "P3", 0.38],
    ["BR-2026-1102-011", "P3", 0.25],
    ["BR-2026-1101-031", "P3", 0.43],
  ])("scores %s as %s (%s), matching the prototype", (id, priority, score) => {
    const result = computePriority(report(id), config, ASSETS);
    expect(result.priority).toBe(priority);
    expect(result.score).toBe(score);
  });

  it("forces P1 on a safety keyword even below the P1 threshold", () => {
    const result = computePriority(report("BR-2026-1102-012"), config, ASSETS);
    expect(result.components.keywordHits).toEqual(["smoke"]);
    expect(result.safetyOverride).toBe(true);
    expect(priorityReasons(report("BR-2026-1102-012"), config, ASSETS)[0]).toBe('Safety signal: "smoke"');
  });

  it("treats statutory assets as a partial safety signal, not an automatic P1", () => {
    const result = computePriority(report("BR-2026-1024-017"), config, ASSETS);
    expect(result.components.safety).toBe(0.5);
    expect(result.safety).toBe(false);
  });

  it("follows the configured weights and thresholds", () => {
    const strict = { ...config, p1Threshold: 0.9, p2Threshold: 0.6 };
    expect(computePriority(report("BR-2026-1102-014"), strict, ASSETS).priority).toBe("P2");
  });
});

describe("queue helpers", () => {
  it("uses a supervisor override as the effective priority", () => {
    expect(effectivePriority(report("BR-2026-1101-031"), config, ASSETS)).toBe("P2");
  });

  it("reports SLA state per report state", () => {
    expect(slaState(report("BR-2026-1102-014"), config, ASSETS)).toEqual({ kind: "remaining", minutes: 9, warning: false });
    expect(slaState(report("BR-2026-1102-009"), config, ASSETS)).toEqual({ kind: "remaining", minutes: 22, warning: false });
    expect(slaState(report("BR-2026-1102-012"), config, ASSETS)).toEqual({ kind: "responded", minutes: 4 });
    expect(slaState({ ...report("BR-2026-1102-014"), minutesAgo: 20 }, config, ASSETS)).toEqual({ kind: "overdue", minutes: 5 });
  });

  it("warns when a P1 needs parts that are out of stock", () => {
    expect(triageWarnings(report("BR-2026-1102-012"), config, ASSETS)[0]).toContain("Burner nozzle 3 GPH (lead time 14 days)");
    expect(triageWarnings(report("BR-2026-1102-014"), config, ASSETS)).toEqual([]);
  });

  it("sorts open reports by priority, then age, and closed reports last", () => {
    const order = [...REPORTS].sort((a, b) => compareQueue(a, b, config, ASSETS)).map((item) => item.id);
    expect(order.slice(0, 3)).toEqual(["BR-2026-1102-012", "BR-2026-1102-014", "BR-2026-1102-015"]);
    expect(order.slice(-2)).toEqual(["BR-2026-1024-017", "BR-2026-1101-031"]);
  });
});
