import { describe, expect, it } from "vitest";
import { formatPercentAxis, formatPercentFromFraction, formatRupiahCompact } from "./formatters";

describe("chart formatters", () => {
  it("formats Rupiah compactly", () => {
    expect(formatRupiahCompact(239_270_000)).toBe("Rp 239,3 m");
    expect(formatRupiahCompact(1_080_000_000)).toBe("Rp 1,08 bn");
    expect(formatRupiahCompact(6_683_144_041)).toBe("Rp 6,68 bn");
    expect(formatRupiahCompact(-47_000_000)).toBe("-Rp 47 m");
    expect(formatRupiahCompact(8_500)).toBe("Rp 8,5 k");
    expect(formatRupiahCompact(0)).toBe("Rp 0");
  });

  it("formats a fraction as a percent", () => {
    expect(formatPercentFromFraction(0.28498, 3)).toBe("28,498%");
    expect(formatPercentFromFraction(0.28498)).toBe("28,5%");
    expect(formatPercentFromFraction(1, 0)).toBe("100%");
  });

  it("formats an axis tick in points", () => {
    expect(formatPercentAxis(73.487)).toBe("73%");
    expect(formatPercentAxis(100)).toBe("100%");
  });
});
