"use client";

import { useState } from "react";
import { BarChart3, Info, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type Subscription = {
  id: string;
  name: string;
  description: string;
  startedOn: string;
  renewsOn: string;
  billingCycle: string;
  renewalMessage: string;
  active: boolean;
};

const initialSubscriptions: Subscription[] = [
  {
    id: "aimos-main",
    name: "AIMOS",
    description: "AI Marketing Operating System",
    startedOn: "14 July 2026",
    renewsOn: "14 July 2027",
    billingCycle: "Monthly",
    renewalMessage: "Your subscription will automatically renew on 12 May 2027",
    active: true,
  },
  {
    id: "aimos-modules",
    name: "AIMOS",
    description: "AI Marketing Operating System",
    startedOn: "Included Modules",
    renewsOn: "Included Modules",
    billingCycle: "Monthly",
    renewalMessage: "Your subscription will automatically renew on 12 May 2027",
    active: true,
  },
];

function SubscriptionCard({
  subscription,
  onCancel,
}: {
  subscription: Subscription;
  onCancel: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-4 px-4 py-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <BarChart3 className="h-6 w-6" strokeWidth={2} />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold leading-6 text-gray-950">
              {subscription.name}
            </h3>
            <span
              className={cn(
                "rounded-full px-4 py-1 text-[10px] font-semibold",
                subscription.active
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {subscription.active ? "Active" : "Canceled"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-gray-800">
            {subscription.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.info(`Manage ${subscription.name} is not connected yet`)}
          className="ml-auto h-9 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-5 text-xs font-medium text-gray-950 shadow-sm transition-colors hover:bg-gray-50"
        >
          Manage
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-200 px-4 py-4 sm:grid-cols-3">
        {[
          ["Started On", subscription.startedOn],
          ["Renews On", subscription.renewsOn],
          ["Billing Cycle", subscription.billingCycle],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[9px] leading-4 text-gray-700">{label}</p>
            <p className="text-sm font-semibold leading-5 text-gray-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center">
        <p className="flex min-w-0 items-center gap-2 text-[11px] text-primary-500">
          <Info className="h-4 w-4 shrink-0" />
          <span>{subscription.renewalMessage}</span>
        </p>
        {subscription.active && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer text-left text-[11px] font-medium text-red-500 hover:text-red-700 sm:ml-auto sm:shrink-0"
          >
            Cancel Subscription
          </button>
        )}
      </div>
    </article>
  );
}

function CancelSubscriptionDialog({
  subscription,
  submitting,
  onClose,
  onConfirm,
}: {
  subscription: Subscription;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-subscription-title"
        className="relative w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-3 top-3 cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
          aria-label="Close confirmation"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <Trash2 className="h-5 w-5" />
        </span>
        <h3
          id="cancel-subscription-title"
          className="mt-4 text-sm font-semibold text-gray-950"
        >
          Are you sure you want
          <br />
          to cancel subscription?
        </h3>
        <p className="mx-auto mt-2 max-w-64 text-[11px] leading-4 text-gray-500">
          Are you sure you want to cancel your {subscription.name} subscription?
          You may lose access to your subscribed features.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 cursor-pointer rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="h-9 cursor-pointer rounded-md bg-red-500 text-xs font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Canceling..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionSettings() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedSubscription = subscriptions.find(
    (subscription) => subscription.id === selectedId,
  );

  async function cancelSubscription() {
    if (!selectedSubscription) return;
    setSubmitting(true);

    try {
      // Replace this resolved promise with the subscription cancellation API.
      await Promise.resolve();
      setSubscriptions((current) =>
        current.map((subscription) =>
          subscription.id === selectedSubscription.id
            ? { ...subscription, active: false }
            : subscription,
        ),
      );
      setSelectedId(null);
      toast.success("Subscription Canceled", {
        description: "Your subscription has been canceled successfully.",
      });
    } catch {
      toast.error("Failed to Cancel Subscription", {
        description:
          "We couldn't cancel subscription at this time. Please review the information and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-gray-950">Subscription</h2>
        <div className="mt-4 space-y-4">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onCancel={() => setSelectedId(subscription.id)}
            />
          ))}
        </div>
      </section>

      {selectedSubscription && (
        <CancelSubscriptionDialog
          subscription={selectedSubscription}
          submitting={submitting}
          onClose={() => setSelectedId(null)}
          onConfirm={cancelSubscription}
        />
      )}
    </>
  );
}
