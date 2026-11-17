"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ListChecks, Search, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { monthlyVolveProduction } from "./data";
import {
  type ApiSignal,
  type SignalFlag,
  type SignalMetric
} from "./use-signals";
import { countSignals, filterSignals } from "./signal-filters";
import { DesignIcon } from "./design-icon";
import { SignalFormula } from "./signal-formula";

const kinds = {
  insight: {
    label: "Insight",
    plural: "Insights",
    subtitle: "What is happening now",
    stripe: "bg-blue-600",
    chip: "bg-blue-50 text-blue-700"
  },
  recommendation: {
    label: "Recommendation",
    plural: "Recommendations",
    subtitle: "What to do about it",
    stripe: "bg-[var(--signals-accent)]",
    chip: "bg-primary-50 text-[var(--signals-accent)]"
  },
  prediction: {
    label: "Prediction",
    plural: "Predictions",
    subtitle: "What is likely to happen",
    stripe: "bg-slate-600",
    chip: "bg-slate-100 text-slate-700"
  },
  other: {
    label: "Other",
    plural: "Other",
    subtitle: "Other signals",
    stripe: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700"
  }
} as const;
type Kind = keyof typeof kinds;
const valueStyles = {
  production: {
    label: "▲ Production",
    className: "bg-primary-50 text-primary-800"
  },
  cost: { label: "▼ Cost", className: "bg-sky-50 text-sky-900" },
  both: {
    label: "▲▼ Production + Cost",
    className: "bg-amber-50 text-amber-900"
  }
} as const;
const levelStyles: Record<string, string> = {
  risk: "bg-red-50 text-red-700 border border-red-200/70",
  watch: "bg-amber-50 text-amber-800 border border-amber-200/70",
  opportunity: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  info: "bg-sky-50 text-sky-700 border border-sky-200/70"
};
const factPageUrl = "https://factpages.sodir.no/field/pageview/all/3420717";

function display(value: unknown): string {
  if (value == null) return "—";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  return JSON.stringify(value);
}

function label(key: string) {
  return key.replaceAll("_", " ");
}

function signalKind(type: string): Kind {
  const normalized = type.toLowerCase();
  return Object.prototype.hasOwnProperty.call(kinds, normalized)
    ? (normalized as Kind)
    : "other";
}

