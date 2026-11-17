import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parsePaymentMethods,
  paymentMethodsKey,
  paymentMethodsSnapshot,
  savePaymentMethods,
  subscribePaymentMethods,
  type PaymentMethod,
} from "./payment-method-storage";

const method: PaymentMethod = {
  id: "card-1",
  brand: "visa",
  lastFour: "1234",
  expires: "12/28",
  cardholder: "Test User",
  billingAddress: "United States, 10001",
  country: "United States",
  zip: "10001",
};

describe("Prototype payment method persistence", () => {
  let stored: Map<string, string>;
  const key = paymentMethodsKey("user-1", "tenant-1")!;
  const load = () => parsePaymentMethods(paymentMethodsSnapshot(key));

  beforeEach(() => {
    stored = new Map();
    vi.stubGlobal("window", Object.assign(new EventTarget(), {
      localStorage: {
        getItem: vi.fn((name: string) => stored.get(name) ?? null),
        setItem: vi.fn((name: string, value: string) => stored.set(name, value)),
      },
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("restores added cards from storage, including edits and deletion of the last card", () => {
    savePaymentMethods(key, [method]);
    expect(load()).toEqual([method]);

    savePaymentMethods(key, [{ ...load()[0], cardholder: "Updated Name" }]);
    expect(load()[0].cardholder).toBe("Updated Name");

    savePaymentMethods(key, []);
    expect(load()).toEqual([]);
    expect(stored.get(key)).toBe("[]");
  });

  it("never persists full card numbers, CVCs, or other unapproved fields", () => {
    const withSecrets = { ...method, cardNumber: "4000000000001234", cvc: "918" };
    savePaymentMethods(key, [withSecrets]);

    expect(JSON.parse(stored.get(key)!)).toEqual([method]);
    expect(stored.get(key)).not.toContain(withSecrets.cardNumber);
    expect(stored.get(key)).not.toContain(withSecrets.cvc);
    expect(parsePaymentMethods(JSON.stringify([withSecrets]))).toEqual([method]);
  });

  it("isolates users and tenants and refuses to save without an account", () => {
    savePaymentMethods(key, [method]);
    expect(paymentMethodsSnapshot(paymentMethodsKey("user-2", "tenant-1"))).toBeNull();
    expect(paymentMethodsSnapshot(paymentMethodsKey("user-1", "tenant-2"))).toBeNull();
    expect(paymentMethodsKey()).toBeNull();
    expect(() => savePaymentMethods(null, [method])).toThrow("No signed-in account");
    expect(paymentMethodsKey("a:b", "c")).not.toBe(paymentMethodsKey("a", "b:c"));
  });

  it.each(["invalid JSON", "null", "{}", '[{"lastFour":"1234"}]'])(
    "handles malformed stored data without crashing: %s",
    (snapshot) => expect(parsePaymentMethods(snapshot)).toEqual([]),
  );

  it("rejects a full card number in the last-four field", () => {
    expect(() => savePaymentMethods(key, [{ ...method, lastFour: "4000000000001234" }])).toThrow();
    expect(stored.size).toBe(0);
  });

  it("notifies subscribers for local changes and cross-tab storage events", () => {
    const changed = vi.fn();
    const unsubscribe = subscribePaymentMethods(changed);
    savePaymentMethods(key, [method]);
    window.dispatchEvent(new Event("storage"));
    expect(changed).toHaveBeenCalledTimes(2);

    unsubscribe();
    savePaymentMethods(key, []);
    window.dispatchEvent(new Event("storage"));
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("does not report success when browser storage is blocked", () => {
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw new Error("Blocked"); });
    expect(() => savePaymentMethods(key, [method])).toThrow("Blocked");
    vi.mocked(window.localStorage.getItem).mockImplementation(() => { throw new Error("Blocked"); });
    expect(paymentMethodsSnapshot(key)).toBeNull();
  });
});
