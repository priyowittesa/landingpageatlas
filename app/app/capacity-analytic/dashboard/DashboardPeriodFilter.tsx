"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Params } from "../api-types";
import { selectClass } from "../components/CapacityFilters";

export function DashboardPeriodFilter({ value, onApply }: { value: Params; onApply: (period: Params) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const label = new Date(Number(value.year), Number(value.month) - 1).toLocaleString("en", { month: "long", year: "numeric" });
  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft(value); }}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Reporting period" title={`Reporting period: ${label}`}>
        <CalendarDays size={16} />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-72 space-y-4">
      <div><h2 className="text-sm font-semibold">Reporting Period</h2><p className="text-xs text-muted-foreground">Updates dashboard totals and production parts.</p></div>
      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onApply(draft); setOpen(false); }}>
        <label className="block space-y-1 text-sm">Year<input aria-label="Year" type="number" required min="1" max="9999" className={selectClass} value={String(draft.year ?? "")} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} /></label>
        <label className="block space-y-1 text-sm">Month<select aria-label="Month" className={selectClass} value={Number(draft.month)} onChange={(event) => setDraft({ ...draft, month: Number(event.target.value) })}>
          {Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>{new Date(2026, index).toLocaleString("en", { month: "long" })}</option>)}
        </select></label>
        <label className="block space-y-1 text-sm">Plan<select aria-label="Plan" className={selectClass} value={String(draft.plan ?? "production")} onChange={(event) => setDraft({ ...draft, plan: event.target.value })}>
          <option value="production">Production Plan</option><option value="prototype">Prototype Plan</option>
        </select></label>
        <Button type="submit" className="w-full">Apply Filter</Button>
      </form>
    </PopoverContent>
  </Popover>;
}
