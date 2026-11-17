"use client";

import { useQueries } from "@tanstack/react-query";
import { capacityGet } from "../../api";
import type { ScopeInfo } from "../../api-types";
import { useCapacityScope } from "../../use-capacity";
import { ApiState } from "../../components/ApiState";

export function ScopeSummaries({ scopeLevel, scopeIds, effectiveFrom, targetName }: {
  scopeLevel: string; scopeIds: string[]; effectiveFrom: string; targetName: (id: string) => string;
}) {
  const scope = useCapacityScope();
  const ids = scopeLevel === "FORMULA_SCOPE_LEVEL_GLOBAL" ? [""] : scopeIds;
  const queries = useQueries({ queries: ids.map((id) => {
    const params = { scope_level: scopeLevel, scope_id: id || undefined, effective_from: effectiveFrom };
    return {
      queryKey: ["capacity-analytic", scope, "/formulas/scope-info", params],
      queryFn: ({ signal }: { signal: AbortSignal }) => capacityGet<ScopeInfo>("/formulas/scope-info", params, signal),
      enabled: !!scope && !!effectiveFrom, retry: false,
    };
  }) });
  return <div className="space-y-3">{queries.map((query, index) => <section key={ids[index]} className="space-y-2 rounded-lg border bg-neutral-50 p-4 text-sm">
    <h3 className="font-medium">{ids[index] ? targetName(ids[index]) : "Global Default"}</h3>
    <ApiState query={query} />
    {query.data && <>
      <p>{query.data.current ? `${query.data.current.name} v${query.data.current.version_no}, in effect since ${query.data.current.effective_from}.` : "This scope inherits its capacity formula."} Saving creates v{query.data.next_version_no}.</p>
      <p>Applies to {query.data.applies_to?.length ?? 0} of {query.data.total_lines} lines.</p>
      {!!query.data.overridden?.length && <p className="text-warning">{query.data.overridden.map((item) => item.line.line_code).join(", ")} have a more specific formula and will not change.</p>}
    </>}
  </section>)}</div>;
}
