import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleAccessGuard } from "./ModuleAccessGuard";

const mocks = vi.hoisted(() => ({
  pathname: "/app/inspection/templates/new",
  authMe: vi.fn(),
  replace: vi.fn(),
  effects: [] as Array<() => void>,
  page: vi.fn()
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace })
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.authMe }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void) => { mocks.effects.push(effect); }
}));

const profile = (access: string) => ({
  rbac: { modules: [{
    id: "inspection", key: "inspection", name: "Inspection",
    href: "/inspection", access_level: access
  }] }
});
function ProtectedPage() {
  mocks.page();
  return <p>Protected module content</p>;
}
function render() {
  const html = renderToStaticMarkup(
    <ModuleAccessGuard><ProtectedPage /></ModuleAccessGuard>
  );
  mocks.effects.forEach((effect) => effect());
  mocks.effects = [];
  return html;
}

describe("module access boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effects = [];
    mocks.pathname = "/app/inspection/templates/new";
    mocks.authMe.mockReturnValue({
      data: profile("no_access"), isError: false, isFetchedAfterMount: true
    });
  });

  it("never mounts denied page components and redirects away", () => {
    expect(render()).not.toContain("Protected module content");
    expect(mocks.page).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/unauthorized");
  });

  it("mounts allowed page components", () => {
    mocks.authMe.mockReturnValue({
      data: profile("view_only"), isError: false, isFetchedAfterMount: true
    });
    expect(render()).toContain("Protected module content");
    expect(mocks.page).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("waits for fresh permissions even when an old grant is cached", () => {
    mocks.authMe.mockReturnValue({
      data: profile("full_access"), isError: false, isFetchedAfterMount: false
    });
    expect(render()).toContain("Checking access");
    expect(mocks.page).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.authMe).toHaveBeenLastCalledWith("/app/inspection/templates/new");
    mocks.pathname = "/app/inspection/products/id";
    render();
    expect(mocks.authMe).toHaveBeenLastCalledWith("/app/inspection/products/id");
    expect(mocks.page).not.toHaveBeenCalled();
  });

  it.each([undefined, false])("never mounts Data Access when is_admin is %s", (isAdmin) => {
    mocks.pathname = "/app/data-access/module-id/edit";
    mocks.authMe.mockReturnValue({
      data: { is_admin: isAdmin, rbac: { modules: [] } },
      isError: false,
      isFetchedAfterMount: true
    });
    expect(render()).not.toContain("Protected module content");
    expect(mocks.page).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/unauthorized");
  });

  it("mounts Data Access for admins without module grants", () => {
    mocks.pathname = "/app/data-access";
    mocks.authMe.mockReturnValue({
      data: { is_admin: true, rbac: { modules: [] } },
      isError: false,
      isFetchedAfterMount: true
    });
    expect(render()).toContain("Protected module content");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("waits for fresh admin status before mounting Data Access", () => {
    mocks.pathname = "/app/data-access";
    mocks.authMe.mockReturnValue({
      data: { is_admin: true }, isError: false, isFetchedAfterMount: false
    });
    expect(render()).toContain("Checking access");
    expect(mocks.page).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("fails closed when permissions cannot be refreshed", () => {
    mocks.authMe.mockReturnValue({
      data: profile("full_access"), isError: true, isFetchedAfterMount: true
    });
    expect(render()).toContain("Unable to verify your access");
    expect(mocks.page).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("unmounts a page when refreshed permissions revoke access", () => {
    mocks.authMe.mockReturnValue({
      data: profile("edit"), isError: false, isFetchedAfterMount: true
    });
    render();
    mocks.page.mockClear();
    mocks.authMe.mockReturnValue({
      data: profile("no_access"), isError: false, isFetchedAfterMount: true
    });
    expect(render()).not.toContain("Protected module content");
    expect(mocks.page).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/unauthorized");
  });
});
