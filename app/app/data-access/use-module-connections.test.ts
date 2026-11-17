import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyConnectionDraft, buildAdditionsPayload, connectionDraft, connectionKey, selectedConnectionKeys
} from "./connections";
import {
  addModuleConnections, fetchModuleConnections, removeModuleConnections, saveModuleConnections, useModuleConnections
} from "./use-module-connections";

type MutationOptions = {
  onSuccess: () => Promise<unknown>;
  onError: () => void;
};

const mocks = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), del: vi.fn(),
  useQuery: vi.fn(),
  useMutation: vi.fn<(options: MutationOptions) => unknown>(),
  invalidateQueries: vi.fn()
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries })
}));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get, post: mocks.post, delete: mocks.del }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const existing = { database_name: "test", schema_name: "test", table_name: "test" };
const newTable = { database_name: "test", schema_name: "test", table_name: "other" };
const response = {
  items: [{
    id: "connection", module_id: "module-id", database_name: "test", selected: false,
    schemas: [{
      id: "schema", schema_name: "test",
      tables: [
        { id: "table", table_name: "test", selected: true, created_at: "2026-10-30T06:44:35Z" },
        { id: "other", table_name: "other", selected: false }
      ]
    }]
  }]
};

describe("module connections", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.useQuery.mockReturnValue({});
    mocks.invalidateQueries.mockResolvedValue(undefined);
    mocks.get.mockImplementation(async (url: string) => ({
      data: url.endsWith("/tables")
        ? { items: [{ name: "test", schema_name: "test" }, { name: "other", schema_name: "test" }] }
        : response
    }));
  });

  it("loads the edited module and respects table selection even when the database is unselected", async () => {
    mocks.get.mockResolvedValueOnce({ data: response });
    const items = await fetchModuleConnections("module-id");
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/modules/module-id/connections");
    expect(selectedConnectionKeys(items)).toEqual([connectionKey(existing)]);
    expect(buildAdditionsPayload(items, [connectionKey(newTable)])).toEqual({
      connections: [existing, newTable], hasNewSelections: true, hasExistingSelections: true
    });
  });

  it("re-reads before POST and includes existing selections with the additions", async () => {
    mocks.get.mockResolvedValueOnce({ data: response });
    mocks.post.mockResolvedValueOnce({ data: {} });
    await addModuleConnections("module-id", [connectionKey(newTable)], true);
    expect(mocks.get).toHaveBeenCalledBefore(mocks.post);
    expect(mocks.post).toHaveBeenCalledWith("/v1/portal/modules/module-id/connections", {
      connections: [existing, newTable]
    });
  });

  it("accepts a table discovered in the catalog but absent from saved connections", async () => {
    mocks.get.mockResolvedValueOnce({
      data: { items: [{
        ...response.items[0],
        schemas: [{ ...response.items[0].schemas[0], tables: [response.items[0].schemas[0].tables[0]] }]
      }] }
    });
    await addModuleConnections("module-id", [connectionKey(newTable), connectionKey(newTable)], true);
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/connection/tables", {
      params: { database_name: "test", schema_name: "test" }
    });
    expect(mocks.get.mock.calls.filter(([url]) => String(url).endsWith("/tables"))).toHaveLength(1);
    expect(mocks.post).toHaveBeenCalledWith("/v1/portal/modules/module-id/connections", {
      connections: [existing, newTable]
    });
  });

  it("requires confirmation if a fresh read discovers existing selections", async () => {
    mocks.get.mockResolvedValueOnce({ data: response });
    await expect(addModuleConnections("module-id", [connectionKey(newTable)], false))
      .rejects.toThrow("Existing selections changed");
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("posts only new selections when no tables are already selected", async () => {
    mocks.get.mockResolvedValueOnce({
      data: { items: [{
        ...response.items[0],
        schemas: [{
          ...response.items[0].schemas[0],
          tables: response.items[0].schemas[0].tables.map((table) => ({ ...table, selected: false }))
        }]
      }] }
    });
    mocks.post.mockResolvedValueOnce({ data: {} });
    await addModuleConnections("module-id", [connectionKey(newTable)], false);
    expect(mocks.post).toHaveBeenCalledWith("/v1/portal/modules/module-id/connections", {
      connections: [newTable]
    });
  });

  it("does not POST an empty or already selected addition", async () => {
    mocks.get.mockResolvedValue({ data: response });
    await addModuleConnections("module-id", [], false);
    await addModuleConnections("module-id", [connectionKey(existing)], false);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("fails closed when tables disappear, the response is malformed, or an existing selection cannot be represented", async () => {
    mocks.get.mockResolvedValueOnce({ data: response });
    await expect(addModuleConnections("module-id", [connectionKey({ ...newTable, table_name: "missing" })], true))
      .rejects.toThrow("no longer available");
    mocks.get.mockResolvedValueOnce({ data: {} });
    await expect(addModuleConnections("module-id", [connectionKey(newTable)], true)).rejects.toThrow();
    mocks.get.mockResolvedValueOnce({
      data: { items: [{ ...response.items[0], selected: true, schemas: [] }] }
    });
    await expect(addModuleConnections("module-id", [], true)).rejects.toThrow("no selected tables");
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("encodes the module ID and distinguishes names containing separators", async () => {
    mocks.get.mockResolvedValueOnce({ data: { items: [] } });
    await fetchModuleConnections("module/id");
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/modules/module%2Fid/connections");
    expect(connectionKey({ database_name: "a.b", schema_name: "c", table_name: "d" }))
      .not.toBe(connectionKey({ database_name: "a", schema_name: "b.c", table_name: "d" }));
  });

  it("rejects invalid selection keys before posting", async () => {
    await expect(addModuleConnections("module-id", ["not-json"], true)).rejects.toThrow();
    await expect(addModuleConnections("module-id", ['["test", "test"]'], true)).rejects.toThrow();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("deletes only saved checked tables with explicit database, schema and table parameters", async () => {
    await removeModuleConnections("module-id", [connectionKey(existing), connectionKey(existing), connectionKey(newTable)]);
    expect(mocks.del.mock.calls).toEqual([[
      "/v1/portal/modules/module-id/connections/test",
      { params: { schema_name: "test", table_name: "test" } }
    ]]);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("encodes module and database path segments on DELETE", async () => {
    const selection = { database_name: "db/name", schema_name: "public", table_name: "events" };
    mocks.get.mockResolvedValueOnce({ data: { items: [{
      id: "db", module_id: "module/id", database_name: selection.database_name, selected: false,
      schemas: [{ id: "schema", schema_name: selection.schema_name, tables: [
        { id: "table", table_name: selection.table_name, selected: true }
      ] }]
    }] } });
    await removeModuleConnections("module/id", [connectionKey(selection)]);
    expect(mocks.del).toHaveBeenCalledWith("/v1/portal/modules/module%2Fid/connections/db%2Fname", {
      params: { schema_name: "public", table_name: "events" }
    });
  });

  it("does not delete connections when adding tables fails", async () => {
    mocks.post.mockRejectedValueOnce(new Error("offline"));
    await expect(saveModuleConnections("module-id", [connectionKey(newTable)], [connectionKey(existing)], true))
      .rejects.toThrow("offline");
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("adds before deleting when saving mixed changes", async () => {
    await saveModuleConnections("module-id", [connectionKey(newTable)], [connectionKey(existing)], true);
    expect(mocks.post).toHaveBeenCalledBefore(mocks.del);
    expect(mocks.del).toHaveBeenCalledOnce();
  });

  it("reports deletion errors and skips a deletion that a later read shows is complete", async () => {
    mocks.del.mockRejectedValueOnce(new Error("forbidden"));
    await expect(removeModuleConnections("module-id", [connectionKey(existing)])).rejects.toThrow("forbidden");
    mocks.get.mockResolvedValueOnce({ data: { items: [] } });
    await removeModuleConnections("module-id", [connectionKey(existing)]);
    expect(mocks.del).toHaveBeenCalledOnce();
  });

  it("deletes multiple tables in a schema individually without widening the delete scope", async () => {
    mocks.get.mockResolvedValueOnce({ data: { items: [{
      ...response.items[0],
      schemas: [{
        ...response.items[0].schemas[0],
        tables: response.items[0].schemas[0].tables.map((table) => ({ ...table, selected: true }))
      }]
    }] } });
    await removeModuleConnections("module-id", [connectionKey(existing), connectionKey(newTable)]);
    expect(mocks.del.mock.calls).toEqual([
      ["/v1/portal/modules/module-id/connections/test", { params: { schema_name: "test", table_name: "test" } }],
      ["/v1/portal/modules/module-id/connections/test", { params: { schema_name: "test", table_name: "other" } }]
    ]);
  });

  it("refreshes live list and sub-module configuration flags after saving connections", async () => {
    useModuleConnections("module-id", "tenant:user");
    await mocks.useMutation.mock.calls[0][0].onSuccess();

    expect(mocks.invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ["data-access-connections", "tenant:user", "module-id"] }],
      [{ queryKey: ["data-access-catalog", "tenant:user"] }],
      [{ queryKey: ["data-access-submodules", "tenant:user"] }]
    ]);
  });

  it("refreshes configuration even when a save fails after partially applying changes", () => {
    useModuleConnections("module-id", "tenant:user");
    mocks.useMutation.mock.calls[0][0].onError();

    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["data-access-catalog", "tenant:user"] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["data-access-submodules", "tenant:user"] });
  });
});

describe("connection drafts", () => {
  it("tracks removals separately from additions", () => {
    expect(connectionDraft([connectionKey(existing)], [connectionKey(newTable)])).toEqual({
      additions: [connectionKey(newTable)], removals: [connectionKey(existing)]
    });
  });

  it("preserves server selections added while an edit is pending", () => {
    const concurrent = connectionKey({ ...existing, table_name: "concurrent" });
    const draft = { additions: [connectionKey(newTable)], removals: [connectionKey(existing)] };
    expect(applyConnectionDraft([connectionKey(existing), concurrent], draft)).toEqual([concurrent, connectionKey(newTable)]);
  });

  it("cancels pending changes when a saved table is rechecked or a new table is unchecked", () => {
    expect(connectionDraft([connectionKey(existing)], [connectionKey(existing)])).toEqual({ additions: [], removals: [] });
    expect(connectionDraft([], [])).toEqual({ additions: [], removals: [] });
  });
});
