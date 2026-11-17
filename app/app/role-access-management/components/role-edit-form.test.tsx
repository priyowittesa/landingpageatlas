import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RbacModule } from "@/components/layout/dasbhoard/navigation";
import type { Role, RoleAccessLevel } from "../types";
import { RoleEditForm } from "./role-edit-form";

const mocks = vi.hoisted(() => ({
  authMe: vi.fn(),
  portalModules: vi.fn(),
  roleAccess: vi.fn(),
  setRoleAccess: vi.fn(),
  refetch: vi.fn()
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.authMe }));
vi.mock("@/components/settings/use-portal-applications", () => ({
  usePortalModules: mocks.portalModules
}));
vi.mock("../use-roles", () => ({
  useRoleAccess: mocks.roleAccess,
  useSetRoleAccess: () => ({ mutateAsync: mocks.setRoleAccess }),
  useUpdateRole: () => ({ isPending: false })
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() })
}));

const role: Role = {
  id: "edited-role",
  name: "Project Manager",
  description: "Manage projects",
  created_at: "",
  updated_at: ""
};
const modules: RbacModule[] = [
  {
    id: "inspection",
    key: "inspection",
    name: "Inspection",
    description: "Keep every project compliant and on track.",
    sub_modules: [
      {
        id: "templates",
        key: "templates",
        name: "Templates",
        description: "Create and manage reusable inspection templates."
      },
      { id: "products", key: "products", name: "Products" }
    ]
  },
  {
    id: "assets",
    key: "asset-management",
    name: "Asset Management",
    access_level: "ACCESS_LEVEL_FULL_ACCESS"
  }
];

type NodeProps = {
  children?: ReactNode;
  group?: { module: RbacModule; features: RbacModule[] };
  expanded?: boolean;
  onChange?: (moduleKey: string, level: RoleAccessLevel) => Promise<void>;
  onClick?: () => void;
};

function elements(node: ReactNode): ReactElement<NodeProps>[] {
  return Children.toArray(node).flatMap((child) => (
    isValidElement<NodeProps>(child)
      ? [child, ...elements(child.props.children)]
      : []
  ));
}

function renderForm() {
  let tree: ReactNode;
  function CaptureForm() {
    tree = RoleEditForm({ role });
    return null;
  }
  renderToStaticMarkup(<CaptureForm />);
  const nodes = elements(tree);
  return {
    html: renderToStaticMarkup(tree),
    groups: nodes.filter((node) => node.props.group),
    nodes
  };
}

describe("role permission groups from auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authMe.mockReturnValue({
      data: { user_id: "user", rbac: { role_id: "current-role", modules } },
      isLoading: false,
      isError: false,
      refetch: mocks.refetch
    });
    mocks.roleAccess.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false
    });
    mocks.setRoleAccess.mockImplementation(async (payload) => payload);
  });

  it("uses RBAC modules and nested submodules without fetching the portal catalog", () => {
    const { groups } = renderForm();
    expect(mocks.authMe).toHaveBeenCalledOnce();
    expect(mocks.portalModules).not.toHaveBeenCalled();
    expect(groups.map((group) => group.props.group!.module.name)).toEqual([
      "Asset Management", "Inspection"
    ]);
    expect(groups[1].props.group!.features.map((feature) => feature.name)).toEqual([
      "Products", "Templates"
    ]);
    const html = renderToStaticMarkup(cloneElement(groups[1], { expanded: true }));
    expect(html).toContain('name="permission-products"');
    expect(html).toContain('name="permission-templates"');
    expect(html).toContain("Keep every project compliant and on track.");
    expect(html).toContain("Create and manage reusable inspection templates.");
    expect(modules.map((module) => module.id)).toEqual(["inspection", "assets"]);
    expect(modules[0].sub_modules!.map((module) => module.id)).toEqual([
      "templates", "products"
    ]);
  });

  it("keeps modules without submodules selectable without using the current user's access level", () => {
    const { groups } = renderForm();
    const html = renderToStaticMarkup(cloneElement(groups[0], { expanded: true }));
    expect(html).toContain('name="permission-asset-management"');
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="no_access"/);
    expect(html).not.toMatch(/<input[^>]*checked=""[^>]*value="full_access"/);
    expect(mocks.roleAccess).toHaveBeenCalledWith(role.id);
  });

  it("saves permissions using the RBAC module key and the edited role ID", async () => {
    const { groups } = renderForm();
    const feature = groups[1].props.group!.features[0];
    await groups[1].props.onChange!(feature.key, "edit");
    expect(mocks.setRoleAccess).toHaveBeenCalledExactlyOnceWith({
      access_level: "edit",
      module_key: "products",
      role_id: role.id
    });
  });

  it("preserves slash-prefixed module keys from auth/me when saving", async () => {
    mocks.authMe.mockReturnValue({
      data: {
        rbac: {
          modules: [{
            id: "connections",
            key: "atlas-knowledge-source",
            name: "Workflow & Connections",
            sub_modules: [{
              id: "workflow",
              key: "/workflow",
              name: "Workflow Studio",
              access_level: "full_access",
              sub_modules: []
            }]
          }]
        }
      }
    });
    const { groups } = renderForm();
    await groups[0].props.onChange!("/workflow", "view_only");
    expect(mocks.setRoleAccess).toHaveBeenCalledExactlyOnceWith({
      access_level: "view_only",
      module_key: "/workflow",
      role_id: role.id
    });
  });

  it.each([undefined, null, { role_id: "current-role", modules: [] }])(
    "shows an empty list when RBAC modules are unavailable: %j",
    (rbac) => {
      mocks.authMe.mockReturnValue({
        data: { user_id: "user", rbac },
        isLoading: false,
        isError: false
      });
      expect(renderForm().html).toContain("No module or feature found.");
      expect(mocks.portalModules).not.toHaveBeenCalled();
    }
  );

  it("waits for auth/me before displaying permission groups", () => {
    mocks.authMe.mockReturnValue({ isLoading: true, isError: false });
    const { html } = renderForm();
    expect(html).toContain("Loading");
    expect(html).toContain("permissions...");
    expect(html).not.toContain("No module or feature found.");
  });

  it("retries auth/me when permission groups cannot be loaded", () => {
    mocks.authMe.mockReturnValue({
      isLoading: false,
      isError: true,
      refetch: mocks.refetch
    });
    const { html, nodes } = renderForm();
    expect(html).toContain("Module data could not be loaded.");
    nodes.find((node) => node.props.children === "Try Again")!.props.onClick!();
    expect(mocks.refetch).toHaveBeenCalledOnce();
    expect(mocks.portalModules).not.toHaveBeenCalled();
  });
});
