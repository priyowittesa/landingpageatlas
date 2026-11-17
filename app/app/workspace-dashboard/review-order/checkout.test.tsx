import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  resume: vi.fn(),
  resumeTransaction: vi.fn(),
  checkout: vi.fn(),
  packages: vi.fn(),
  syncCurrentUser: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useEffect: (effect: () => void) => {
      effect();
      effect();
    }
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: null }) }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));
vi.mock("@/components/layout/dasbhoard/ResponsiveSidebarProvider", () => ({
  useSidebar: () => ({ collapsed: false })
}));
vi.mock("@/hooks/useAuthMe", () => ({ useAuthMe: () => ({}) }));
vi.mock("@/hooks/useSyncUser", () => ({
  useSyncUser: () => ({ syncCurrentUser: mocks.syncCurrentUser, isLoading: false })
}));
vi.mock("../explore-module/use-packages", () => ({
  getIcon: vi.fn(),
  isCatalogAvailable: () => true,
  useCheckout: mocks.checkout,
  useGetModules: () => ({ data: { items: [] } }),
  useGetPackages: mocks.packages,
  useGetTransaction: mocks.transaction,
  useResumeTransaction: mocks.resume,
  useDownloadTransactionReceipt: () => ({ mutate: vi.fn() })
}));

import { checkoutUrl, reviewUrl } from "./checkout-url";
import ReviewOrderPage from "./page";
import { RestoreCheckoutView, ReviewOrderClient } from "./review-order-client";

const paymentDetails = {
  bank: "bca",
  expiry_time: "2026-11-01T00:00:00Z",
  order_id: "order-1",
  payment_method: "bca_va",
  provider: "provider",
  provider_url: "",
  qr_url: "",
  transaction_id: "tx-1",
  va_number: "123456"
};

function renderRestoredPayment() {
  return renderToStaticMarkup(
    <RestoreCheckoutView
      transactionId="tx-1"
      onBack={vi.fn()}
      addOns={[]}
      billingCycle="yearly"
      includedModules={[]}
      packages={[]}
    />
  );
}

function findButton(node: ReactNode, label: string): (() => void) | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) continue;
    if (child.type === "button" && Children.toArray(child.props.children).includes(label)) {
      return child.props.onClick;
    }
    const onClick = findButton(child.props.children, label);
    if (onClick) return onClick;
  }
}

