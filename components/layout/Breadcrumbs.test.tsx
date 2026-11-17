import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";

type BreadcrumbItem = { title: string; href?: string };

const mocks = vi.hoisted(() => ({
  pathname: "/app",
  params: {} as Record<string, string | string[]>,
  items: [] as BreadcrumbItem[]
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useParams: () => mocks.params
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));
vi.mock("@/stores/breadcrumb-store", () => ({
  useBreadcrumbStore: (selector: (state: { items: BreadcrumbItem[] }) => unknown) =>
    selector({ items: mocks.items })
}));

const render = (maxItems?: number) =>
  renderToStaticMarkup(<Breadcrumbs maxItems={maxItems} />);

describe("route-aware breadcrumbs", () => {
  beforeEach(() => {
    mocks.pathname = "/app";
    mocks.params = {};
    mocks.items = [];
  });

  it.each([
    ["/app/master-data/employee", "master data", "/app/master-data"],
    ["/app/ai-studio/workflow", "ai studio", "/app/ai-studio"],
    ["/app/asset-management/work-orders", "asset management", "/app/asset-management"],
    ["/app/daily-diaries/daily-activities", "daily diaries", "/app/daily-diaries"],
    ["/app/labour-rostering/shifts", "labour rostering", "/app/labour-rostering"],
    [
      "/app/operation-intelligence/predictive-actions",
      "operation intelligence",
      "/app/operation-intelligence"
    ]
  ])("renders missing parent breadcrumbs as text on %s", (pathname, title, href) => {
    mocks.pathname = pathname;
    const html = render();
    expect(html).toContain(`>${title}</span>`);
    expect(html).not.toContain(`href="${href}"`);
    expect(html).not.toContain("<a ");
  });

  it("keeps existing parent pages linked and the current page as text", () => {
    mocks.pathname = "/app/inspection/templates/generate";
    const html = render();
    expect(html).toContain('href="/app/inspection"');
    expect(html).toContain('href="/app/inspection/templates"');
    expect(html).not.toContain('href="/app/inspection/templates/generate"');
    expect(html).toContain('aria-current="page"');
  });

  it("keeps redirecting parent pages linked", () => {
    mocks.pathname = "/app/token-usage/overview";
    expect(render()).toContain('href="/app/token-usage"');
  });

  it("hides dynamic IDs without dropping valid ancestor links", () => {
    mocks.pathname = "/app/master-data/employee/employee-1/edit";
    mocks.params = { id: "employee-1" };
    const html = render();
    expect(html).toContain('href="/app/master-data/employee"');
    expect(html).not.toContain("employee-1");
    expect(html).not.toContain('href="/app/master-data"');
    expect(html).toContain(">edit</span>");
  });

  it("preserves the workflow label and hides catch-all parameters", () => {
    mocks.pathname = "/app/ai-studio/workflow/folder-1/workflow-1";
    mocks.params = { folderId: "folder-1", id: "workflow-1" };
    const html = render();
    expect(html).toContain(">Workflow Studio</span>");
    expect(html).not.toContain("folder-1");
    expect(html).not.toContain("workflow-1");

    mocks.pathname = "/app/synergy-intelligence/scheduled/task-1";
    mocks.params = { route: ["scheduled", "task-1"] };
    expect(render()).not.toContain("scheduled");
    expect(render()).not.toContain("task-1");
  });

  it("validates custom breadcrumbs too, including dynamic and missing parent pages", () => {
    mocks.items = [
      { title: "Master Data", href: "/app/master-data" },
      { title: "Employees", href: "/app/master-data/employee?tab=active" },
      { title: "Employee", href: "/app/master-data/employee/employee-1" },
      { title: "Request", href: "/app/product-development/requests/request-1" },
      { title: "Edit", href: "/app/master-data/employee/employee-1/edit" }
    ];
    const html = render();
    expect(html).toContain(">Master Data</span>");
    expect(html).toContain('href="/app/master-data/employee?tab=active"');
    expect(html).toContain(">Employee</span>");
    expect(html).toContain('href="/app/product-development/requests/request-1"');
    expect(html).not.toContain('href="/app/master-data"');
    expect(html).not.toContain('href="/app/master-data/employee/employee-1"');
    expect(html).not.toContain('href="/app/master-data/employee/employee-1/edit"');
    expect(html).not.toContain(">Dashboard<");
  });

  it("renders custom labels without destinations as text", () => {
    mocks.items = [{ title: "Group" }, { title: "Current" }];
    const html = render();
    expect(html).toContain(">Group</span>");
    expect(html).toContain(">Current</span>");
    expect(html).not.toContain("<a ");
  });

  it("supports the shorter dashboard header trail", () => {
    mocks.pathname = "/app/inspection/templates/generate";
    const html = render(2);
    expect(html).toContain('href="/app/inspection/templates"');
    expect(html).not.toContain('href="/app/inspection"');
    expect(html).toContain(">generate</span>");
  });

  it("renders the dashboard fallback without links", () => {
    expect(render()).toContain(">Dashboard</span>");
    expect(render()).not.toContain("<a ");
  });
});
