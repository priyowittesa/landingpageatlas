import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteMaster, getMaster, masterDraft, masterPayload, saveMaster, type EntityKind, type MasterEntity } from "./api";

const mocks = vi.hoisted(() => ({ get: vi.fn(), write: vi.fn() }));
vi.mock("@/app/app/capacity-analytic/api", () => ({ capacityGet: mocks.get, capacityWrite: mocks.write }));

describe("Product Structure proto request contracts", () => {
  beforeEach(() => vi.resetAllMocks());

  it("creates products using product_code/product_name and an actual status ID", async () => {
    mocks.write.mockResolvedValue({ id: "new" });
    await saveMaster("product", { product_code: "P01", product_name: "Product One", status_id: "status-1", tenant_id: "do-not-send", created_by: "do-not-send" });
    expect(mocks.write).toHaveBeenCalledWith("/products", {
      product_code: "P01", product_name: "Product One", status_id: "status-1",
    }, "POST");
  });

  it("sends immutable parent associations on create only", () => {
    const group = { group_code: "G01", group_name: "Group One", status_id: "status-1" };
    expect(masterPayload("group", group, "product-1")).toHaveProperty("product_id", "product-1");
    expect(masterPayload("group", group, "product-1", true)).not.toHaveProperty("product_id");
  });

  it("uses native line fields and keeps omitted optional shift/station settings unchanged on update", () => {
    const existing: MasterEntity = { id: "line-1", status_id: "status-1", line_code: "L01", line_name: "Line One", efficiency_pct: 80 };
    const draft = masterDraft("line", existing);
    expect(draft.shifts_per_day).toBe("");
    expect(masterPayload("line", draft, "group-1", true)).toEqual({
      line_code: "L01", line_name: "Line One", efficiency_pct: 80, status_id: "status-1",
    });
    expect(masterDraft("line")).toMatchObject({ shifts_per_day: "1", hours_per_shift: "8", parallel_stations: "1" });
  });

  it("preserves the distinction between omitted labor time and explicitly clearing it with zero", () => {
    const draft = { ...masterDraft("part"), part_number: "PN-1", part_name: "Part One", status_id: "status-1" };
    expect(masterPayload("part", draft, "line-1", true)).not.toHaveProperty("standard_labor_time_minutes");
    expect(masterPayload("part", { ...draft, standard_labor_time_minutes: "0" }, "line-1", true)).toHaveProperty("standard_labor_time_minutes", 0);
  });

  it("creates assembly relationships with component IDs, not fabricated part-name fields", () => {
    expect(masterPayload("assembly", { usage: "2.5", component_part_id: "child", status_id: "status-1" }, "parent")).toEqual({
      parent_part_id: "parent", component_part_id: "child", usage: 2.5, status_id: "status-1",
    });
    expect(masterPayload("assembly", { usage: "3", component_part_id: "child", status_id: "status-1" }, "parent", true)).toEqual({ usage: 3, status_id: "status-1" });
    expect(() => masterPayload("assembly", { usage: "1", component_part_id: "parent", status_id: "status-1" }, "parent")).toThrow("different component");
  });

  it.each([
    ["shifts_per_day", "5"], ["shifts_per_day", "1.5"], ["hours_per_shift", "25"], ["parallel_stations", "0"],
  ])("rejects invalid %s values before sending requests", (field, value) => {
    const draft = { ...masterDraft("line"), line_code: "L", line_name: "Line", status_id: "status-1", [field]: value };
    expect(() => masterPayload("line", draft, "group-1")).toThrow("allowed range");
  });

  it.each(["product", "group", "line", "part", "assembly"] as EntityKind[])("encodes %s detail and delete IDs", async (kind) => {
    await getMaster(kind, "a/b");
    await deleteMaster(kind, "a/b");
    expect(mocks.get.mock.lastCall![0]).toMatch(/\/a%2Fb$/);
    expect(mocks.write.mock.lastCall!).toEqual([expect.stringMatching(/\/a%2Fb$/), undefined, "DELETE"]);
  });
});
