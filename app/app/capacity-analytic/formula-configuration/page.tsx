"use client";

import { useState } from "react";
import { Globe, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import AddButton from "@/components/AddButton";
import { usePathname, useRouter } from "next/navigation";
import type { TableColumn } from "@/types/type";
import type { FormulaCatalog, FormulaVersion, LineAssignments, LineCapacity, MasterRecord, Params } from "../api-types";
import { useCapacityAccess, useCapacityMutation, useCapacityOptions, useCapacityQuery } from "../use-capacity";
import { capacityError, capacityWrite, enumLabel } from "../api";
import { ApiState, CapacityValue, StatusBadge } from "../components/ApiState";
import { ApiTable } from "../components/ApiTable";
import { CapacityFilters, currentPeriod, MasterSelect, selectClass } from "../components/CapacityFilters";
import { formulaLabel } from "./formula-api";
import { ApiFormulaTokens } from "./components/ApiFormulaTokens";
import { ApiFormulaHistory } from "./components/ApiFormulaHistory";
import ConfirmationModal from "@/components/ConfirmationModal";
import { CapacityThresholdSettings } from "../components/CapacityThresholdSettings";
import { MonthlyInputs } from "../components/MonthlyInputs";

const getFormulaVersionColumns = (
  onHistory: (version: FormulaVersion) => void,
  onEdit: (version: FormulaVersion) => void,
  onDelete: (version: FormulaVersion) => void,
  canManage: boolean,
): TableColumn<FormulaVersion>[] => [
  {
    key: "scope", header: "Scope",
    render: (row) => (
      <div>
        <div className="font-semibold text-foreground">{formulaLabel(row)}</div>
        <div className="text-xs text-muted-foreground">{enumLabel(row.scope_level)}</div>
      </div>
    ),
  },
  {
    key: "formula", header: "Formula",
    render: (row) => (
      <span className="text-sm text-foreground">{row.reads_as || row.name}</span>
    ),
  },
  {
    key: "effective_from", header: "Effective",
  },
  { key: "updated_by", header: "Updated by" },
  {
    key: "status", header: "Status",
    render: (row) => <StatusBadge value={row.status} />,
  },
  {
    key: "actions", header: "Actions",
    render: (row) => <div className="flex gap-2">
      <Button variant="ghost" onClick={() => onHistory(row)}>History</Button>
      {canManage && row.id && <Button variant="ghost" onClick={() => onEdit(row)}>{row.status === "FORMULA_VERSION_STATUS_DRAFT" ? "Edit" : "New Version"}</Button>}
      {canManage && ["FORMULA_VERSION_STATUS_DRAFT", "FORMULA_VERSION_STATUS_SCHEDULED"].includes(row.status ?? "") && <Button variant="ghost" onClick={() => onDelete(row)}>Delete</Button>}
    </div>,
  },
];

export default function FormulaConfigurationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { canManage } = useCapacityAccess();

  const [historyScope, setHistoryScope] = useState<FormulaVersion | null>(null);
  const [deleting, setDeleting] = useState<FormulaVersion | null>(null);
  const [filters, setFilters] = useState<Params>(currentPeriod);
  const [listScope, setListScope] = useState({ level: "", id: "" });
  const scopePath = listScope.level === "FORMULA_SCOPE_LEVEL_PRODUCT" ? "/products" : listScope.level === "FORMULA_SCOPE_LEVEL_LINE_GROUP" ? "/production-line-groups" : "/production-lines";
  const scopeTargets = useCapacityOptions<MasterRecord>(scopePath, undefined, !!listScope.level && listScope.level !== "FORMULA_SCOPE_LEVEL_GLOBAL");
  const assignments = useCapacityQuery<LineAssignments>("/formulas/line-assignments", { year: filters.year, month: filters.month });
  const capacities = useCapacityOptions<LineCapacity>("/capacity/lines", filters);
  const catalog = useCapacityQuery<FormulaCatalog>("/formulas/catalog");
  const remove = useCapacityMutation((id: string) => capacityWrite(`/formulas/${encodeURIComponent(id)}`, undefined, "DELETE"));
  const formulaVersionColumns = getFormulaVersionColumns(setHistoryScope, (row) => router.push(`${pathname}/add?id=${encodeURIComponent(row.id!)}`), setDeleting, canManage);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex justify-between">
        <PageHeader
          title="Formula Configuration"
          subtitle="Define how available capacity is calculated for each scope, then
            confirm the result before it goes live."
        />

        {canManage && <AddButton
          label="New Formula"
          onClick={() => router.push(pathname + "/add")}
        />}
      </section>

      <CapacityFilters value={filters} onApply={setFilters} />
      <ApiState query={assignments} />
      <ApiState query={capacities} />
      {catalog.error && <ApiState query={catalog} />}
      {/* Global default */}
      <section className="rounded-xl border border-border bg-background p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Globe size={16} className="text-primary-600" />
          </div>

          <h2 className="font-bold text-foreground">Global default</h2>

          {assignments.data?.global_default?.is_system_default ? <span className="text-xs text-muted-foreground">System default</span> : <StatusBadge value={assignments.data?.global_default?.status} />}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ApiFormulaTokens catalog={catalog.data} tokens={(assignments.data?.global_default?.tokens ?? []).map((token) => ({ token }))} />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {formulaLabel(assignments.data?.global_default)}; {assignments.data?.global_default_line_count ?? "-"} of {assignments.data?.total_lines ?? "-"} lines.
        </p>
      </section>

      {/* Which formula each line uses */}
      <section className="rounded-xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <ClipboardList size={16} className="text-primary-600" />
            </div>

            <h2 className="font-bold text-foreground">
              Which formula each line uses in {filters.year}-{String(filters.month).padStart(2, "0")}
            </h2>
          </div>

        </div>

        <div className="mt-4.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {(assignments.data?.items ?? []).filter((item) =>
            (!filters["filter.product_id"] || item.line.product_id === filters["filter.product_id"]) &&
            (!filters["filter.line_group_id"] || item.line.group_id === filters["filter.line_group_id"]) &&
            (!filters["filter.line_id"] || item.line.line_id === filters["filter.line_id"])).map((item) => {
            const capacity = capacities.data?.find((entry) => entry.line.line_id === item.line.line_id);
            return (
            <div
              key={item.line.line_id}
              className="rounded-md border border-border p-2.5 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-foreground">{item.line.line_code}</span>
                <CapacityValue value={capacity?.capacity_pct} status={capacity?.status} problem={capacity?.problem} />
              </div>

              <p className="text-sm text-muted-foreground">
                {formulaLabel(item.formula)} {item.own ? "(own)" : ""}
              </p>

              {item.upcoming && (
                <p className="text-sm text-info">From {item.upcoming_from}: {formulaLabel(item.upcoming)}</p>
              )}
            </div>
          ); })}
        </div>
      </section>

      {/* Formula versions */}
      <section className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Formula Scope<select aria-label="Formula Scope" value={listScope.level} className={selectClass} onChange={(e) => setListScope({ level: e.target.value, id: "" })}>
          <option value="">All Scopes</option><option value="FORMULA_SCOPE_LEVEL_GLOBAL">Global</option><option value="FORMULA_SCOPE_LEVEL_PRODUCT">Product</option><option value="FORMULA_SCOPE_LEVEL_LINE_GROUP">Line Group</option><option value="FORMULA_SCOPE_LEVEL_LINE">Line</option>
        </select></label>
        {listScope.level && listScope.level !== "FORMULA_SCOPE_LEVEL_GLOBAL" && <MasterSelect label="Scope Target" value={listScope.id} onChange={(id) => setListScope({ ...listScope, id })} items={scopeTargets.data ?? []} />}
        {scopeTargets.error && <ApiState query={scopeTargets} />}
      </section>
      <ApiTable
        title="Formula versions"
        columns={formulaVersionColumns}
        path="/formulas"
        params={{ scope_level: listScope.level || undefined, scope_id: listScope.id || undefined }}
        statusOptions={[{ label: "Draft", value: "draft" }, { label: "Scheduled", value: "scheduled" }, { label: "Active", value: "active" }, { label: "Superseded", value: "superseded" }]}
        getRowId={(row) => row.id!}
      />
      <CapacityThresholdSettings />
      <MonthlyInputs params={{ year: filters.year, month: filters.month }} />

      {historyScope && (
        <ApiFormulaHistory
          version={historyScope}
          onClose={() => setHistoryScope(null)}
        />
      )}
      <ConfirmationModal open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Delete Formula Version?" description="Only draft and scheduled formula versions can be deleted." confirmLabel="Delete" isLoading={remove.isPending} onConfirm={async () => {
        if (!deleting?.id) return;
        try { await remove.mutateAsync(deleting.id); setDeleting(null); } catch { /* Keep confirmation open on failure. */ }
      }} />
      {remove.error && <p role="alert" className="text-sm text-destructive">{capacityError(remove.error)}</p>}
    </div>
  );
}
