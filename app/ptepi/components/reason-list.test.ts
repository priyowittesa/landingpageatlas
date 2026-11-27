import { describe, expect, it } from "vitest";
import { isListedInReason, splitReason } from "./reason-list";

const MOS =
  "Material On Site (MOS): 20 kV Substation: BA not in the register (due by plan); Panel LVMDP: BA not in the register (due by plan); Other Works: BA not in the register (due by plan).";

describe("long reasons as lists", () => {
  it("splits the clauses and lifts the stage name out as the lead", () => {
    const parts = splitReason(MOS);
    expect(parts?.lead).toBe("Material On Site (MOS)");
    expect(parts?.items).toHaveLength(3);
    expect(parts?.items[0]).toBe("20 kV Substation: BA not in the register (due by plan).");
  });

  it("has no lead when every clause stands alone", () => {
    expect(splitReason("Cost above RAP; BAMK still draft; 2 Tagihan held")?.lead).toBeNull();
  });

  it("keeps short reasons as a sentence", () => {
    expect(splitReason("Cost above RAP; BAMK still draft.")).toBeNull();
  });

  it("recognises evidence lines that only repeat the list", () => {
    expect(isListedInReason(MOS, ["Panel LVMDP: BA not in the register."])).toBe(true);
    expect(isListedInReason(MOS, ["Panel SVGm: PO Vendor not in the register."])).toBe(false);
    expect(isListedInReason(MOS, [])).toBe(false);
  });
});
