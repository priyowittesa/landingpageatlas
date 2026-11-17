import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchConnectionDatabases, fetchConnectionSchemas, fetchConnectionTables } from "./connection-catalog";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

describe("connection discovery", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads database names from the discovery endpoint", async () => {
    mocks.get.mockResolvedValueOnce({ data: { items: [{ name: "aimos_dev" }, { name: "aimos_prod" }] } });
    await expect(fetchConnectionDatabases()).resolves.toEqual([{ name: "aimos_dev" }, { name: "aimos_prod" }]);
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/connection/databases");
  });

  it("loads schemas and tables with their database and schema parameters", async () => {
    mocks.get.mockResolvedValueOnce({ data: { items: [{ name: "pg_catalog" }] } });
    await expect(fetchConnectionSchemas("aimos_dev")).resolves.toEqual([{ name: "pg_catalog" }]);
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/connection/schemas", {
      params: { database_name: "aimos_dev" }
    });
    mocks.get.mockResolvedValueOnce({ data: { items: [{ name: "pg_aggregate", schema_name: "pg_catalog" }] } });
    await expect(fetchConnectionTables("aimos_dev", "pg_catalog")).resolves.toEqual([{ name: "pg_aggregate" }]);
    expect(mocks.get).toHaveBeenCalledWith("/v1/portal/connection/tables", {
      params: { database_name: "aimos_dev", schema_name: "pg_catalog" }
    });
  });

  it("accepts empty catalogs and rejects malformed responses or a mismatched schema", async () => {
    mocks.get.mockResolvedValueOnce({ data: { items: [] } });
    await expect(fetchConnectionDatabases()).resolves.toEqual([]);
    mocks.get.mockResolvedValueOnce({ data: { items: null } });
    await expect(fetchConnectionSchemas("aimos_dev")).rejects.toThrow();
    mocks.get.mockResolvedValueOnce({ data: { items: [{ name: "table", schema_name: "other" }] } });
    await expect(fetchConnectionTables("aimos_dev", "public")).rejects.toThrow("different schema");
  });
});
