"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import PageHeader from "@/components/PageHeader";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { useAuthMe } from "@/hooks/useAuthMe";
import { AnalyticsDashboard } from "./analytics-dashboard/AnalyticsDashboard";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Blocks,
  Building2,
  CheckCircle2,
  Clock3,
  ConciergeBell,
  Copy,
  ExternalLink,
  Flame,
  Forklift,
  HardHat,
  Headphones,
  LoaderCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Truck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useGetTransaction,
  useGetTransactions,
  useResumeTransaction
} from "./explore-module/use-packages";

const modules = [
  {
    title: "AIMOS",
    description: "Service Operations & Response Assistant",
    icon: BarChart3,
    iconClass: "bg-primary-50 text-primary-600"
  },
  {
    title: "SAFERA",
    description: "Safety Event, Field Evidence & Risk Analytics",
    icon: Shield,
    iconClass: "bg-emerald-50 text-emerald-600"
  },
  {
    title: "SERVORA",
    description: "Service Operations & Response Assistant",
    icon: Headphones,
    iconClass: "bg-pink-50 text-pink-600"
  },
  {
    title: "FLEETRA",
    description: "Fleet Logistics, Efficiency & Execution Tracking Assistant",
    icon: Truck,
    iconClass: "bg-sky-50 text-sky-600"
  },
  {
    title: "HAULORA",
    description: "Haulage Optimisation & Load Operations Resource Assistant",
    icon: Forklift,
    iconClass: "bg-red-50 text-red-600"
  },
  {
    title: "PETROS",
    description: "Petroleum Technical Reliability & Operations System",
    icon: Flame,
    iconClass: "bg-amber-50 text-amber-600"
  },
  {
    title: "PROJERA",
    description: "Project Execution, Risk & Analytics Assistant",
    icon: HardHat,
    iconClass: "bg-yellow-50 text-orange-600"
  },
  {
    title: "LEASERA",
    description: "Lease Evidence, Analytics & Risk Assistant",
    icon: Building2,
    iconClass: "bg-indigo-50 text-indigo-600"
  },
  {
    title: "GUESTRA",
    description: "Guest Experience, Service Tracking & Response Assistant",
    icon: ConciergeBell,
    iconClass: "bg-teal-50 text-teal-600"
  }
];

const quickTips = [
  {
    target: "welcome",
    title: "Welcome to ATLAS!",
    description:
      "Take a quick tour to learn the basics and discover how to get started with ATLAS."
  },
  {
    target: "navigation",
    title: "Your Main Navigation",
    description:
      "Use the sidebar to navigate between your workspace, master data, settings, and other available features."
  },
  {
    target: "subscription",
    title: "Keep Track of Your Trial",
    description:
      "Check your remaining trial period and explore available modules before choosing your subscription."
  },
  {
    target: "modules",
    title: "Explore Available Modules",
    description:
      "Discover modules built to support your business operations. Explore and activate the modules that fit your needs."
  },
  {
    target: "experts",
    title: "Contact Our Experts",
    description:
      "Get in touch with our team of specialists to find the right solution for your business needs."
  }
];

