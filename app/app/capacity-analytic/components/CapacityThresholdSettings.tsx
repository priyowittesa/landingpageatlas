"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Thresholds } from "../api-types";
import { capacityError, capacityWrite } from "../api";
import { useCapacityMutation, useCapacityQuery } from "../use-capacity";
import { ApiState } from "./ApiState";
import { selectClass } from "./CapacityFilters";

export function CapacityThresholdSettings() {
  const query = useCapacityQuery<Thresholds>("/capacity-threshold");
  return <section className="space-y-3 rounded-xl border bg-background p-5">
    <h2 className="text-lg font-semibold">Capacity Thresholds</h2>
    <ApiState query={query} />
    {query.data && <ThresholdForm key={`${query.data.warning_pct}:${query.data.ng_pct}:${query.data.is_default}`} value={query.data} />}
  </section>;
}

function ThresholdForm({ value }: { value: Thresholds }) {
  const [warning, setWarning] = useState(value.warning_pct);
  const [ng, setNg] = useState(value.ng_pct);
  const save = useCapacityMutation((reset: boolean) => capacityWrite("/capacity-threshold", reset ? undefined : {
    warning_pct: warning, ng_pct: ng,
  }, reset ? "DELETE" : "PUT"));
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(false); }}>
    <p className="text-sm text-muted-foreground">{value.is_default ? "Using system defaults." : "Using tenant thresholds."} Status is always calculated by the API.</p>
    <div className="flex flex-wrap items-end gap-4">
      <label className="text-sm">Warning (%)<input aria-label="Warning Threshold" required type="number" min="0" step="any" value={warning} onChange={(e) => setWarning(Number(e.target.value))} className={selectClass} /></label>
      <label className="text-sm">NG (%)<input aria-label="NG Threshold" required type="number" min="0" step="any" value={ng} onChange={(e) => setNg(Number(e.target.value))} className={selectClass} /></label>
      <Button disabled={save.isPending || ng <= warning || !save.canManage}>Save Thresholds</Button>
      <Button type="button" variant="outline" disabled={save.isPending || value.is_default || !save.canManage} onClick={() => save.mutate(true)}>Restore Defaults</Button>
    </div>
    {ng <= warning && <p className="text-sm text-destructive">NG must be greater than Warning.</p>}
    {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}
  </form>;
}
