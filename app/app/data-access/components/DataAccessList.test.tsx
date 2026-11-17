import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TableColumn, TablePagination } from "@/types/type";
import type { PortalModuleRow } from "../catalog";
import { DataAccessList } from "./DataAccessList";
import { formatUpdated } from "./shared";

type TableProps = {
  columns: TableColumn<PortalModuleRow>[];
  data: PortalModuleRow[];
  pagination: TablePagination;
};

const mocks = vi.hoisted(() => ({
  useDataAccess: vi.fn(),
  table: vi.fn<(props: TableProps) => void>()
}));
vi.mock("../use-data-access", () => ({ useDataAccess: mocks.useDataAccess }));
vi.mock("next/image", () => ({
  default: ({ src, alt, width, height }: ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ""} width={width} height={height} />
  )
}));
vi.mock("@/components/Table", () => ({
  default: (props: TableProps) => {
    mocks.table(props);
    return (
      <table>
        <thead>
          <tr>
            {props.columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.data.map((row) => (
            <tr key={row.id}>
              {props.columns.map((column) => (
                <td key={column.key}>{column.render?.(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}));

const modules: PortalModuleRow[] = [
  {
    id: "asset/id",
    name: "Asset Management",
    key: "asset-management",
    is_configured: false,
    updated_at: "2026-09-30T03:51:29.548912Z",
    subModules: [
      {
        id: "asset-list",
        name: "Asset List",
        key: "asset-list",
        is_configured: true
      },
      {
        id: "work-orders",
        name: "Work Orders",
        key: "work-orders",
        is_configured: false
      }
    ]
  },
  {
    id: "inspection",
    name: "Inspection",
    key: "inspection",
    is_configured: true,
    updated_at: "2026-09-30T03:51:42.343746Z",
    subModules: []
  }
];

describe("Data Access list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useDataAccess.mockReturnValue({
      data: { modules },
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });
  });

  it("shows live flags, child counts and API timestamps without preview metadata", () => {
    const html = renderToStaticMarkup(<DataAccessList />);

    expect(html).toContain("1 of 2 configured");
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain("No sub-modules");
    expect(html).toContain(formatUpdated(modules[0].updated_at!));
    expect(html).toContain('href="/app/data-access/asset%2Fid/edit"');
    expect(html).toContain("Configuration");
    expect(html).toContain(">Not configured</span>");
    expect(html).toContain(">Configured</span>");
    expect(html).toMatch(/Configured Modules<\/h2><p[^>]*>1<\/p>/);
    expect(html).toMatch(/Not Configured<\/h2><p[^>]*>1<\/p>/);
    expect(html).not.toContain("by null");
    expect(html).not.toContain("browser-only preview");
    expect(html).not.toContain("Default Database");
    expect(html).not.toContain("Databases in Use");
    expect(
      mocks.table.mock.lastCall?.[0].columns.map((column) => column.key)
    ).not.toContain("health");
  });

  it("renders a missing timestamp without an invented last-updated actor", () => {
    mocks.useDataAccess.mockReturnValueOnce({
      data: { modules: [{ ...modules[0], updated_at: null }] },
      isLoading: false,
      error: null
    });
    const html = renderToStaticMarkup(<DataAccessList />);
    expect(html).not.toContain("Invalid Date");
    expect(html).not.toContain("by null");
    expect(html).toContain('class="text-gray-400">-</span>');
  });

  it("paginates parent rows, not the API total including sub-modules", () => {
    mocks.useDataAccess.mockReturnValueOnce({
      data: {
        modules: Array.from({ length: 12 }, (_, index) => ({
          ...modules[0],
          id: `module-${index}`
        }))
      },
      isLoading: false,
      error: null
    });
    renderToStaticMarkup(<DataAccessList />);
    expect(mocks.table.mock.lastCall?.[0].data).toHaveLength(10);
    expect(mocks.table.mock.lastCall?.[0].pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      totalEntries: 12
    });
  });

  it("shows loading and API errors rather than stale rows", () => {
    mocks.useDataAccess.mockReturnValueOnce({ isLoading: true });
    expect(renderToStaticMarkup(<DataAccessList />)).toContain(
      "Loading Data Access"
    );
    expect(mocks.table).not.toHaveBeenCalled();
    mocks.useDataAccess.mockReturnValueOnce({
      data: { modules },
      error: new Error("Offline")
    });
    expect(renderToStaticMarkup(<DataAccessList />)).toContain(
      "Unable to load Data Access"
    );
    expect(mocks.table).not.toHaveBeenCalled();
  });
});
