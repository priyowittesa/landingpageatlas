import { describe, expect, it } from "vitest";
import { CONNECTIONS, WORKFLOWS } from "./data";
import {
  getConnectionStats,
  getConnectionUsage,
  getRunOrder,
  getRunOutcome,
  getStudioSummary,
  getWorkflowsAtRisk,
  initialActiveMap,
  simulateRun
} from "./logic";

const active = initialActiveMap(CONNECTIONS);
const byId = (id: string) => WORKFLOWS.find((workflow) => workflow.id === id)!;

describe("workflow data", () => {
  it("links only steps that exist and connections that exist", () => {
    const connectionIds = new Set(CONNECTIONS.map((connection) => connection.id));
    for (const workflow of WORKFLOWS) {
      const stepIds = new Set(workflow.steps.map((step) => step.id));
      for (const link of workflow.links) {
        expect(stepIds.has(link.from) && stepIds.has(link.to)).toBe(true);
      }
      for (const step of workflow.steps) {
        if (step.connectionId) expect(connectionIds.has(step.connectionId)).toBe(true);
      }
    }
  });
});

describe("getRunOrder", () => {
  it("runs every step once, after the steps that feed it", () => {
    for (const workflow of WORKFLOWS) {
      const order = getRunOrder(workflow).map((step) => step.id);
      expect(order).toHaveLength(workflow.steps.length);
      for (const link of workflow.links) {
        expect(order.indexOf(link.from)).toBeLessThan(order.indexOf(link.to));
      }
    }
  });
});

describe("simulateRun", () => {
  it("finishes every step when all connections are active", () => {
    const results = simulateRun(byId("wf-weekly-progress"), active, CONNECTIONS);
    expect(results.every((result) => result.status === "success")).toBe(true);
    expect(getRunOutcome(results)).toBe("success");
  });

  it("fails the step on an inactive connection and keeps the rest", () => {
    const results = simulateRun(byId("wf-billing-readiness"), active, CONNECTIONS);
    const failed = results.filter((result) => result.status === "failed");
    expect(failed.map((result) => result.stepId)).toEqual(["s6"]);
    expect(failed[0].message).toContain("e-Invoice gateway");
    expect(getRunOutcome(results)).toBe("warning");
  });

  it("skips the steps downstream of a failed step", () => {
    const results = simulateRun(byId("wf-weekly-progress"), { ...active, "conn-sharepoint": false }, CONNECTIONS);
    expect(results[0].status).toBe("failed");
    expect(results.slice(1).every((result) => result.status === "skipped")).toBe(true);
    expect(getRunOutcome(results)).toBe("failed");
  });
});

describe("connection figures", () => {
  it("counts active, inactive and used connections", () => {
    expect(getConnectionStats(CONNECTIONS, active, WORKFLOWS)).toEqual({ total: 9, active: 8, inactive: 1, inUse: 9 });
  });

  it("lists the workflows behind a connection", () => {
    expect(getConnectionUsage("conn-einvoice", WORKFLOWS).map((workflow) => workflow.id)).toEqual(["wf-billing-readiness"]);
  });

  it("flags workflows that use an inactive connection", () => {
    expect(getWorkflowsAtRisk(WORKFLOWS, active).map((workflow) => workflow.id)).toEqual(["wf-billing-readiness"]);
    expect(getWorkflowsAtRisk(WORKFLOWS, { ...active, "conn-einvoice": true })).toEqual([]);
  });

  it("sums the month's runs and success rate", () => {
    const summary = getStudioSummary(WORKFLOWS);
    expect(summary.workflows).toBe(4);
    expect(summary.runsThisMonth).toBe(18);
    expect(summary.successRate).toBeCloseTo(17 / 18);
  });
});
