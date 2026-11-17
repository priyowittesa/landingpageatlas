import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOnboardingSignals } from "./onboarding-signals";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => mocks }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));
const signal = (id: string, type = "insight") => ({
  id, code: `quality:rejections_spike:part:${id}`, type, confidence: 0.9,
  title: `Rejection signal ${id}`, module_name: "quality_rejection", status: "open"
});

describe("activated onboarding signals transport", () => {
  beforeEach(() => vi.resetAllMocks());

  it("uses the AI-engine endpoint and the active onboarding, without restricting to open signals", async () => {
    const abort = new AbortController().signal;
    mocks.get.mockResolvedValue({ data: { items: [signal("one")], next_page_token: "" } });
    const items = await getOnboardingSignals("onboarding", abort);
    expect(items).toHaveLength(1);
    expect(mocks.get).toHaveBeenCalledWith("/v1/ai-engine/signals", {
      params: { onboarding_id: "onboarding", is_active: true, page_size: 100 },
      signal: abort
    });
    expect(items[0]).toMatchObject({ metadata: null, metrics: null, description: "" });
  });

  it("loads every page and deduplicates signals so the summary counts are accurate", async () => {
    mocks.get.mockResolvedValueOnce({
      data: { items: [signal("one"), signal("two")], next_page_token: "next" }
    }).mockResolvedValueOnce({
      data: { items: [signal("two"), { ...signal("three", "prediction"), status: "actioned" }] }
    });
    const items = await getOnboardingSignals("onboarding");
    expect(items.map((item) => item.id)).toEqual(["one", "two", "three"]);
    expect(items[2].status).toBe("actioned");
    expect(mocks.get.mock.lastCall![1].params.page_token).toBe("next");
  });

  it("returns an actual empty feed without inserting demo records", async () => {
    mocks.get.mockResolvedValue({ data: { items: [] } });
    await expect(getOnboardingSignals("onboarding")).resolves.toEqual([]);
  });

  it("rejects repeated page tokens rather than silently showing incomplete counts", async () => {
    mocks.get.mockResolvedValue({ data: { items: [], next_page_token: "loop" } });
    await expect(getOnboardingSignals("onboarding")).rejects.toThrow("pagination");
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it("does not turn failures or invalid payloads into a successful empty feed", async () => {
    mocks.get.mockResolvedValue({ data: { data: [] } });
    await expect(getOnboardingSignals("onboarding")).rejects.toThrow();
    mocks.get.mockRejectedValue(new Error("Unavailable"));
    await expect(getOnboardingSignals("onboarding")).rejects.toThrow("Unavailable");
  });
});
