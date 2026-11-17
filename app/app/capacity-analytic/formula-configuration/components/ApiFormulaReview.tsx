"use client";

import { useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FormulaCatalog, FormulaImpact, FormulaReview, FormulaVersion } from "../../api-types";
import { capacityError, capacityGet, capacityWrite, formatNumber } from "../../api";
import { useCapacityMutation, useCapacityQuery, useCapacityScope } from "../../use-capacity";
import { ApiState, CapacityValue } from "../../components/ApiState";
import { ApiFormulaTokens } from "./ApiFormulaTokens";
import { formulaLabel } from "../formula-api";

export function ApiFormulaReview({ versions, onClose, onActivated }: {
  versions: FormulaVersion[]; onClose: () => void; onActivated: () => void;
}) {
  const scope = useCapacityScope();
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const [activated, setActivated] = useState<string[]>([]);
  const catalog = useCapacityQuery<FormulaCatalog>("/formulas/catalog");
  const queries = useQueries({
    queries: versions.map((version) => ({
      queryKey: ["capacity-analytic", scope, "review", version.id],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const id = encodeURIComponent(version.id!);
        const [review, impact] = await Promise.all([
          capacityGet<FormulaReview>(`/formulas/${id}/review`, undefined, signal),
          capacityGet<FormulaImpact>(`/formulas/${id}/impact`, undefined, signal),
        ]);
        return { review, impact };
      },
      enabled: !!scope && !!version.id,
      retry: false,
      staleTime: 0,
    })),
  });
  const action = useCapacityMutation(async () => {
    for (const version of versions) {
      if (!version.id || activated.includes(version.id)) continue;
      await capacityWrite(`/formulas/${encodeURIComponent(version.id)}/activate`, { reason: reason.trim() });
      // Retain successful activations if a later target fails, so retry never reactivates it.
      setActivated((old) => [...old, version.id!]);
    }
  });
  const ready = versions.length > 0 && versions.every((version, i) => !!version.id && (activated.includes(version.id) || (!!queries[i]?.data && !queries[i].isFetching && !queries[i].error && !queries[i].data?.review.activation_blocker && queries[i].data?.review.valid !== false)));
  return <Dialog open onOpenChange={(open) => !open && !action.isPending && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto p-5 sm:max-w-[912px]" showCloseButton={!action.isPending} onInteractOutside={(e) => action.isPending && e.preventDefault()} onEscapeKeyDown={(e) => action.isPending && e.preventDefault()}>
      <DialogHeader className="flex-row items-center gap-4 border-b border-border pb-4 pr-6 text-left">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary"><Sparkles size={24} /></span>
        <div className="space-y-1"><DialogTitle>Review Before It Goes Live</DialogTitle><DialogDescription>{versions.length === 1 ? `${versions[0].name} - ${formulaLabel(versions[0])} - takes effect ${versions[0].effective_from || "-"}` : `${versions.length} saved formula versions. Review every target before activation.`}</DialogDescription></div>
      </DialogHeader>
      {catalog.error && <ApiState query={catalog} />}
      {queries.map((query, index) => <section key={versions[index].id ?? index} className="space-y-4">
        <h3 className="text-sm font-semibold">Formula Change{versions.length > 1 ? ` - ${formulaLabel(versions[index])}` : ""}</h3>
        {activated.includes(versions[index].id ?? "") && <p className="text-sm text-emerald-700">Activated successfully.</p>}
        <ApiState query={query} />
        {query.data && <>
          <div className="divide-y divide-border rounded-[10px] border border-border">
            <div className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[136px_1fr]"><span className="text-muted-foreground">Name</span><div className="flex flex-wrap items-center gap-2"><span>{query.data.review.replaces?.name || "Inherited formula"}</span><ArrowRight size={14} /><strong>{query.data.review.formula_version.name}</strong></div></div>
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-[136px_1fr]">
              <div className="text-sm font-semibold">{formulaLabel(versions[index])}<p className="mt-1 text-xs font-normal text-muted-foreground">Changed tokens are highlighted.</p></div>
              <div className="min-w-0 space-y-3"><div className="space-y-2"><p className="text-xs text-muted-foreground">In Effect</p><ApiFormulaTokens catalog={catalog.data} tokens={query.data.review.replaces_tokens ?? []} removed /></div>
                <div className="space-y-2"><p className="text-xs text-muted-foreground">Proposed</p><ApiFormulaTokens catalog={catalog.data} tokens={query.data.review.new_tokens ?? []} /></div></div>
            </div>
            <div className="space-y-1 px-5 py-3 text-xs text-muted-foreground"><p>Applies to: {query.data.review.applies_to?.map((line) => line.line_code).join(", ") || "-"}</p><p>Takes effect: {query.data.review.formula_version.effective_from || "-"}</p></div>
          </div>
          {!!query.data.review.overridden?.length && <p className="text-sm text-warning">Unchanged due to a more specific formula: {query.data.review.overridden.map((item) => item.line.line_code).join(", ")}</p>}
          {query.data.review.error && <p role="alert" className="text-sm text-destructive">{query.data.review.error.message}</p>}
          <h4 className="text-sm font-semibold">Impact in {query.data.impact.year}-{String(query.data.impact.month).padStart(2, "0")}</h4>
          <div className="overflow-x-auto rounded-[10px] border border-border"><table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Line</th><th className="px-4 py-3 font-medium">Available (pcs)</th><th className="px-4 py-3 font-medium">Capacity %</th></tr></thead>
            <tbody>{(query.data.impact.items ?? []).map((item) => <tr key={item.line.line_id} className="border-b last:border-0">
              <td className="px-4 py-3 font-semibold">{item.line.line_code}{item.overridden_by && <p className="mt-1 text-xs font-normal text-muted-foreground">Overridden by {item.overridden_by.name}</p>}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-muted-foreground">{formatNumber(item.current?.available_pcs)}</span><ArrowRight size={14} /><strong>{formatNumber(item.proposed?.available_pcs)}</strong></div></td>
              <td className="px-4 py-3"><div className="flex flex-wrap items-center gap-2"><CapacityValue value={item.current?.capacity_pct} status={item.current?.status} /><ArrowRight size={14} /><CapacityValue value={item.proposed?.capacity_pct} status={item.proposed?.status} problem={item.proposed?.problem} /></div></td>
            </tr>)}</tbody>
          </table></div>
          {query.data.review.activation_blocker && !activated.includes(versions[index].id ?? "") && <p role="alert" className="text-sm text-destructive">{query.data.review.activation_blocker}</p>}
        </>}
      </section>)}
      <label className="space-y-1 text-sm font-medium">Reason for Change<textarea aria-label="Reason for Change" required placeholder="Explain why this formula is changing" className="min-h-20 w-full rounded-md border p-3" value={reason} onChange={(e) => setReason(e.target.value)} disabled={action.isPending} /></label>
      {activated.length > 0 && <p className="text-sm">{activated.length} of {versions.length} versions activated.</p>}
      {action.error && <p role="alert" className="text-sm text-destructive">{capacityError(action.error)} Reload the review before trying again.</p>}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={action.isPending}>Back to Editing</Button>
        <Button disabled={!ready || !reason.trim() || action.isPending || !action.canManage} onClick={async () => {
          try { await action.mutateAsync(); onActivated(); } catch {
            await client.invalidateQueries({ queryKey: ["capacity-analytic", scope] });
            await Promise.all(queries.map((query) => query.refetch()));
          }
        }}>{action.isPending ? "Activating..." : "Confirm Activation"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
