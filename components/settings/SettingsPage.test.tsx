import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";

const mocks = vi.hoisted(() => ({
  authMe: vi.fn(),
  replace: vi.fn(),
  skills: vi.fn(),
  effects: [] as Array<() => void>
}));

vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.authMe }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace })
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void) => { mocks.effects.push(effect); }
}));
vi.mock("./ModuleOrderSettings", () => ({
  ModuleOrderSettings: () => <p>Module order content</p>
}));
vi.mock("./SubscriptionSettings", () => ({ SubscriptionSettings: () => null }));
vi.mock("./PaymentMethodSettings", () => ({ PaymentMethodSettings: () => null }));
vi.mock("./PaymentHistorySettings", () => ({ PaymentHistorySettings: () => null }));
vi.mock("./NotificationSettings", () => ({ NotificationSettings: () => null }));
vi.mock("./PackageSettings", () => ({ PackageSettings: () => null }));
vi.mock("./ModulesSettings", () => ({ ModulesSettings: () => null }));
vi.mock("./ThemeAppearanceSettings", () => ({ ThemeAppearanceSettings: () => null }));
vi.mock("./ManageTenantsSettings", () => ({ ManageTenantsSettings: () => null }));
vi.mock("./SkillsSettings", () => ({
  SkillsSettings: () => {
    mocks.skills();
    return <p>Skills content</p>;
  }
}));

function render() {
  const html = renderToStaticMarkup(<SettingsPage initialTab="skills" />);
  mocks.effects.forEach((effect) => effect());
  mocks.effects = [];
  return html;
}

describe("Skills settings admin access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effects = [];
    mocks.authMe.mockReturnValue({ data: { is_admin: true }, isLoading: false });
  });

  it("shows the Skills navigation and mounts its content for admins", () => {
    const html = render();
    expect(html).toContain('aria-current="page">Skills</button>');
    expect(html).toContain("Skills content");
    expect(mocks.skills).toHaveBeenCalledOnce();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it.each([false, undefined, null, "true", 1])(
    "hides Skills and redirects direct visits when is_admin is %s",
    (isAdmin) => {
      mocks.authMe.mockReturnValue({ data: { is_admin: isAdmin }, isLoading: false });
      expect(render()).not.toContain("Skills");
      expect(mocks.skills).not.toHaveBeenCalled();
      expect(mocks.replace).toHaveBeenCalledWith(
        "/app/settings?tab=module-order", { scroll: false }
      );
    }
  );

  it("hides Skills while auth/me is loading without redirecting", () => {
    mocks.authMe.mockReturnValue({ data: undefined, isLoading: true });
    expect(render()).not.toContain("Skills");
    expect(mocks.skills).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("hides Skills when auth/me fails without a profile", () => {
    mocks.authMe.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    expect(render()).not.toContain("Skills");
    expect(mocks.skills).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith(
      "/app/settings?tab=module-order", { scroll: false }
    );
  });

  it("removes Skills when refreshed auth/me data revokes admin status", () => {
    expect(render()).toContain("Skills content");
    mocks.skills.mockClear();
    mocks.authMe.mockReturnValue({ data: { is_admin: false }, isLoading: false });
    expect(render()).not.toContain("Skills");
    expect(mocks.skills).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith(
      "/app/settings?tab=module-order", { scroll: false }
    );
  });
});
