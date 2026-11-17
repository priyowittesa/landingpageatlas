"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  Activity,
  BarChart3,
  Coins,
  Download,
  History,
  TriangleAlert
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useExportTokenRequests,
  useTokenUsageAccess,
  useTokenUsageOverview
} from "../hooks/useTokenUsage";
import {
  formatPercent,
  formatPeriodRange,
  getMonthDateRange,
  formatShortDate,
  formatTokens
} from "../lib/format";
import type { TokenUsageGranularity } from "../types";
import { ConsumptionChart } from "./ConsumptionChart";
import {
  ConsumptionFilters,
  ModuleUsageRow,
  TokenKpiCard,
  TokenUsageCard
} from "./TokenUsageShared";
import { TokenUsageAdminOverview } from "./TokenUsageAdminOverview";

/** One of the three summary stats under the balance card. */
function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-6 text-gray-950">
        {value}
      </p>
    </div>
  );
}

export function TokenUsageOverview() {
  const router = useRouter();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { isAdmin } = useTokenUsageAccess();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [granularity, setGranularity] =
    useState<TokenUsageGranularity>("monthly");
  const dateRange = useMemo(() => getMonthDateRange(month), [month]);
  const { data, isLoading, isFetching } = useTokenUsageOverview({
    ...dateRange,
    granularity
  });
  const exportRequests = useExportTokenRequests();

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Overview" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

  // Admins see a policy-focused overview instead of the personal usage view.
  if (isAdmin) {
    return <TokenUsageAdminOverview />;
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  const { balance } = data;
  const isBelowThreshold =
    balance.remainingPercent < data.warningThresholdPercent;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Overview
          </h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">
            Track how many AI tokens you have consumed this period and where
            they went
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-xs"
            onClick={() => exportRequests.mutate(dateRange)}
            disabled={exportRequests.isPending}
          >
            <Download className="h-3.5 w-3.5" />
            Export report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-xs"
            onClick={() => router.push("/app/token-usage/usage-history")}
          >
            <History className="h-3.5 w-3.5" />
            View usage history
          </Button>
        </div>
      </div>

      {/* Low-balance callout */}
      {isBelowThreshold && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50/70 px-4 py-3">
          <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              You have {formatTokens(balance.remaining)} tokens left (
              {formatPercent(balance.remainingPercent)} of your quota).
            </p>
            <p className="text-xs text-gray-500">
              Below the {data.warningThresholdPercent}% warning threshold set by
              your tenant admin. Quota resets on{" "}
              {formatShortDate(data.quotaResetsAt)}.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TokenKpiCard
          label="Used today"
          value={formatTokens(data.usedToday)}
          caption={`${data.requestsToday} AI request${data.requestsToday === 1 ? "" : "s"}`}
          trendPercent={data.usedTodayTrendPercent}
        />
        <TokenKpiCard
          label="Active modules"
          value={String(data.activeModulesCount)}
          caption={data.activeModules.join(", ")}
        />
        <TokenKpiCard
          label="Warning threshold"
          value={`${data.warningThresholdPercent}%`}
          caption="Set by your tenant admin"
        />
        <TokenKpiCard
          label="Quota resets in"
          value={`${data.quotaResetsInDays} days`}
          caption={`Next reset ${formatShortDate(data.quotaResetsAt)}`}
        />
      </div>

      {/* Balance + module breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TokenUsageCard
          icon={Coins}
          title="Tokens left this period"
          subtitle={formatPeriodRange(balance.periodStart, balance.periodEnd)}
          footer={
            <div className="grid grid-cols-3 gap-4">
              <BalanceStat
                label="Requests left"
                value={`${formatTokens(data.estimatedRequestsLeft)} requests`}
              />
              <BalanceStat
                label="Daily average"
                value={`${formatTokens(balance.dailyAverage)} tokens`}
              />
              <BalanceStat
                label="Runs out in"
                value={
                  data.estimatedDaysLeft > 0
                    ? `${Math.ceil(data.estimatedDaysLeft)} days`
                    : "Not at risk"
                }
              />
            </div>
          }
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-6xl font-bold leading-none tracking-tight text-gray-950">
              {formatTokens(balance.remaining)}
            </span>
            <span className="text-xl font-semibold text-gray-500">
              /{balance.quota}
            </span>
            <span className="text-sm text-gray-500">tokens</span>
          </div>

          <Progress
            value={balance.remainingPercent}
            className="mt-6 h-3"
            indicatorClassName="bg-primary-600"
          />

          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>{formatPercent(balance.remainingPercent)} left</span>
            <span>{formatTokens(balance.used)} tokens used</span>
          </div>
        </TokenUsageCard>

        <TokenUsageCard
          icon={Activity}
          title="Token usage"
          subtitle="Usage by module"
          footer={
            <Button
              variant="outline"
              className="h-10 w-full text-xs"
              onClick={() => router.push("/app/token-usage/usage-history")}
            >
              View detailed breakdown
            </Button>
          }
        >
          <div className="space-y-4">
            {data.moduleUsage.map((item) => (
              <ModuleUsageRow
                key={item.module}
                label={item.module}
                percent={item.percent}
                tokens={item.tokens}
              />
            ))}
          </div>
        </TokenUsageCard>
      </div>

      {/* Consumption chart */}
      <TokenUsageCard
        icon={BarChart3}
        title="Consumption"
        subtitle="Track daily token consumption over time"
        headerRight={
          <ConsumptionFilters
            month={month}
            granularity={granularity}
            onMonthChange={setMonth}
            onGranularityChange={setGranularity}
          />
        }
      >
        <ConsumptionChart
          series={data.consumption}
          isLoading={isFetching}
          height={220}
        />
      </TokenUsageCard>
    </div>
  );
}
