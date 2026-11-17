import { describe, expect, it, vi } from "vitest";
import CapacityAnalyticPage from "./page";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

describe("Capacity Analytic entry", () => {
  it("opens the dashboard rather than skipping to an analysis screen", () => {
    CapacityAnalyticPage();
    expect(redirect).toHaveBeenCalledWith("/app/capacity-analytic/dashboard");
  });
});
