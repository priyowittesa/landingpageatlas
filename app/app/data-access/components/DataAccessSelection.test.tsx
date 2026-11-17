import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectionKey, type ConnectionDraft } from "../connections";
import { DataAccessEditor } from "./DataAccessEditor";

type Confirmation =
  | { action: "save"; moduleId: string }
  | { action: "discard"; href: string };
type Drafts = Record<string, ConnectionDraft>;
const mocks = vi.hoisted(() => ({
  activeId: null as string | null,
  description: "Initial description",
  confirmation: null as Confirmation | null,
  drafts: {} as Drafts,
  submit: undefined as
    | ((event: { preventDefault: () => void }) => void)
    | undefined,
  link: vi.fn<
    (props: {
      onClick: (event: { preventDefault: () => void }) => void;
    }) => void
  >(),
  dialog:
    vi.fn<
      (props: {
        open: boolean;
        role: string;
        description: React.ReactNode;
        onConfirm: () => void;
        onOpenChange: (open: boolean) => void;
      }) => void
    >(),
  textarea:
    vi.fn<
      (props: {
        onChange: (event: { target: { value: string } }) => void;
      }) => void
    >(),
  panel:
    vi.fn<
      (props: {
        onSelectSubmodule: (id: string) => void;
        activeSubmodule?: { id: string };
        onChange: (update: (current: string[]) => string[]) => void;
      }) => void
    >(),
  connections: vi.fn(),
  submodules: vi.fn(),
  detail: vi.fn(),
  push: vi.fn(),
  reset: vi.fn(),
  updateModule: vi.fn(),
  save: vi.fn()
}));
vi.mock("react/jsx-runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react/jsx-runtime")>();
  const capture =
    (fn: typeof actual.jsx) =>
    (...args: Parameters<typeof actual.jsx>) => {
      if (args[0] === "form")
        mocks.submit = (args[1] as { onSubmit: typeof mocks.submit }).onSubmit;
      return fn(...args);
    };
  return { ...actual, jsx: capture(actual.jsx), jsxs: capture(actual.jsxs) };
});
vi.mock("react/jsx-dev-runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react/jsx-dev-runtime")>();
  return {
    ...actual,
    jsxDEV: (...args: Parameters<typeof actual.jsxDEV>) => {
      if (args[0] === "form")
        mocks.submit = (args[1] as { onSubmit: typeof mocks.submit }).onSubmit;
      return actual.jsxDEV(...args);
    }
  };
});
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const state = actual.useState(initial);
      if (typeof initial === "function")
        return [
          mocks.confirmation,
          (value: Confirmation | null) => {
            mocks.confirmation = value;
          }
        ];
      if (
        initial &&
        typeof initial === "object" &&
        Object.keys(initial).length === 0
      ) {
        return [
          mocks.drafts,
          (update: Drafts | ((previous: Drafts) => Drafts)) => {
            mocks.drafts =
              typeof update === "function" ? update(mocks.drafts) : update;
          }
        ];
      }
      if (initial === "Initial description")
        return [
          mocks.description,
          (value: string) => {
            mocks.description = value;
          }
        ];
      return initial === null
        ? [
            mocks.activeId,
            (id: string) => {
              mocks.activeId = id;
            }
          ]
        : state;
    }
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({
  default: (
    props: Parameters<typeof mocks.link>[0] & { children: React.ReactNode }
  ) => {
    mocks.link(props);
    return <span>{props.children}</span>;
  }
}));
vi.mock("@/components/ConfirmationModal", () => ({
  default: (props: Parameters<typeof mocks.dialog>[0]) => {
    mocks.dialog(props);
    return null;
  }
}));
vi.mock("@/hooks/useAuthMe", () => ({
  useAuthMe: () => ({
    data: { user_id: "user", tenant_id: "tenant" },
    isLoading: false
  })
}));
vi.mock("../use-module-detail", () => ({ useModuleDetail: mocks.detail }));
vi.mock("../use-submodules", () => ({ useSubmodules: mocks.submodules }));
vi.mock("../use-module-connections", () => ({
  useModuleConnections: mocks.connections
}));
vi.mock("../use-update-module", () => ({
  useUpdateModule: mocks.updateModule
}));
vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props: Parameters<typeof mocks.textarea>[0]) => {
    mocks.textarea(props);
    return null;
  }
}));
vi.mock("./ModuleConnectionsPanel", () => ({
  ModuleConnectionsPanel: (props: Parameters<typeof mocks.panel>[0]) => {
    mocks.panel(props);
    return null;
  }
}));
vi.mock("./shared", () => ({
  DesignIcon: () => null,
  ErrorState: () => null,
  LoadingState: () => null
}));

