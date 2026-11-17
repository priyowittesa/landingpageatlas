import { beforeEach, describe, expect, it, vi } from "vitest";
import { useModuleDetail } from "./use-module-detail";

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

describe("module details", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the requested module from the detail endpoint", async () => {
    mocks.get.mockResolvedValueOnce({
      data: { id: "module-id", name: "Analytics", key: "analytics", status: "active" }
    });
    useModuleDetail("module-id", "tenant:user");
    const options = mocks.useQuery.mock.calls[0][0];
    expect(options.queryKey).toEqual(["data-access-module", "tenant:user", "module-id"]);
    expect(options.enabled).toBe(true);
    await expect(options.queryFn()).resolves.toEqual({ id: "module-id", name: "Analytics", key: "analytics" });
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/modules/module-id");
  });

  it("does not fetch without a session and rejects mismatched detail", async () => {
    useModuleDetail("module-id", null);
    expect(mocks.useQuery.mock.calls[0][0].enabled).toBe(false);
    mocks.get.mockResolvedValueOnce({ data: { id: "other", name: "Other", key: "other" } });
    await expect(mocks.useQuery.mock.calls[0][0].queryFn()).rejects.toThrow("does not match");
  });
});
