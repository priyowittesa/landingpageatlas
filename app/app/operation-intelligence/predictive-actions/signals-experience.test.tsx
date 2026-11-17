import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignalsExperience } from "./signals-experience";

const mocks = vi.hoisted(() => ({ flow: vi.fn(), results: vi.fn() }));
vi.mock("./use-onboarding", () => ({ useOnboarding: mocks.flow }));
vi.mock("./formulas-dialog", () => ({ FormulasDialog: () => null }));
vi.mock("./activated-signals", () => ({
  ActivatedSignals: (props: { scope: string; onboardingId: string }) => {
    mocks.results(props);
    return <div>Activated signals dashboard</div>;
  }
}));
vi.mock("next/image", () => ({
  default: ({ src }: { src: string }) => <span data-image={src} />
}));
vi.mock("@/lib/axios", () => ({ axiosConfig: () => ({}) }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "" } }));

const base = {
  scope: "user:tenant", record: null, loading: false, error: null, actionError: null,
  pack: { data: { name: "Actual Pack", version: "2.0" }, isError: false, refetch: vi.fn() },
  canManage: true, busy: false, warnings: [],
  generate: vi.fn(), regenerate: vi.fn(), activate: vi.fn(), refresh: vi.fn(), reload: vi.fn()
};
const ready = {
  id: "record", name: "Example Company", status: "ready", version: 4,
  industry_pack_version: "1.2", modules: ["one", "two"],
  datasets: { one: {}, two: {}, three: {} }, detectors: [{}, {}],
  generation: { pack_generated: true }, is_active: false
};
function render(overrides: Record<string, unknown> = {}) {
  mocks.flow.mockReturnValue({ ...base, ...overrides });
  return renderToStaticMarkup(<SignalsExperience />);
}
const text = (html: string) => html.replace(/<[^>]*>/g, "");

describe("server-driven onboarding screens", () => {
  beforeEach(() => vi.clearAllMocks());

  it("waits for initial API data rather than flashing an actionable empty state", () => {
    const html = render({ loading: true });
    expect(html).toContain("Loading your data source");
    expect(html).not.toContain("Analyze &amp; Generate");
  });

  it("shows the empty state only after confirming there is no onboarding", () => {
    const html = render();
    expect(html).toContain("Analyze &amp; Generate");
    expect(html).toContain("/images/operations-intelligence/intro.webp");
    expect(html).not.toContain("UI demo");
  });

  it.each([
    { stage: "intro", record: null },
    { stage: "ready", record: ready },
    { stage: "failed", record: { ...ready, status: "failed" } }
  ])("uses portal theme colors for the $stage primary action", ({ record }) => {
    const html = render({ record });
    expect(html).toContain("bg-primary-700");
    expect(html).toContain("hover:bg-primary-800");
    expect(html).not.toMatch(/<button[^>]*class="[^"]*bg-red-/);
  });

  it("shows a retry instead of treating a failed initial request as empty", () => {
    const html = render({ error: new Error("Gateway offline") });
    expect(html).toContain("Gateway offline");
    expect(html).toContain("Try Again");
    expect(html).not.toContain("Analyze &amp; Generate");
  });

  it("keeps generating driven by backend status without fake table counts or success", () => {
    const html = render({ record: { ...ready, status: "generating" } });
    expect(html).toContain("Setting up your data source");
    expect(html).toContain("Completion is confirmed by the AI engine");
    expect(html).not.toContain("Read 14 tables");
    expect(html).not.toContain("Your data source is ready");
  });

  it("renders the real failure message and regeneration action", () => {
    const html = render({ record: { ...ready, status: "failed", status_message: "column 'missing' not in table 'production'" } });
    expect(text(html)).toContain("Setup did not finish");
    expect(html).toContain("missing");
    expect(html).toContain("Regenerate");
    expect(html).not.toContain("yearly_saleable_production");
  });

  it("derives counts and the selected pack/version from API data", () => {
    const html = render({ record: ready });
    expect(text(html)).toContain("Actual Pack 1.2");
    expect(text(html)).toContain("set up 2 detectors in 2 modules");
    expect(text(html)).toContain("3Datasets mapped");
    expect(html).not.toContain("Low confidence mappings");
    expect(html).toContain("Industry pack generated automatically");
  });

  it("switches from the activation card to the real signals dashboard after success", () => {
    expect(render({ record: ready })).toMatch(/>Activate</);
    const html = render({ record: { ...ready, is_active: true } });
    expect(text(html)).toContain("Activated signals dashboard");
    expect(mocks.results).toHaveBeenCalledWith(expect.objectContaining({
      scope: "user:tenant", onboardingId: ready.id, canManage: true, onReviewFormulas: expect.any(Function)
    }));
    expect(html).not.toMatch(/>Activate</);
    expect(html).not.toContain("Your data source is ready");
    expect(html).not.toContain("Annulus pressure");
    expect(html).not.toContain("Restart demo");
  });

  it("opens the dashboard on reload for an active onboarding with empty generated arrays", () => {
    const html = render({ record: {
      id: "71c5d449-0958-4024-9de5-9a873bfc359e",
      name: "KomangTerbang.ltd", status: "ready", is_active: true, version: 3,
      datasets: {}, detectors: [], metrics: [], actions: [], datastore_connection_id: "",
      modules: [{ id: "quality_rejection", label: "Quality & Rejection Control" }]
    } });
    expect(html).toContain("Activated signals dashboard");
    expect(html).not.toContain("Your data source is ready");
    expect(html).not.toContain("Analyze &amp; Generate");
  });

  it("lets view-only users open the activated screen without activation controls", () => {
    const html = render({ canManage: false, record: { ...ready, is_active: true } });
    expect(html).toContain("Activated signals dashboard");
    expect(html).toContain("You have view-only access.");
    expect(html).not.toContain("An editor can generate");
    expect(html).not.toMatch(/>Activate</);
  });

  it("disables writes for view-only users", () => {
    const html = render({ canManage: false });
    expect(html).toContain("view-only access");
    expect(html).toContain('disabled=""');
  });

  it("shows validation details and non-blocking warnings returned by the backend", () => {
    const html = render({
      record: ready, warnings: ["Generated pack needs review"],
      actionError: { response: { status: 422, data: { error: {
        message: "Invalid threshold", details: [{ path: "detectors[0].params.threshold", message: "must be positive" }]
      } } } }
    });
    expect(html).toContain("Generated pack needs review");
    expect(text(html)).toContain("detectors[0].params.threshold: must be positive");
  });
});