describe("in-place submodule selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activeId = null;
    mocks.description = "Initial description";
    mocks.confirmation = null;
    mocks.drafts = {};
    mocks.save.mockResolvedValue(undefined);
    mocks.updateModule.mockReturnValue({
      isPending: false,
      isError: false,
      mutateAsync: vi.fn().mockResolvedValue(undefined)
    });
    mocks.detail.mockReturnValue({
      data: {
        id: "parent",
        name: "Inspection",
        description: "Initial description"
      },
      isLoading: false
    });
    mocks.submodules.mockReturnValue({
      data: [
        { id: "one", name: "Non Conformance" },
        { id: "two", name: "Run Inspection" }
      ],
      isLoading: false,
      error: null
    });
    mocks.connections.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      save: { isPending: false, reset: mocks.reset, mutateAsync: mocks.save }
    });
  });

  it("defaults to the first submodule, then switches connections without navigating or changing parent details", () => {
    const render = () =>
      renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    render();
    expect(mocks.connections).toHaveBeenLastCalledWith("one", "tenant:user");
    mocks.panel.mock.lastCall![0].onSelectSubmodule("two");
    render();
    expect(mocks.panel.mock.lastCall![0].activeSubmodule?.id).toBe("two");
    expect(mocks.connections).toHaveBeenLastCalledWith("two", "tenant:user");
    expect(mocks.detail).toHaveBeenLastCalledWith("parent", "tenant:user");
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.reset).toHaveBeenCalledOnce();
  });

  it("does not switch while a save is in progress", () => {
    mocks.connections.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      save: { isPending: true, reset: mocks.reset }
    });
    renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    mocks.panel.mock.lastCall![0].onSelectSubmodule("two");
    expect(mocks.activeId).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("enables description-only saving without submodules or connection data", () => {
    mocks.submodules.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    });
    mocks.connections.mockReturnValue({
      data: undefined,
      isLoading: false,
      save: { isPending: false }
    });
    const render = () =>
      renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    expect(render().match(/<button[^>]*type="submit"[^>]*>/)?.[0]).toContain(
      ' disabled=""'
    );
    mocks.textarea.mock.lastCall![0].onChange({
      target: { value: "New description" }
    });
    expect(
      render().match(/<button[^>]*type="submit"[^>]*>/)?.[0]
    ).not.toContain(' disabled=""');
    expect(mocks.updateModule).toHaveBeenLastCalledWith(
      "parent",
      "tenant:user"
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("keeps description errors visible without discarding the draft", () => {
    mocks.description = "Unsaved description";
    mocks.updateModule.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error("Description update failed")
    });
    const html = renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    expect(html).toContain("Description update failed");
    expect(mocks.description).toBe("Unsaved description");
  });

  it("requires the popup confirmation before saving an unchecked table", async () => {
    const saved = connectionKey({
      database_name: "aimos_dev",
      schema_name: "public",
      table_name: "events"
    });
    mocks.connections.mockReturnValue({
      data: [
        {
          id: "db",
          module_id: "one",
          database_name: "aimos_dev",
          selected: false,
          schemas: [
            {
              id: "schema",
              schema_name: "public",
              tables: [{ id: "table", table_name: "events", selected: true }]
            }
          ]
        }
      ],
      isLoading: false,
      error: null,
      save: { isPending: false, reset: mocks.reset, mutateAsync: mocks.save }
    });
    const render = () =>
      renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    render();
    mocks.panel.mock.lastCall![0].onChange(() => []);
    render();
    mocks.submit!({ preventDefault: vi.fn() });
    expect(mocks.save).not.toHaveBeenCalled();
    render();
    const dialog = mocks.dialog.mock.lastCall![0];
    expect(dialog.open).toBe(true);
    expect(dialog.role).toBe("alertdialog");
    expect(renderToStaticMarkup(<>{dialog.description}</>)).toContain(
      "aimos_dev.public.events"
    );
    dialog.onConfirm();
    await vi.waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        additions: [],
        removals: [saved],
        confirmedExisting: true
      })
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("preserves pending removals when the popup is cancelled", () => {
    mocks.confirmation = { action: "save", moduleId: "one" };
    mocks.drafts = {
      one: { additions: [], removals: ['["db","public","events"]'] }
    };
    renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    mocks.dialog.mock.lastCall![0].onOpenChange(false);
    expect(mocks.confirmation).toBeNull();
    expect(mocks.drafts.one.removals).toHaveLength(1);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("shows a discard popup instead of navigating or using a browser prompt", () => {
    mocks.description = "Unsaved description";
    const render = () =>
      renderToStaticMarkup(<DataAccessEditor moduleId="parent" />);
    render();
    const preventDefault = vi.fn();
    mocks.link.mock.lastCall![0].onClick({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    render();
    const dialog = mocks.dialog.mock.lastCall![0];
    expect(dialog.open).toBe(true);
    dialog.onConfirm();
    expect(mocks.push).toHaveBeenCalledWith("/app/data-access");
  });
});
