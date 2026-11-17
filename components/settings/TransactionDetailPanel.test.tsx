import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ButtonProps } from "@/components/ui/button";
import { TransactionDetailPanel } from "./TransactionDetailPanel";
import type { TransactionItem } from "./use-transactions";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  print: vi.fn(),
  download: vi.fn(),
  error: vi.fn(),
  button: vi.fn<(props: ButtonProps) => void>(),
  states: [] as unknown[],
  cursor: 0,
}));
vi.mock("./use-transactions", () => ({
  useTransaction: mocks.transaction,
  printTransactionReceipt: mocks.print,
  downloadTransactionReceipt: mocks.download,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: vi.fn() } }));
vi.mock("@/components/ui/button", () => ({
  Button: (props: ButtonProps) => {
    mocks.button(props);
    return <button disabled={props.disabled}>{props.children}</button>;
  },
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = mocks.cursor++;
    if (!(index in mocks.states)) mocks.states[index] = initial;
    return [mocks.states[index], (value: unknown) => { mocks.states[index] = value; }];
  },
}));

const transaction: TransactionItem = {
  id: "transaction-1", order_id: "order-1", invoice_number: "INV-1",
  type: "subscription", status: "paid", billing_cycle: "monthly",
  currency: "USD", subtotal: 100, discount_amount: 0, final_amount: 100,
  payment_method: "credit_card", provider: "", promo_code: "",
  paid_at: "2026-11-01T00:00:00Z", created_at: "2026-11-01T00:00:00Z", items: [],
};

function button(label: string) {
  mocks.cursor = 0;
  mocks.button.mockClear();
  renderToStaticMarkup(<TransactionDetailPanel transactionId={transaction.id} onBack={vi.fn()} />);
  const props = mocks.button.mock.calls.map(([props]) => props).find(
    (props) => renderToStaticMarkup(<>{props.children}</>).includes(label)
  );
  if (!props) throw new Error(`Button not found: ${label}`);
  return props;
}

function click(label: string) {
  return (button(label).onClick as () => Promise<void>)();
}

describe("invoice detail actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.states = [];
    mocks.cursor = 0;
    mocks.transaction.mockReturnValue({ data: transaction, isLoading: false });
    mocks.print.mockResolvedValue(undefined);
    mocks.download.mockResolvedValue(undefined);
  });

  it("prints the selected transaction's PDF and disables printing while it loads", async () => {
    let finish!: () => void;
    mocks.print.mockReturnValueOnce(new Promise<void>((resolve) => { finish = resolve; }));

    const printing = click("Print Invoice");
    expect(mocks.print).toHaveBeenCalledWith("transaction-1");
    expect(button("Print Invoice").disabled).toBe(true);
    expect(mocks.download).not.toHaveBeenCalled();

    finish();
    await printing;
    expect(button("Print Invoice").disabled).toBe(false);
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("reports print failures and enables retrying", async () => {
    mocks.print.mockRejectedValueOnce(new Error("offline"));
    await click("Print Invoice");

    expect(mocks.error).toHaveBeenCalledWith("Print failed", {
      description: "Could not print the invoice. Please try again.",
    });
    expect(button("Print Invoice").disabled).toBe(false);
  });

  it("preserves the separate PDF download action", async () => {
    await click("Download PDF");
    expect(mocks.download).toHaveBeenCalledWith("transaction-1", "order-1");
    expect(mocks.print).not.toHaveBeenCalled();
  });
});
