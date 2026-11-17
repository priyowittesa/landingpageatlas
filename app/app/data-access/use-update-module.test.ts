import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PortalModule } from "./catalog";
import { updateModuleDescription, useUpdateModule } from "./use-update-module";

type MutationOptions = {
  mutationFn: (description: string) => Promise<void>;
  onSuccess: (result: void, description: string) => Promise<void>;
};
const mocks = vi.hoisted(() => ({
  get: vi.fn(), put: vi.fn(), invalidateQueries: vi.fn(), setQueryData: vi.fn(),
  useMutation: vi.fn<(options: MutationOptions) => unknown>()
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: mocks.useMutation,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries, setQueryData: mocks.setQueryData })
}));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get, put: mocks.put }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const detail = {
  id: "parent", name: "Inspection", key: "inspection", description: "Old description",
  category: "construction", href: "/inspection", icon: "target", is_menu: true,
  monthly_price: 200, order: 0, parent_id: "", status: "active", version: "1", yearly_price: 500,
  monthly_price_idr: 100000, created_at: { seconds: 1 }
};

describe("module description updates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.get.mockResolvedValue({ data: detail });
    mocks.put.mockResolvedValue({ data: {} });
  });

  it("updates the parent description and preserves all other writable settings", async () => {
    useUpdateModule("parent", "tenant:user");
    await mocks.useMutation.mock.calls[0][0].mutationFn("New description");
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/modules/parent");
    expect(mocks.put).toHaveBeenCalledWith("/v1/portal/modules/parent", {
      name: "Inspection", key: "inspection", description: "New description",
      category: "construction", href: "/inspection", icon: "target", is_menu: true,
      monthly_price: 200, order: 0, parent_id: "", status: "active", version: "1", yearly_price: 500
    });
  });

  it("supports clearing the description and encodes the module ID", async () => {
    mocks.get.mockResolvedValueOnce({ data: { ...detail, id: "parent/id" } });
    await updateModuleDescription("parent/id", "");
    expect(mocks.put).toHaveBeenCalledWith("/v1/portal/modules/parent%2Fid", expect.objectContaining({ description: "" }));
  });

  it("updates the detail cache and invalidates related module lists after success", async () => {
    useUpdateModule("parent", "tenant:user");
    await mocks.useMutation.mock.calls[0][0].onSuccess(undefined, "New description");
    const [key, update] = mocks.setQueryData.mock.calls[0] as [unknown, (previous: PortalModule) => PortalModule];
    expect(key).toEqual(["data-access-module", "tenant:user", "parent"]);
    expect(update(detail)).toMatchObject({ id: "parent", description: "New description" });
    expect(mocks.invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ["data-access-module", "tenant:user", "parent"] }],
      [{ queryKey: ["data-access-catalog", "tenant:user"] }],
      [{ queryKey: ["data-access-submodules", "tenant:user"] }],
      [{ queryKey: ["portal-modules"] }]
    ]);
  });

  it("does not write without a session or when the detail ID does not match", async () => {
    useUpdateModule("parent", null);
    await expect(mocks.useMutation.mock.calls[0][0].mutationFn("Changed")).rejects.toThrow("session");
    mocks.get.mockResolvedValueOnce({ data: { ...detail, id: "other" } });
    await expect(updateModuleDescription("parent", "Changed")).rejects.toThrow("does not match");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("propagates PUT errors without modifying cached data", async () => {
    mocks.put.mockRejectedValueOnce(new Error("offline"));
    await expect(updateModuleDescription("parent", "Changed")).rejects.toThrow("offline");
    expect(mocks.setQueryData).not.toHaveBeenCalled();
  });
});
