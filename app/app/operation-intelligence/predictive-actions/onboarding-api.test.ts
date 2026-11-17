import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activateOnboarding, createOnboarding, errorMessage, getIndustryPack,
  getLatestOnboarding, getOnboarding, getOnboardingFormulas, getOpenSignalCounts,
  OnboardingStateChanged, regenerateOnboarding
} from "./onboarding-api";
import { mapOnboardingFormulas } from "./onboarding-formulas";
import { canManageOnboarding } from "./onboarding-permissions";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => mocks }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const base = "/v1/ai-engine/onboardings";
const record = {
  id: "onboarding-1", tenant_id: "tenant-from-token", name: "Example Company",
  status: "ready", version: 7, is_active: false,
  industry_pack_id: "pack-1", industry_pack_version: "0.1.0",
  datastore_connection_id: "existing-connection",
  modules: ["production"], datasets: { production: { table: "field_production" } },
  metrics: [{ id: "metric" }], detectors: [{ id: "decline" }],
  actions: [{ id: "action" }], generation: { pack_generated: true },
  future_configuration: { preserved: true }
};
const envelope = (data: unknown) => ({ data: { data, meta: { warnings: [] } } });
const error = (code: string, status: number) => ({
  response: { status, data: { error: { code, message: "Backend message" } } }
});

