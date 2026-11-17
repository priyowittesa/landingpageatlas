import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormulasDialog } from "./formulas-dialog";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.query }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({}) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? <section>{children}</section> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogClose: ({ children }: { children: ReactNode }) => <button>{children}</button>
}));

const id = "46079853-882c-45f7-abe6-12923fa26b72";
const payload = {
  onboarding_id: id, onboarding_version: 52,
  detectors: [{
    id: "production_yoy_decline", version: "1.0.0", enabled: true,
    module: "production_performance", module_label: "Production Performance",
    inputs: [{
      column: "bore_oil_vol", name: "field", ref: "production.net_oe",
      rollup: { aggregate: "sum", from: "day", to: "year" },
      table: "volve_production_data", unit: "mill Sm3"
    }],
    params: {
      confidence: { high: 0.9, low: 0.75, min_history_periods: 5 },
      priority: { decline_weight: 0.5, share_cap: 0.5, share_weight: 10 },
      threshold: 0.15
    },
    signal_when: "Production declines",
    steps: [{ step: "condition", expression: "change <= -threshold" }],
    skip_rule: "previous < min_value", template: "period_decline"
  }]
};

function render() {
  return renderToStaticMarkup(
    <FormulasDialog
      open scope="user:tenant" onboarding={{ id, status: "ready", name: "Example Company", version: 51 }}
      onOpenChange={vi.fn()} onMissing={vi.fn()}
    />
  );
}

describe("live formula response rendering", () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.query.mockReturnValueOnce({ data: payload, isSuccess: true })
      .mockReturnValueOnce({ data: { production_yoy_decline: 2 } });
  });

  it("renders API versions, nested parameter chips and rollup metadata from the supplied payload", () => {
    const html = render();
    const text = html.replace(/<[^>]*>/g, "");
    expect(text).toContain("onboarding v52");
    expect(text).toContain("Detector production_yoy_decline v1.0.0");
    expect(text).toContain("confidence.min_history_periods");
    expect(text).toContain("priority.share_cap");
    expect(text).toContain("sum · day to year");
    expect(text).toContain("table volve_production_data · column bore_oil_vol");
    expect(text).toContain("2 open signals");
    expect(html).toContain("change &lt;= -threshold");
    expect(text).not.toContain("Pertamina upstream");
  });

  it("does not substitute a fake zero when open signal counts cannot be fetched", () => {
    mocks.query.mockReset();
    mocks.query.mockReturnValueOnce({ data: payload, isSuccess: true })
      .mockReturnValueOnce({ isError: true, refetch: vi.fn() });
    const text = render().replace(/<[^>]*>/g, "");
    expect(text).toContain("Signal count unavailable");
    expect(text).not.toContain("0 open signals");
  });

  it("uses the portal palette for formula card borders", () => {
    const html = render();
    expect(html).toContain("border-primary-200");
    expect(html).not.toContain("border-[#d5c4ff]");
  });
});
