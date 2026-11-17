import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FormulaDraft, FormulaToken, FormulaVersion } from "../api-types";
import { fromApiTokens, saveFormulaDraft, saveFormulaTargets, toApiTokens } from "./formula-api";

const mocks = vi.hoisted(() => ({ get: vi.fn(), write: vi.fn() }));
vi.mock("../api", () => ({ capacityGet: mocks.get, capacityWrite: mocks.write }));
const draft: FormulaDraft = {
  scope_level: "FORMULA_SCOPE_LEVEL_LINE", scope_ids: ["line-1"], name: "Machine output",
  effective_from: "2026-12-01", tokens: [{ type: "variable", value: "working_days" }],
};
const version: FormulaVersion = { id: "draft-1", scope_level: draft.scope_level, scope_id: "line-1", version_no: 4, name: draft.name, status: "FORMULA_VERSION_STATUS_DRAFT" };

describe("formula serialization and lifecycle", () => {
  beforeEach(() => vi.resetAllMocks());

  it("round-trips nested functions, commas, unit conversions and catalogue codes without inventing aliases", () => {
    const tokens: FormulaToken[] = [
      { type: "function", value: "min" }, { type: "lparen" },
      { type: "variable", value: "shifts_per_day" }, { type: "operator", value: "*" },
      { type: "number", number: 3600, unit: "s/h", label: "seconds per hour" },
      { type: "comma" }, { type: "function", value: "max" }, { type: "lparen" },
      { type: "variable", value: "cycle_time_seconds" }, { type: "comma" },
      { type: "number", number: 1 }, { type: "rparen" }, { type: "rparen" },
    ];
    const editor = fromApiTokens(tokens, { variables: [{ code: "shifts_per_day", label: "Shifts per day", group: "time_available", source: "Master line", description: "" }] });
    expect(editor[1].label).toBe("Shifts per day");
    expect(toApiTokens(editor)).toEqual(tokens);
  });

  it("normalizes UI multiplication, division and formatted numbers to the backend token shape", () => {
    expect(toApiTokens([
      { uid: "1", kind: "constant", value: "3,600", unit: "s/h" },
      { uid: "2", kind: "operator", symbol: "\u00f7" },
      { uid: "3", kind: "variable", code: "cycle_time_seconds" },
      { uid: "4", kind: "operator", symbol: "x" },
      { uid: "5", kind: "constant", value: "0.8" },
    ])).toEqual([
      { type: "number", number: 3600, unit: "s/h" }, { type: "operator", value: "/" },
      { type: "variable", value: "cycle_time_seconds" }, { type: "operator", value: "*" },
      { type: "number", number: 0.8 },
    ]);
  });

  it("creates one draft per target using scope_ids and returns all saved versions", async () => {
    mocks.write.mockResolvedValue({ formula_versions: [version, { ...version, id: "draft-2" }] });
    await expect(saveFormulaDraft({ ...draft, scope_ids: ["line-1", "line-2"] })).resolves.toHaveLength(2);
    expect(mocks.write).toHaveBeenCalledWith("/formulas", { ...draft, scope_ids: ["line-1", "line-2"] });
  });

  it("updates only draft content and does not send immutable scope or audit fields", async () => {
    mocks.get.mockResolvedValue(version);
    mocks.write.mockResolvedValue(version);
    await expect(saveFormulaDraft(draft, "draft/1")).resolves.toEqual([version]);
    expect(mocks.get).toHaveBeenCalledWith("/formulas/draft%2F1");
    expect(mocks.write).toHaveBeenCalledWith("/formulas/draft%2F1", {
      name: draft.name, tokens: draft.tokens, effective_from: draft.effective_from,
    }, "PUT");
  });

  it.each(["FORMULA_VERSION_STATUS_ACTIVE", "FORMULA_VERSION_STATUS_SCHEDULED", "FORMULA_VERSION_STATUS_SUPERSEDED"])("forks %s into a new draft rather than changing immutable history", async (status) => {
    mocks.get.mockResolvedValue({ ...version, status });
    mocks.write.mockResolvedValue({ formula_versions: [version] });
    await saveFormulaDraft(draft, version.id);
    expect(mocks.write).toHaveBeenCalledWith("/formulas", draft);
  });

  it("creates a new draft when targets change instead of silently saving to the original scope", async () => {
    mocks.get.mockResolvedValue(version);
    mocks.write.mockResolvedValue({ formula_versions: [{ ...version, scope_id: "other" }] });
    const changed = { ...draft, scope_ids: ["other"] };
    await saveFormulaDraft(changed, version.id);
    expect(mocks.write).toHaveBeenCalledWith("/formulas", changed);
  });

  it("does not report a successful save when the create response contains no versions", async () => {
    mocks.write.mockResolvedValue({});
    await expect(saveFormulaDraft(draft)).rejects.toThrow("did not return");
  });

  it("updates every previously saved target when a multi-target draft is edited", async () => {
    const second = { ...version, id: "draft-2", scope_id: "line-2" };
    mocks.get.mockResolvedValueOnce(version).mockResolvedValueOnce(second);
    mocks.write.mockResolvedValueOnce(version).mockResolvedValueOnce(second);
    await expect(saveFormulaTargets({ ...draft, scope_ids: ["line-1", "line-2"] }, [version, second])).resolves.toEqual([version, second]);
    expect(mocks.write.mock.calls.map(([path]) => path)).toEqual(["/formulas/draft-1", "/formulas/draft-2"]);
  });
});
