"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useCapacityOptions, useCapacityPreview, useCapacityQuery } from "../../use-capacity";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { FormulaCatalog, FormulaPreview, FormulaToken, MasterRecord } from "../../api-types";
import { ApiState, CapacityValue } from "../../components/ApiState";
import { currentPeriod, selectClass } from "../../components/CapacityFilters";
import { formatNumber, masterLabel } from "../../api";
import { CapacitySidePanel } from "../../components/CapacitySidePanel";
import { ApiFormulaTokens } from "./ApiFormulaTokens";

export function ApiFormulaPreview({ scopeLevel, scopeIds, tokens, onClose }: {
  scopeLevel: string; scopeIds: string[]; tokens: FormulaToken[]; onClose: () => void;
}) {
  const [period, setPeriod] = useState(() => {
    const { year, month } = currentPeriod();
    return `${year}-${String(month).padStart(2, "0")}`;
  });
  const [compare, setCompare] = useState<string[]>([]);
  const [plan, setPlan] = useState("PLAN_TYPE_PRODUCTION");
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  const catalog = useCapacityQuery<FormulaCatalog>("/formulas/catalog");
  const stableTokens = useDebouncedValue(tokens, 350);
  const [year, month] = period.split("-").map(Number);
  const query = useCapacityPreview<FormulaPreview>("/formulas/preview-impact", {
    scope_level: scopeLevel, scope_ids: scopeIds, tokens: stableTokens, year, month, plan, compare_line_ids: compare,
  }, !!year && !!month && (scopeLevel === "FORMULA_SCOPE_LEVEL_GLOBAL" || !!scopeIds.length));
  const waiting = JSON.stringify(tokens) !== JSON.stringify(stableTokens);
  const inScopeIds = new Set(query.data?.in_scope?.map((item) => item.line.line_id));
  return <CapacitySidePanel title="Impact Preview" description="Recalculates as you edit, compared with the formulas in effect that month." icon={<Sparkles size={16} />} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">Month<input aria-label="Preview Month" type="month" min="0001-01" max="9999-12" value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass} /></label>
        <label className="space-y-1 text-sm">Plan<select aria-label="Preview Plan" className={selectClass} value={plan} onChange={(e) => setPlan(e.target.value)}><option value="PLAN_TYPE_PRODUCTION">Production</option><option value="PLAN_TYPE_PROTOTYPE">Prototype</option></select></label>
      </div>
      <details className="rounded-lg border border-border p-3 text-sm"><summary className="cursor-pointer font-medium">Compare Other Lines{query.data ? ` (${query.data.in_scope?.length ?? 0} in scope + ${query.data.compared?.length ?? 0} compared)` : ""}</summary>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{(lines.data ?? []).filter((line) => !inScopeIds.has(line.id)).map((line) => <label key={line.id} className="flex items-center gap-2">
          <input type="checkbox" checked={compare.includes(line.id)} onChange={(e) => setCompare((old) => e.target.checked ? [...old, line.id] : old.filter((id) => id !== line.id))} />{masterLabel(line)}
        </label>)}</div>
      </details>
      <ApiState query={query} />
      <ApiState query={lines} />
      {catalog.error && <ApiState query={catalog} />}
      {waiting && <p role="status" className="text-xs text-muted-foreground">Updating preview after your edits...</p>}
      {query.data?.error && <p role="alert" className="text-sm text-destructive">{query.data.error.message}</p>}
      {!waiting && query.data?.valid !== false && ([["In Scope", query.data?.in_scope], ["Compared", query.data?.compared]] as const).map(([title, items]) => <section key={title} className="space-y-3" aria-busy={query.isFetching}>
        <h3 className="text-sm font-semibold">{title} <span className="text-muted-foreground">({items?.length ?? 0})</span></h3>
        {!!items?.length && <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"><span>Line</span><span>Available (pcs)</span><span>Capacity %</span></div>}
        {(items ?? []).map((item) => {
          const result = title === "Compared" ? item.current : item.proposed;
          return <details key={item.line.line_id} className="group border-b border-border pb-3 text-sm">
            <summary className="grid cursor-pointer grid-cols-[1fr_1fr_1fr] items-start gap-2 rounded-md p-3 hover:bg-muted/50">
              <span className="font-semibold">{item.line.line_code}<span className="mt-1 block text-[11px] font-normal text-muted-foreground">View calculation</span></span>
              <span>{formatNumber(result?.available_pcs)}</span>
              <span className="[&>span]:flex-wrap"><CapacityValue value={result?.capacity_pct} status={result?.status} problem={result?.problem} /></span>
            </summary>
            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
            {item.overridden_by && <p className="mt-2">A more specific formula applies: {item.overridden_by.name}</p>}
            {title === "In Scope" && <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Currently Available</p><p>{formatNumber(item.current?.available_pcs, " pcs")}</p><CapacityValue value={item.current?.capacity_pct} status={item.current?.status} /></div>
              <div><p className="text-xs text-muted-foreground">Proposed Available</p><p>{formatNumber(result?.available_pcs, " pcs")}</p><CapacityValue value={result?.capacity_pct} status={result?.status} /></div>
            </div>}
            {!!result?.formula?.tokens?.length && <ApiFormulaTokens catalog={catalog.data} tokens={result.formula.tokens.map((token) => ({ token }))} />}
            <p className="break-words">{result?.problem || result?.substituted || result?.formula?.reads_as || "Calculation details are unavailable."}</p>
            <p>Loading: {formatNumber(result?.loading_pcs, " pcs")}</p>
            {!!result?.values?.length && <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="p-2">Variable</th><th className="p-2">Value</th><th className="p-2">Source</th></tr></thead><tbody>{result.values.map((value) => <tr key={value.code} className="border-b last:border-0"><td className="p-2">{value.label}</td><td className="p-2">{formatNumber(value.value)} {value.unit}</td><td className="p-2 text-muted-foreground">{value.source}</td></tr>)}</tbody></table></div>}
            </div>
          </details>;
        })}
        {!query.isPending && !query.error && !items?.length && <p className="text-xs text-muted-foreground">{title === "Compared" ? "Select other lines to compare without changing their formulas." : "No lines in the selected scope."}</p>}
      </section>)}
  </CapacitySidePanel>;
}
