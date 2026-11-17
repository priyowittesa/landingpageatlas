import { z } from "zod";

const paymentMethodSchema = z.object({
  id: z.string().min(1),
  brand: z.enum(["visa", "mastercard"]),
  lastFour: z.string().regex(/^\d{4}$/),
  expires: z.string(),
  cardholder: z.string(),
  billingAddress: z.string(),
  country: z.string(),
  zip: z.string(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type CardBrand = PaymentMethod["brand"];

const methodsSchema = z.array(paymentMethodSchema);
const CHANGE_EVENT = "atlas-payment-methods-changed";

export function paymentMethodsKey(userId?: string, tenantId = "") {
  return userId
    ? `atlas:payment-methods:v1:${encodeURIComponent(userId)}:${encodeURIComponent(tenantId)}`
    : null;
}

export function parsePaymentMethods(snapshot: string | null): PaymentMethod[] {
  if (!snapshot) return [];
  try {
    return methodsSchema.parse(JSON.parse(snapshot));
  } catch {
    return [];
  }
}

export function paymentMethodsSnapshot(key: string | null): string | null {
  if (!key || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function savePaymentMethods(key: string | null, methods: PaymentMethod[]) {
  if (!key) throw new Error("No signed-in account");
  // Zod strips unknown fields so full card numbers and CVCs cannot be persisted.
  const safeMethods = methodsSchema.parse(methods);
  window.localStorage.setItem(key, JSON.stringify(safeMethods));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribePaymentMethods(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
