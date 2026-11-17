import { ReviewOrderClient } from "./review-order-client";

export default async function ReviewOrderPage({
  searchParams
}: {
  searchParams: Promise<{
    addons?: string;
    addon_billing_cycles?: string;
    billing_cycle?: string;
    package?: string;
    packages?: string;
    renewal?: string;
    transaction?: string;
  }>;
}) {
  const {
    addons,
    addon_billing_cycles,
    billing_cycle,
    package: packageId,
    packages,
    renewal,
    transaction
  } = await searchParams;
  const packageIds =
    packages?.split(",").filter(Boolean) ?? (packageId ? [packageId] : []);
  return (
    <ReviewOrderClient
      key={JSON.stringify([packageIds, addons, addon_billing_cycles, billing_cycle, renewal, transaction])}
      initialAddOns={addons?.split(",").filter(Boolean) ?? []}
      initialAddOnBillingCycles={addon_billing_cycles}
      initialBillingCycle={billing_cycle === "yearly" ? "yearly" : "monthly"}
      packageIds={packageIds}
      renewal={renewal === "1"}
      initialTransactionId={transaction}
    />
  );
}