function metadataValue(signal: ApiSignal, key: string): string | undefined {
  const value = signal.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isSignalMetric(value: unknown): value is SignalMetric {
  return typeof value === "object" && value !== null && "value" in value;
}

function formatMetricValue(metric: unknown): string {
  if (metric == null) return "—";

  if (isSignalMetric(metric)) {
    const val = metric.value;
    if (val == null) return "—";

    if (typeof val === "number") {
      if (metric.unit === "ratio") {
        const pct = val * 100;
        const formatted = Number.isInteger(pct)
          ? pct.toString()
          : pct.toFixed(1);
        return `${formatted}%`;
      }
      if (metric.unit === "%") {
        const formatted = Number.isInteger(val)
          ? val.toString()
          : val.toFixed(1);
        return `${formatted}%`;
      }
      const numStr = val.toLocaleString("en-US");
      return metric.unit ? `${numStr} ${metric.unit}` : numStr;
    }
    if (metric.unit === "%") {
      return `${String(val)}%`;
    }
    return metric.unit ? `${String(val)} ${metric.unit}` : String(val);
  }

  if (typeof metric === "number") {
    return metric.toLocaleString("en-US");
  }

  return display(metric);
}

function getPrimaryMetric(metrics?: Record<string, unknown> | null): {
  key: string;
  label: string;
  formattedValue: string;
  metric: SignalMetric | null;
} | null {
  if (!metrics) return null;
  const entries = Object.entries(metrics);
  if (entries.length === 0) return null;

  const primaryEntry =
    entries.find(([, val]) => isSignalMetric(val) && val.primary === true) ??
    entries[0];

  const [key, val] = primaryEntry;
  const metricObj = isSignalMetric(val) ? val : null;
  const metricLabel = metricObj?.label || label(key);
  const formattedValue = formatMetricValue(val);

  return {
    key,
    label: metricLabel,
    formattedValue,
    metric: metricObj
  };
}

function formatConfidence(confidence: number | null | undefined): string {
  if (confidence == null) return "—";
  const pct =
    confidence <= 1 && confidence >= 0 ? confidence * 100 : confidence;
  const formatted = Number.isInteger(pct) ? pct.toString() : pct.toFixed(1);
  return `${formatted}%`;
}

function SignalTags({ signal }: { signal: ApiSignal }) {
  const kind = kinds[signalKind(signal.type)];
  const valueTags: string[] = Array.isArray(signal.metadata?.value_tags)
    ? signal.metadata.value_tags
    : metadataValue(signal, "value")
      ? [metadataValue(signal, "value")!]
      : [];
  const level = signal.metadata?.severity ?? metadataValue(signal, "level");
  const entityName = signal.metadata?.entity?.name;
  const entityKind = signal.metadata?.entity?.kind;

  // predictive actions generated
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${kind.chip}`}
      >
        <DesignIcon
          name={
            signalKind(signal.type) === "other" ? "ai" : signalKind(signal.type)
          }
          size={12}
        />
        {signalKind(signal.type) === "other" ? signal.type : kind.label}
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
        <DesignIcon name="ai" size={12} /> AI
      </span>
      {entityName && (
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
          <DesignIcon name="entity" size={12} />
          {entityKind ? `${label(entityKind)}: ` : ""}
          {entityName}
        </span>
      )}
      {signal.module_name && (
        <span className="text-slate-500">{label(signal.module_name)}</span>
      )}
      {valueTags.map((vTag) => {
        const lower = vTag.toLowerCase();
        const style = valueStyles[lower as keyof typeof valueStyles];
        return style ? (
          <span
            key={vTag}
            className={`rounded px-1.5 py-0.5 font-semibold ${style.className}`}
          >
            {style.label}
          </span>
        ) : (
          <span
            key={vTag}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 capitalize"
          >
            {vTag}
          </span>
        );
      })}
      {level && (
        <span
          className={`rounded px-1.5 py-0.5 font-semibold capitalize ${levelStyles[level.toLowerCase()] ?? "bg-slate-100 text-slate-700"}`}
        >
          {level}
        </span>
      )}
      {signal.metadata?.synthetic === true && (
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
          Synthetic / derived
        </span>
      )}
    </span>
  );
}

function VolveFieldRecord() {
  const stats = [
    {
      label: "Field status",
      value: "Shut down",
      detail: "OIL · North Sea · Equinor Energy AS"
    },
    {
      label: "Cumulative oil",
      value: "10.17 mill Sm3",
      detail: "100% of 10.17 recoverable"
    },
    {
      label: "Peak month",
      value: "277k Sm3",
      detail: "Dec 2008 (about 57,992 bopd)"
    },
    {
      label: "Water share 2016",
      value: "83%",
      detail: "70% in 2015 · produced water ÷ liquid"
    },
    {
      label: "Export",
      value: "NAVION SAGA",
      detail: "FSU, 90 m water depth · 2008-02-12 to 2016-10-06"
    }
  ];
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-primary-800">
            Volve field record · Sodir FactPages
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Historical reference data · separate from the live signals feed
          </p>
        </div>
        <a
          href={factPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
        >
          Open FactPage <DesignIcon name="external-link" size={12} />
        </a>
      </div>
      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-md border border-slate-200 p-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p className="mt-1 text-lg font-bold text-primary-900">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-xs font-semibold text-primary-800">
          Monthly gross oil and produced water, Feb 2008 to Sep 2016 (thousand
          Sm3)
        </h3>
        <div className="mt-2 h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyVolveProduction}
              margin={{ top: 8, right: 12, left: -20, bottom: 4 }}
            >
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={11}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                domain={[0, 300]}
              />
              <Tooltip
                formatter={(value, name) => [`${value} thousand Sm3`, name]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="oil"
                name="Gross oil"
                stroke="var(--atlas-primary-700)"
                fill="var(--atlas-primary-100)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="water"
                name="Produced water"
                stroke="#155e75"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Water overtook oil in 2010 and peaked in Oct 2014. The last full
          production month was Aug 2016. Production stopped in Sep 2016 and the
          FSU was removed on 2016-10-06.
        </p>
      </div>
    </section>
  );
}

export function SignalsResults({
  signals,
  onReviewFormulas,
  loading = false,
  error = false,
  onRetry,
  scheduleControls
}: {
  signals: ApiSignal[];
  onReviewFormulas: () => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  scheduleControls?: ReactNode;
}) {
  const [kind, setKind] = useState<Kind | "all">("all");
  const [moduleName, setModuleName] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [code, setCode] = useState("");
  const [flagId, setFlagId] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<ApiSignal | null>(null);
  const filtered = filterSignals(signals, {
    kind,
    status,
    moduleName,
    severity,
    searchQuery,
    code,
    flagId,
    createdAfter,
    createdBefore
  });
  const loaded = filtered.slice(0, pageSize);
  const countData = countSignals(signals);
  const areas = [
    ...new Set(signals.map((signal) => signal.module_name).filter(Boolean))
  ].sort();
  const metricEntries = selected ? Object.entries(selected.metrics ?? {}) : [];
  const metadataEntries = selected
    ? Object.entries(selected.metadata ?? {})
    : [];

  return (
    <div className="signals-results min-w-0 space-y-5 pb-8 text-slate-900">
      <section className="signals-hero rounded-[10px] p-5 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wide">
            <DesignIcon name="ai-white" /> AI-GENERATED
          </span>
          <Button
            className="h-10 rounded-lg border border-primary-500 bg-primary-500 px-6 text-white hover:bg-primary-400"
            onClick={onReviewFormulas}
          >
            Review Formula in Use
          </Button>
        </div>
        <h1 className="mt-3 font-[Georgia,serif] text-2xl font-bold leading-tight sm:text-[40px] sm:leading-10">
          Operation Intelligence &amp; Predictive Actions
        </h1>
        <p className="mt-2 text-sm leading-5 text-white/85">
          Review insights, recommendations and predictions from NEXA. Open a
          signal to inspect its evidence, metrics and suggested action. People
          decide; nothing runs on its own.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(["all", "insight", "recommendation", "prediction"] as const).map(
            (item) => {
              const active = kind === item;
              const count =
                item === "all"
                  ? Object.values(countData).reduce<number>(
                      (acc, val) => acc + (typeof val === "number" ? val : 0),
                      0
                    )
                  : (countData[item] ?? 0);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(item)}
                  className={`rounded-lg border p-3.5 text-left transition-colors ${active ? "border-white bg-white text-slate-900" : "border-white/25 bg-white/10 hover:bg-white/20"}`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${active ? "text-[var(--signals-accent)]" : "text-white/90"}`}
                  >
                    <DesignIcon
                      name={
                        item === "all"
                          ? active
                            ? "ai-red"
                            : "ai-white"
                          : active
                            ? item
                            : `${item}-white`
                      }
                      size={active && item !== "all" ? 12 : 14}
                    />
                    {item === "all" ? "All AI signals" : kinds[item].plural}
                  </span>
                  <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums">
                    {loading || (error && !signals.length)
                      ? "--"
                      : count.toLocaleString()}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${active ? "text-slate-500" : "text-white/75"}`}
                  >
                    {item === "all" ? "Total signals" : kinds[item].subtitle}
                  </span>
                </button>
              );
            }
          )}
        </div>
        <p className="mt-2 text-[11px] text-white/75">
          Counts reflect total signals aggregated by type.
        </p>
        {scheduleControls}
      </section>
      <div className="pt-5">
        <VolveFieldRecord />
      </div>
      <div className="flex flex-wrap items-end gap-3 text-xs">
        <label className="flex flex-col gap-1 font-medium">
          Search
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search well, detector, title…"
              className="h-9 w-52 rounded border border-slate-200 bg-white pl-8 pr-3 outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1 font-medium">
          Area / module
          <input
            list="signal-modules"
            value={moduleName}
            onChange={(event) => setModuleName(event.target.value)}
            placeholder="All areas"
            className="h-9 w-40 rounded border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-primary-700"
          />
        </label>
        <datalist id="signal-modules">
          {areas.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>
        <label className="flex flex-col gap-1 font-medium">
          Severity
          <select
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="h-9 rounded border border-slate-200 bg-white px-2.5 outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="all">All severities</option>
            <option value="risk">Risk</option>
            <option value="watch">Watch</option>
            <option value="opportunity">Opportunity</option>
            <option value="info">Info</option>
          </select>
        </label>
        <div className="inline-flex h-9 items-center rounded border border-slate-200 bg-white p-0.5">
          {["all", "open", "actioned"].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={status === item}
              onClick={() => setStatus(item)}
              className={`rounded px-3 py-1.5 font-semibold capitalize ${status === item ? "bg-primary-700 text-white" : "text-slate-500 hover:text-slate-900"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="ml-auto text-slate-500" role="status">
          {loaded.length < filtered.length
            ? `${loaded.length} of ${filtered.length} shown`
            : `${loaded.length} loaded`}
        </span>
      </div>
      <details className="rounded border border-slate-200 bg-white p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-primary-700">
          More filters
        </summary>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            Signal code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Code"
              className="h-9 w-40 rounded border border-slate-200 px-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Flag ID
            <input
              value={flagId}
              onChange={(event) => setFlagId(event.target.value)}
              placeholder="Flag UUID"
              className="h-9 w-44 rounded border border-slate-200 px-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Created after
            <input
              type="datetime-local"
              value={createdAfter}
              onChange={(event) => setCreatedAfter(event.target.value)}
              className="h-9 rounded border border-slate-200 px-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Created before
            <input
              type="datetime-local"
              value={createdBefore}
              onChange={(event) => setCreatedBefore(event.target.value)}
              className="h-9 rounded border border-slate-200 px-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Page size
            <select
              aria-label="Page size"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-9 rounded border border-slate-200 px-2"
            >
              {[5, 10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setFlagId("");
              setCreatedAfter("");
              setCreatedBefore("");
              setModuleName("");
              setStatus("all");
              setKind("all");
              setSeverity("all");
              setSearchQuery("");
            }}
            className="h-9 rounded border border-slate-200 px-3 font-semibold hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
      </details>
      <div className="space-y-5 pt-5">
        {loading && (
          <p role="status" className="py-10 text-center text-sm text-slate-500">
            Loading signals...
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            <p>Unable to load signals. Please try again.</p>
            <Button variant="outline" onClick={onRetry}>
              Retry signals
            </Button>
          </div>
        )}
        {loaded.map((signal) => {
          const kindData = kinds[signalKind(signal.type)];
          const primaryMetric = getPrimaryMetric(signal.metrics);
          const priorityScore = signal.metadata?.priority_score;

          return (
            <button
              key={signal.id}
              type="button"
              onClick={() => setSelected(signal)}
              className="group flex w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-shadow hover:border-primary-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
            >
              <span className={`w-1.5 shrink-0 ${kindData.stripe}`} />
              <span className="grid min-w-0 flex-1 gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <span className="min-w-0">
                  <SignalTags signal={signal} />
                  <span className="mt-1.5 block text-sm font-bold">
                    {signal.title || signal.code}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-slate-500">
                    {signal.description || signal.reason_nexa}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-4 lg:justify-end">
                  {primaryMetric && (
                    <span className="text-right">
                      <span className="block text-[11px] text-slate-500">
                        {primaryMetric.label}
                      </span>
                      <span className="block text-sm font-bold tabular-nums">
                        {primaryMetric.formattedValue}
                      </span>
                    </span>
                  )}
                  {!primaryMetric && (
                    <span className="text-right">
                      <span className="block text-[11px] text-slate-500">
                        Code
                      </span>
                      <span className="block text-sm font-bold tabular-nums">
                        {signal.code}
                      </span>
                    </span>
                  )}
                  <span className="hidden text-right sm:block">
                    <span className="block text-[11px] text-slate-500">
                      Confidence
                    </span>
                    <span className="block text-sm font-bold tabular-nums">
                      {formatConfidence(signal.confidence)}
                    </span>
                  </span>
                  {priorityScore != null && (
                    <span className="hidden text-right md:block">
                      <span className="block text-[11px] text-slate-500">
                        Priority
                      </span>
                      <span className="block text-sm font-bold tabular-nums">
                        {(priorityScore * 100).toFixed(0)}%
                      </span>
                    </span>
                  )}
                  <span className="inline-flex h-8 items-center gap-1.5 rounded bg-[var(--signals-accent)] px-3 text-xs font-semibold text-white group-hover:bg-primary-800">
                    View details <DesignIcon name="arrow-right" />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
        {!loading && !error && loaded.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            {signals.length
              ? "No signals match these filters."
              : "No signals yet. Insights, recommendations and predictions will appear here when available."}
          </p>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="signals-detail fixed inset-y-0 right-0 left-auto top-0 flex h-dvh w-full max-w-[500px] translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 p-0 sm:max-w-[500px]"
        >
          {selected && (
            <>
              <div
                className={`h-1 shrink-0 ${kinds[signalKind(selected.type)].stripe}`}
              />
              <div className="flex items-start gap-3 border-b border-slate-200 p-5">
                <div className="min-w-0 flex-1">
                  <SignalTags signal={selected} />
                  <DialogTitle className="mt-2 text-[17px] leading-snug font-bold">
                    {selected.title || selected.code}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs">
                    {selected.code} · {label(selected.module_name)} ·{" "}
                    {selected.status}
                  </DialogDescription>
                </div>
                <button
                  type="button"
                  aria-label="Close signal details"
                  onClick={() => setSelected(null)}
                  className="grid size-8 shrink-0 place-items-center rounded hover:bg-slate-100"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 space-y-5 p-5 text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-gradient-to-r from-primary-50 to-primary-100 px-3 py-2 text-xs font-semibold text-primary-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    Generated by NEXA · Confidence{" "}
                    {formatConfidence(selected.confidence)}
                  </span>
                  {selected.metadata?.priority_score != null && (
                    <span className="rounded bg-white/80 px-2 py-0.5 text-[11px] font-bold text-primary-800">
                      Priority score:{" "}
                      {(selected.metadata.priority_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <section className="rounded-lg border border-primary-700/25 bg-primary-50/60 p-3.5">
                  <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-700">
                    <ListChecks className="size-3.5" />
                    Suggested action
                  </h3>
                  <p className="mt-1 font-semibold leading-relaxed text-primary-900">
                    {selected.suggested_action || "No action provided."}
                  </p>
                </section>
                {selected.metadata?.entity && (
                  <section className="rounded-md border border-slate-200 bg-slate-50/50 p-3.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Target Entity
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {selected.metadata.entity.name || "—"}
                        </span>
                        {selected.metadata.entity.kind && (
                          <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 capitalize">
                            {selected.metadata.entity.kind}
                          </span>
                        )}
                      </div>
                      {selected.metadata.entity.id && (
                        <span className="font-mono text-xs text-slate-500">
                          ID: {selected.metadata.entity.id}
                        </span>
                      )}
                    </div>
                  </section>
                )}
                {selected.description && (
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Description
                    </h3>
                    <p className="mt-1 leading-relaxed text-slate-800">
                      {selected.description}
                    </p>
                  </section>
                )}
                {selected.reason_nexa && (
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Why NEXA flagged this
                    </h3>
                    <p className="mt-1 leading-relaxed text-slate-800">
                      {selected.reason_nexa}
                    </p>
                  </section>
                )}
                {metricEntries.length > 0 && (
                  <section className="rounded-md border border-slate-200 p-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Metrics
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {metricEntries.length}{" "}
                        {metricEntries.length === 1 ? "metric" : "metrics"}
                      </span>
                    </div>
                    <div className="mt-2 divide-y divide-slate-100">
                      {[...metricEntries]
                        .sort(([, a], [, b]) => {
                          const aPrimary =
                            isSignalMetric(a) && a.primary ? 1 : 0;
                          const bPrimary =
                            isSignalMetric(b) && b.primary ? 1 : 0;
                          return bPrimary - aPrimary;
                        })
                        .map(([key, val]) => {
                          const metricObj = isSignalMetric(val) ? val : null;
                          const metricName = metricObj?.label || label(key);
                          const formattedVal = formatMetricValue(val);
                          const hasThreshold =
                            metricObj?.threshold !== undefined;
                          const formattedThreshold = hasThreshold
                            ? formatMetricValue({
                                value: metricObj.threshold,
                                unit: metricObj.unit
                              })
                            : null;

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between py-2 text-xs"
                            >
                              <div className="min-w-0 pr-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-700 capitalize">
                                    {metricName}
                                  </span>
                                  {metricObj?.primary && (
                                    <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-800">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                {hasThreshold && (
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    Threshold: {formattedThreshold}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {formattedVal}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </section>
                )}
                {Array.isArray(selected.metadata?.evidence) &&
                  selected.metadata.evidence.length > 0 && (
                    <section className="rounded-md border border-slate-200 p-3.5">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Evidence &amp; Data Source
                      </h3>
                      <div className="mt-2 space-y-2">
                        {selected.metadata.evidence.map((ev, index) => (
                          <div
                            key={index}
                            className="rounded-md border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="font-mono text-primary-700">
                                {ev.collection || "Evidence dataset"}
                              </span>
                              {ev.count != null && (
                                <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {ev.count.toLocaleString()} records
                                </span>
                              )}
                            </div>
                            {ev.period && (
                              <div className="mt-1 text-slate-600">
                                <span className="text-slate-400">Period: </span>
                                <span className="font-mono text-[11px]">
                                  {ev.period}
                                </span>
                              </div>
                            )}
                            {ev.filter && Object.keys(ev.filter).length > 0 && (
                              <div className="mt-1 text-slate-600">
                                <span className="text-slate-400">Filter: </span>
                                <span className="font-mono text-[11px]">
                                  {Object.entries(ev.filter)
                                    .map(([k, v]) => `${k}=${v}`)
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                <SignalFormula value={selected.metadata?.formula} />
                {selected.metadata && (
                  <section className="rounded-md border border-slate-200 p-3.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Detection &amp; Model Context
                    </h3>
                    <dl className="mt-2 space-y-2 text-xs">
                      {selected.metadata.detector && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Detector</dt>
                          <dd className="text-right font-semibold">
                            {label(selected.metadata.detector)}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.model_version && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Model version</dt>
                          <dd className="text-right font-mono text-slate-700">
                            {selected.metadata.model_version}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.scan_id && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Scan ID</dt>
                          <dd className="text-right font-mono text-slate-700">
                            {selected.metadata.scan_id}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.source && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Source</dt>
                          <dd className="text-right font-semibold">
                            {selected.metadata.source}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.narrative_by && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Narrative by</dt>
                          <dd className="text-right font-semibold uppercase">
                            {selected.metadata.narrative_by}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.first_seen_at && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">First seen</dt>
                          <dd className="text-right">
                            {new Date(
                              selected.metadata.first_seen_at
                            ).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.last_seen_at && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Last seen</dt>
                          <dd className="text-right">
                            {new Date(
                              selected.metadata.last_seen_at
                            ).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {selected.metadata.is_active != null && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Active</dt>
                          <dd className="text-right font-semibold">
                            {selected.metadata.is_active ? "Yes" : "No"}
                          </dd>
                        </div>
                      )}
                      {metadataEntries
                        .filter(
                          ([k]) =>
                            ![
                              "entity",
                              "evidence",
                              "formula",
                              "detector",
                              "model_version",
                              "scan_id",
                              "source",
                              "narrative_by",
                              "first_seen_at",
                              "last_seen_at",
                              "severity",
                              "value_tags",
                              "priority_score",
                              "is_active",
                              "is_illustrative"
                            ].includes(k)
                        )
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="capitalize text-slate-500">
                              {label(k)}
                            </dt>
                            <dd className="min-w-0 break-all text-right font-semibold">
                              {display(v)}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                )}
                {(() => {
                  const flags: SignalFlag[] =
                    selected.flags && selected.flags.length > 0
                      ? selected.flags
                      : (selected.flag_ids || []).map((id) => ({
                          id,
                          name: id
                        }));
                  if (flags.length === 0) return null;

                  return (
                    <section className="rounded-md border border-slate-200 p-3.5">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Flags
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {flags.map((flag) => {
                          const flagLower = flag.name.toLowerCase();
                          const badgeColor =
                            flagLower === "risk"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : flagLower === "watch"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : flagLower === "production"
                                  ? "border-rose-200 bg-rose-50 text-rose-800"
                                  : flagLower === "cost"
                                    ? "border-sky-200 bg-sky-50 text-sky-800"
                                    : "border-slate-200 bg-slate-100 text-slate-700";

                          return (
                            <span
                              key={flag.id}
                              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${badgeColor}`}
                            >
                              <span>{flag.name}</span>
                              {flag.id !== flag.name && (
                                <span className="font-mono text-[10px] opacity-60">
                                  ({flag.id.slice(0, 8)}…)
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </section>
                  );
                })()}
                <p className="text-xs text-slate-500">
                  Read only. No API endpoint for accepting, dismissing, or
                  auditing actions was provided.
                </p>
                <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
                  Created:{" "}
                  {selected.created_at
                    ? new Date(selected.created_at).toLocaleString()
                    : "—"}{" "}
                  {selected.created_by ? `by ${selected.created_by}` : ""}
                  <br />
                  Updated:{" "}
                  {selected.updated_at
                    ? new Date(selected.updated_at).toLocaleString()
                    : "—"}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
