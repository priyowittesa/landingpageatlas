"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ContactRound,
  Copy,
  Download,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { useSession } from "next-auth/react";
import { useAuthMe } from "@/hooks/useAuthMe";
import { useSyncUser } from "@/hooks/useSyncUser";
import { queryKeys } from "@/types/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  getIcon,
  isCatalogAvailable,
  useCheckout,
  useGetModules,
  useGetPackages,
  useGetTransaction,
  useDownloadTransactionReceipt,
  useResumeTransaction,
  type ApiModule,
  type ApiPackage,
  type CatalogBillingCycle
} from "../explore-module/use-packages";
import { checkoutUrl, reviewUrl, selectionUrl } from "./checkout-url";
import { PaymentCountdown } from "./payment-countdown";

type AddOn = {
  billingCycle: BillingCycle;
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  monthlyPrice: number;
  monthlyPriceIdr: number;
  yearlyPrice: number | null;
  yearlyPriceIdr: number | null;
};

const paymentGroups = [
  {
    id: "virtual-account",
    title: "Virtual Account",
    description: "Pay through bank transfer using a unique virtual account.",
    icon: Banknote,
    methods: ["bca_va"]
  },
  {
    id: "ewallet",
    title: "E-Wallet",
    description: "Pay through your preferred e-wallet.",
    icon: WalletCards,
    methods: ["gopay"]
  },
  {
    id: "credit-card",
    title: "Credit / Debit Card",
    description: "Pay securely with your card.",
    icon: ContactRound,
    methods: ["credit_card"]
  }
];

type Stage = "review" | "processing" | "waiting";
type BillingCycle = CatalogBillingCycle;

type CheckoutResponse = {
  bank: string;
  expiry_time: string;
  final_amount: number;
  order_id: string;
  payment_method: string;
  provider_url: string;
  qr_url: string;
  transaction_id: string;
  va_number: string;
};

function money(value: number | null | undefined, currency: "USD" | "IDR") {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (currency === "IDR") return `IDR ${safeValue.toLocaleString("id-ID")}`;
  return `$${safeValue.toLocaleString("en-US")}`;
}

type PricedCatalogItem = {
  monthlyPrice: number;
  monthlyPriceIdr: number;
  yearlyPrice: number | null;
  yearlyPriceIdr: number | null;
};

function catalogPrice(
  item: PricedCatalogItem,
  billingCycle: BillingCycle,
  currency: "USD" | "IDR"
): number | null {
  if (billingCycle === "yearly") {
    return currency === "IDR" ? item.yearlyPriceIdr : item.yearlyPrice;
  }
  return currency === "IDR" ? item.monthlyPriceIdr : item.monthlyPrice;
}

function apiCatalogPrice(
  item: ApiModule | ApiPackage,
  billingCycle: BillingCycle,
  currency: "USD" | "IDR"
): number | null {
  return catalogPrice(
    {
      monthlyPrice: item.monthly_price,
      monthlyPriceIdr: item.monthly_price_idr,
      yearlyPrice: item.yearly_price,
      yearlyPriceIdr: item.yearly_price_idr
    },
    billingCycle,
    currency
  );
}

function cycleLabel(billingCycle: BillingCycle): string {
  return billingCycle === "yearly" ? "Year" : "Month";
}

function subscriptionPackageIds(subscription: unknown): string[] {
  const result = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value) result.add(value);
    else if (value && typeof value === "object") {
      const item = value as Record<string, unknown>;
      add(item.package_id ?? item.id);
    }
  };
  const subscriptions = Array.isArray(subscription)
    ? subscription
    : subscription && typeof subscription === "object"
      ? [subscription]
      : [];
  subscriptions.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const data = entry as Record<string, unknown>;
    add(data.package_id);
    if (Array.isArray(data.package_ids)) data.package_ids.forEach(add);
    add(data.package);
    if (Array.isArray(data.packages)) data.packages.forEach(add);
  });
  return [...result];
}

type IncludedModuleItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type SummaryPackage = {
  name: string;
  monthlyPrice: number;
  monthlyPriceIdr: number;
  yearlyPrice: number | null;
  yearlyPriceIdr: number | null;
};

