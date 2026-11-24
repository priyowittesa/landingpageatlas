import { beforeEach, describe, expect, it } from "vitest";
import { selectHasOpenAction, useActionsStore, type NewEpiAction } from "./actions-store";

const sample: NewEpiAction = {
  title: "Get PO Vendor (Confirmation Order) signed: Power Transformer (PNP126)",
  projectId: "PNP126",
  ownerRole: "Project Manager",
  dueDate: "2026-11-15",
  source: "Evidence gate: PNP126 stage 2",
  autonomy: "L1"
};

describe("actions store", () => {
  beforeEach(() => useActionsStore.getState().reset());

  it("adds an open action with a sequential id", () => {
    const first = useActionsStore.getState().addAction(sample);
    const second = useActionsStore
      .getState()
      .addAction({ ...sample, source: "Evidence gate: PNP126 stage 3" });
    expect(first).toMatchObject({ id: "ACT-001", status: "open", autonomy: "L1", projectId: "PNP126" });
    expect(second.id).toBe("ACT-002");
    expect(useActionsStore.getState().actions).toHaveLength(2);
  });

  it("returns the existing action instead of creating a duplicate for the same source", () => {
    const first = useActionsStore.getState().addAction(sample);
    const again = useActionsStore.getState().addAction(sample);
    expect(again.id).toBe(first.id);
    expect(useActionsStore.getState().actions).toHaveLength(1);
  });

  it("allows a new action for a source once the previous one is done", () => {
    const first = useActionsStore.getState().addAction(sample);
    useActionsStore.getState().setStatus(first.id, "done");
    const again = useActionsStore.getState().addAction(sample);
    expect(again.id).toBe("ACT-002");
  });

  it("tells whether an unfinished action exists for a source", () => {
    expect(selectHasOpenAction(sample.source)(useActionsStore.getState())).toBe(false);
    useActionsStore.getState().addAction(sample);
    expect(selectHasOpenAction(sample.source)(useActionsStore.getState())).toBe(true);
  });
});
