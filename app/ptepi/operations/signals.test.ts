import { describe, expect, it } from "vitest";
import { epiData } from "../data";
import { buildSeedActions } from "../store/action-helpers";
import { countByKind, filterSignals, getSignals, splitByAction, trackedActionOf } from "./signals";

const signals = getSignals(epiData);
const seeds = buildSeedActions(epiData);

describe("operations intelligence signals", () => {
  it("counts insights, recommendations and predictions of the demo data", () => {
    expect(countByKind(signals)).toEqual({ all: 17, insight: 7, recommendation: 6, prediction: 4 });
  });

  it("gives every signal one action with an issue, an owner and a due date after the snapshot", () => {
    for (const signal of signals) {
      expect(signal.action.issue, signal.id).toBeTruthy();
      expect(signal.action.ownerRole, signal.id).toBeTruthy();
      expect(signal.action.dueDate > epiData.asAt, signal.id).toBe(true);
      expect(signal.evidence.length, signal.id).toBeGreaterThan(0);
    }
    expect(new Set(signals.map((signal) => signal.id)).size).toBe(signals.length);
  });

  it("lists the most severe first", () => {
    const levels = signals.map((signal) => signal.level);
    expect(levels.indexOf("watch")).toBeGreaterThan(levels.lastIndexOf("risk"));
  });

  it("keeps the PNP126 headline figures in its signals", () => {
    const noProgress = signals.find((signal) => signal.id === "I-NO-PROGRESS");
    expect(noProgress?.title).toBe("PNP126 shows no progress in weeks 14 to 18 (5 weeks)");
    expect(noProgress?.metrics.map((metric) => metric.value)).toEqual(["28,5%", "-45 pts"]);
    const late = signals.find((signal) => signal.id === "P-LATE-PNP126");
    expect(late?.title).toBe("PNP126 is likely to finish 126 days after the planned end");
    expect(late?.estimated).toBe(true);
    expect(signals.find((signal) => signal.id === "P-PACE")?.metrics[1]?.value).toBe("2,8 pts per week");
  });

  it("filters by kind and module", () => {
    expect(filterSignals(signals, { kind: "prediction", module: "all" })).toHaveLength(4);
    expect(filterSignals(signals, { kind: "all", module: "service" }).map((signal) => signal.id)).toEqual(["R-INSPECTION"]);
    expect(filterSignals(signals, { kind: "insight", module: "service" })).toEqual([]);
  });

  it("treats a signal as actioned when its issue is already tracked", () => {
    expect(trackedActionOf(signals.find((signal) => signal.id === "I-CLAIMED")!, seeds)?.id).toBe("EXC-03");
    expect(splitByAction(signals, seeds)).toEqual({ open: expect.any(Array), actioned: 7 });
    expect(splitByAction(signals, seeds).open).toHaveLength(10);
  });

  it("moves a signal out of Open once its action is created", () => {
    const first = splitByAction(signals, seeds).open[0]!;
    const created = [...seeds, { ...first.action, id: "ACT-01", status: "open" as const }];
    expect(splitByAction(signals, created).open).toHaveLength(9);
    expect(trackedActionOf(first, created)?.id).toBe("ACT-01");
  });
});
