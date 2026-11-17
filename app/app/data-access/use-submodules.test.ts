import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSubmodules } from "./use-submodules";

type QueryOptions = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
  enabled: boolean;
};

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  useQuery: vi.fn<(options: QueryOptions) => unknown>()
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

describe("submodule catalog", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads every page using the edited module as parent_id", async () => {
    mocks.get
      .mockResolvedValueOnce({
        data: {
          items: [{ id: "one", name: "Non Conformance", key: "non-conformance", parent_id: "parent" }],
          next_page_token: "next"
        }
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: "two", name: "Run Inspection", key: "inspection-feature", parent_id: "parent" }],
          next_page_token: ""
        }
      });
    useSubmodules("parent", "tenant:user");
    const query = mocks.useQuery.mock.calls[0][0];
    expect(query.queryKey).toEqual(["data-access-submodules", "tenant:user", "parent"]);
    expect(query.enabled).toBe(true);
    await expect(query.queryFn()).resolves.toEqual([
      { id: "one", name: "Non Conformance", key: "non-conformance", parent_id: "parent" },
      { id: "two", name: "Run Inspection", key: "inspection-feature", parent_id: "parent" }
    ]);
    expect(mocks.get.mock.calls).toEqual([
      ["/v1/portal/modules", { params: { parent_id: "parent" } }],
      ["/v1/portal/modules", { params: { parent_id: "parent", page_token: "next" } }]
    ]);
  });

  it("supports an empty result and waits for an authenticated scope", async () => {
    mocks.get.mockResolvedValueOnce({ data: { items: [], next_page_token: "" } });
    useSubmodules("parent", null);
    const query = mocks.useQuery.mock.calls[0][0];
    expect(query.enabled).toBe(false);
    expect(mocks.get).not.toHaveBeenCalled();
    await expect(query.queryFn()).resolves.toEqual([]);
  });

  it("rejects malformed responses and repeated page tokens", async () => {
    useSubmodules("parent", "tenant:user");
    const query = mocks.useQuery.mock.calls[0][0];
    mocks.get.mockResolvedValueOnce({ data: { items: null } });
    await expect(query.queryFn()).rejects.toThrow();
    mocks.get.mockResolvedValue({ data: { items: [], next_page_token: "same" } });
    await expect(query.queryFn()).rejects.toThrow("repeated page token");
  });
});
