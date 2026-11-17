import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectionKey } from "../connections";
import {
  CatalogDatabase,
  CatalogSchema,
  CatalogTable
} from "./ConnectionCatalogNodes";
import { ConnectionCatalogPicker } from "./ConnectionCatalogPicker";

type QueryOptions = { queryKey: readonly unknown[]; enabled?: boolean };
type CheckboxProps = {
  "aria-label": string;
  checked: boolean | "indeterminate";
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};
const mocks = vi.hoisted(() => ({
  query: vi.fn<(options: QueryOptions) => unknown>(),
  fetchQuery: vi.fn(),
  checkbox: vi.fn<(props: CheckboxProps) => void>()
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: mocks.query,
  useQueryClient: () => ({ fetchQuery: mocks.fetchQuery })
}));
vi.mock("../connection-catalog", () => ({
  fetchConnectionDatabases: vi.fn(),
  fetchConnectionSchemas: vi.fn(),
  fetchConnectionTables: vi.fn()
}));
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: (props: CheckboxProps) => {
    mocks.checkbox(props);
    return null;
  }
}));

const saved = connectionKey({
  database_name: "aimos_dev",
  schema_name: "pg_catalog",
  table_name: "pg_aggregate"
});
const added = connectionKey({
  database_name: "aimos_dev",
  schema_name: "pg_catalog",
  table_name: "other"
});
const tables = [{ name: "pg_aggregate" }, { name: "other" }];

