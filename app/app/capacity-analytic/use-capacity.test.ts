import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCapacityMutation, useCapacityOptions, useCapacityPreview, useCapacityQuery } from "./use-capacity";
import { canManageCapacity } from "./permissions";

type QueryOptions = { queryKey: readonly unknown[]; enabled: boolean; retry: boolean; queryFn: (context: { signal: AbortSignal }) => Promise<unknown> };
type MutationOptions = { mutationFn: (variables: unknown) => Promise<unknown>; retry: boolean; onSuccess: () => Promise<unknown> };
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), get: vi.fn(), all: vi.fn(), write: vi.fn(), invalidate: vi.fn(),
  query: vi.fn<(options: QueryOptions) => unknown>(),
  mutation: vi.fn<(options: MutationOptions) => object>(),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/app/capacity-analytic/dashboard" }));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.auth }));
vi.mock("./api", () => ({ capacityGet: mocks.get, capacityListAll: mocks.all, capacityWrite: mocks.write }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.query, useMutation: mocks.mutation,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
function profile(access = "full_access", tenant = "tenant-1") {
  return {
    isFetchedAfterMount: true, isError: false,
    data: { user_id: "user-1", tenant_id: tenant, rbac: { modules: [
      { id: "capacity", key: "capacity-analytic", name: "Capacity Analytic", href: "capacity-analytic", access_level: access },
    ] } },
  };
}

describe("scoped capacity queries and mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockReturnValue(profile());
    mocks.mutation.mockReturnValue({});
    mocks.invalidate.mockResolvedValue(undefined);
  });

  it("keys queries by user, tenant, path and applied filters and forwards cancellation", async () => {
    const params = { year: 2026, month: 11, "filter.line_id": "line-1" };
    useCapacityQuery("/capacity/dashboard", params);
    const options = mocks.query.mock.lastCall![0];
    expect(options).toMatchObject({ queryKey: ["capacity-analytic", "user-1:tenant-1", "/capacity/dashboard", params], enabled: true, retry: false });
    const signal = new AbortController().signal;
    await options.queryFn({ signal });
    expect(mocks.get).toHaveBeenCalledWith("/capacity/dashboard", params, signal);
    expect(mocks.auth).toHaveBeenCalledWith("/app/capacity-analytic/dashboard");
    mocks.auth.mockReturnValue(profile("full_access", "tenant-2"));
    useCapacityQuery("/capacity/dashboard", params);
    expect(mocks.query.mock.lastCall![0].queryKey[1]).toBe("user-1:tenant-2");
  });

  it("does not fetch analytics before access has been refreshed or when required filters are absent", () => {
    mocks.auth.mockReturnValue({ ...profile(), isFetchedAfterMount: false });
    useCapacityQuery("/capacity/dashboard");
    expect(mocks.query.mock.lastCall![0].enabled).toBe(false);
    mocks.auth.mockReturnValue(profile());
    useCapacityQuery("/capacity/trend", {}, false);
    expect(mocks.query.mock.lastCall![0].enabled).toBe(false);
  });

  it("loads every selector page with its filters and abort signal", async () => {
    useCapacityOptions("/production-lines", { product_id: "product-1" });
    const signal = new AbortController().signal;
    await mocks.query.mock.lastCall![0].queryFn({ signal });
    expect(mocks.all).toHaveBeenCalledWith("/production-lines", { product_id: "product-1" }, signal);
  });

  it("invalidates only the current user's tenant module after a successful write", async () => {
    const write = vi.fn().mockResolvedValue({ id: "saved" });
    useCapacityMutation(write);
    const options = mocks.mutation.mock.lastCall![0];
    await options.mutationFn({ qty: 100 });
    await options.onSuccess();
    expect(write).toHaveBeenCalledWith({ qty: 100 });
    expect(options.retry).toBe(false);
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["capacity-analytic", "user-1:tenant-1"] });
  });

  it.each(["view_only", "no_access", "unexpected"])("blocks writes for %s", async (level) => {
    mocks.auth.mockReturnValue(profile(level));
    const write = vi.fn();
    const result = useCapacityMutation(write);
    expect(result.canManage).toBe(false);
    expect(() => mocks.mutation.mock.lastCall![0].mutationFn({})).toThrow("permission");
    expect(write).not.toHaveBeenCalled();
  });

  it("uses read-only POST query keys for validation without invalidating analytics", async () => {
    const body = { tokens: [{ type: "number", number: 1 }] };
    useCapacityPreview("/formulas/validate", body);
    const options = mocks.query.mock.lastCall![0];
    expect(options.queryKey).toEqual(["capacity-analytic", "user-1:tenant-1", "/formulas/validate", body]);
    await options.queryFn({ signal: new AbortController().signal });
    expect(mocks.write).toHaveBeenCalledWith("/formulas/validate", body);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("does not grant editing based on a view-only module or an unrelated module", () => {
    expect(canManageCapacity(profile("ACCESS_LEVEL_EDIT").data.rbac.modules)).toBe(true);
    expect(canManageCapacity(profile("ACCESS_LEVEL_VIEW_ONLY").data.rbac.modules)).toBe(false);
    expect(canManageCapacity([{ ...profile().data.rbac.modules[0], key: "other", href: "other" }])).toBe(false);
  });
});
