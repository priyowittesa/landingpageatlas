import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentMethodSettings } from "./PaymentMethodSettings";
import { paymentMethodsKey } from "./payment-method-storage";

const mocks = vi.hoisted(() => ({ authMe: vi.fn() }));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: mocks.authMe }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => string | null) => snapshot(),
}));

describe("Payment Method Settings", () => {
  let stored: Map<string, string>;
  beforeEach(() => {
    vi.clearAllMocks();
    stored = new Map();
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => stored.get(key) ?? null },
    });
    mocks.authMe.mockReturnValue({
      data: { user_id: "user-1", tenant_id: "tenant-1" },
      isLoading: false,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("starts without hard-coded demo cards and explains browser-only storage", () => {
    const html = renderToStaticMarkup(<PaymentMethodSettings />);
    expect(html).toContain("No payment methods");
    expect(html).toContain("saved only in this browser");
    expect(html).toContain("Full card numbers and CVCs are not saved");
    expect(html).not.toContain("John Doe");
    expect(html).not.toContain("4242");
  });

  it("restores only the current account's cards on a fresh render", () => {
    stored.set(paymentMethodsKey("user-1", "tenant-1")!, JSON.stringify([{
      id: "card-1", brand: "visa", lastFour: "1234", expires: "12/28",
      cardholder: "Saved User", billingAddress: "United States, 10001",
      country: "United States", zip: "10001",
    }]));
    const render = () => renderToStaticMarkup(<PaymentMethodSettings />);
    expect(render()).toContain("Saved User");
    expect(render()).toContain("1234");

    mocks.authMe.mockReturnValue({
      data: { user_id: "user-2", tenant_id: "tenant-1" }, isLoading: false,
    });
    expect(render()).not.toContain("Saved User");
    expect(render()).toContain("No payment methods");
  });

  it("disables adding cards until the account is available", () => {
    mocks.authMe.mockReturnValue({ isLoading: true });
    const html = renderToStaticMarkup(<PaymentMethodSettings />);
    expect(html).toContain("Loading payment methods...");
    expect(html).toMatch(/<button[^>]*disabled=""/);
  });
});
