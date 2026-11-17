"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormulaCatalog, FormulaToken, FormulaVersion } from "../../api-types";
import { useCapacityQuery } from "../../use-capacity";
import { ApiState, StatusBadge } from "../../components/ApiState";
import { ApiFormulaTokens } from "./ApiFormulaTokens";
import { formulaLabel } from "../formula-api";
import { CapacitySidePanel } from "../../components/CapacitySidePanel";

export function ApiFormulaHistory({ version, onClose }: { version: FormulaVersion; onClose: () => void }) {
  const query = useCapacityQuery<{ items?: FormulaVersion[]; in_effect_version_id?: string }>("/formulas/history", { scope_level: version.scope_level, scope_id: version.scope_id });
  const catalog = useCapacityQuery<FormulaCatalog>("/formulas/catalog");
  const [target, setTarget] = useState("");
  const compare = useCapacityQuery<{
    base_tokens?: { token: FormulaToken; changed: boolean }[];
    target_tokens?: { token: FormulaToken; changed: boolean }[];
  }>("/formulas/compare", { base_id: query.data?.in_effect_version_id, target_id: target }, !!target && !!query.data?.in_effect_version_id);
  return <CapacitySidePanel title={`History: ${version.scope_code || formulaLabel(version)}`}
    description={`${query.data?.items?.length ?? "-"} versions. Compare a previous version with the formula in effect now.`}
    icon={<History size={16} />} onClose={onClose}>
      <ApiState query={query} />
      {catalog.error && <ApiState query={catalog} />}
      {(query.data?.items ?? []).map((item) => <section key={item.id} className="space-y-3 border-b border-border pb-6 last:border-0">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{item.name}</h3><span className="rounded-md bg-muted px-1.5 py-0.5 text-xs">v{item.version_no}</span><StatusBadge value={item.status} />
          {item.id === query.data?.in_effect_version_id && <span className="text-xs font-medium text-success">In effect now</span>}
        </div>
        <p className="text-xs text-muted-foreground">Since {item.effective_from || "-"} - Updated by {item.updated_by || "-"}{item.updated_at ? ` on ${new Date(item.updated_at).toLocaleDateString()}` : ""}</p>
        <ApiFormulaTokens catalog={catalog.data} tokens={(item.tokens ?? []).map((token) => ({ token }))} />
        {item.reads_as && <p className="text-xs text-muted-foreground">Reads as: {item.reads_as}</p>}
        {query.data?.in_effect_version_id && item.id !== query.data.in_effect_version_id && <Button variant="outline" aria-pressed={target === item.id} onClick={() => setTarget(target === item.id ? "" : item.id!)}>Compare With In Effect</Button>}
      </section>)}
      {query.data && !query.data.items?.length && <p className="text-sm text-muted-foreground">No formula versions for this scope.</p>}
      {target && <section className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold">Comparison</h3><p className="text-xs text-muted-foreground">Changed tokens are highlighted. Unchanged tokens keep their original style.</p><ApiState query={compare} />
        {compare.data && <><h4 className="text-xs font-medium">In Effect</h4><ApiFormulaTokens catalog={catalog.data} tokens={compare.data.base_tokens ?? []} removed />
          <h4 className="text-xs font-medium">Selected Version</h4><ApiFormulaTokens catalog={catalog.data} tokens={compare.data.target_tokens ?? []} /></>}
      </section>}
  </CapacitySidePanel>;
}
