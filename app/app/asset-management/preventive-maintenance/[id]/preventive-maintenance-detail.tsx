"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { usePreventive } from "../use-preventives";

export function PreventiveMaintenanceDetail({ id }: { id: string }) {
  const query = usePreventive(id);
  const item = query.data;
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  useEffect(() => {
    setBreadcrumbs([
      {
        title: "Preventive Maintenance",
        href: "/app/asset-management/preventive-maintenance"
      },
      { title: "Preventive Detail" }
    ]);
    return clearBreadcrumbs;
  }, [clearBreadcrumbs, setBreadcrumbs]);

  if (query.isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading preventive detail...
      </div>
    );
  }

  if (query.isError || !item) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          Preventive maintenance detail could not be loaded.
        </p>
        <Button variant="outline" onClick={() => query.refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const usage = Math.max(0, item.currentUsage - item.lastServiceUsage);
  const frequencyName = item.frequencyType;
  const usageUnit = item.unit;
  const progress =
    item.thresholdValue > 0
      ? Math.min(
          100,
          Math.max(0, (item.currentUsage / item.thresholdValue) * 100)
        )
      : 0;
  const reached = progress >= 100;

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="flex items-center gap-2">
          <Link
            href="/app/asset-management/preventive-maintenance"
            aria-label="Back to preventive maintenance"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{item.assetName}</h1>
        </div>
        <p className="mt-1 pl-7 text-sm text-muted-foreground">
          Asset Code: {item.assetCode}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Frequency Type" value={frequencyName} />
        <Metric
          label="Threshold"
          value={formatUsage(item.thresholdValue, usageUnit)}
        />
        <Metric
          label="Current Usage"
          value={formatUsage(item.currentUsage, usageUnit)}
        />
        <Metric
          label="Usage Since Last Service"
          value={formatUsage(usage, usageUnit)}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Asset Specifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Core details and operational status
          </p>
          <dl className="mt-4 divide-y">
            <Detail
              label="Work Order Status"
              value={<Status value={item.workOrderStatus} />}
            />
            <Detail label="Asset Code" value={item.assetCode} />
            <Detail label="Asset Name" value={item.assetName} />
            <Detail label="Model" value={item.model} />
            <Detail label="Current Project" value={item.project} />
          </dl>

          <h2 className="mt-6 text-base font-semibold">Latest Usage Update</h2>
          <dl className="mt-3 divide-y">
            <Detail
              label="Recorded At"
              value={formatDate(item.latestUsageAt)}
            />
            <Detail label="Recorded By" value={item.latestUsageBy} />
            <Detail
              label="Usage"
              value={formatUsage(item.latestUsage, usageUnit)}
            />
          </dl>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Maintenance Progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational health and upcoming schedule
          </p>
          <div className="mt-5 flex items-center justify-between">
            <strong>{Math.round(progress)}% Threshold Reached</strong>
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatUsage(item.currentUsage, usageUnit)} /{" "}
            {formatUsage(item.thresholdValue, usageUnit)} until next service
          </p>
          <div
            className={`mt-5 flex items-center gap-2 rounded-lg px-3 py-3 text-sm ${
              reached
                ? "bg-emerald-50 text-emerald-700"
                : "bg-sky-50 text-sky-700"
            }`}
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {reached
              ? "Maintenance threshold has been reached."
              : `${formatUsage(Math.max(0, item.thresholdValue - item.currentUsage), usageUnit)} remaining until maintenance.`}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const created = value.toLowerCase().includes("created");
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] ${created ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-sky-600"}`}
    >
      {titleCase(value)}
    </span>
  );
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatUsage(value: number, unit: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
}
