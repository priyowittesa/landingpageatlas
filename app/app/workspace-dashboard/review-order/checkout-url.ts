import type { CatalogBillingCycle } from "../explore-module/use-packages";

export function selectionUrl(
  href: string,
  packageIds: string[],
  addOnBillingCycles: Record<string, CatalogBillingCycle>,
  billingCycle: CatalogBillingCycle
) {
  const url = new URL(href);
  const addOnIds = Object.keys(addOnBillingCycles);
  url.searchParams.set("packages", packageIds.join(","));
  url.searchParams.set("billing_cycle", billingCycle);
  if (addOnIds.length) {
    url.searchParams.set("addons", addOnIds.join(","));
    url.searchParams.set("addon_billing_cycles", JSON.stringify(addOnBillingCycles));
  } else {
    url.searchParams.delete("addons");
    url.searchParams.delete("addon_billing_cycles");
  }
  return url.toString();
}

export function checkoutUrl(
  href: string,
  transactionId: string,
  packageIds: string[],
  addOnBillingCycles: Record<string, CatalogBillingCycle>,
  billingCycle: CatalogBillingCycle
) {
  const url = new URL(selectionUrl(href, packageIds, addOnBillingCycles, billingCycle));
  url.searchParams.set("transaction", transactionId);
  return url.toString();
}

export function reviewUrl(href: string) {
  const url = new URL(href);
  url.searchParams.delete("transaction");
  return url.toString();
}
