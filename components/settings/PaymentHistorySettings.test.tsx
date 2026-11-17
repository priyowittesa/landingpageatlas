import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentHistorySettings } from "./PaymentHistorySettings";
import type { TransactionItem } from "./use-transactions";

const mocks = vi.hoisted(() => ({
  transactions: vi.fn()
}));

vi.mock("./use-transactions", () => ({
  useTransactions: mocks.transactions,
  downloadTransactionReceipt: vi.fn()
}));
vi.mock("./TransactionDetailPanel", () => ({
  TransactionDetailPanel: () => null
}));

function transaction(id: string): TransactionItem {
  return {
    id,
    order_id: `order-${id}`,
    invoice_number: `INV-${id}`,
    type: "subscription",
    status: "paid",
    billing_cycle: "monthly",
    currency: "USD",
    subtotal: 100,
    discount_amount: 0,
    final_amount: 100,
    payment_method: "credit_card",
    provider: "",
    promo_code: "",
    paid_at: "2026-11-01T00:00:00Z",
    created_at: "2026-11-01T00:00:00Z",
    items: []
  };
}

describe("Payment History controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transactions.mockReturnValue({
      data: {
        items: [transaction("1"), transaction("2")],
        total_count: 2,
        next_page_token: ""
      },
      isLoading: false,
      isFetching: false,
      isError: false
    });
  });

  it("does not offer transaction selection or bulk export", () => {
    const html = renderToStaticMarkup(<PaymentHistorySettings />);

    expect(html).toContain("Invoice #INV-1");
    expect(html).toContain("Invoice #INV-2");
    expect(html).not.toContain('role="checkbox"');
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain("Select all");
    expect(html).not.toContain("Export");
    expect(html).not.toContain('data-state="selected"');
  });

  it("keeps receipt downloads, invoice details, filters, and pagination", () => {
    const html = renderToStaticMarkup(<PaymentHistorySettings />);

    expect(html.match(/aria-label="Download receipt"/g)).toHaveLength(2);
    expect(html.match(/aria-label="View invoice"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Filter by status"');
    expect(html).toContain('aria-label="Search invoices"');
    expect(html).toContain("Showing 1-2 of 2 transactions");
    expect(html).toContain("Previous");
    expect(html).toContain("Next");
  });

  it.each([
    { isLoading: false, isError: false, message: "No transactions match your filters." },
    { isLoading: true, isError: false, message: "Loading transactions" },
    { isLoading: false, isError: true, message: "Unable to load transactions. Please try again." }
  ])("does not offer bulk controls when showing $message", ({ message, ...state }) => {
    mocks.transactions.mockReturnValue({ ...state, isFetching: false });
    const html = renderToStaticMarkup(<PaymentHistorySettings />);

    expect(html).toContain(message);
    expect(html).not.toContain('role="checkbox"');
    expect(html).not.toContain("Select all");
    expect(html).not.toContain("Export");
  });
});
