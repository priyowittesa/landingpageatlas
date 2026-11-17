"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { cn } from "@/lib/utils";
import type { WellStatus } from "./data";

export const chartColors = {
  primary: "var(--atlas-primary-700)",
  soft: "var(--atlas-primary-300)",
  blue: "#155e75",
  amber: "#d97706"
};

export function Provenance({
  type
}: {
  type: "Measured" | "Calculated" | "Synthetic" | "Estimated";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold",
        type === "Synthetic"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-primary-200 bg-primary-50 text-primary-800"
      )}
    >
      {type}
    </span>
  );
}
export function Panel({
  title,
  aside,
  children,
  className
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border border-gray-200 bg-white",
        className
      )}
    >
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-primary-800">{title}</h2>
        {aside && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {aside}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
export function StatusBadge({
  status
}: {
  status: WellStatus | "Producing" | "Injecting" | "Shut-in" | "Offline";
}) {
  const style =
    status === "Critical"
      ? "bg-red-50 text-red-700"
      : status === "Warning" || status === "Injecting, under target"
        ? "bg-amber-50 text-amber-800"
        : status === "Injecting, on target" ||
            status === "Injecting" ||
            status === "Producing"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${style}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
export function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 max-w-56 rounded border border-gray-200 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded border border-gray-200 bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-primary-700 text-white"
              : "text-gray-600 hover:bg-primary-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
export function MetricCard({
  label,
  value,
  unit,
  delta,
  negative = false
}: {
  label: string;
  value: string;
  unit: string;
  delta?: string;
  negative?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-gray-200 border-t-2 border-t-primary-700 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <Provenance type="Calculated" />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-gray-950">
          {value}
        </span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      {delta && (
        <p
          className={cn(
            "mt-5 text-xs",
            negative ? "text-red-600" : "text-emerald-700"
          )}
        >
          {delta} <span className="text-gray-500">vs prior</span>
        </p>
      )}
    </div>
  );
}
export function TimeChart({
  data,
  lines,
  height = 260,
  yDomain
}: {
  data: object[];
  lines: {
    key: string;
    name: string;
    color: string;
    axis?: "right";
    dashed?: boolean;
  }[];
  height?: number;
  yDomain?: [number, number];
}) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 14, bottom: 4, left: -20 }}
        >
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10 }}
            tickLine={false}
            domain={yDomain ?? ["auto", "auto"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              yAxisId={line.axis === "right" ? "right" : "left"}
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              strokeDasharray={line.dashed ? "4 4" : undefined}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function AreaTrend({
  data
}: {
  data: { day: string; oil: number; water: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 14, right: 14, bottom: 4, left: -18 }}
        >
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            domain={[8100, 11700]}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[78, 86]}
            tick={{ fontSize: 10 }}
            unit="%"
          />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="oil"
            name="Oil (bopd)"
            stroke={chartColors.primary}
            fill="var(--atlas-primary-100)"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="water"
            name="Water cut (%)"
            stroke={chartColors.blue}
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function HorizontalBars({
  items,
  max
}: {
  items: { id: string; oil: number; potential: number }[];
  max?: number;
}) {
  const ceiling = max ?? Math.max(1, ...items.map((item) => item.potential));
  return (
    <div className="space-y-2 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-[65px_minmax(0,1fr)_50px] items-center gap-2 text-[11px]"
        >
          <span className="truncate text-gray-500">{item.id}</span>
          <div className="relative h-4 rounded-sm bg-gray-50">
            <div
              className="absolute inset-y-0 left-0 bg-primary-200"
              style={{
                width: `${Math.min(100, (item.potential / ceiling) * 100)}%`
              }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-primary-700"
              style={{ width: `${Math.min(100, (item.oil / ceiling) * 100)}%` }}
            />
          </div>
          <span className="text-right tabular-nums text-gray-500">
            {item.oil.toLocaleString("en-US")}
          </span>
        </div>
      ))}
      <p className="pt-2 text-right text-[11px] text-gray-500">
        <span className="text-primary-700">■</span> Actual &nbsp;{" "}
        <span className="text-primary-200">■</span> Gap / reference
      </p>
    </div>
  );
}
