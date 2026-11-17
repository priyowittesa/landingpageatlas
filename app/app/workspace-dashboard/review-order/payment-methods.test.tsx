import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  states: [] as unknown[],
  cursor: 0,
  checkout: vi.fn()
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    // Preserve hook state between captured renders without mounting a DOM.
    useState: (initial: unknown) => {
      const index = mocks.cursor++;
      if (!(index in mocks.states)) {
        mocks.states[index] = typeof initial === "function" ? initial() : initial;
      }
      return [mocks.states[index], (update: unknown) => {
        mocks.states[index] = typeof update === "function" ? update(mocks.states[index]) : update;
      }];
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
vi.mock("@/hooks/useSyncUser", () => ({ useSyncUser: () => ({}) }));
vi.mock("../explore-module/use-packages", () => ({
  getIcon: vi.fn(),
  isCatalogAvailable: () => true,
  useCheckout: () => ({ mutate: mocks.checkout, isPending: false }),
  useGetModules: () => ({ data: { items: [] } }),
  useGetPackages: () => ({
    data: {
      items: [{
        id: "package-1", name: "Package", status: "active",
        monthly_price: 10, monthly_price_idr: 250000,
        yearly_price: 100, yearly_price_idr: 2500000,
        module_ids: [], included_modules: []
      }]
    }
  }),
  useGetTransaction: vi.fn(),
  useResumeTransaction: vi.fn(),
  useDownloadTransactionReceipt: vi.fn()
}));

import { ReviewOrderClient } from "./review-order-client";

type ButtonProps = {
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  "aria-pressed"?: boolean;
};

function renderReview() {
  let tree: ReactNode;
  mocks.cursor = 0;
  function CaptureReview() {
    tree = ReviewOrderClient({
      initialAddOns: [], initialBillingCycle: "monthly", packageIds: ["package-1"]
    });
    return null;
  }
  renderToStaticMarkup(<CaptureReview />);
  return tree;
}

function text(node: ReactNode): string {
  return Children.toArray(node).map((child) =>
    isValidElement<{ children?: ReactNode }>(child)
      ? text(child.props.children)
      : typeof child === "string" ? child : ""
  ).join("");
}

function findButton(node: ReactNode, label: string): ButtonProps | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<ButtonProps>(child)) continue;
    if (child.type === "button" && text(child.props.children).includes(label)) return child.props;
    const button = findButton(child.props.children, label);
    if (button) return button;
  }
}

function button(label: string) {
  const result = findButton(renderReview(), label);
  if (!result) throw new Error(`Button not found: ${label}`);
  return result;
}

describe("checkout credit-card currency restrictions", () => {
  beforeEach(() => {
    mocks.states = [];
    mocks.cursor = 0;
    mocks.checkout.mockReset();
  });

  it("disables card payments for IDR and explains the USD requirement", () => {
    const card = button("Credit / Debit Card");
    expect(card.disabled).toBe(true);
    expect(text(card.children)).toContain("Available for USD payments only.");
    card.onClick!();
    expect(button("Virtual Account")["aria-pressed"]).toBe(true);
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "IDR", payment_method: "bca_va" }),
      expect.any(Object)
    );
  });

  it("allows selecting and submitting credit-card payments in USD", () => {
    button("USD Payment").onClick!();
    expect(button("Credit / Debit Card").disabled).toBe(false);
    button("Credit / Debit Card").onClick!();
    expect(button("Credit / Debit Card")["aria-pressed"]).toBe(true);
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD", payment_method: "credit_card" }),
      expect.any(Object)
    );
  });

  it("resets a selected card to virtual account when switching back to IDR", () => {
    button("USD Payment").onClick!();
    button("Credit / Debit Card").onClick!();
    button("IDR Payment").onClick!();
    expect(button("Credit / Debit Card").disabled).toBe(true);
    expect(button("Credit / Debit Card")["aria-pressed"]).toBe(false);
    expect(button("Virtual Account")["aria-pressed"]).toBe(true);
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "IDR", payment_method: "bca_va" }),
      expect.any(Object)
    );
  });

  it("switches an e-wallet selection to card for USD and hides non-card methods", () => {
    button("E-Wallet").onClick!();
    button("USD Payment").onClick!();
    expect(findButton(renderReview(), "E-Wallet")).toBeUndefined();
    expect(findButton(renderReview(), "Virtual Account")).toBeUndefined();
    expect(button("Credit / Debit Card")["aria-pressed"]).toBe(true);
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD", payment_method: "credit_card" }),
      expect.any(Object)
    );
    button("IDR Payment").onClick!();
    expect(button("Virtual Account")["aria-pressed"]).toBe(true);
    button("E-Wallet").onClick!();
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "IDR", payment_method: "gopay" }),
      expect.any(Object)
    );
  });

  it("hides virtual account and switches its selection to card for USD", () => {
    button("USD Payment").onClick!();
    expect(findButton(renderReview(), "Virtual Account")).toBeUndefined();
    expect(findButton(renderReview(), "bca_va")).toBeUndefined();
    expect(button("Credit / Debit Card")["aria-pressed"]).toBe(true);
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD", payment_method: "credit_card" }),
      expect.any(Object)
    );
  });

  it("blocks checkout if a stale selection leaves BCA virtual account paired with USD", () => {
    const staleVirtualAccountSelection = button("bca_va").onClick!;
    button("USD Payment").onClick!();
    staleVirtualAccountSelection();
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("blocks checkout if a stale selection leaves an e-wallet paired with USD", () => {
    button("E-Wallet").onClick!();
    const staleWalletSelection = button("gopay").onClick!;
    button("USD Payment").onClick!();
    staleWalletSelection();
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("blocks checkout if a stale selection leaves a card paired with IDR", () => {
    button("USD Payment").onClick!();
    button("Credit / Debit Card").onClick!();
    const staleCardSelection = button("credit_card").onClick!;
    button("IDR Payment").onClick!();
    staleCardSelection();
    button("Complete Purchase").onClick!();
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
});
