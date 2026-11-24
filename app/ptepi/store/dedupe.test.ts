import { beforeEach, describe, expect, it } from "vitest";
import { epiData } from "../data";
import { buildAllAnswers } from "../ask-atlas/answers";
import { getEvidenceStages, getSuggestedAction } from "../selectors";
import { buildSeedActions, issueForActionId } from "./action-helpers";
import { findOpenMatch, useActionsStore } from "./actions-store";

describe("action dedupe across screens", () => {
  beforeEach(() => {
    useActionsStore.getState().reset();
    useActionsStore.getState().seed(buildSeedActions(epiData));
  });

  it("returns EXC-03 when the evidence gate raises the transformer PO action", () => {
    const stage = getEvidenceStages(epiData, "PNP126")[1];
    if (!stage) throw new Error("stage 2 missing");
    const suggestion = getSuggestedAction(epiData, "PNP126", stage);
    const before = useActionsStore.getState().actions.length;
    const result = useActionsStore.getState().addAction(suggestion);
    expect(result.id).toBe("EXC-03");
    expect(useActionsStore.getState().actions).toHaveLength(before);
    expect(findOpenMatch(useActionsStore.getState().actions, suggestion)?.id).toBe("EXC-03");
  });

  it("returns the seeded billing exception for a Nexa Intelligence billing action", () => {
    const billing = buildAllAnswers(epiData).billing.actions.find((a) => a.projectId === "PTP1125");
    if (!billing) throw new Error("billing action missing");
    expect(useActionsStore.getState().addAction(billing).id).toBe("EXC-06");
  });

  it("adds a new action when the issue is tracked but done, or on another project", () => {
    useActionsStore.getState().setStatus("EXC-03", "done");
    const stage = getEvidenceStages(epiData, "PNP126")[1];
    if (!stage) throw new Error("stage 2 missing");
    const added = useActionsStore.getState().addAction(getSuggestedAction(epiData, "PNP126", stage));
    expect(added.id).toMatch(/^ACT-/);
    expect(issueForActionId("EXC-03")).toBe("evidence-stage-2");
  });
});
