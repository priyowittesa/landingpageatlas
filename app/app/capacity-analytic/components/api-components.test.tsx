import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiTable } from "./ApiTable";
import { ApiState, CapacityValue, StatusBadge } from "./ApiState";
import { LoadingCapacityChart } from "./Chart";
import { ApiFormulaTokens } from "../formula-configuration/components/ApiFormulaTokens";
import { MasterSelect } from "./CapacityFilters";
import { AdditionalWorkingDaysTable } from "./ManagementTables";
import { CapacityTrendChart } from "../capacity-trend/components/CapacityTrendChart";

const mocks = vi.hoisted(() => ({
  table: vi.fn(), query: vi.fn(), get: vi.fn(),
}));
vi.mock("@/components/Table", () => ({ default: (props: unknown) => { mocks.table(props); return null; } }));
vi.mock("../use-capacity", () => ({ useCapacityQuery: mocks.query }));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({ get: mocks.get }) }));

describe("capacity API presentation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.query.mockReturnValue({
      data: { items: [{ id: "first" }], total_count: 45, next_page_token: "second-page" },
      error: null, isPending: false, isFetching: false, refetch: vi.fn(),
    });
  });

  it("passes API total_count and cursor navigation constraints to the shared table", () => {
    renderToStaticMarkup(<ApiTable title="Bridging History" path="/bridging-cases" params={{ year: 2026 }} columns={[]} getRowId={(row: { id: string }) => row.id} />);
    expect(mocks.query).toHaveBeenCalledWith("/bridging-cases", {
      year: 2026, page_size: 20, page_token: "", search: undefined,
    });
    const props = mocks.table.mock.lastCall![0];
    expect(props.data).toEqual([{ id: "first" }]);
    expect(props.pagination.totalEntries).toBe(45);
    expect(props.pagination.canPageChange(2)).toBe(true);
    expect(props.pagination.canPageChange(3)).toBe(false);
  });

  it("does not allow another page without a next_page_token even if total_count suggests one", () => {
    mocks.query.mockReturnValue({ data: { items: [], total_count: 200 }, isPending: false, isFetching: false, error: null });
    renderToStaticMarkup(<ApiTable title="History" path="/bridging-cases" columns={[]} getRowId={() => ""} />);
    expect(mocks.table.mock.lastCall![0].pagination.canPageChange(2)).toBe(false);
  });

  it("supports the dashboard's five-row layout without replacing cursor pagination", () => {
    renderToStaticMarkup(<ApiTable title="Activities" path="/activity-plans" defaultPageSize={5} columns={[]} getRowId={() => ""} />);
    expect(mocks.query).toHaveBeenCalledWith("/activity-plans", { page_size: 5, page_token: "", search: undefined });
    const props = mocks.table.mock.lastCall![0];
    expect(props.toolbarLayout).toBe("horizontal");
    expect(props.pagination.pageSize).toBe(5);
    expect(props.pagination.pageSizeOptions).toContain(5);
    expect(props.pagination.canPageChange(3)).toBe(false);
  });

  it("renders backend warnings separately from normal and NG, and exposes unknown capacity problems", () => {
    expect(renderToStaticMarkup(<StatusBadge value="CAPACITY_STATUS_WARNING" />)).toContain("Warning");
    expect(renderToStaticMarkup(<StatusBadge value="BRIDGING_STATUS_PENDING_REVIEW" />)).toContain("Pending Review");
    const html = renderToStaticMarkup(<CapacityValue problem="No calendar" />);
    expect(html).toContain('title="No calendar"');
    expect(html).not.toContain("0%");
    expect(renderToStaticMarkup(<CapacityValue value={0} status="CAPACITY_STATUS_NORMAL" />)).toContain("0%");
  });

  it("shows request errors with a retry action rather than a fabricated successful state", () => {
    const html = renderToStaticMarkup(<ApiState query={{ isPending: false, error: { response: { status: 412, data: { error: { message: "Only draft versions may be changed" } } } }, refetch: vi.fn() }} />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("Only draft versions may be changed");
    expect(html).toContain("Retry");
  });

  it("scales chart values above 400% and keeps the plot horizontally scrollable", () => {
    const html = renderToStaticMarkup(<LoadingCapacityChart groups={[{ line: "Line 1", bars: [{ label: "N", color: "#000", value: 725 }] }]} legend={[]} refLines={[{ pct: 650, color: "#f00" }]} />);
    expect(html).toContain("725%");
    expect(html).toContain("750%");
    expect(html).toContain("overflow-x-auto");
    expect(html).not.toContain("181.25%");
  });

  it("honors the backend token-index diff flags even for repeated labels", () => {
    const html = renderToStaticMarkup(<ApiFormulaTokens removed tokens={[
      { token: { type: "operator", value: "*" }, changed: true },
      { token: { type: "operator", value: "*" }, changed: false },
    ]} />);
    expect(html.match(/border-red-400/g)).toHaveLength(1);
    expect(html.match(/border-transparent/g)).toHaveLength(1);
    expect(html.match(/line-through/g)).toHaveLength(1);
  });

  it("renders catalog token labels and units with distinct variable and number styles", () => {
    const html = renderToStaticMarkup(<ApiFormulaTokens tokens={[
      { token: { type: "variable", value: "working_days", label: "Working days", unit: "day" } },
      { token: { type: "number", number: 3600, unit: "s/h", label: "Seconds per hour" } },
    ]} />);
    expect(html).toContain("Working days");
    expect(html).toContain("day");
    expect(html).toContain("3600");
    expect(html).toContain("s/h");
    expect(html).toContain("bg-primary/10");
    expect(html).toContain("border-border bg-background");
  });

  it("renders only loading and N-1 as bars, with gap-aware shift lines and tenant thresholds", () => {
    const html = renderToStaticMarkup(<CapacityTrendChart data={[
      { month: "Jan", loading: 725, n1: 0, shift1: 250 },
      { month: "Feb" },
      { month: "Mar", loading: 0, shift1: 0 },
    ]} legend={[
      { label: "Loading", color: "#111" }, { label: "N-1", color: "#222" },
      { label: "Capacity 1 Shift", color: "#333" }, { label: "Capacity 2 Shift", color: "#444" }, { label: "Capacity 3 Shift", color: "#555" },
    ]} refLines={[{ pct: 225, label: "Warning (225%)", color: "#abc", dashStyle: "dashed" }]} />);
    expect(html.match(/data-series="Loading"/g)).toHaveLength(2);
    expect(html.match(/data-series="N-1"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Jan N-1: 0%"');
    expect(html).not.toContain('aria-label="Feb Loading:');
    expect(html).toContain("725%");
    expect(html).toContain("750%");
    expect(html).toContain("Warning (225%)");
    expect(html).not.toContain("Warning (200%)");
    expect(html).toContain('data-series="Capacity 1 Shift"');
    expect(html).toContain("stroke-dasharray");
    expect(html).toMatch(/<path d="M[^"]* M/);
    expect(html).not.toContain("NaN");
    expect(html).toContain("overflow-x-auto");
  });

  it("uses proto master-data codes and names instead of displaying internal UUIDs", () => {
    const html = renderToStaticMarkup(<MasterSelect label="Product" value="" onChange={vi.fn()} items={[
      { id: "product-uuid", product_code: "P01", product_name: "Product One" },
      { id: "line-uuid", line_code: "LINE-A", line_name: "Main Line" },
    ]} />);
    expect(html).toContain("P01 - Product One");
    expect(html).toContain("LINE-A - Main Line");
    expect(html).not.toContain(">product-uuid<");
  });

  it("treats additional working days as a complete summary, not a cursor-paginated list", () => {
    const rows = [
      { line: { line_id: "line-1", line_code: "LINE-A" }, add_days: 2, activities: ["Night OT"], overtime_hours: 4 },
      { line: { line_id: "line-2", line_code: "LINE-B" }, absorbed_loading_pct: 0 },
    ];
    mocks.query.mockReturnValue({ data: { items: rows }, isPending: false, error: null, refetch: vi.fn() });
    renderToStaticMarkup(<AdditionalWorkingDaysTable params={{ year: 2026, month: 12 }} />);
    expect(mocks.query).toHaveBeenCalledWith("/overtime-logs/additional-working-days", { year: 2026, month: 12 });
    const props = mocks.table.mock.lastCall![0];
    expect(props.data).toEqual(rows);
    expect(props.pagination).toBeUndefined();
    const absorbed = props.columns.find((column: { key: string }) => column.key === "absorbed_loading_pct");
    expect(absorbed.render(rows[0])).toBe("-");
    expect(absorbed.render(rows[1])).toBe("0%");
  });
});
