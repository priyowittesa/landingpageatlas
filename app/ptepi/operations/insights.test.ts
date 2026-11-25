import { describe, expect, it } from "vitest";
import { epiData } from "../data";
import { getInsights } from "./insights";
import { getSignals } from "./signals";

describe("dashboard insights", () => {
  it("shows the three most severe signals on the portfolio screen", () => {
    const insights = getInsights(epiData);
    expect(insights).toHaveLength(3);
    expect(insights.every((insight) => insight.level === "risk")).toBe(true);
    expect(insights.map((insight) => insight.id)).toEqual(getSignals(epiData).slice(0, 3).map((signal) => signal.id));
  });

  it("keeps to the module and the project of the screen", () => {
    const evidence = getInsights(epiData, { modules: ["evidence"], projectId: "PNP126" });
    expect(evidence.map((insight) => insight.id).sort()).toEqual(["I-CLAIMED", "R-BAST", "R-MOS"]);
    expect(getInsights(epiData, { modules: ["service"] }).map((insight) => insight.id)).toEqual(["R-INSPECTION"]);
  });

  it("shows nothing for a project the signals do not mention", () => {
    expect(getInsights(epiData, { modules: ["cockpit", "evidence"], projectId: "GS125" })).toEqual([]);
  });

  it("marks the estimated forecast", () => {
    const late = getInsights(epiData, { modules: ["cockpit"], projectId: "PNP126" }).find((insight) => insight.id === "P-LATE-PNP126");
    expect(late?.estimated).toBe(true);
  });
});
