import { describe, expect, it, vi } from "vitest";
import { filterModuleRows, loadPortalModules, mergeCatalog, moduleRows, type PortalModule } from "./catalog";
import { saveModule } from "./model";
import type { DataAccessState } from "./types";

const catalog: PortalModule[] = [
  { id: "child", name: "Asset List", key: "asset-list", parent_id: "parent" },
  { id: "parent", name: "Asset Management", key: "asset-management", description: "Assets" },
  { id: "orphan", name: "Orphan", key: "orphan", parent_id: "missing" },
  { id: "new", name: "New module", key: "new" }
];

const emptyState: DataAccessState = { version: 1, modules: [], history: [] };

describe("portal module catalog", () => {
  it("loads every page, including children returned before their parent", async () => {
    const getPage = vi.fn()
      .mockResolvedValueOnce({ items: catalog.slice(0, 1), next_page_token: "next" })
      .mockResolvedValueOnce({ items: catalog.slice(1), next_page_token: "" });

    const result = await loadPortalModules(getPage);
    expect(getPage.mock.calls).toEqual([[undefined], ["next"]]);
    expect(result).toEqual(catalog);
    expect(mergeCatalog(result, emptyState).modules).toEqual([
      {
        id: "parent", name: "Asset Management", key: "asset-management",
        description: "Assets", defaultDatabase: null, updatedAt: null, updatedBy: null,
        subModules: [{ id: "child", name: "Asset List", database: null, outputDatabase: null, tables: [] }]
      },
      {
        id: "new", name: "New module", key: "new", description: "",
        defaultDatabase: null, updatedAt: null, updatedBy: null, subModules: []
      }
    ]);
  });

  it("rejects malformed pages and repeated page tokens instead of showing a partial catalog", async () => {
    await expect(loadPortalModules(async () => ({ items: null }))).rejects.toThrow();
    await expect(loadPortalModules(async () => ({ items: [], next_page_token: "same" })))
      .rejects.toThrow("repeated page token");
  });

  it("reads live configuration and timestamps from the updated response without requiring prices", async () => {
    const child = {
      id: "child", name: "Asset List", key: "asset-list", parent_id: "parent",
      is_menu: false, is_configured: true, updated_at: "2026-09-30T03:51:16.817136Z"
    };
    const parent = {
      id: "parent", name: "Asset Management", key: "asset-management",
      is_menu: true, is_configured: false, updated_at: "2026-09-30T03:51:29.548912Z"
    };
    const result = await loadPortalModules(async () => ({
      exchange_rate: {
        as_of: "2026-11-03T02:08:17Z", available: true, from: "USD",
        rate: 18136, source: "frankfurter.dev", to: "IDR"
      },
      items: [
        { ...child, monthly_price_idr: 0, yearly_price: null, yearly_price_idr: null },
        { ...parent, monthly_price: 200, monthly_price_idr: 3627200, yearly_price: 500, yearly_price_idr: 9068000 },
        { id: "orphan", name: "Orphan", key: "orphan", parent_id: "missing", is_menu: false },
        { id: "non-menu", name: "Non-menu", key: "non-menu", is_menu: false }
      ],
      next_page_token: "",
      total_count: 4
    }));

    expect(moduleRows(result)).toEqual([{ ...parent, subModules: [child] }]);
    expect(moduleRows(result)[0].is_configured).toBe(false);
  });

  it("filters by the module configuration flag independently of its children", () => {
    const rows = moduleRows([
      { id: "parent", name: "Asset Management", key: "asset-management", is_configured: false },
      { id: "child", name: "Asset List", key: "asset-list", parent_id: "parent", is_configured: true },
      { id: "inspection", name: "Inspection", key: "inspection-feature", is_configured: true }
    ]);

    expect(filterModuleRows(rows, "", "all")).toEqual(rows);
    expect(filterModuleRows(rows, "", "configured").map((module) => module.id)).toEqual(["inspection"]);
    expect(filterModuleRows(rows, "", "not-configured").map((module) => module.id)).toEqual(["parent"]);
    expect(filterModuleRows(rows, " ASSET ", "all").map((module) => module.id)).toEqual(["parent"]);
    expect(filterModuleRows(rows, "inspection-feature", "configured").map((module) => module.id)).toEqual(["inspection"]);
    expect(filterModuleRows(rows, "Asset", "configured")).toEqual([]);
  });

  it("uses catalog identities while retaining matching preview configuration and history", () => {
    const stored: DataAccessState = {
      version: 1,
      modules: [
        {
          id: "parent", name: "Old name", key: "old-key", description: "Custom description",
          defaultDatabase: "db", updatedAt: "2026-10-30T00:00:00Z", updatedBy: "User",
          subModules: [
            { id: "child", name: "Old child", database: "db", outputDatabase: null, tables: ["schema.table"] },
            { id: "removed", name: "Removed", database: null, outputDatabase: null, tables: [] }
          ]
        },
        {
          id: "old-demo", name: "Old demo", key: "old-demo", description: "",
          defaultDatabase: null, updatedAt: null, updatedBy: null, subModules: []
        }
      ],
      history: [{
        id: "history", moduleId: "parent", subModuleId: "child", subModuleName: "Asset List",
        actor: "User", at: "2026-10-30T00:00:00Z", kind: "added", summary: "Added", details: []
      }]
    };

    const result = mergeCatalog(catalog, stored);
    expect(result.modules.map((module) => module.id)).toEqual(["parent", "new"]);
    expect(result.modules[0]).toMatchObject({
      name: "Asset Management", key: "asset-management", description: "Custom description",
      defaultDatabase: "db", updatedBy: "User",
      subModules: [{ id: "child", name: "Asset List", database: "db", tables: ["schema.table"] }]
    });
    expect(result.history).toEqual(stored.history);
    expect(stored.modules).toHaveLength(2);
  });

  it("uses the merged catalog for conflict detection when saving", () => {
    const original = mergeCatalog(catalog, emptyState).modules[0];
    const changed = mergeCatalog(catalog, {
      ...emptyState,
      modules: [{ ...original, description: "Changed in another tab" }]
    });
    expect(() => saveModule(changed, original, original, [], "User", "2026-10-30T00:00:00Z"))
      .toThrow("changed in another tab");
  });
});
