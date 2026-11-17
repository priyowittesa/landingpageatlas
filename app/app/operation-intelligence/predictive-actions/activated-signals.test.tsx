import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivatedSignals } from "./activated-signals";

const mocks = vi.hoisted(() => ({ query: vi.fn(), fetch: vi.fn(), schedule: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.query }));
vi.mock("./onboarding-signals", () => ({ getOnboardingSignals: mocks.fetch }));
vi.mock("./onboarding-schedule", () => ({
  OnboardingSchedule: (props: unknown) => { mocks.schedule(props); return <span>Schedule controls</span>; }
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("recharts", () => ({
  Area: () => null, ComposedChart: () => null, CartesianGrid: () => null,
  Legend: () => null, Line: () => null, ResponsiveContainer: () => null,
  Tooltip: () => null, XAxis: () => null, YAxis: () => null
}));

function render(overrides: Record<string, unknown> = {}) {
  mocks.query.mockReturnValue({
    data: [], isPending: false, isError: false, refetch: vi.fn(), ...overrides
  });
  return renderToStaticMarkup(
    <ActivatedSignals scope="user:tenant" onboardingId="active-id" canManage={false} onReviewFormulas={vi.fn()} />
  );
}

describe("activated signals dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the after-generate screen with real empty counts and the formulas action", async () => {
    const html = render();
    expect(html).toContain("AI-GENERATED");
    expect(html).toContain("All AI signals");
    expect(html).toContain("Review Formula in Use");
    expect(html).toContain("No signals yet.");
    expect(html).not.toContain("Your data source is ready");
    expect(html).not.toContain("Demo signals");
    expect(mocks.schedule).toHaveBeenCalledWith({
      scope: "user:tenant", onboardingId: "active-id", canManage: false
    });
    const options = mocks.query.mock.lastCall![0];
    expect(options.queryKey).toEqual(["ai-engine", "user:tenant", "onboardings", "active-id", "signals"]);
    const signal = new AbortController().signal;
    await options.queryFn({ signal });
    expect(mocks.fetch).toHaveBeenCalledWith("active-id", signal);
  });

  it("distinguishes loading and API failures from an actual empty feed", () => {
    const loading = render({ data: undefined, isPending: true });
    expect(loading).toContain("Loading signals...");
    expect(loading).not.toContain("No signals yet.");
    const error = render({ data: undefined, isError: true });
    expect(error).toContain("Unable to load signals.");
    expect(error).toContain("Retry signals");
    expect(error).not.toContain("No signals yet.");
  });

  it("renders backend signal cards instead of local example records", () => {
    const html = render({ data: [{
      id: "quality-one", code: "quality:rejections:part:1", type: "insight",
      title: "Actual rejection spike", description: "Returned by the engine",
      module_name: "quality_rejection", status: "open", confidence: 0.9,
      metrics: null, metadata: null
    }] });
    expect(html).toContain("Actual rejection spike");
    expect(html).toContain("Returned by the engine");
    expect(html).toContain("View details");
    expect(html).not.toContain("No signals yet.");
    expect(html).not.toContain("Annulus pressure");
  });

  it("uses branding accents for recommendation cards while preserving risk colors", () => {
    const html = render({ data: [{
      id: "recommendation", code: "quality:review", type: "recommendation",
      title: "Review production", description: "Returned by the engine",
      module_name: "quality_rejection", status: "open", confidence: 0.9,
      metrics: null, metadata: { severity: "risk", value_tags: ["production"] }
    }] });
    expect(html).toContain("bg-primary-50");
    expect(html).toContain("hover:border-primary-300");
    expect(html).toContain("focus-visible:outline-primary-700");
    expect(html).toContain("group-hover:bg-primary-800");
    expect(html).toContain("bg-red-50 text-red-700");
    expect(html).not.toContain("group-hover:bg-red-800");
  });

  it("inherits the API palette without redefining it in the module stylesheet", () => {
    const css = readFileSync(new URL("./signals.css", import.meta.url), "utf8");
    expect(css).not.toMatch(/--atlas-primary-\d+\s*:/);
    expect(css).toContain("--signals-accent: var(--atlas-primary-700)");
    for (const shade of [500, 700, 800]) {
      expect(css).toContain(`var(--atlas-primary-${shade})`);
    }
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
