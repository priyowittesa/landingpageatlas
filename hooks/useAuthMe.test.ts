import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/types/api";
import { useAuthMe } from "./useAuthMe";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  useQuery: vi.fn<(options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<unknown>;
    staleTime?: number;
    refetchOnMount?: string;
  }) => unknown>()
}));
vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

describe("current-user access queries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves the existing profile query for ordinary callers", () => {
    useAuthMe();
    expect(mocks.useQuery.mock.lastCall![0].queryKey).toEqual(queryKeys.user.me());
  });

  it("refetches permissions per route and supports profile invalidation", async () => {
    useAuthMe("/app/inspection/templates");
    const options = mocks.useQuery.mock.lastCall![0];
    expect(options.queryKey).toEqual([
      ...queryKeys.user.me(), "route-access", "/app/inspection/templates"
    ]);
    expect(options.staleTime).toBe(0);
    expect(options.refetchOnMount).toBe("always");
    mocks.get.mockResolvedValue({ data: { data: { user_id: "user" } } });
    await expect(options.queryFn()).resolves.toEqual({ user_id: "user" });
    expect(mocks.get).toHaveBeenCalledWith("/v1/auth/me");
  });
});