function OrderSummary({
  addOns,
  billingCycle,
  currency,
  compact = false,
  includedModules,
  packages
}: {
  addOns: AddOn[];
  billingCycle: BillingCycle;
  currency: "USD" | "IDR";
  compact?: boolean;
  includedModules: IncludedModuleItem[];
  packages: SummaryPackage[];
}) {
  const packagesTotal = packages.reduce(
    (sum, pkg) => sum + (catalogPrice(pkg, billingCycle, currency) ?? 0),
    0
  );
  const total =
    packagesTotal +
    addOns.reduce(
      (sum, item) => sum + (catalogPrice(item, item.billingCycle, currency) ?? 0),
      0
    );
  return (
    <aside
      className={cn(
        "rounded-xl border border-gray-200 bg-white",
        !compact && "lg:sticky lg:top-20"
      )}
    >
      <div className="space-y-4 p-5 text-[11px]">
        <div>
          <p className="font-bold text-gray-900">Packages</p>
          <div className="mt-3 space-y-2">
            {packages.map((pkg) => {
              const displayPrice = catalogPrice(pkg, billingCycle, currency);
              return (
                <div
                  key={pkg.name}
                  className="flex justify-between gap-3 font-semibold"
                >
                  <span>{pkg.name}</span>
                  <span className="text-primary-700">
                    {money(displayPrice, currency)}
                    <span className="font-normal text-gray-500">
                      {" "}
                      / {cycleLabel(billingCycle)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1 font-semibold">
            <ChevronDown className="h-3 w-3" /> Included Modules
          </p>
          <div className="mt-2 space-y-2 pl-4 text-gray-500">
            {includedModules.map((item) => (
              <div key={item.title} className="flex justify-between gap-3">
                <span>{item.title}</span>
                <span className="text-primary-700">Included</span>
              </div>
            ))}
          </div>
          {addOns.length > 0 && (
            <>
              <p className="mt-4 flex items-center gap-1 font-semibold">
                <ChevronDown className="h-3 w-3" /> Add-on Modules
              </p>
              <div className="mt-2 space-y-2 pl-4 text-gray-500">
                {addOns.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3">
                    <span>{item.title}</span>
                    <span className="text-primary-700">
                      {money(
                        catalogPrice(item, item.billingCycle, currency),
                        currency
                      )}{" "}
                      /{cycleLabel(item.billingCycle)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-end justify-between border-t border-gray-200 pt-4">
          <span className="font-bold text-gray-950">Total</span>
          <span className="text-base font-bold text-primary-700">
            {money(total, currency)}
            <span className="text-[11px] font-normal text-gray-500">
              {" "}
              {addOns.some((item) => item.billingCycle !== billingCycle) ? "due initially" : `/${cycleLabel(billingCycle)}`}
            </span>
          </span>
        </div>
        {!compact && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            {[
              {
                icon: ShieldCheck,
                title: "Secure Payment",
                text: "Your data is encrypted and safe"
              },
              {
                icon: Clock3,
                title: "Cancel Anytime",
                text: "No long-term contracts"
              },
              {
                icon: Zap,
                title: "Instant Access",
                text: "Start using modules right away"
              }
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-[10px] text-gray-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function SelectedItem({
  title,
  description,
  icon: Icon,
  monthlyPrice,
  monthlyPriceIdr,
  yearlyPrice,
  yearlyPriceIdr,
  billingCycle,
  currency,
  onBillingCycleChange,
  onRemove
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  monthlyPrice: number;
  monthlyPriceIdr: number;
  yearlyPrice: number | null;
  yearlyPriceIdr: number | null;
  billingCycle: BillingCycle;
  currency: "USD" | "IDR";
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onRemove?: () => void;
}) {
  return (
    <article className="flex items-start gap-3 rounded-lg border border-primary-500 bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-semibold text-gray-950">{title}</h4>
        <p className="mt-1 text-[10px] leading-4 text-gray-500">
          {description}
        </p>
        <p className="mt-1 text-[10px] font-semibold text-primary-700">
          {money(
            catalogPrice(
              { monthlyPrice, monthlyPriceIdr, yearlyPrice, yearlyPriceIdr },
              billingCycle,
              currency
            ),
            currency
          )}{" "}
          <span className="font-normal text-gray-500">
            /{cycleLabel(billingCycle)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Select
          value={billingCycle}
          onValueChange={(value) => onBillingCycleChange(value as BillingCycle)}
        >
          <SelectTrigger
            aria-label={`${title} billing cycle`}
            className="h-7 w-24 rounded-md px-2 text-[10px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly" disabled={yearlyPrice == null}>
              Yearly
            </SelectItem>
          </SelectContent>
        </Select>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-6 items-center gap-1 rounded border border-red-300 px-2 text-[9px] font-semibold text-red-500 hover:bg-red-50"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
    </article>
  );
}

function ProcessingView({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1400);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <LoaderCircle className="h-14 w-14 animate-spin text-primary-500" />
      <h1 className="mt-5 text-lg font-bold text-gray-950">
        Processing Payment
      </h1>
      <p className="mt-1 text-xs text-gray-500">
        Please wait while we securely process your payment.
      </p>
    </div>
  );
}

function WaitingView({
  onBack,
  addOns,
  billingCycle,
  currency,
  includedModules,
  packages,
  checkoutResponse,
  transactionId
}: {
  onBack: () => void;
  addOns: AddOn[];
  billingCycle: BillingCycle;
  currency: "USD" | "IDR";
  includedModules: IncludedModuleItem[];
  packages: SummaryPackage[];
  checkoutResponse: CheckoutResponse;
  transactionId: string;
}) {
  const [copied, setCopied] = useState(false);
  const transaction = useGetTransaction(transactionId);

  if (transaction.data?.status === "paid") {
    return (
      <SuccessView
        addOns={addOns}
        billingCycle={billingCycle}
        currency={currency}
        includedModules={includedModules}
        packages={packages}
        transactionId={transactionId}
      />
    );
  }

  const paymentMethod = checkoutResponse.payment_method;
  const isQrPayment =
    paymentMethod === "gopay" || Boolean(checkoutResponse.qr_url);
  const isRedirectPayment = paymentMethod === "credit_card";
  const isVaPayment = !isQrPayment && !isRedirectPayment;
  const bankLabel = checkoutResponse.bank.toUpperCase();
  const vaNumber = checkoutResponse.va_number;
  const orderId = checkoutResponse.order_id;
  const expiryDate = new Date(checkoutResponse.expiry_time);
  const formattedExpiry = expiryDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  });
  const formattedExpiryTime = expiryDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });

  const howToPaySteps = (() => {
    switch (paymentMethod) {
      case "bca_va":
        return [
          "Go to your bank application or ATM",
          "Choose transfer and select BCA Virtual Account",
          "Enter the virtual account number",
          "Confirm the payment"
        ];
      case "bni_va":
        return [
          "Go to your bank application or ATM",
          "Choose transfer and select BNI Virtual Account",
          "Enter the virtual account number",
          "Confirm the payment"
        ];
      case "mandiri_va":
        return [
          "Go to your bank application or ATM",
          "Choose transfer and select Mandiri Virtual Account",
          "Enter the virtual account number",
          "Confirm the payment"
        ];
      case "permata_va":
        return [
          "Go to your bank application or ATM",
          "Choose transfer and select Permata Virtual Account",
          "Enter the virtual account number",
          "Confirm the payment"
        ];
      case "gopay":
        return [
          "Open GoPay app on your phone",
          "Tap 'Pay' and scan the QR code",
          "Check the merchant name and amount",
          "Confirm the payment with your PIN"
        ];
      case "credit_card":
        return [
          "Open your bank's mobile app or website",
          "Navigate to credit card payment",
          "Enter card details if prompted",
          "Confirm the payment"
        ];
      default:
        return [
          "Go to your bank application or ATM",
          "Choose transfer and select Virtual Account",
          "Enter the virtual account number",
          "Confirm the payment"
        ];
    }
  })();

  return (
    <div className="pb-10">
      <h1 className="text-xl font-bold text-gray-950">Complete Your Payment</h1>
      <p className="mt-1 text-xs text-gray-500">
        Complete your payment using the selected payment method to activate your
        workspace and selected modules.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-primary-400 bg-primary-50 p-4 sm:flex-row sm:items-center">
            <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
            <div className="flex-1">
              <p className="text-xs font-bold text-primary-700">
                Waiting for your payment
              </p>
              <p className="text-[10px] text-primary-600">
                Once we receive it, your order will be activated automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => transaction.refetch()}
              disabled={transaction.isFetching}
              className="h-9 rounded-md bg-primary-700 px-4 text-xs font-semibold text-white disabled:opacity-60"
            >
              <RefreshCw
                className={cn(
                  "mr-2 inline h-3.5 w-3.5",
                  transaction.isFetching && "animate-spin"
                )}
              />
              {transaction.isFetching ? "Checking..." : "Refresh Status"}
            </button>
          </div>
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            {isVaPayment && (
              <>
                <p className="text-[10px] uppercase text-gray-400">
                  Virtual account number
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="rounded bg-blue-600 px-2 py-1 text-sm font-black text-white">
                    {bankLabel}
                  </span>
                  <strong className="text-2xl tracking-wide text-primary-700">
                    {vaNumber}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(vaNumber);
                      setCopied(true);
                    }}
                    className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-primary-400 px-3 text-[10px] font-semibold text-primary-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            )}
            {isQrPayment && (
              <>
                <p className="text-[10px] uppercase text-gray-400">
                  Scan to pay with{" "}
                  {paymentMethod === "gopay" ? "GoPay" : "e-wallet"}
                </p>
                <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                    {checkoutResponse.qr_url ? (
                      <QRCodeSVG
                        value={checkoutResponse.qr_url}
                        size={200}
                        level="M"
                        className="h-50 w-50"
                      />
                    ) : (
                      <div className="flex h-50 w-50 items-center justify-center rounded-md bg-gray-50 text-center text-[10px] text-gray-400">
                        QR code unavailable
                      </div>
                    )}
                    <p className="text-[10px] font-semibold text-gray-500">
                      Open{" "}
                      {paymentMethod === "gopay" ? "GoPay" : "your e-wallet"}{" "}
                      app and scan this code
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    <p className="text-[11px] text-gray-600">
                      Scan the QR code with your{" "}
                      {paymentMethod === "gopay" ? "GoPay" : "e-wallet"} app, or
                      open the payment page directly on this device.
                    </p>
                    {checkoutResponse.provider_url && (
                      <a
                        href={checkoutResponse.provider_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-primary-700 px-5 text-xs font-semibold text-white hover:bg-primary-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Payment Page
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
            {isRedirectPayment && (
              <>
                <p className="text-[10px] uppercase text-gray-400">
                  Credit / debit card payment
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <p className="text-[11px] text-gray-600">
                    Complete your card payment on the secure provider page. You
                    will be redirected to the payment gateway.
                  </p>
                  {checkoutResponse.provider_url && (
                    <a
                      href={checkoutResponse.provider_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-primary-700 px-5 text-xs font-semibold text-white hover:bg-primary-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Payment Page
                    </a>
                  )}
                </div>
              </>
            )}
            <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 text-[11px] sm:grid-cols-2">
              <div className="space-y-3">
                <p>
                  <span className="block text-gray-400">Order ID</span>
                  <strong>{orderId}</strong>
                </p>
                <p>
                  <span className="block text-gray-400">Total Amount</span>
                  <strong className="text-primary-700">
                    {money(checkoutResponse.final_amount, currency)}
                  </strong>
                </p>
                <p>
                  <span className="block text-gray-400">Payment Expiry</span>
                  <strong>
                    {formattedExpiry}, {formattedExpiryTime} WIB
                  </strong>
                </p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-gray-50 p-5 text-center">
                <PaymentCountdown expiryTime={checkoutResponse.expiry_time} />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold">How to pay</h2>
            <ol className="mt-4 space-y-4 text-xs text-gray-600">
              {howToPaySteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <div>
          <OrderSummary
            addOns={addOns}
            billingCycle={billingCycle}
            currency={currency}
            includedModules={includedModules}
            packages={packages}
          />
          <button
            type="button"
            onClick={onBack}
            className="mt-3 h-10 w-full rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold"
          >
            <ArrowLeft className="mr-2 inline h-3.5 w-3.5" />
            Back to Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessView({
  addOns,
  billingCycle,
  currency,
  includedModules,
  packages,
  transactionId
}: {
  addOns: AddOn[];
  billingCycle: BillingCycle;
  currency: "USD" | "IDR";
  includedModules: IncludedModuleItem[];
  packages: SummaryPackage[];
  transactionId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { syncCurrentUser, isLoading: isSyncingUser } = useSyncUser();
  const downloadReceipt = useDownloadTransactionReceipt();
  const [isNavigating, setIsNavigating] = useState(false);

  // Refresh the current user's profile and RBAC via GET /v1/auth/me as soon
  // as the payment is confirmed so the workspace reflects the new
  // subscription/modules without waiting for a manual action.
  useEffect(() => {
    syncCurrentUser().catch(() => {
      // Best-effort refresh; surface errors via the existing sync state.
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToWorkspace = async (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await Promise.all([
        syncCurrentUser(),
        queryClient.invalidateQueries({ queryKey: queryKeys.user.me() })
      ]);
    } catch {
      // Even if the refresh fails, proceed to the workspace so the user
      // isn't stranded on the success screen.
    }
    router.replace("/app/workspace-dashboard?skipTransactions=1");
  };

  const isBusy = isNavigating || isSyncingUser;

  return (
    <div className="pb-10">
      <h1 className="text-xl font-bold text-gray-950">Payment Successful</h1>
      <p className="mt-1 text-xs text-gray-500">
        Your payment has been confirmed. We&apos;re now activating your
        workspace and selected modules.
      </p>
      <div className="mt-5 flex gap-3 rounded-xl border border-green-300 bg-green-50 p-4 text-green-700">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <div>
          <p className="text-xs font-bold">Payment Received!</p>
          <p className="text-[10px]">
            Your workspace and selected modules are now being activated.
          </p>
        </div>
      </div>
      <section className="mt-4 rounded-xl border border-gray-200 bg-white">
        <header className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4">
          <h2 className="text-sm font-bold">Order Summary</h2>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => downloadReceipt.mutate({ id: transactionId })}
              disabled={downloadReceipt.isPending}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 px-4 text-xs font-semibold"
            >
              {downloadReceipt.isPending ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloadReceipt.isPending
                ? "Downloading..."
                : "Download Receipt"}
            </button>
            <Link
              href="/app/workspace-dashboard?skipTransactions=1"
              onClick={handleGoToWorkspace}
              aria-disabled={isBusy}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md bg-primary-700 px-5 text-xs font-semibold text-white",
                isBusy && "pointer-events-none opacity-70"
              )}
            >
              {isBusy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              Go to Workspace
            </Link>
          </div>
        </header>
        <OrderSummary
          addOns={addOns}
          billingCycle={billingCycle}
          currency={currency}
          includedModules={includedModules}
          packages={packages}
          compact
        />
      </section>
    </div>
  );
}

export function RestoreCheckoutView({
  transactionId,
  onBack,
  addOns,
  billingCycle,
  includedModules,
  packages
}: {
  transactionId: string;
  onBack: () => void;
  addOns: AddOn[];
  billingCycle: BillingCycle;
  includedModules: IncludedModuleItem[];
  packages: SummaryPackage[];
}) {
  const transaction = useGetTransaction(transactionId);
  const resume = useResumeTransaction();
  const { mutate: resumeTransaction, isIdle } = resume;
  const resumedTransactionId = useRef<string | null>(null);

  useEffect(() => {
    if (
      transaction.data?.status === "pending" &&
      isIdle &&
      resumedTransactionId.current !== transactionId
    ) {
      resumedTransactionId.current = transactionId;
      resumeTransaction(transactionId);
    }
  }, [transaction.data?.status, transactionId, isIdle, resumeTransaction]);

  const currency = transaction.data?.currency === "USD" ? "USD" : "IDR";
  if (transaction.data?.status === "paid") {
    return (
      <SuccessView
        addOns={addOns}
        billingCycle={billingCycle}
        currency={currency}
        includedModules={includedModules}
        packages={packages}
        transactionId={transactionId}
      />
    );
  }

  if (transaction.data?.status === "pending" && resume.data) {
    return (
      <WaitingView
        onBack={onBack}
        addOns={addOns}
        billingCycle={billingCycle}
        currency={currency}
        includedModules={includedModules}
        packages={packages}
        checkoutResponse={{
          ...resume.data,
          final_amount: transaction.data.final_amount
        }}
        transactionId={transactionId}
      />
    );
  }

  const transactionUnavailable =
    (transaction.isError && !transaction.data) ||
    (transaction.data && transaction.data.status !== "pending");
  if (transactionUnavailable || resume.isError) {
    return (
      <div className="py-10">
        <h1 className="text-lg font-bold text-gray-950">
          Unable to resume payment
        </h1>
        <p className="mt-2 text-xs text-gray-500">
          {transactionUnavailable && transaction.data
            ? `This transaction is ${transaction.data.status}.`
            : "We could not load your payment details. Please try again."}
        </p>
        <div className="mt-4 flex gap-3">
          {!transaction.data && (
            <button
              type="button"
              onClick={() => transaction.refetch()}
              className="h-9 rounded-md bg-primary-700 px-4 text-xs font-semibold text-white"
            >
              Retry
            </button>
          )}
          {transaction.data?.status === "pending" && resume.isError && (
            <button
              type="button"
              onClick={() => resumeTransaction(transactionId)}
              className="h-9 rounded-md bg-primary-700 px-4 text-xs font-semibold text-white"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="h-9 rounded-md border border-gray-200 px-4 text-xs font-semibold"
          >
            Back to Payment Method
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <LoaderCircle className="h-14 w-14 animate-spin text-primary-500" />
      <h1 className="mt-5 text-lg font-bold text-gray-950">Restoring payment</h1>
    </div>
  );
}

export function ReviewOrderClient({
  initialAddOns,
  initialAddOnBillingCycles,
  initialBillingCycle,
  packageIds,
  renewal = false,
  initialTransactionId
}: {
  initialAddOns: string[];
  initialAddOnBillingCycles?: string;
  initialBillingCycle: BillingCycle;
  packageIds: string[];
  renewal?: boolean;
  initialTransactionId?: string;
}) {
  const { collapsed } = useSidebar();
  const { data: session } = useSession();
  const authMe = useAuthMe();
  const packagesQuery = useGetPackages();
  const modulesQuery = useGetModules();
  const checkout = useCheckout();
  const [addOnIds, setAddOnIds] = useState(initialAddOns);
  const [addOnBillingCycles, setAddOnBillingCycles] = useState<Record<string, BillingCycle>>(() => {
    try {
      const parsed: unknown = JSON.parse(initialAddOnBillingCycles ?? "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(Object.entries(parsed).filter(
        ([id, cycle]) => initialAddOns.includes(id) && (cycle === "monthly" || cycle === "yearly")
      )) as Record<string, BillingCycle>;
    } catch {
      return {};
    }
  });
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>(initialBillingCycle);
  const [currency, setCurrency] = useState<"USD" | "IDR">("IDR");
  const [paymentGroup, setPaymentGroup] = useState("virtual-account");
  const [paymentMethod, setPaymentMethod] = useState("bca_va");
  const [promoCode, setPromoCode] = useState("");
  const [stage, setStage] = useState<Stage>("review");
  const [isRestoring, setIsRestoring] = useState(Boolean(initialTransactionId));
  const [checkoutResponse, setCheckoutResponse] =
    useState<CheckoutResponse | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<string[]>([]);

  useEffect(() => {
    if (stage !== "review" || isRestoring) return;
    // Persist IDs, not catalog-derived items, so loading cannot erase selections.
    const href = selectionUrl(
      window.location.href,
      packageIds,
      Object.fromEntries(addOnIds.map((id) => [id, addOnBillingCycles[id] ?? "monthly"])),
      billingCycle
    );
    if (href !== window.location.href) {
      window.history.replaceState(window.history.state, "", href);
    }
  }, [addOnIds, addOnBillingCycles, billingCycle, packageIds, stage, isRestoring]);

  const selectedPackages = useMemo<ApiPackage[]>(
    () =>
      (packagesQuery.data?.items ?? []).filter(
        (pkg) => packageIds.includes(pkg.id) && isCatalogAvailable(pkg.status)
      ),
    [packageIds, packagesQuery.data]
  );

  const selectedPackage = useMemo<ApiPackage | undefined>(
    () => selectedPackages[0],
    [selectedPackages]
  );
  const activeSubscriptionPackageIds = useMemo(
    () =>
      authMe.data?.subscription_expired
        ? []
        : subscriptionPackageIds(authMe.data?.subscription),
    [authMe.data?.subscription, authMe.data?.subscription_expired]
  );
  const containsActivePackage =
    !renewal &&
    selectedPackages.some((pkg) =>
      activeSubscriptionPackageIds.includes(pkg.id)
    );

  const availableModules = useMemo<ApiModule[]>(
    () =>
      (modulesQuery.data?.items ?? [])
        .filter((m) => isCatalogAvailable(m.status))
        .filter(
          (m) =>
            !selectedPackages.some(
              (pkg) =>
                pkg.module_ids.includes(m.id) ||
                pkg.included_modules.some((im) => im.id === m.id)
            )
        ),
    [modulesQuery.data, selectedPackages]
  );

  const includedModules = useMemo(
    () =>
      selectedPackage?.included_modules
        .filter((m) => isCatalogAvailable(m.status))
        .map((m) => ({
          title: m.name,
          description: m.description,
          icon: getIcon(m.icon)
        })) ?? [],
    [selectedPackage]
  );

  const addOns = useMemo<AddOn[]>(
    () =>
      availableModules
        .filter((m) => addOnIds.includes(m.id))
        .map((m) => ({
          id: m.id,
          billingCycle: addOnBillingCycles[m.id] === "yearly" && m.yearly_price != null ? "yearly" : "monthly",
          title: m.name,
          description: m.description,
          icon: getIcon(m.icon),
          monthlyPrice: m.monthly_price,
          monthlyPriceIdr: m.monthly_price_idr,
          yearlyPrice: m.yearly_price,
          yearlyPriceIdr: m.yearly_price_idr
        })),
    [availableModules, addOnIds, addOnBillingCycles]
  );

  const summaryPackages = useMemo<SummaryPackage[]>(
    () =>
      selectedPackages.map((pkg) => ({
        name: pkg.name,
        monthlyPrice: pkg.monthly_price,
        monthlyPriceIdr: pkg.monthly_price_idr,
        yearlyPrice: pkg.yearly_price,
        yearlyPriceIdr: pkg.yearly_price_idr
      })),
    [selectedPackages]
  );
  const yearlyAvailable =
    selectedPackages.every((pkg) => pkg.yearly_price != null);
  const activeBillingCycle: BillingCycle =
    billingCycle === "yearly" && yearlyAvailable ? "yearly" : "monthly";

  function changeBillingCycle(cycle: BillingCycle) {
    if (cycle === "monthly" || yearlyAvailable) setBillingCycle(cycle);
  }

  function changeCurrency(nextCurrency: "USD" | "IDR") {
    setCurrency(nextCurrency);
    if (nextCurrency === "IDR" && paymentMethod === "credit_card") {
      setPaymentGroup("virtual-account");
      setPaymentMethod("bca_va");
    } else if (nextCurrency === "USD") {
      setPaymentGroup("credit-card");
      setPaymentMethod("credit_card");
    }
  }

  function handleCheckout() {
    if (
      containsActivePackage ||
      (paymentMethod === "credit_card" && currency !== "USD") ||
      (currency === "USD" && paymentMethod !== "credit_card")
    ) return;
    checkout.mutate(
      {
        currency,
        customer_email: session?.user?.email ?? "",
        customer_name: session?.user?.name ?? "",
        items: [
          ...selectedPackages.map((pkg) => ({
            billing_cycle: activeBillingCycle,
            item_type: "package" as const,
            reference_id: pkg.id
          })),
          ...addOns.map((item) => ({
            billing_cycle: item.billingCycle,
            item_type: "addon" as const,
            reference_id: item.id
          }))
        ],
        payment_method: paymentMethod,
        promo_code: promoCode
      },
      {
        onSuccess: (data) => {
          const response = data as CheckoutResponse;
          window.history.replaceState(
            null,
            "",
            checkoutUrl(
              window.location.href,
              response.transaction_id,
              selectedPackages.map((pkg) => pkg.id),
              Object.fromEntries(addOns.map((item) => [item.id, item.billingCycle])),
              activeBillingCycle
            )
          );
          setCheckoutResponse(response);
          setStage("processing");
        }
      }
    );
  }

  function backToReview() {
    window.history.replaceState(null, "", reviewUrl(window.location.href));
    setIsRestoring(false);
    setStage("review");
  }

  if (isRestoring && initialTransactionId)
    return (
      <RestoreCheckoutView
        transactionId={initialTransactionId}
        onBack={backToReview}
        addOns={addOns}
        billingCycle={activeBillingCycle}
        includedModules={includedModules}
        packages={summaryPackages}
      />
    );
  if (stage === "processing")
    return <ProcessingView onDone={() => setStage("waiting")} />;
  if (stage === "waiting")
    return (
      <WaitingView
        onBack={backToReview}
        addOns={addOns}
        billingCycle={activeBillingCycle}
        currency={currency}
        includedModules={includedModules}
        packages={summaryPackages}
        checkoutResponse={checkoutResponse!}
        transactionId={checkoutResponse!.transaction_id}
      />
    );
  const isLoading = packagesQuery.isLoading || modulesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="pb-28">
        <Link
          href="/app/workspace-dashboard/explore-module"
          className="inline-flex items-center gap-2 text-lg font-bold text-gray-950 hover:text-primary-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Review Order
        </Link>
        <p className="ml-7 mt-0.5 text-[10px] text-gray-500">
          Review your selected modules and confirm your order.
        </p>
        <div className="mt-8 flex items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="pb-28">
        <Link
          href="/app/workspace-dashboard/explore-module"
          className="inline-flex items-center gap-2 text-lg font-bold text-gray-950 hover:text-primary-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Review Order
        </Link>
        <p className="ml-7 mt-0.5 text-[10px] text-gray-500">
          Review your selected modules and confirm your order.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <p className="text-sm font-semibold text-gray-700">
            Package not found
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Go back and select a package to continue.
          </p>
          <Link
            href="/app/workspace-dashboard/explore-module"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary-700 px-4 text-xs font-semibold text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const displayPackagesTotal = summaryPackages.reduce(
    (sum, pkg) => sum + (catalogPrice(pkg, activeBillingCycle, currency) ?? 0),
    0
  );
  const displayAddOnsTotal = addOns.reduce(
    (sum, item) =>
      sum + (catalogPrice(item, item.billingCycle, currency) ?? 0),
    0
  );
  const subtotal = displayPackagesTotal + displayAddOnsTotal;
  const estimatedTax = subtotal * 0.0825;
  const orderTotal = subtotal + estimatedTax;

  return (
    <div className="pb-28">
      <Link
        href="/app/workspace-dashboard/explore-module"
        className="inline-flex items-center gap-2 text-lg font-bold text-gray-950 hover:text-primary-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Review Order
      </Link>
      <p className="ml-7 mt-0.5 text-[10px] text-gray-500">
        Review your selected modules and confirm your order.
      </p>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">1. Selected Plan</h2>
              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-600">
                {selectedPackages.length} Package
                {selectedPackages.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2">
              {selectedPackages.map((pkg) => {
                const Icon = getIcon(pkg.icon);
                const expanded = expandedPackages.includes(pkg.id);
                const packageModules = pkg.included_modules.filter((module) =>
                  isCatalogAvailable(module.status)
                );
                return (
                  <article
                    key={pkg.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                  >
                    <div className="flex w-full items-center gap-3 p-3">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedPackages((current) =>
                            current.includes(pkg.id)
                              ? current.filter((id) => id !== pkg.id)
                              : [...current, pkg.id]
                          )
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-950">
                            {pkg.name}
                          </p>
                          <p className="truncate text-[10px] text-gray-500">
                            {pkg.description}
                          </p>
                        </div>
                      </button>
                      <p className="ml-auto shrink-0 text-xs font-bold">
                        {money(
                          apiCatalogPrice(pkg, activeBillingCycle, currency),
                          currency
                        )}
                        <span className="font-normal text-gray-500">
                          {" "}
                          /{cycleLabel(activeBillingCycle)}
                        </span>
                      </p>
                      <Select
                        value={activeBillingCycle}
                        onValueChange={(value) =>
                          changeBillingCycle(value as BillingCycle)
                        }
                      >
                        <SelectTrigger
                          aria-label="Billing cycle"
                          className="h-7 w-24 rounded-md px-2 text-[10px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly" disabled={!yearlyAvailable}>Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${pkg.name}`}
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedPackages((current) =>
                            current.includes(pkg.id)
                              ? current.filter((id) => id !== pkg.id)
                              : [...current, pkg.id]
                          )
                        }
                        className="shrink-0"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expanded && "rotate-180"
                          )}
                        />
                      </button>
                    </div>
                    {expanded && (
                      <div className="space-y-1 border-t border-gray-100 bg-gray-50/40 p-3">
                        {packageModules.map((module) => {
                          const ModuleIcon = getIcon(module.icon);
                          return (
                            <div
                              key={module.id}
                              className="flex items-start gap-2 rounded-md px-2 py-1.5"
                            >
                              <ModuleIcon className="mt-0.5 h-3.5 w-3.5 text-primary-600" />
                              <div>
                                <p className="text-[11px] font-semibold">
                                  {module.name}
                                </p>
                                <p className="text-[9px] text-gray-500">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">2. Selected Add-ons</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-semibold",
                  addOns.length > 0
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {addOns.length} Added
              </span>
            </div>
            {addOns.length > 0 ? (
              <div className="space-y-2">
                {addOns.map((item) => (
                  <SelectedItem
                    key={item.id}
                    {...item}
                    currency={currency}
                    onBillingCycleChange={(cycle) => setAddOnBillingCycles((current) => ({ ...current, [item.id]: cycle }))}
                    onRemove={() =>
                      setAddOnIds((current) =>
                        current.filter((id) => id !== item.id)
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 text-center">
                <PackageCheck className="h-6 w-6 text-gray-400" />
                <p className="mt-2 text-xs font-semibold text-gray-700">
                  No add-ons selected
                </p>
                <p className="mt-1 text-[10px] text-gray-500">
                  Return to Explore Modules if you want to add extra
                  capabilities.
                </p>
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-2 text-sm font-bold">3. Payment Details</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
                {(["IDR", "USD"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeCurrency(item)}
                    className={cn(
                      "h-9 rounded-md text-xs font-medium transition-colors",
                      currency === item
                        ? "bg-gray-950 text-white shadow-sm"
                        : "text-gray-700 hover:bg-white/70"
                    )}
                  >
                    <span className="mr-2">{item === "IDR" ? "🇮🇩" : "🇺🇸"}</span>
                    {item} Payment
                  </button>
                ))}
              </div>
              <p className="mb-4 mt-3 text-[10px] font-semibold text-gray-700">
                You can select your payment method on the next step.
              </p>
              <div className="mb-4">
                <label className="mb-1.5 block text-[10px] font-semibold text-gray-500">
                  Promo Code
                </label>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code (optional)"
                  className="h-9 w-full max-w-xs rounded-md border border-gray-200 bg-white px-3 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="space-y-3">
                {paymentGroups.filter((group) => currency === "IDR" || group.id === "credit-card").map((group) => {
                  const disabled = group.id === "credit-card" && currency !== "USD";
                  const active = !disabled && paymentGroup === group.id;
                  const Icon = group.icon;
                  return (
                    <div
                      key={group.id}
                      className={cn(
                        "rounded-xl border p-4",
                        active ? "border-primary-500" : "border-gray-200"
                      )}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        aria-pressed={active}
                        onClick={() => {
                          if (disabled) return;
                          setPaymentGroup(group.id);
                          setPaymentMethod(group.methods[0]);
                        }}
                        className="flex w-full items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span
                          className={cn(
                            "h-3 w-3 rounded-full border",
                            active && "border-[4px] border-gray-950"
                          )}
                        />
                        <Icon className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="text-xs font-semibold">{group.title}</p>
                          <p className="text-[10px] text-gray-500">
                            {disabled ? "Available for USD payments only." : group.description}
                          </p>
                        </div>
                        <span className="ml-auto text-[9px] text-gray-400">
                          Powered by <strong>midtrans</strong>
                        </span>
                      </button>
                      {active && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {group.methods.map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={cn(
                                "flex h-10 items-center justify-between rounded-md border px-3 text-[10px] font-bold",
                                paymentMethod === method
                                  ? "border-primary-500 bg-primary-50 text-primary-800"
                                  : "border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              <span>{method}</span>
                              {paymentMethod === method && (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[9px] text-gray-500">
                <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                By continuing, you agree to our{" "}
                <a href="#" className="font-semibold text-primary-700">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-semibold text-primary-700">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </section>
        </div>
        <aside className="rounded-xl border border-gray-200 bg-white lg:sticky lg:top-20">
          <h2 className="border-b border-gray-200 p-4 text-sm font-bold">
            Payment Summary
          </h2>
          <div className="p-4 text-[11px]">
            <p className="mb-2 font-bold">Packages</p>
            <div className="space-y-2 text-gray-500">
              {selectedPackages.map((pkg) => (
                <div key={pkg.id} className="flex justify-between gap-3">
                  <span>{pkg.name} Subscription /{cycleLabel(activeBillingCycle)}</span>
                  <strong className="text-gray-900">
                    {money(
                      apiCatalogPrice(pkg, activeBillingCycle, currency),
                      currency
                    )}
                  </strong>
                </div>
              ))}
            </div>
            {addOns.length > 0 && (
              <>
                <p className="mb-2 mt-4 font-bold">Add-on Modules</p>
                <div className="space-y-2 text-gray-500">
                  {addOns.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3">
                      <span>{item.title} /{cycleLabel(item.billingCycle)}</span>
                      <strong className="text-gray-900">
                        {money(
                          catalogPrice(item, item.billingCycle, currency) ?? 0,
                          currency
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong className="text-gray-900">
                  {money(subtotal, currency)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8.25%)</span>
                <strong className="text-gray-900">
                  {money(estimatedTax, currency)}
                </strong>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-gray-200 pt-4">
              <strong className="text-sm">Order Total</strong>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-700">
                  {money(orderTotal, currency)}
                </p>
                <p className="text-[9px] text-gray-500">
                  Billing cycle:{" "}
                  {addOns.some((item) => item.billingCycle !== activeBillingCycle) ? "Mixed (see items above)" : activeBillingCycle === "yearly" ? "Yearly" : "Monthly"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkout.isPending || containsActivePackage}
              className="mt-5 h-10 w-full rounded-md bg-primary-700 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
            >
              {containsActivePackage
                ? "Package Already Active"
                : checkout.isPending
                  ? "Processing..."
                  : renewal
                    ? "Complete Renewal"
                    : "Complete Purchase"}
              <ChevronRight className="ml-2 inline h-3.5 w-3.5" />
            </button>
            {containsActivePackage && (
              <p className="mt-2 text-center text-[10px] font-medium text-red-500">
                Remove the active package before continuing checkout.
              </p>
            )}
            <Link
              href="/app/workspace-dashboard/explore-module"
              className="mt-2 flex h-9 items-center justify-center rounded-md border border-red-400 text-xs font-semibold text-red-500 hover:bg-red-50"
            >
              Cancel Order
            </Link>
            <p className="mt-3 flex items-center justify-center gap-1 text-[9px] text-gray-400">
              <ShieldCheck className="h-3 w-3" /> Secure 256-bit SSL encrypted
              payment
            </p>
          </div>
        </aside>
      </div>
      <div
        className={cn(
          "hidden fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur transition-[left] duration-300",
          collapsed ? "lg:left-16" : "lg:left-64"
        )}
      >
        <div className="mx-auto flex max-w-6xl justify-end">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkout.isPending || containsActivePackage}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gray-950 px-5 text-xs font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkout.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            Pay Securely ·{" "}
            {money(
              displayPackagesTotal +
                addOns.reduce(
                  (sum, item) =>
                    sum + (catalogPrice(item, item.billingCycle, currency) ?? 0),
                  0
                ),
              currency
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
