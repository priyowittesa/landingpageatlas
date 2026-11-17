import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditDataAccessPage from "../[moduleId]/edit/page";
import { changeDatabase } from "../model";
import type { DataAccessModule } from "../types";
import { selectionState, updateSelection } from "./TablePicker";

const mocks = vi.hoisted(() => ({
  useAuthMe: vi.fn(),
  useModuleDetail: vi.fn(),
  useModuleConnections: vi.fn(),
  useSubmodules: vi.fn(),
  catalogPicker: vi.fn(),
  updateModule: vi.fn()
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.useAuthMe }));
vi.mock("../use-module-detail", () => ({
  useModuleDetail: mocks.useModuleDetail
}));
vi.mock("../use-module-connections", () => ({
  useModuleConnections: mocks.useModuleConnections
}));
vi.mock("../use-submodules", () => ({ useSubmodules: mocks.useSubmodules }));
vi.mock("../use-update-module", () => ({
  useUpdateModule: mocks.updateModule
}));
vi.mock("./ConnectionCatalogPicker", () => ({
  ConnectionCatalogPicker: (props: { selected: string[] }) => {
    mocks.catalogPicker(props);
    return <div>Connection catalog</div>;
  }
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const assetModule: DataAccessModule = {
  id: "c0a1b629-c12b-423a-90df-3f68011791f9",
  name: "Asset Management",
  key: "asset-management",
  description: "Asset data",
  defaultDatabase: "atlas_construction",
  updatedAt: null,
  updatedBy: null,
  subModules: [
    {
      id: "child",
      name: "Asset List",
      database: null,
      outputDatabase: null,
      tables: ["equipment.asset_breakdown"]
    },
    {
      id: "other",
      name: "Work Orders",
      database: "atlas_workflow",
      outputDatabase: null,
      tables: ["workflow.tasks"]
    }
  ]
};

async function renderPage(moduleId = assetModule.id) {
  return renderToStaticMarkup(
    await EditDataAccessPage({ params: Promise.resolve({ moduleId }) })
  );
}

describe("Data Access edit route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateModule.mockReturnValue({ isPending: false, isError: false });
    mocks.useAuthMe.mockReturnValue({
      data: { user_id: "user", tenant_id: "tenant" },
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
    mocks.useModuleDetail.mockReturnValue({
      data: {
        id: assetModule.id,
        name: "Portal Asset Management",
        key: assetModule.key,
        description: "Portal description"
      },
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
    mocks.useModuleConnections.mockReturnValue({
      data: [
        {
          id: "connection",
          module_id: assetModule.id,
          database_name: "test",
          selected: false,
          schemas: [
            {
              id: "schema",
              schema_name: "public",
              tables: [
                { id: "table", table_name: "assets", selected: true },
                { id: "other-table", table_name: "equipment", selected: false }
              ]
            }
          ]
        }
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      save: { isPending: false, isError: false, reset: vi.fn() }
    });
    mocks.useSubmodules.mockReturnValue({
      data: [
        {
          id: "child",
          name: "Asset List",
          key: "asset-list",
          parent_id: assetModule.id
        },
        {
          id: "other",
          name: "Work Orders",
          key: "work-orders",
          parent_id: assetModule.id
        }
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  it("keeps parent settings and selects the first submodule without a child edit link", async () => {
    const html = await renderPage();
    expect(html).toContain("Edit Module");
    expect(html).toContain("Asset Management");
    expect(html).toContain("Module Data Sources");
    expect(html).toContain("Sub-modules");
    expect(html).toContain("Asset List");
    expect(html).toContain("Work Orders");
    expect(html).not.toContain('href="/app/data-access/child/edit"');
    expect(html).toContain(
      'aria-pressed="true" aria-label="Select Asset List"'
    );
    expect(html).toContain("1 table selected");
    expect(html).toContain("Portal Asset Management");
    expect(html).toContain("Portal description");
    const descriptionField = html.match(
      /<textarea[^>]*id="module-description"[^>]*>/
    )?.[0];
    expect(descriptionField).toBeDefined();
    expect(descriptionField).not.toContain("readonly");
    expect(mocks.updateModule).toHaveBeenCalledWith(
      assetModule.id,
      "tenant:user"
    );
    expect(html).not.toContain("Default Database");
    expect(html).not.toContain("atlas_construction_dev");
    expect(html).toContain("Connection catalog");
    expect(mocks.catalogPicker.mock.lastCall?.[0]).toMatchObject({
      selected: ['["test","public","assets"]']
    });
    expect(html).not.toContain("Preview configuration");
    expect(html).toContain("Removing saved selections requires confirmation");
    expect(html).toContain("Save Changes");
    expect(mocks.useModuleConnections).toHaveBeenCalledWith(
      "child",
      "tenant:user"
    );
    expect(mocks.useModuleDetail).toHaveBeenCalledWith(
      assetModule.id,
      "tenant:user"
    );
    expect(mocks.useSubmodules).toHaveBeenCalledWith(
      assetModule.id,
      "tenant:user"
    );
  });

  it("shows loading and load errors instead of an empty editor", async () => {
    mocks.useAuthMe.mockReturnValueOnce({ isLoading: true });
    expect(await renderPage()).toContain("Loading Data Access");
    mocks.useAuthMe.mockReturnValueOnce({
      isLoading: false,
      error: new Error("offline"),
      refetch: vi.fn()
    });
    expect(await renderPage()).toContain("Unable to load Data Access");
  });

  it("waits for the module details and shows detail errors", async () => {
    mocks.useModuleDetail.mockReturnValueOnce({ isLoading: true });
    expect(await renderPage()).toContain("Loading Data Access");
    mocks.useModuleDetail.mockReturnValueOnce({
      isLoading: false,
      error: new Error("offline"),
      refetch: vi.fn()
    });
    expect(await renderPage()).toContain("Unable to load Data Access");
  });

  it("does not show sample connections when loading fails", async () => {
    mocks.useModuleConnections.mockReturnValueOnce({
      isLoading: false,
      error: new Error("offline"),
      refetch: vi.fn(),
      save: { isPending: false, isError: false }
    });
    const html = await renderPage();
    expect(html).toContain("Unable to load module connections");
    expect(html).not.toContain("atlas_construction");
  });

  it("shows submodule loading, errors and empty results independently of connections", async () => {
    mocks.useSubmodules.mockReturnValueOnce({
      isLoading: true,
      error: null,
      refetch: vi.fn()
    });
    expect(await renderPage()).toContain("Loading sub-modules");
    mocks.useSubmodules.mockReturnValueOnce({
      isLoading: false,
      error: new Error("offline"),
      refetch: vi.fn()
    });
    const error = await renderPage();
    expect(error).toContain("Unable to load sub-modules");
    expect(error).toContain("1 table selected");
    mocks.useSubmodules.mockReturnValueOnce({
      isLoading: false,
      error: null,
      data: [],
      refetch: vi.fn()
    });
    expect(await renderPage()).toContain("No sub-modules found");
    expect(mocks.useModuleConnections).toHaveBeenLastCalledWith(
      "",
      "tenant:user"
    );
  });

  it("uses the currently edited submodule ID and links back to its parent", async () => {
    mocks.useModuleDetail.mockReturnValueOnce({
      data: {
        id: "child",
        name: "Asset List",
        key: "asset-list",
        parent_id: assetModule.id
      },
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
    const html = await renderPage("child");
    expect(html).toContain(`href="/app/data-access/${assetModule.id}/edit"`);
    expect(html).toContain("Back to parent module");
    expect(mocks.useSubmodules).toHaveBeenCalledWith("child", "tenant:user");
    expect(mocks.useModuleConnections).toHaveBeenCalledWith(
      "child",
      "tenant:user"
    );
  });
});

describe("table selection", () => {
  it("selects and removes groups without disturbing other selections", () => {
    expect(selectionState(["a", "b"], ["a", "c"])).toBe("indeterminate");
    expect(selectionState(["a", "b"], ["a", "b"])).toBe(true);
    expect(selectionState([], [])).toBe(false);
    expect(updateSelection(["a", "c"], ["a", "b"], true)).toEqual([
      "a",
      "c",
      "b"
    ]);
    expect(updateSelection(["a", "b", "c"], ["a", "b"], false)).toEqual(["c"]);
  });

  it("clears tables only for sub-modules whose source changes", () => {
    const changed = changeDatabase(assetModule, "atlas_manufacturing");
    expect(changed.subModules[0].tables).toEqual([]);
    expect(changed.subModules[1].tables).toEqual(["workflow.tasks"]);
    expect(
      changeDatabase(assetModule, "atlas_workflow", "child").subModules[0]
        .tables
    ).toEqual([]);
    expect(
      changeDatabase(assetModule, null, "other").subModules[1].tables
    ).toEqual([]);
  });
});