function QuickTipsTour() {
  const [step, setStep] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { setCollapsed, setSidebarOpen } = useSidebar();

  const finish = useCallback(() => {
    localStorage.setItem("atlas.workspace-quick-tips.completed", "true");
    setStep(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    const start = () => {
      setCollapsed(false);
      if (window.innerWidth < 1024) setSidebarOpen(true);
      setStep(0);
    };
    window.addEventListener("atlas:start-quick-tips", start);
    const timer = window.setTimeout(() => {
      if (!localStorage.getItem("atlas.workspace-quick-tips.completed"))
        start();
    }, 500);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("atlas:start-quick-tips", start);
    };
  }, [setCollapsed, setSidebarOpen]);

  useEffect(() => {
    if (step === null) return;
    const target = document.querySelector<HTMLElement>(
      `[data-quick-tip="${quickTips[step].target}"]`
    );
    if (!target) return;

    const update = () => setTargetRect(target.getBoundingClientRect());
    update();
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step]);

  if (step === null) return null;

  const tip = quickTips[step];
  const width = 250;
  const isNavigationStep = tip.target === "navigation";
  const hasRoomOnRight = targetRect
    ? targetRect.right + width + 28 <= window.innerWidth
    : false;
  const placeOnRight = isNavigationStep && hasRoomOnRight;
  const left = targetRect
    ? placeOnRight
      ? targetRect.right + 14
      : Math.max(
          12,
          Math.min(
            window.innerWidth - width - 12,
            targetRect.left + targetRect.width / 2 - width / 2
          )
        )
    : 12;
  const placeBelow =
    !targetRect || targetRect.bottom + 170 < window.innerHeight;
  const top = targetRect
    ? placeOnRight
      ? Math.max(72, Math.min(window.innerHeight - 180, targetRect.top + 120))
      : placeBelow
        ? targetRect.bottom + 14
        : Math.max(12, targetRect.top - 164)
    : 80;

  return (
    <>
      {targetRect && (
        <div
          className="pointer-events-none fixed inset-0 z-[60]"
          aria-hidden="true"
        >
          <svg className="absolute inset-0 h-full w-full">
            <defs>
              <mask id="quick-tips-focus-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.55)"
              mask="url(#quick-tips-focus-mask)"
            />
          </svg>
          <div
            className="absolute rounded-xl border-2 border-primary-500 shadow-[0_0_0_2px_color-mix(in_srgb,var(--atlas-primary-500)_25%,transparent),0_0_18px_color-mix(in_srgb,var(--atlas-primary-500)_45%,transparent)]"
            style={{
              top: targetRect.top - 3,
              left: targetRect.left - 3,
              width: targetRect.width + 6,
              height: targetRect.height + 6
            }}
          />
        </div>
      )}
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Quick tip ${step + 1} of ${quickTips.length}`}
        className="fixed z-[80] w-[250px] rounded-sm bg-white p-4 shadow-2xl"
        style={{ left, top }}
      >
        <span
          aria-hidden="true"
          className={`absolute h-3 w-3 rotate-45 bg-white ${
            placeOnRight
              ? "-left-1.5 top-8"
              : placeBelow
                ? "-top-1.5 left-1/2 -translate-x-1/2"
                : "-bottom-1.5 left-1/2 -translate-x-1/2"
          }`}
        />
        <h3 className="text-xs font-bold text-gray-950">{tip.title}</h3>
        <p className="mt-1.5 text-[10px] leading-4 text-gray-500">
          {tip.description}
        </p>
        <div className="mt-4 flex items-center gap-1.5">
          <span className="mr-auto text-[9px] text-gray-500">
            {step + 1} of {quickTips.length}
          </span>
          {step < quickTips.length - 1 && (
            <button
              type="button"
              onClick={finish}
              className="h-7 rounded-md border border-gray-200 px-2 text-[10px] font-medium hover:bg-gray-50"
            >
              {step === 0 ? "Skip Tour" : "Skip"}
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-7 rounded-md border border-gray-200 px-2 text-[10px] font-medium hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              step === quickTips.length - 1 ? finish() : setStep(step + 1)
            }
            className="h-7 rounded-md bg-primary-700 px-2.5 text-[10px] font-semibold text-white hover:bg-primary-800"
          >
            {step === 0
              ? "Start Tour"
              : step === quickTips.length - 1
                ? "Finish"
                : "Next"}
          </button>
        </div>
      </section>
    </>
  );
}

function HeroIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      viewBox="0 0 370 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M44 161c39-10 73-7 105 0 48 10 109 11 171-1"
        stroke="var(--atlas-primary-500)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M287 153c11-39 28-59 50-65-3 18-18 41-35 65h-15Z"
        fill="var(--atlas-primary-300)"
      />
      <path
        d="M301 153c8-48 25-76 47-89 1 27-13 61-31 89h-16Z"
        fill="var(--atlas-primary-900)"
      />
      <path
        d="M56 155c-9-25-22-37-36-37 2 14 11 29 24 39l12-2Z"
        fill="var(--atlas-primary-900)"
      />
      <path
        d="M63 155c-3-29-12-47-28-55-2 18 5 39 17 56l11-1Z"
        fill="var(--atlas-primary-400)"
      />

      <rect
        x="76"
        y="24"
        width="176"
        height="112"
        rx="7"
        fill="var(--atlas-primary-50)"
        stroke="var(--atlas-primary-300)"
        strokeWidth="3"
      />
      <rect
        x="101"
        y="47"
        width="72"
        height="16"
        rx="8"
        fill="var(--atlas-primary-900)"
      />
      <circle cx="159" cy="55" r="4" stroke="white" strokeWidth="1.5" />
      <path
        d="m160 52 3 3-3 3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="99"
        y="87"
        width="40"
        height="67"
        rx="8"
        fill="var(--atlas-primary-600)"
      />
      <rect
        x="105"
        y="79"
        width="28"
        height="11"
        rx="3"
        fill="var(--atlas-primary-50)"
        stroke="var(--atlas-primary-400)"
      />
      <path
        d="M109 101h20M109 108h15M109 115h18"
        stroke="var(--atlas-primary-100)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="119" cy="135" r="5" fill="var(--atlas-primary-400)" />

      <rect
        x="42"
        y="106"
        width="28"
        height="50"
        rx="5"
        fill="var(--atlas-primary-50)"
        stroke="var(--atlas-primary-300)"
        strokeWidth="2"
      />
      <path
        d="M49 115h14M49 120h11"
        stroke="var(--atlas-primary-300)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="50"
        y="151"
        width="12"
        height="2"
        rx="1"
        fill="var(--atlas-primary-300)"
      />

      <path
        d="M199 90h74l27 56H174l25-56Z"
        fill="var(--atlas-primary-50)"
        stroke="var(--atlas-primary-300)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m201 91 35 29 36-29"
        stroke="var(--atlas-primary-100)"
        strokeWidth="2"
      />
      <path
        d="M170 146h136v7a6 6 0 0 1-6 6H177a7 7 0 0 1-7-7v-6Z"
        fill="var(--atlas-primary-600)"
      />
      <path
        d="M218 150h39"
        stroke="var(--atlas-primary-200)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M145 136v20h43"
        stroke="var(--atlas-primary-500)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <path
        d="M164 126h29v13"
        stroke="var(--atlas-primary-600)"
        strokeWidth="9"
      />
      <rect
        x="154"
        y="123"
        width="19"
        height="10"
        rx="2"
        fill="var(--atlas-primary-500)"
      />
      <circle cx="157" cy="128" r="1.5" fill="white" />
      <circle cx="162" cy="128" r="1.5" fill="white" />
    </svg>
  );
}

function PurpleButton({
  children,
  href,
  variant = "solid"
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "solid" | "outline";
}) {
  const className = `inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
    variant === "outline"
      ? "border-primary-700 bg-white text-primary-700 hover:bg-primary-50"
      : "border-primary-700 bg-primary-700 text-white shadow-sm hover:bg-primary-800"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}

function money(value: number, currency: string) {
  if (currency === "IDR") return `IDR ${value.toLocaleString("id-ID")}`;
  return `$${value}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    paid: "bg-green-100 text-green-700 border-green-300",
    expired: "bg-gray-100 text-gray-500 border-gray-300",
    failed: "bg-red-100 text-red-700 border-red-300"
  };
  const cls = styles[status] ?? "bg-gray-100 text-gray-500 border-gray-300";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function CompleteYourPaymentView({
  transactionId,
  onBack,
  onProceed
}: {
  transactionId: string;
  onBack: () => void;
  onProceed: (packageId: string) => void;
}) {
  const { data: tx, isFetching, refetch } = useGetTransaction(transactionId);
  const resume = useResumeTransaction();
  const [copied, setCopied] = useState(false);

  const packageItem = tx?.items.find((item) => item.item_type === "package");
  const currency = tx?.currency ?? "IDR";

  const resumeData = resume.data;
  const vaNumber = resumeData?.va_number ?? "";
  const bankLabel = (resumeData?.bank ?? "").toUpperCase();
  const paymentMethod = resumeData?.payment_method ?? "";
  const isQrPayment = Boolean(resumeData?.qr_url) && !vaNumber;
  const isVaPayment = Boolean(vaNumber);
  const isRedirectPayment =
    !isQrPayment && !isVaPayment && Boolean(resumeData?.provider_url);

  useEffect(() => {
    if (tx?.id && tx.status === "pending" && !resume.isPending && !resumeData) {
      resume.mutate(tx.id);
    }
  }, [tx?.id, tx?.status, resume, resumeData]);

  if (tx?.status === "paid") {
    return (
      <div className="pb-10">
        <h1 className="text-xl font-bold text-gray-950">Payment Successful</h1>
        <p className="mt-1 text-xs text-gray-500">
          Your payment has been confirmed. Your subscription is now active.
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
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-primary-700 px-5 text-xs font-semibold text-white"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-lg font-bold text-gray-950 hover:text-primary-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Complete Your Payment
      </button>
      <p className="ml-7 mt-0.5 text-[10px] text-gray-500">
        Complete your payment to activate your subscription.
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
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 rounded-md bg-primary-700 px-4 text-xs font-semibold text-white disabled:opacity-60"
            >
              <RefreshCw
                className={`mr-2 inline h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              {isFetching ? "Checking..." : "Refresh Status"}
            </button>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase text-gray-400">Order ID</p>
              <StatusBadge status={tx?.status ?? "pending"} />
            </div>
            <strong className="mt-1 block text-sm text-gray-950">
              {tx?.order_id ?? "--"}
            </strong>
            <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 text-[11px] sm:grid-cols-2">
              <div className="space-y-3">
                <p>
                  <span className="block text-gray-400">Total Amount</span>
                  <strong className="text-primary-700">
                    {money(tx?.final_amount ?? 0, currency)}
                  </strong>
                </p>
                <p>
                  <span className="block text-gray-400">Billing Cycle</span>
                  <strong className="capitalize">
                    {tx?.billing_cycle ?? "monthly"}
                  </strong>
                </p>
                <p>
                  <span className="block text-gray-400">Payment Method</span>
                  <strong>{tx?.payment_method || "Not selected"}</strong>
                </p>
                <p>
                  <span className="block text-gray-400">Created At</span>
                  <strong>
                    {tx?.created_at
                      ? new Date(tx.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Jakarta"
                        })
                      : "--"}
                  </strong>
                </p>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-gray-50 p-5 text-center">
                <div>
                  <span className="text-gray-500">Provider</span>
                  <p className="mt-2 text-lg font-bold capitalize text-gray-700">
                    {tx?.provider ?? "--"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {resume.isPending && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Resuming transaction...
            </div>
          )}

          {resumeData && (isVaPayment || isQrPayment || isRedirectPayment) && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              {isVaPayment && (
                <>
                  <p className="text-[10px] uppercase text-gray-400">
                    Virtual account number
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    {bankLabel && (
                      <span className="rounded bg-blue-600 px-2 py-1 text-sm font-black text-white">
                        {bankLabel}
                      </span>
                    )}
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
                  {resumeData.expiry_time && (
                    <p className="mt-4 text-[11px] text-gray-500">
                      <span className="block text-gray-400">
                        Payment Expiry
                      </span>
                      <strong>
                        {new Date(resumeData.expiry_time).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            timeZone: "Asia/Jakarta"
                          }
                        )}{" "}
                        {new Date(resumeData.expiry_time).toLocaleTimeString(
                          "id-ID",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Jakarta"
                          }
                        )}{" "}
                        WIB
                      </strong>
                    </p>
                  )}
                </>
              )}
              {isQrPayment && (
                <>
                  <p className="text-[10px] uppercase text-gray-400">
                    Scan to pay{" "}
                    {paymentMethod === "gopay" ? "with GoPay" : "with e-wallet"}
                  </p>
                  <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <QRCodeSVG
                        value={resumeData.qr_url}
                        size={200}
                        level="M"
                        className="h-50 w-50"
                      />
                      <p className="text-[10px] font-semibold text-gray-500">
                        Open{" "}
                        {paymentMethod === "gopay" ? "GoPay" : "your e-wallet"}{" "}
                        app and scan this code
                      </p>
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                      <p className="text-[11px] text-gray-600">
                        Scan the QR code with your{" "}
                        {paymentMethod === "gopay" ? "GoPay" : "e-wallet"} app,
                        or open the payment page directly on this device.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {isRedirectPayment && (
                <>
                  <p className="text-[10px] uppercase text-gray-400">
                    Complete your payment
                  </p>
                  <p className="mt-3 text-[11px] text-gray-600">
                    Open the payment page to complete your transaction.
                  </p>
                </>
              )}
              {resumeData.provider_url && (
                <a
                  href={resumeData.provider_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary-700 px-4 text-xs font-semibold text-white hover:bg-primary-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Payment Page
                </a>
              )}
            </section>
          )}

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold">Order Items</h2>
            <div className="mt-4 space-y-3">
              {tx?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-[10px] capitalize text-gray-500">
                      {item.item_type} &times;{item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-primary-700">
                    {money(item.amount, currency)}
                  </span>
                </div>
              )) ?? <p className="text-xs text-gray-500">No items found.</p>}
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-gray-200 pt-4">
              <span className="font-bold text-gray-950">Total</span>
              <span className="text-base font-bold text-primary-700">
                {money(tx?.final_amount ?? 0, currency)}
                <span className="text-[11px] font-normal text-gray-500">
                  {" "}
                  /{tx?.billing_cycle === "yearly" ? "Year" : "Month"}
                </span>
              </span>
            </div>
          </section>
        </div>

        <div>
          <aside className="rounded-xl border border-gray-200 bg-white">
            <div className="space-y-3 p-5 text-[11px]">
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
            </div>
          </aside>
          <button
            type="button"
            onClick={() => onProceed(packageItem?.reference_id ?? "")}
            className="mt-3 h-10 w-full rounded-lg bg-primary-700 text-xs font-semibold text-white hover:bg-primary-800"
          >
            Proceed to Payment
            <ArrowRight className="ml-2 inline h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 h-10 w-full rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold"
          >
            <ArrowLeft className="mr-2 inline h-3.5 w-3.5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceDashboardPage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceDashboardPageInner />
    </Suspense>
  );
}

