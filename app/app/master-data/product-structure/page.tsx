"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ApiState } from "@/app/app/capacity-analytic/components/ApiState";
import { currentPeriod, selectClass } from "@/app/app/capacity-analytic/components/CapacityFilters";
import { MonthlyInputs } from "@/app/app/capacity-analytic/components/MonthlyInputs";
import { capacityError } from "@/app/app/capacity-analytic/api";
import { useCapacityAccess, useCapacityMutation, useCapacityOptions } from "@/app/app/capacity-analytic/use-capacity";
import type { ProductionPart } from "@/app/app/capacity-analytic/api-types";
import { ProductSidebar } from "./components/ProductStructureSidebar";
import { MasterEntityTable } from "./components/MasterEntityTable";
import { MasterEntityForm } from "./components/MasterEntityForm";
import { MasterStatuses } from "./components/MasterStatuses";
import type { ProductStructureSelection } from "./types";
import { useProductStructure } from "./useProductStructure";
import { deleteMaster, entityDefinitions, getMaster, type EntityKind, type MasterEntity, type MasterStatus } from "./api";

export default function ProductStructurePage() {
  const data = useProductStructure();
  const { canManage } = useCapacityAccess();
  const [selection, setSelection] = useState<ProductStructureSelection | null>(null);
  const [editing, setEditing] = useState<{ kind: EntityKind; parentId?: string; record?: MasterEntity } | null>(null);
  const [deleting, setDeleting] = useState<{ kind: EntityKind; record: MasterEntity } | null>(null);
  const [statusKind, setStatusKind] = useState<EntityKind | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(() => {
    const value = currentPeriod();
    return `${value.year}-${String(value.month).padStart(2, "0")}`;
  });
  const [year, month] = period.split("-").map(Number);
  const product = data.products.data?.find((item) => item.id === selection?.productId) ?? data.products.data?.[0];
  const group = selection && "groupId" in selection ? data.groups.data?.find((item) => item.id === selection.groupId && item.product_id === product?.id) : undefined;
  const line = group && selection && "lineId" in selection ? data.lines.data?.find((item) => item.id === selection.lineId && item.production_line_group_id === group.id) : undefined;
  const part = line && selection?.level === "part" ? data.parts.data?.find((item) => item.id === selection.partId && item.production_line_id === line.id) : undefined;
  const resolved: ProductStructureSelection = part && line && group && product ? { level: "part", productId: product.id, groupId: group.id, lineId: line.id, partId: part.id } :
    line && group && product ? { level: "line", productId: product.id, groupId: group.id, lineId: line.id } :
    group && product ? { level: "group", productId: product.id, groupId: group.id } : { level: "product", productId: product?.id ?? "" };
  const kind: EntityKind = part ? "assembly" : line ? "part" : group ? "line" : "group";
  const parent = part ?? line ?? group ?? product;
  const parentKind: EntityKind = part ? "part" : line ? "line" : group ? "group" : "product";
  const assemblies = useCapacityOptions<MasterEntity>("/assembly-parts", { parent_part_id: part?.id }, !!part);
  const assemblyStatuses = useCapacityOptions<MasterStatus>("/statuses", { entity_type: "assembly_part" }, !!part);
  const capacities = useCapacityOptions<ProductionPart>("/capacity/production-parts", { year, month, "filter.line_id": line?.id }, !!line && !!year && !!month);
  const remove = useCapacityMutation((target: { kind: EntityKind; record: MasterEntity }) => deleteMaster(target.kind, target.record.id));
  const rows = kind === "group" ? (data.groups.data ?? []).filter((item) => item.product_id === product?.id) :
    kind === "line" ? (data.lines.data ?? []).filter((item) => item.production_line_group_id === group?.id) :
    kind === "part" ? (data.parts.data ?? []).filter((item) => item.production_line_id === line?.id) : assemblies.data ?? [];
  const edit = async (targetKind: EntityKind, record: MasterEntity, parentId?: string) => {
    setLoading(true); setLoadError("");
    try { setEditing({ kind: targetKind, parentId, record: await getMaster(targetKind, record.id) }); }
    catch (error) { setLoadError(capacityError(error)); }
    finally { setLoading(false); }
  };
  const ready = [data.products, data.groups, data.lines, data.parts].every((query) => !!query.data && !query.error);
  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Product Structure" subtitle="Manage production products, line groups, lines, parts, and assembly components" />
      {data.queries.filter((query) => query.isPending || query.error).map((query, index) => <ApiState key={index} query={query} />)}
      {ready && <div className="flex min-w-0 flex-col gap-8 lg:flex-row">
        <ProductSidebar products={data.tree} selection={resolved} onSelect={setSelection}
          onAddProduct={canManage ? () => setEditing({ kind: "product" }) : undefined}
          getLinesForGroup={data.getLinesForGroup} getPartsForLine={data.getPartsForLine} />
        <section className="min-w-0 flex-1 space-y-6">
          {parent ? <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{String(parent[entityDefinitions[parentKind].code] ?? "")}: {String(parent[entityDefinitions[parentKind].name ?? ""] ?? "")}</h2>
              {canManage && <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={loading} onClick={() => void edit(parentKind, parent)}>Edit {entityDefinitions[parentKind].label}</Button>
                <Button variant="outline" onClick={() => setDeleting({ kind: parentKind, record: parent })}>Delete {entityDefinitions[parentKind].label}</Button>
                <Button variant="outline" onClick={() => setStatusKind(parentKind)}>Manage Statuses</Button>
              </div>}
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {entityDefinitions[parentKind].fields.filter((field) => field.key === entityDefinitions[parentKind].code || field.key === entityDefinitions[parentKind].name).map((field) => <div key={field.key} className="rounded-lg border p-4"><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 text-sm font-semibold">{String(parent[field.key] ?? "-")}</dd></div>)}
              {parentKind === "group" && <div className="rounded-lg border p-4"><dt className="text-xs text-muted-foreground">Production Lines</dt><dd className="mt-1 text-sm font-semibold">{rows.length} {rows.length === 1 ? "line" : "lines"}</dd></div>}
              <div className="rounded-lg border p-4"><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 text-sm font-semibold">{data.statusLabel(parentKind as "product" | "group" | "line" | "part", parent.status_id)}</dd></div>
            </dl>
            {entityDefinitions[parentKind].fields.some((field) => field.key !== entityDefinitions[parentKind].code && field.key !== entityDefinitions[parentKind].name) && <details className="rounded-lg border border-border p-4">
              <summary className="cursor-pointer text-sm font-medium">Capacity Parameters</summary>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{entityDefinitions[parentKind].fields.filter((field) => field.key !== entityDefinitions[parentKind].code && field.key !== entityDefinitions[parentKind].name).map((field) => <div key={field.key}><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 text-sm font-semibold">{String(parent[field.key] ?? "-")}</dd></div>)}</dl>
            </details>}
            {line && <label className="block max-w-xs text-sm">Capacity Month<input aria-label="Capacity Month" type="month" className={selectClass} value={period} onChange={(e) => setPeriod(e.target.value)} /></label>}
            {line && <ApiState query={capacities} />}
            {part && <><ApiState query={assemblies} /><ApiState query={assemblyStatuses} /></>}
            <MasterEntityTable key={`${kind}:${parent.id}`} kind={kind} rows={rows} statuses={kind === "assembly" ? assemblyStatuses.data ?? [] : data.statuses[kind]}
              parts={data.parts.data ?? []} capacities={capacities.data} canManage={canManage} busy={loading}
              onAdd={() => setEditing({ kind, parentId: parent.id })} onEdit={(row) => void edit(kind, row, parent.id)}
              onDelete={(record) => setDeleting({ kind, record })} onStatuses={() => setStatusKind(kind)}
              onOpen={kind === "assembly" ? undefined : (row) => {
                if (kind === "group" && product) setSelection({ level: "group", productId: product.id, groupId: row.id });
                else if (kind === "line" && product && group) setSelection({ level: "line", productId: product.id, groupId: group.id, lineId: row.id });
                else if (kind === "part" && product && group && line) setSelection({ level: "part", productId: product.id, groupId: group.id, lineId: line.id, partId: row.id });
              }} />
            {line && <MonthlyInputs params={{ production_line_id: line.id, year, month }} />}
          </> : <p className="text-sm text-muted-foreground">No products yet. Add a product to start its production structure.</p>}
        </section>
      </div>}
      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
      {editing && <MasterEntityForm key={`${editing.kind}:${editing.record?.id ?? editing.parentId ?? "new"}`} {...editing} onClose={() => setEditing(null)} />}
      {statusKind && <MasterStatuses kind={statusKind} onClose={() => setStatusKind(null)} />}
      <ConfirmationModal open={!!deleting} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }}
        title={`Delete ${deleting ? entityDefinitions[deleting.kind].label : "Record"}?`} description="This permanently deletes the selected master record. Related records may prevent deletion." confirmLabel="Delete" isLoading={remove.isPending}
        onConfirm={async () => { if (deleting) { try { await remove.mutateAsync(deleting); setDeleting(null); } catch { /* Keep confirmation open. */ } } }} />
      {remove.error && <p role="alert" className="text-sm text-destructive">{capacityError(remove.error)}</p>}
    </div>
  );
}
