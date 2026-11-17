import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyAppearance, generatePrimaryScale, PRIMARY_STEPS } from "./appearance";
import { getPortalBranding } from "./branding-api";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => mocks }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const primaryScale = generatePrimaryScale("#087f5b");
const branding = {
  primary_color: primaryScale[500],
  primary_color_scale: Object.fromEntries(
    PRIMARY_STEPS.map((step) => [String(step), primaryScale[step]])
  ),
  primary_font_family: "Arial"
};

describe("portal branding theme", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    { name: "direct", payload: branding },
    { name: "data envelope", payload: { data: branding } },
    { name: "nested branding", payload: { data: { branding } } }
  ])("applies the full palette from a $name GET response", async ({ payload }) => {
    mocks.get.mockResolvedValueOnce({ data: payload });
    const settings = await getPortalBranding();
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/branding");
    expect(settings).toEqual({ primaryScale, fontFamily: "Arial" });

    const setProperty = vi.fn();
    vi.stubGlobal("document", {
      documentElement: { style: { setProperty } }
    });
    applyAppearance(settings);
    for (const step of PRIMARY_STEPS) {
      expect(setProperty).toHaveBeenCalledWith(
        `--atlas-primary-${step}`, primaryScale[step]
      );
    }
    expect(setProperty).toHaveBeenCalledWith("--primary", branding.primary_color);
  });
});