function WorkspaceDashboardPageInner() {
  const searchParams = useSearchParams();
  const skipTransactions = searchParams?.get("skipTransactions") === "1";
  const authMe = useAuthMe();
  const { data: transactionsData, isLoading: transactionsLoading } =
    useGetTransactions(undefined, {
      enabled: !skipTransactions,
      tenantId: authMe.data?.tenant_id
    });
  const router = useRouter();
  const [showCompletePayment, setShowCompletePayment] = useState(false);

  const pendingTransaction = transactionsData?.items?.[0];
  const hasPending = pendingTransaction?.status === "pending";

  // Show the analytics dashboard when the user has subscribed to at least one
  // of the relevant modules (daily-diaries or labour-rostering). Otherwise,
  // fall back to the default "welcome / explore modules" onboarding page.
  const rbacModules = authMe.data?.rbac?.modules ?? [];
  const hasModule = (key: string) =>
    rbacModules.some(
      (module) =>
        module.key === key || module.sub_modules?.some((sub) => sub.key === key)
    );
  const hasDailyDiaries =
    hasModule("daily-diaries") || hasModule("daily-activities");
  const hasLabourRostering = hasModule("labour-rostering");
  const hasCapacityAnalytic = hasModule("capacity-analytic");
  const showAnalyticsDashboard =
    hasDailyDiaries || hasLabourRostering || hasCapacityAnalytic;

  function handleCompletePayment() {
    if (!pendingTransaction) return;
    setShowCompletePayment(true);
  }

  function handleProceedToPayment(packageId: string) {
    router.push(`/app/workspace-dashboard/review-order?package=${packageId}`);
  }

  if (showCompletePayment && pendingTransaction) {
    return (
      <div className="space-y-8 pb-6">
        <CompleteYourPaymentView
          transactionId={pendingTransaction.id}
          onBack={() => setShowCompletePayment(false)}
          onProceed={handleProceedToPayment}
        />
      </div>
    );
  }

  // Subscribed users with daily-diaries or labour-rostering module access get
  // the analytics dashboard instead of the onboarding/welcome page.
  if (showAnalyticsDashboard) {
    return (
      <AnalyticsDashboard
        hasLabourRostering={hasLabourRostering}
        hasDailyDiaries={hasDailyDiaries}
        hasCapacityAnalytic={hasCapacityAnalytic}
      />
    );
  }

  return (
    <div className="space-y-7 pb-6">
      <QuickTipsTour />

      <div data-quick-tip="welcome" className="space-y-7">
        <PageHeader
          title="Welcome to ATLAS!"
          subtitle={`You don't have any active modules yet. You're currently on free trial. Explore, try, and find the modules that best fit your business needs.`}
        />

        {transactionsLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Checking for pending transactions...
          </div>
        )}

        {hasPending && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-800">
                You have a pending transaction
              </p>
              <p className="text-[11px] text-amber-700">
                Order {pendingTransaction.order_id} is still awaiting payment.
                Complete your payment to activate your subscription.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompletePayment}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-amber-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
            >
              <ArrowRight className="h-4 w-4" />
              Complete Your Payment
            </button>
          </div>
        )}

        <section className="grid min-h-[190px] overflow-hidden rounded-2xl border border-primary-300 bg-primary-50 px-7 py-6 sm:px-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-4">
          <div className="relative z-10 flex max-w-xl flex-col items-start">
            <span className="text-[11px] font-bold uppercase tracking-wide text-primary-700">
              Built for your business
            </span>
            <h2 className="mt-2 text-[27px] font-bold leading-[1.08] tracking-[-0.02em] text-gray-950 sm:text-[30px]">
              Power your operations with
              <br className="hidden sm:block" /> industry leading modules.
            </h2>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              ATLAS modules help you work smarter, faster and more efficiently.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <PurpleButton href="/app/workspace-dashboard/explore-module">
                <Blocks className="h-4 w-4" />
                Explore Modules
              </PurpleButton>
              <span data-quick-tip="experts">
                <PurpleButton variant="outline">
                  Contact Our Experts
                  <ArrowRight className="h-3.5 w-3.5" />
                </PurpleButton>
              </span>
            </div>
          </div>

          <div className="mx-auto mt-5 h-[155px] w-full max-w-[360px] lg:mt-0 lg:h-[170px]">
            <HeroIllustration />
          </div>
        </section>
      </div>

      <section
        data-quick-tip="modules"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
      >
        {modules.map(({ title, description, icon: Icon, iconClass }) => (
          <Link
            key={title}
            href="/app/workspace-dashboard/explore-module"
            aria-label={`Explore ${title} module`}
            className="flex min-h-[130px] flex-col items-start rounded-lg border border-gray-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <h3 className="mt-3 text-base font-bold leading-5 text-gray-950">
              {title}
            </h3>
            <p className="mt-1 text-[10px] leading-[1.45] text-gray-700">
              {description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