describe("AI-engine onboarding transport", () => {
  beforeEach(() => vi.resetAllMocks());

  it("selects the newest onboarding from the wrapped list", async () => {
    const signal = new AbortController().signal;
    mocks.get.mockResolvedValue({ data: { data: [record], next_page_token: "" } });
    await expect(getLatestOnboarding(signal)).resolves.toEqual(record);
    expect(mocks.get).toHaveBeenCalledWith(base, { params: { page_size: 1 }, signal });
    mocks.get.mockResolvedValue({ data: { data: [] } });
    await expect(getLatestOnboarding()).resolves.toBeNull();
  });

  it("does not turn invalid responses or network failures into an empty state", async () => {
    mocks.get.mockResolvedValue({ data: { items: [] } });
    await expect(getLatestOnboarding()).rejects.toThrow();
    mocks.get.mockRejectedValue(error("AI_ENGINE_UNAVAILABLE", 502));
    await expect(getLatestOnboarding()).rejects.toMatchObject({ response: { status: 502 } });
  });

  it("creates with only the name and generate flag, never a tenant or connection override", async () => {
    mocks.post.mockResolvedValue(envelope({ id: "new", status: "generating", version: 1 }));
    await expect(createOnboarding("Example Company")).resolves.toMatchObject({ record: { status: "generating" } });
    expect(mocks.post).toHaveBeenCalledWith(base, { name: "Example Company", generate: true });
  });

  it("regenerates with an empty body", async () => {
    mocks.post.mockResolvedValue(envelope({ ...record, status: "generating" }));
    await regenerateOnboarding(record.id);
    expect(mocks.post).toHaveBeenCalledWith(`${base}/${record.id}/regenerate`);
  });

  it("passes cancellation and safely encodes detail identifiers", async () => {
    const signal = new AbortController().signal;
    mocks.get.mockResolvedValue(envelope({ ...record, id: "a/b" }));
    await getOnboarding("a/b", signal);
    expect(mocks.get).toHaveBeenCalledWith(`${base}/a%2Fb`, { signal });
  });

  it("rejects mismatched onboarding identifiers", async () => {
    mocks.get.mockResolvedValue(envelope({ ...record, id: "different" }));
    await expect(getOnboarding(record.id)).rejects.toThrow("does not match");
  });

  it("activates with a freshly fetched, complete replacement and its latest version", async () => {
    mocks.get.mockResolvedValue(envelope(record));
    mocks.put.mockResolvedValue({
      data: { data: { ...record, is_active: true, version: 8 }, meta: { warnings: [{ message: "Non-blocking warning" }] } }
    });
    const result = await activateOnboarding(record.id);
    const { tenant_id, ...configuration } = record;
    expect(tenant_id).toBeDefined();
    expect(mocks.get).toHaveBeenCalledWith(`${base}/${record.id}`, { signal: undefined });
    expect(mocks.put).toHaveBeenCalledWith(`${base}/${record.id}`, { ...configuration, is_active: true });
    expect(result.record.version).toBe(8);
    expect(result.warnings).toEqual(["Non-blocking warning"]);
  });

  it("never replaces a full configuration with sparse list data", async () => {
    mocks.get.mockResolvedValue(envelope({
      id: record.id, status: "ready", name: record.name, version: 7
    }));
    await expect(activateOnboarding(record.id)).rejects.toThrow("incomplete");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("still sends PUT when optional collections are omitted or the backend connection value is empty", async () => {
    const current: Record<string, unknown> = { ...record, datastore_connection_id: "" };
    delete current.metrics;
    delete current.actions;
    mocks.get.mockResolvedValue(envelope(current));
    mocks.put.mockResolvedValue(envelope({ ...current, is_active: true, version: 8 }));
    await activateOnboarding(record.id);
    const expected: Record<string, unknown> = { ...current, is_active: true };
    delete expected.tenant_id;
    expect(mocks.put).toHaveBeenCalledWith(`${base}/${record.id}`, expected);
    expect(mocks.put.mock.lastCall![1]).not.toHaveProperty("metrics");
    expect(mocks.put.mock.lastCall![1]).not.toHaveProperty("actions");
  });

  it("does not invent an optimistic-lock version when the full response omits it", async () => {
    const current: Record<string, unknown> = { ...record };
    delete current.version;
    mocks.get.mockResolvedValue(envelope(current));
    await expect(activateOnboarding(record.id)).rejects.toThrow("version");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("preserves a changed generation status rather than activating it", async () => {
    mocks.get.mockResolvedValue(envelope({ ...record, status: "generating" }));
    await expect(activateOnboarding(record.id)).rejects.toBeInstanceOf(OnboardingStateChanged);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("does not repeat an activation already completed elsewhere", async () => {
    mocks.get.mockResolvedValue(envelope({ ...record, is_active: true }));
    await expect(activateOnboarding(record.id)).resolves.toMatchObject({ record: { is_active: true } });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("loads pack metadata and forwarded formula data through their data envelopes", async () => {
    mocks.get.mockResolvedValueOnce(envelope({ name: "Manufacturing", version: "0.1.0" }));
    await expect(getIndustryPack("pack/1")).resolves.toEqual({ name: "Manufacturing", version: "0.1.0" });
    expect(mocks.get).toHaveBeenCalledWith("/v1/ai-engine/industry-packs/pack%2F1", { signal: undefined });
    mocks.get.mockResolvedValueOnce(envelope({ onboarding_id: record.id, detectors: [{ id: "decline" }] }));
    await expect(getOnboardingFormulas(record.id)).resolves.toMatchObject({ detectors: [{ id: "decline" }] });
    expect(mocks.get).toHaveBeenLastCalledWith(`${base}/${record.id}/formulas`, { signal: undefined });
  });

  it("follows legacy signal pagination and counts each signal only once", async () => {
    const signal = new AbortController().signal;
    mocks.get.mockResolvedValueOnce({ data: {
      items: [{ id: "1", code: "production:decline:field:1" }], next_page_token: "next"
    } }).mockResolvedValueOnce({ data: {
      items: [
        { id: "1", code: "production:decline:field:1" },
        { id: "2", code: "production:decline:field:2" },
        { id: "3", code: "reserves:rp:field:1" }
      ], next_page_token: ""
    } });
    await expect(getOpenSignalCounts(record.id, signal)).resolves.toEqual({ decline: 2, rp: 1 });
    expect(mocks.get).toHaveBeenLastCalledWith("/v1/ai-engine/signals", {
      params: { onboarding_id: record.id, status: "open", is_active: true, page_size: 100, page_token: "next" }, signal
    });
  });

  it("rejects repeated page tokens instead of presenting partial signal counts", async () => {
    mocks.get.mockResolvedValue({ data: { items: [], next_page_token: "repeated" } });
    await expect(getOpenSignalCounts(record.id)).rejects.toThrow("Counts are unavailable");
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it("includes validation paths and provides actionable version-conflict messages", () => {
    expect(errorMessage({ response: { status: 422, data: { error: {
      code: "VALIDATION_FAILED", message: "Invalid configuration",
      details: [{ path: "detectors[0].params.threshold", message: "must be > 0" }]
    } } } }, "Fallback")).toContain("detectors[0].params.threshold: must be > 0");
    expect(errorMessage(error("VERSION_CONFLICT", 409), "Fallback")).toContain("Review the refreshed configuration");
  });
});

describe("forwarded engine formula mapping", () => {
  it("handles the live production detector's nested parameters and daily-to-yearly rollup", () => {
    const [formula] = mapOnboardingFormulas([{
      enabled: true, id: "production_yoy_decline", version: "1.0.0",
      module: "production_performance", module_label: "Production Performance",
      inputs: [{
        column: "bore_oil_vol", name: "field", ref: "production.net_oe",
        rollup: { aggregate: "sum", from: "day", to: "year" },
        table: "volve_production_data", unit: "mill Sm3"
      }],
      params: {
        confidence: { high: 0.9, low: 0.75, min_history_periods: 5 },
        priority: { decline_weight: 0.5, share_cap: 0.5, share_weight: 10 },
        min_value: 0.1, risk_multiplier: 2, threshold: 0.15
      },
      signal_when: "production.net_oe in the last complete year is at least 15% below the year before.",
      skip_rule: "previous < min_value, or no value in the current period",
      steps: [{ step: "condition", expression: "change <= -threshold" }],
      template: "period_decline", type: "insight"
    }]);
    expect(formula.parameters).toEqual(expect.arrayContaining([
      ["confidence.high", "0.9"], ["confidence.low", "0.75"],
      ["confidence.min_history_periods", "5"], ["priority.decline_weight", "0.5"],
      ["priority.share_cap", "0.5"], ["priority.share_weight", "10"], ["threshold", "0.15"]
    ]));
    expect(formula.data).toContainEqual(["From", "table volve_production_data · column bore_oil_vol"]);
    expect(formula.data).toContainEqual(["Rollup", "sum · day to year"]);
    expect(formula.version).toBe("1.0.0");
    expect(formula.calculations).toEqual([["condition", "change <= -threshold"]]);
  });

  it("renders engine inputs, expressions, parameters, steps, version and disabled state", () => {
    const [formula] = mapOnboardingFormulas([{
      id: "production_yoy_decline", version: "2.0", module: "production_performance", enabled: false,
      signal_when: "Production falls", inputs: [
        { name: "field", ref: "production.net_oe", unit: "mill Sm3", table: "production", column: "net" },
        { name: "ratio", ref: "reserves.remaining", table: "reserves", expr: "coalesce(oil, 0)" }
      ], params: { threshold: 0.15, include_current: false },
      steps: [{ step: "change", expression: "(current - previous) / previous" }], skip_rule: "previous < min_value"
    }], { production_yoy_decline: 3 });
    expect(formula).toMatchObject({
      title: "Production yoy decline", category: "Production performance", version: "2.0",
      enabled: false, openSignals: 3, condition: "Production falls",
      note: "Not evaluated when previous < min_value"
    });
    expect(formula.data).toContainEqual(["field", "production.net_oe (mill Sm3)"]);
    expect(formula.data).toContainEqual(["From", "table reserves · expr coalesce(oil, 0)"]);
    expect(formula.parameters).toContainEqual(["include_current", "false"]);
    expect(formula.calculations).toEqual([["change", "(current - previous) / previous"]]);
  });

  it("tolerates absent fields and distinguishes unavailable counts from zero", () => {
    expect(mapOnboardingFormulas([{ id: "rp_low" }])[0]).toMatchObject({
      title: "Rp low", openSignals: undefined, data: [], calculations: [], parameters: []
    });
    expect(mapOnboardingFormulas([{ id: "rp_low", name: "Real title" }], {})[0]).toMatchObject({ title: "Real title", openSignals: 0 });
    expect(() => mapOnboardingFormulas([null, { inputs: [null], params: null, steps: [null] }])).not.toThrow();
  });
});

describe("onboarding write permission", () => {
  it.each(["edit", "full_access", "ACCESS_LEVEL_EDIT", "ACCESS_LEVEL_FULL_ACCESS"])(
    "permits generation and activation with %s",
    (access_level) => {
      expect(canManageOnboarding([{
        id: "parent", key: "operation-inteliggence", name: "Operation Intelligence", href: "operation-intelligence",
        sub_modules: [{ id: "child", key: "predictive-actions", name: "Predictive Actions", href: "predictive-actions", access_level }]
      }])).toBe(true);
    }
  );
  it.each([undefined, "view_only", "no_access", "unknown"])("rejects writes without edit access: %s", (access_level) => {
    expect(canManageOnboarding([{
      id: "parent", key: "operation-inteliggence", name: "Operation Intelligence", href: "operation-intelligence",
      sub_modules: [{ id: "child", key: "predictive-actions", name: "Predictive Actions", href: "predictive-actions", access_level }]
    }])).toBe(false);
  });
});