describe("connection catalog picker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.query.mockImplementation(({ queryKey }) => ({
      data:
        queryKey[2] === "databases"
          ? [{ name: "aimos_dev" }, { name: "aimos_prod" }]
          : queryKey[2] === "schemas"
            ? [{ name: "pg_catalog" }]
            : tables,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    }));
    mocks.fetchQuery.mockResolvedValue(tables);
  });

  it("shows discovery databases rather than using saved connections as the available catalog", () => {
    const html = renderToStaticMarkup(
      <ConnectionCatalogPicker
        scope="tenant:user"
        selected={[saved]}
        onChange={vi.fn()}
        onBusyChange={vi.fn()}
      />
    );
    expect(html).toContain("aimos_dev");
    expect(html).toContain("aimos_prod");
    expect(html).toContain("1 selected");
    expect(html).toContain("/images/data-access/tree-database.svg");
    expect(mocks.query.mock.calls[0][0].queryKey).toEqual([
      "connection-catalog",
      "tenant:user",
      "databases"
    ]);
    expect(
      mocks.query.mock.calls
        .filter(([options]) => options.queryKey[2] === "schemas")
        .every(([options]) => options.enabled === false)
    ).toBe(true);
  });

  it("loads schemas for an expanded database and leaves table queries lazy", () => {
    const html = renderToStaticMarkup(
      <CatalogDatabase
        databaseName="aimos_dev"
        scope="tenant:user"
        expanded
        onToggle={vi.fn()}
        selected={[saved]}
        onChange={vi.fn()}
        onBusyChange={vi.fn()}
      />
    );
    expect(html).toContain("pg_catalog");
    expect(html).toContain("/images/data-access/tree-folder.svg");
    expect(mocks.query.mock.calls[0][0]).toMatchObject({
      queryKey: ["connection-catalog", "tenant:user", "schemas", "aimos_dev"],
      enabled: true
    });
    expect(mocks.query.mock.calls[1][0]).toMatchObject({
      queryKey: [
        "connection-catalog",
        "tenant:user",
        "tables",
        "aimos_dev",
        "pg_catalog"
      ],
      enabled: false
    });
    expect(mocks.checkbox.mock.lastCall?.[0].checked).toBe("indeterminate");
  });

  it("checks saved tables and allows selecting a table that is not already assigned", () => {
    const onChange = vi.fn<(update: (current: string[]) => string[]) => void>();
    renderToStaticMarkup(
      <CatalogTable
        databaseName="aimos_dev"
        schemaName="pg_catalog"
        tableName="pg_aggregate"
        selected={[saved]}
        onChange={onChange}
      />
    );
    expect(mocks.checkbox.mock.lastCall?.[0]).toMatchObject({ checked: true });
    expect(mocks.checkbox.mock.lastCall?.[0].disabled).not.toBe(true);
    mocks.checkbox.mock.lastCall![0].onCheckedChange(false);
    expect(onChange.mock.lastCall![0]([saved])).toEqual([]);
    renderToStaticMarkup(
      <CatalogTable
        databaseName="aimos_dev"
        schemaName="pg_catalog"
        tableName="other"
        selected={[saved]}
        onChange={onChange}
      />
    );
    const checkbox = mocks.checkbox.mock.lastCall![0];
    expect(checkbox.checked).toBe(false);
    expect(checkbox.disabled).not.toBe(true);
    checkbox.onCheckedChange(true);
    expect(onChange.mock.lastCall![0]([saved])).toEqual([saved, added]);
  });

  it("loads all tables before selecting a schema without losing concurrent edits", async () => {
    const onChange = vi.fn<(update: (current: string[]) => string[]) => void>();
    const onBusyChange = vi.fn();
    renderToStaticMarkup(
      <CatalogSchema
        databaseName="aimos_dev"
        schemaName="pg_catalog"
        scope="tenant:user"
        selected={[saved]}
        onChange={onChange}
        onBusyChange={onBusyChange}
      />
    );
    mocks.checkbox.mock.lastCall![0].onCheckedChange(true);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    const concurrent = connectionKey({
      database_name: "aimos_prod",
      schema_name: "public",
      table_name: "events"
    });
    expect(onChange.mock.calls[0][0]([saved, concurrent])).toEqual([
      saved,
      concurrent,
      added
    ]);
    expect(onBusyChange.mock.calls).toEqual([[1], [-1]]);
  });

  it("allows clearing saved and pending selections for a schema", async () => {
    const onChange = vi.fn<(update: (current: string[]) => string[]) => void>();
    renderToStaticMarkup(
      <CatalogSchema
        databaseName="aimos_dev"
        schemaName="pg_catalog"
        scope="tenant:user"
        selected={[saved, added]}
        onChange={onChange}
        onBusyChange={vi.fn()}
      />
    );
    mocks.checkbox.mock.lastCall![0].onCheckedChange(false);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    const unrelated = connectionKey({
      database_name: "aimos_prod",
      schema_name: "public",
      table_name: "events"
    });
    expect(onChange.mock.calls[0][0]([saved, added, unrelated])).toEqual([
      unrelated
    ]);
    expect(mocks.fetchQuery).not.toHaveBeenCalled();
  });

  it("does not partially select a schema when loading its tables fails", async () => {
    const onChange = vi.fn();
    const onBusyChange = vi.fn();
    mocks.fetchQuery.mockRejectedValueOnce(new Error("offline"));
    renderToStaticMarkup(
      <CatalogSchema
        databaseName="aimos_dev"
        schemaName="pg_catalog"
        scope="tenant:user"
        selected={[]}
        onChange={onChange}
        onBusyChange={onBusyChange}
      />
    );
    mocks.checkbox.mock.lastCall![0].onCheckedChange(true);
    await vi.waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(-1));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows explicit database loading, error and empty states", () => {
    const render = () =>
      renderToStaticMarkup(
        <ConnectionCatalogPicker
          scope="tenant:user"
          selected={[]}
          onChange={vi.fn()}
          onBusyChange={vi.fn()}
        />
      );
    mocks.query.mockReturnValueOnce({ isLoading: true });
    expect(render()).toContain("Loading databases");
    mocks.query.mockReturnValueOnce({
      isLoading: false,
      error: new Error("offline")
    });
    expect(render()).toContain("Unable to load databases");
    mocks.query.mockReturnValueOnce({ isLoading: false, data: [] });
    expect(render()).toContain("No databases found");
  });
});
