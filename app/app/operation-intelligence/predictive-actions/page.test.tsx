import { beforeEach, describe, expect, it, vi } from "vitest";
import PredictiveActionsPage from "./page";
import PredictiveActionsLayout from "./layout";

const { requireRouteAccess } = vi.hoisted(() => ({ requireRouteAccess: vi.fn() }));

vi.mock("@/lib/require-auth", () => ({ requireRouteAccess }));
vi.mock("./signals-experience", () => ({
  SignalsExperience: () => null
}));

describe("predictive actions route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the API-driven experience without overriding its state with a demo preview", () => {
    const page = PredictiveActionsPage();
    expect(page.props).not.toHaveProperty("initialStage");
  });

  it("checks RBAC access instead of restricting the route to one company", async () => {
    requireRouteAccess.mockResolvedValue(undefined);
    expect(await PredictiveActionsLayout({ children: "protected content" })).toBe("protected content");
    expect(requireRouteAccess).toHaveBeenCalledWith("/app/operation-intelligence/predictive-actions");
  });

  it("does not render when RBAC authorization fails", async () => {
    requireRouteAccess.mockRejectedValue(new Error("unauthorized"));
    await expect(PredictiveActionsLayout({ children: "protected content" })).rejects.toThrow("unauthorized");
  });
});
