import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { NavNode } from "./navigation";
import { Sidebar } from "./Sidebar";

const mocks = vi.hoisted(() => ({
  authMe: vi.fn(),
  pathname: "/app/workspace-dashboard"
}));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) => children
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.authMe }));
vi.mock("@/hooks/useIsMobile", () => ({ useIsMobile: () => false }));
vi.mock("./ResponsiveSidebarProvider", () => ({
  useSidebar: () => ({
    collapsed: false, sidebarOpen: false,
    toggleCollapsed: vi.fn(), setSidebarOpen: vi.fn()
  })
}));
vi.mock("./NavItem", () => ({
  default: function NavItem({ node }: { node: NavNode }) {
    return (
      <div>
        {node.href ? <a href={node.href}>{node.title}</a> : node.title}
        {node.children?.map((child) => <NavItem key={child.title} node={child} />)}
      </div>
    );
  }
}));

const route = "/app/operation-intelligence/predictive-actions";
const moduleWithAccess = (access_level?: string) => ({
  id: "operation-intelligence",
  key: "operation-inteliggence",
  name: "Operation Intelligence",
  href: "operation-intelligence",
  icon: "sparkles",
  sub_modules: [{
    id: "predictive-actions", key: "predictive-actions", name: "Predictive Actions",
    href: "predictive-actions", icon: "sparkles", access_level, sub_modules: []
  }]
});
const queryWithModules = (modules: unknown[]) => ({
  data: {
    is_admin: true,
    company: { company_name: "Pertamina Group" },
    rbac: { modules }
  },
  isLoading: false,
  isError: false,
  isFetchedAfterMount: true
});
const render = () => renderToStaticMarkup(<Sidebar />);

describe("sidebar module permissions from auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authMe.mockReturnValue(queryWithModules([]));
  });

  it.each(["view_only", "edit", "full_access", "ACCESS_LEVEL_VIEW_ONLY", "ACCESS_LEVEL_EDIT", "ACCESS_LEVEL_FULL_ACCESS"])(
    "shows the module and nested link with a %s grant",
    (level) => {
      mocks.authMe.mockReturnValue(queryWithModules([moduleWithAccess(level)]));
      const html = render();
      expect(html).toContain("Operation Intelligence");
      expect(html).toContain(`href="${route}"`);
      expect(html).toContain("Predictive Actions");
      expect(mocks.authMe).toHaveBeenCalledWith(mocks.pathname);
    }
  );

  it.each([undefined, "", "no_access", "ACCESS_LEVEL_NO_ACCESS", "unknown", "ACCESS_LEVEL_UNSPECIFIED"])(
    "hides ungranted children and their empty container for %s",
    (level) => {
      mocks.authMe.mockReturnValue(queryWithModules([moduleWithAccess(level)]));
      const html = render();
      expect(html).not.toContain("Operation Intelligence");
      expect(html).not.toContain("Predictive Actions");
      expect(html).not.toContain(route);
    }
  );

  it("does not add the module for an admin or company when it is absent from auth/me", () => {
    expect(render()).not.toContain("Operation Intelligence");
  });

  it("hides module navigation when auth/me has no RBAC data", () => {
    mocks.authMe.mockReturnValue({
      ...queryWithModules([]),
      data: { is_admin: true, company: { company_name: "Pertamina Group" } }
    });
    expect(render()).not.toContain("Operation Intelligence");
  });

  it("does not show a parent-only entry without a grant", () => {
    mocks.authMe.mockReturnValue(queryWithModules([{ ...moduleWithAccess(), sub_modules: [] }]));
    expect(render()).not.toContain("Operation Intelligence");
  });

  it("honors a denied parent even if a child is granted", () => {
    mocks.authMe.mockReturnValue(queryWithModules([{
      ...moduleWithAccess("full_access"), access_level: "no_access"
    }]));
    expect(render()).not.toContain("Operation Intelligence");
  });

  it("does not display cached grants before fresh permissions arrive", () => {
    mocks.authMe.mockReturnValue({
      ...queryWithModules([moduleWithAccess("full_access")]),
      isFetchedAfterMount: false
    });
    expect(render()).not.toContain("Operation Intelligence");
  });

  it("does not display cached grants when the permissions request fails", () => {
    mocks.authMe.mockReturnValue({
      ...queryWithModules([moduleWithAccess("full_access")]), isError: true
    });
    expect(render()).not.toContain("Operation Intelligence");
  });

  it("removes the entry when refreshed permissions revoke the grant", () => {
    mocks.authMe.mockReturnValue(queryWithModules([moduleWithAccess("full_access")]));
    expect(render()).toContain(route);
    mocks.authMe.mockReturnValue(queryWithModules([moduleWithAccess("no_access")]));
    expect(render()).not.toContain("Operation Intelligence");
  });
});
