import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type QueryOptions = {
  queryKey: readonly unknown[];
  queryFn: () => unknown;
  enabled: boolean;
};

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  useAuthMe: vi.fn(),
  refetchCatalog: vi.fn(),
  refetchSession: vi.fn(),
  useQuery: vi.fn<(options: QueryOptions) => unknown>(),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.useAuthMe }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

import { useDataAccess } from "./use-data-access";

const catalog = [
  {
    id: "parent", name: "Asset Management", key: "asset-management",
    is_menu: true, is_configured: false, updated_at: "2026-09-30T03:51:29.548912Z"
  },
  {
    id: "child", name: "Asset List", key: "asset-list", parent_id: "parent",
    is_menu: false, is_configured: true, updated_at: "2026-09-30T03:51:16.817136Z"
  }
];

describe("useDataAccess catalog integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuthMe.mockReturnValue({
      data: { user_id: "user", tenant_id: "tenant" },
      isLoading: false, error: null, refetch: mocks.refetchSession
    });
    mocks.useQuery.mockReturnValue({
      data: catalog, isLoading: false, error: null, refetch: mocks.refetchCatalog
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("requests the portal endpoint and follows its page token", async () => {
    mocks.get
      .mockResolvedValueOnce({ data: { items: [catalog[0]], next_page_token: "next" } })
      .mockResolvedValueOnce({ data: { items: [catalog[1]], next_page_token: "" } });
    const result = useDataAccess();
    const catalogQuery = mocks.useQuery.mock.calls[0][0];

    expect(catalogQuery.queryKey).toEqual(["data-access-catalog", "tenant:user"]);
    expect(catalogQuery.enabled).toBe(true);
    expect(result.data?.modules).toEqual([{ ...catalog[0], subModules: [catalog[1]] }]);
    await expect(catalogQuery.queryFn()).resolves.toEqual(catalog);
    expect(mocks.get.mock.calls).toEqual([
      ["/v1/portal/modules", { params: undefined }],
      ["/v1/portal/modules", { params: { page_token: "next" } }]
    ]);
  });

  it("does not read or overwrite browser preview data", () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error("Storage is unavailable"); }),
      setItem: vi.fn()
    };
    vi.stubGlobal("localStorage", storage);

    expect(useDataAccess().data?.modules[0].is_configured).toBe(false);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("waits for an authenticated scope and retries the session when it is missing", () => {
    mocks.useAuthMe.mockReturnValueOnce({ isLoading: true, refetch: mocks.refetchSession });
    const result = useDataAccess();
    expect(mocks.useQuery.mock.calls[0][0].enabled).toBe(false);
    expect(result.isLoading).toBe(true);
    expect(mocks.get).not.toHaveBeenCalled();
    result.refetch();
    expect(mocks.refetchSession).toHaveBeenCalledOnce();
  });

  it("exposes catalog failures and refetches the API rather than local storage", () => {
    const error = new Error("Offline");
    mocks.useQuery.mockReturnValueOnce({
      data: undefined, isLoading: false, error, refetch: mocks.refetchCatalog
    });
    const result = useDataAccess();
    expect(result.data).toBeUndefined();
    expect(result.error).toBe(error);
    result.refetch();
    expect(mocks.refetchCatalog).toHaveBeenCalledOnce();
  });

  it("prioritizes session errors and retries authentication", () => {
    const error = new Error("Session expired");
    mocks.useAuthMe.mockReturnValueOnce({
      isLoading: false, error, refetch: mocks.refetchSession
    });
    const result = useDataAccess();
    expect(result.error).toBe(error);
    result.refetch();
    expect(mocks.refetchSession).toHaveBeenCalledOnce();
    expect(mocks.refetchCatalog).not.toHaveBeenCalled();
  });
});
