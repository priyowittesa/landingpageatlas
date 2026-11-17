import type { UseQueryOptions } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";
import { useProjectDiarySummaries } from "./useProjectDiarySummaries";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  get: vi.fn()
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: mocks.query
}));
vi.mock("@/lib/axios", () => ({
  axiosConfig: () => ({ get: mocks.get })
}));

function SummaryQuery({ enabled }: { enabled: boolean }) {
  useProjectDiarySummaries(enabled);
  return null;
}

function options(enabled = true) {
  renderToStaticMarkup(createElement(SummaryQuery, { enabled }));
  return mocks.query.mock.lastCall![0] as UseQueryOptions<DailyDiariesItem[]>;
}

function load() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return client.fetchQuery(options());
}

describe("project diary summary query", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads every page instead of presenting the first 100 diaries as totals", async () => {
    const first = { id: "first" };
    const last = { id: "last" };
    mocks.get
      .mockResolvedValueOnce({ data: { items: [first], next_page_token: "next" } })
      .mockResolvedValueOnce({ data: { items: [last], next_page_token: "" } });
    expect(await load()).toEqual([first, last]);
    expect(mocks.get.mock.calls[0]).toEqual([
      "/v1/construction-diary/diaries",
      { params: { page_size: "100", page_token: undefined }, signal: expect.any(AbortSignal) }
    ]);
    expect(mocks.get.mock.calls[1][1].params.page_token).toBe("next");
  });

  it("is disabled without projects and shares diary mutation invalidation", () => {
    expect(options(false)).toMatchObject({
      enabled: false,
      queryKey: ["getDailyDiaries", "project-summaries"]
    });
  });

  it("fails rather than showing partial totals when a later page fails", async () => {
    mocks.get
      .mockResolvedValueOnce({ data: { items: [], next_page_token: "next" } })
      .mockRejectedValueOnce(new Error("offline"));
    await expect(load()).rejects.toThrow("offline");
  });

  it("rejects repeated pagination tokens instead of looping forever", async () => {
    mocks.get.mockResolvedValue({ data: { items: [], next_page_token: "same" } });
    await expect(load()).rejects.toThrow("Unable to load all diary summary pages");
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
});
