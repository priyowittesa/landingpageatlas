import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SignalFormula } from "./signal-formula";
import { SignalsResults } from "./signals-results";
import type { ApiSignal } from "./use-signals";

const mocks = vi.hoisted(() => ({ selected: null as ApiSignal | null }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const state = actual.useState(initial);
      return initial === null ? [mocks.selected, state[1]] : state;
    },
  };
});
vi.mock("./design-icon", () => ({ DesignIcon: () => null }));
vi.mock("recharts", () => ({
  Area: () => null, ComposedChart: () => null, CartesianGrid: () => null,
  Legend: () => null, Line: () => null, ResponsiveContainer: () => null,
  Tooltip: () => null, XAxis: () => null, YAxis: () => null,
}));
vi.mock("@/components/ui/dialog", () => {
  const Content = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return {
    Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? children : null,
    DialogContent: Content, DialogDescription: Content, DialogTitle: Content,
  };
});

const formula = {
  detector: "rejection_drop_anomaly",
  inputs: [{
    name: "field", ref: "rejections.qty_ng", source: "column qty_ng",
    table: "d8f1956938bb6485", unit: "pcs",
  }],
  params: {
    confidence: { high: 0.85, low: 0.7, min_history_periods: 4 },
    min_value: 50,
    priority: { decline_weight: 0.7, share_cap: 0.5, share_weight: 20 },
    risk_multiplier: 1.5,
    threshold: 0.5,
  },
  skip_rule: "previous < min_value, or no value in the current period",
  steps: [
    {
      calculation: "(4540 - 10935) / 10935",
      expression: "(current - previous) / previous",
      result: "-0.5848", step: "change",
    },
    {
      calculation: "-0.5848 <= -0.5", expression: "change <= -threshold",
      result: "true", step: "condition",
    },
    {
      calculation: "0.5848 >= 1.5 * 0.5 = 0.75",
      expression: "risk if -change >= risk_multiplier * threshold, else watch",
      result: "watch", step: "severity",
    },
    {
      calculation: "11 >= 4",
      expression: "confidence.high if periods of history >= confidence.min_history_periods, else confidence.low",
      result: "0.85", step: "confidence",
    },
    {
      calculation: "share = 10935 / 322169 = 0.0339; min(1, 0.5848 * 0.7 + min(0.0339 * 20, 0.5))",
      expression: "min(1, -change * priority.decline_weight + min(share * priority.share_weight, priority.share_cap)), share = previous / sum of current over all entities",
      result: "0.9094", step: "priority",
    },
  ],
  template: "period_decline",
  version: "1.0.0",
};

describe("Signal formula details", () => {
  it("renders nested inputs, parameters, ordered calculations, and results instead of a JSON blob", () => {
    const html = renderToStaticMarkup(<SignalFormula value={formula} />);
    for (const value of [
      "Formula Calculation", "rejection_drop_anomaly", ">inputs</dt>", "Parameters",
      "rejections.qty_ng", "d8f1956938bb6485", "min history periods",
      "skip rule", ">steps</dt>", "(4540 - 10935) / 10935", "-0.5848 &lt;= -0.5",
      "watch", "0.9094", "period_decline", "1.0.0",
    ]) expect(html).toContain(value);
    expect(html.match(/<ol /g)).toHaveLength(2);
    expect(html.indexOf(">change<")).toBeLessThan(html.indexOf(">condition<"));
    expect(html).not.toContain("&quot;detector&quot;");
    expect(html).not.toContain("[object Object]");
    expect(html).toContain("wrap-anywhere");
  });

  it("preserves zero, false, null, empty collections, and unknown fields", () => {
    const html = renderToStaticMarkup(
      <SignalFormula value={{ custom: { zero: 0, enabled: false, missing: null, extra: [] } }} />,
    );
    expect(html).toContain(">0</span>");
    expect(html).toContain(">false</span>");
    expect(html).toContain(">-</span>");
    expect(html).toContain(">None</span>");
    expect(html).toContain("custom");
  });

  it("does not render a section when no formula was returned", () => {
    expect(renderToStaticMarkup(<SignalFormula value={undefined} />)).toBe("");
    expect(renderToStaticMarkup(<SignalFormula value={null} />)).toBe("");
  });

  it("renders API strings as text, never as HTML", () => {
    const html = renderToStaticMarkup(<SignalFormula value={{ expression: "<script>alert(1)</script>" }} />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("integrates with signal details without duplicating the generic formula metadata row", () => {
    mocks.selected = {
      id: "signal-1", code: "rejections:drop", type: "insight", status: "open",
      title: "Rejection drop", description: "", reason_nexa: "", suggested_action: "",
      module_name: "quality", confidence: 0.85, metrics: null,
      metadata: { formula, custom_context: "Keep this context" },
      created_at: "", created_by: "", updated_at: "", updated_by: "", tenant_id: "",
    };
    const html = renderToStaticMarkup(
      <SignalsResults signals={[mocks.selected]} onReviewFormulas={vi.fn()} />,
    );
    expect(html.match(/aria-label="Formula calculation"/g)).toHaveLength(1);
    expect(html).toContain("Keep this context");
    expect(html).not.toContain("&quot;detector&quot;");
    mocks.selected = null;
  });
});
