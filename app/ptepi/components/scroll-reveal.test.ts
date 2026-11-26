import { describe, expect, it } from "vitest";
import { nextScrollReveal } from "./scroll-reveal";

describe("screen header on scroll", () => {
  const shown = { hidden: false, anchorY: 300 };

  it("hides on the way down and returns on the way up", () => {
    const down = nextScrollReveal(shown, 340);
    expect(down.hidden).toBe(true);
    expect(nextScrollReveal(down, 320).hidden).toBe(false);
  });

  it("always shows near the top and ignores tiny movements", () => {
    expect(nextScrollReveal({ hidden: true, anchorY: 120 }, 40).hidden).toBe(false);
    expect(nextScrollReveal(shown, 304)).toBe(shown);
  });
});
