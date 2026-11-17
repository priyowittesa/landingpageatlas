"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCapacityOptions } from "../use-capacity";
import type { MasterRecord, Params } from "../api-types";
import { ApiState } from "./ApiState";
import { masterLabel } from "../api";

export function currentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export const selectClass = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";
export function MasterSelect({ label, value, onChange, items, empty = "All", disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; items: MasterRecord[]; empty?: string; disabled?: boolean;
}) {
  return <label className="min-w-0 space-y-1 text-sm font-medium">
    <span>{label}</span>
    <select aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">{empty}</option>
      {items.map((item) => <option key={item.id} value={item.id}>{masterLabel(item)}</option>)}
    </select>
  </label>;
}

export function CapacityFilters({ value, onApply, trend = false }: {
  value: Params; onApply: (params: Params) => void; trend?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const products = useCapacityOptions<MasterRecord>("/products");
  const groups = useCapacityOptions<MasterRecord>("/production-line-groups");
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  const visibleGroups = (groups.data ?? []).filter((group) => !draft["filter.product_id"] || group.product_id === draft["filter.product_id"]);
  const visibleLines = (lines.data ?? []).filter((line) =>
    (!draft["filter.line_group_id"] || line.production_line_group_id === draft["filter.line_group_id"]) &&
    (!draft["filter.product_id"] || visibleGroups.some((group) => group.id === line.production_line_group_id)));
  const update = (key: string, next: string | number) => setDraft((old) => ({
    ...old, [key]: next || undefined,
    ...(key === "filter.product_id" ? { "filter.line_group_id": undefined, "filter.line_id": undefined, line_id: undefined } : {}),
    ...(key === "filter.line_group_id" ? { "filter.line_id": undefined, line_id: undefined } : {}),
  }));
  return <section className="space-y-3 rounded-lg border border-border bg-background p-4">
    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <label className="space-y-1 text-sm font-medium">Year<input aria-label="Year" type="number" min="1" max="9999" className={selectClass} value={Number(draft.year)} onChange={(e) => update("year", Number(e.target.value))} /></label>
      {!trend && <label className="space-y-1 text-sm font-medium">Month<select aria-label="Month" className={selectClass} value={Number(draft.month)} onChange={(e) => update("month", Number(e.target.value))}>
        {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i).toLocaleString("en", { month: "long" })}</option>)}
      </select></label>}
      <label className="space-y-1 text-sm font-medium">Plan<select aria-label="Plan" className={selectClass} value={String(draft.plan ?? "production")} onChange={(e) => update("plan", e.target.value)}>
        <option value="production">Production Plan</option><option value="prototype">Prototype Plan</option>
      </select></label>
      <MasterSelect label="Product" value={String(draft["filter.product_id"] ?? "")} onChange={(v) => update("filter.product_id", v)} items={products.data ?? []} />
      {!trend && <MasterSelect label="Line Group" value={String(draft["filter.line_group_id"] ?? "")} onChange={(v) => update("filter.line_group_id", v)} items={visibleGroups} />}
      <MasterSelect label="Production Line" empty={trend ? "Select a line" : "All"} value={String(draft[trend ? "line_id" : "filter.line_id"] ?? "")} onChange={(v) => update(trend ? "line_id" : "filter.line_id", v)} items={visibleLines} />
      <Button disabled={!draft.year || (trend && !draft.line_id)} onClick={() => onApply(draft)}>Apply Filter</Button>
    </div>
    {[products, groups, lines].filter((q) => q.error).map((q, i) => <ApiState key={i} query={q} />)}
  </section>;
}