describe("checkout refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.packages.mockReturnValue({ data: { items: [] } });
    mocks.transaction.mockReturnValue({
      data: { status: "pending", currency: "IDR", final_amount: 250000 },
      isError: false,
      refetch: vi.fn()
    });
    mocks.resume.mockReturnValue({
      isIdle: false,
      isError: false,
      data: paymentDetails,
      mutate: mocks.resumeTransaction
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(["pending", "paid"])(
    "restores a %s payment from the URL written by Complete Purchase",
    async (status) => {
      const location = {
        href: "https://atlas.example/app/workspace-dashboard/review-order?package=package-1"
      };
      const replaceState = vi.fn((_, __, url: string) => { location.href = url; });
      vi.stubGlobal("window", { location, history: { replaceState } });
      mocks.packages.mockReturnValue({
        data: {
          items: [{
            id: "package-1", name: "Package", status: "active",
            monthly_price: 10, monthly_price_idr: 250000,
            yearly_price: 100, yearly_price_idr: 2500000,
            module_ids: [], included_modules: []
          }]
        }
      });
      const mutate = vi.fn((_, { onSuccess }) =>
        onSuccess({ ...paymentDetails, final_amount: 250000 })
      );
      mocks.checkout.mockReturnValue({ mutate, isPending: false });
      let completePurchase: (() => void) | undefined;
      function CaptureReview() {
        completePurchase = findButton(ReviewOrderClient({
          initialAddOns: [],
          initialBillingCycle: "monthly",
          packageIds: ["package-1"]
        }), "Complete Purchase");
        return null;
      }
      renderToStaticMarkup(<CaptureReview />);
      replaceState.mockClear();
      expect(completePurchase).toBeDefined();
      completePurchase!();
      expect(mutate).toHaveBeenCalledOnce();
      expect(replaceState).toHaveBeenCalledOnce();
      expect(new URL(location.href).searchParams.get("transaction")).toBe("tx-1");

      mocks.transaction.mockReturnValue({
        data: { status, currency: "IDR", final_amount: 250000 }
      });
      const refreshedPage = await ReviewOrderPage({
        searchParams: Promise.resolve(Object.fromEntries(new URL(location.href).searchParams))
      });
      const markup = renderToStaticMarkup(refreshedPage);
      expect(markup).toContain(status === "paid" ? "Payment Successful" : "Complete Your Payment");
      expect(markup).not.toContain("Review Order");
      expect(mutate).toHaveBeenCalledOnce();
    }
  );

  it("stores the actual checkout selection and transaction in the refresh URL", async () => {
    const url = new URL(checkoutUrl(
      "https://atlas.example/app/workspace-dashboard/review-order?package=old&addons=old&renewal=1",
      "tx-1",
      ["package-1", "package-2"],
      { "addon-1": "yearly", "addon-2": "monthly" },
      "yearly"
    ));
    const page = await ReviewOrderPage({
      searchParams: Promise.resolve(Object.fromEntries(url.searchParams))
    });

    expect(page.type).toBe(ReviewOrderClient);
    expect(page.props).toMatchObject({
      initialTransactionId: "tx-1",
      packageIds: ["package-1", "package-2"],
      initialAddOns: ["addon-1", "addon-2"],
      initialAddOnBillingCycles: '{"addon-1":"yearly","addon-2":"monthly"}',
      initialBillingCycle: "yearly",
      renewal: true
    });
    expect(url.search).not.toContain("provider_token");
    expect(new URL(reviewUrl(url.href)).searchParams.has("transaction")).toBe(false);
  });

  it("removes stale add-ons when none were purchased", () => {
    const url = new URL(checkoutUrl(
      "https://atlas.example/review-order?addons=old&addon_billing_cycles=old",
      "tx-1", ["package-1"], {}, "monthly"
    ));
    expect(url.searchParams.has("addons")).toBe(false);
    expect(url.searchParams.has("addon_billing_cycles")).toBe(false);
  });

  it("resumes a pending transaction instead of creating another checkout", () => {
    mocks.resume.mockReturnValue({
      isIdle: true,
      isError: false,
      mutate: mocks.resumeTransaction
    });
    expect(renderRestoredPayment()).toContain("Restoring payment");
    expect(mocks.resumeTransaction).toHaveBeenCalledWith("tx-1");
    expect(mocks.resumeTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("renders the payment screen instead of review for a refreshed route", () => {
    mocks.checkout.mockReturnValue({});
    const markup = renderToStaticMarkup(
      <ReviewOrderClient
        initialTransactionId="tx-1"
        initialAddOns={[]}
        initialBillingCycle="monthly"
        packageIds={[]}
      />
    );
    expect(markup).toContain("Complete Your Payment");
    expect(markup).not.toContain("Review Order");
  });

  it("restores payment details and the transaction amount", () => {
    const markup = renderRestoredPayment();
    expect(markup).toContain("Complete Your Payment");
    expect(markup).toContain("123456");
    expect(markup).toContain("order-1");
    expect(markup).toContain("250.000");
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("shows success when payment completed before the refresh", () => {
    mocks.transaction.mockReturnValue({
      data: { status: "paid", currency: "USD", final_amount: 10 }
    });
    const markup = renderRestoredPayment();
    expect(markup).toContain("Payment Successful");
    expect(mocks.resumeTransaction).not.toHaveBeenCalled();
  });

  it("offers retry when payment details cannot be resumed", () => {
    mocks.resume.mockReturnValue({
      isIdle: false,
      isError: true,
      mutate: mocks.resumeTransaction
    });
    const markup = renderRestoredPayment();
    expect(markup).toContain("Unable to resume payment");
    expect(markup).toContain("Retry");
    expect(markup).toContain("Back to Payment Method");
  });

  it("offers retry when the transaction cannot be loaded", () => {
    mocks.transaction.mockReturnValue({ isError: true, refetch: vi.fn() });
    expect(renderRestoredPayment()).toContain("Retry");
    expect(mocks.resumeTransaction).not.toHaveBeenCalled();
  });

  it("does not resume an expired transaction", () => {
    mocks.transaction.mockReturnValue({
      data: { status: "expired", currency: "IDR", final_amount: 250000 }
    });
    const markup = renderRestoredPayment();
    expect(markup).toContain("This transaction is");
    expect(markup).toContain("expired");
    expect(mocks.resumeTransaction).not.toHaveBeenCalled();
  });
});
