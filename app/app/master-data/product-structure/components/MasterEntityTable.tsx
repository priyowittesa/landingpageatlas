"use client";

import { useState } from "react";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import type { TableColumn } from "@/types/type";
import { StatusBadge as CapacityStatusBadge } from "@/app/app/capacity-analytic/components/ApiState";
import type { ProductionPart } from "@/app/app/capacity-analytic/api-types";
import { entityDefinitions, type EntityKind, type MasterEntity, type MasterStatus } from "../api";
import StatusBadge from "./ProductStructureStatusBadge";

export function MasterEntityTable({ kind, rows, statuses, parts, capacities, canManage, onAdd, onEdit, onDelete, onOpen, onStatuses, busy }: {
  kind: EntityKind; rows: MasterEntity[]; statuses: MasterStatus[]; parts: MasterEntity[]; capacities?: ProductionPart[];
  canManage: boolean; busy: boolean; onAdd: () => void; onEdit: (row: MasterEntity) => void;
  onDelete: (row: MasterEntity) => void; onOpen?: (row: MasterEntity) => void; onStatuses: () => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const definition = entityDefinitions[kind];
  const filtered = rows.filter((row) => Object.entries(row).some(([key, value]) => !key.endsWith("_id") && String(value ?? "").toLowerCase().includes(search.toLowerCase())));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const columns: TableColumn<MasterEntity>[] = [
    ...(kind === "assembly" ? [{
      key: "component_part_id", header: "Component Part", render: (row: MasterEntity) => {
        const part = parts.find((item) => item.id === row.component_part_id);
        return part ? `${part.part_number}: ${part.part_name}` : row.component_part_id || "-";
      },
    }] : []),
    ...definition.fields.map((field) => ({ key: field.key, header: field.label, render: (row: MasterEntity) => String(row[field.key] ?? "-") })),
    { key: "status_id", header: "Master Status", render: (row) => <StatusBadge status={statuses.find((status) => status.id === row.status_id)?.label || "-"} /> },
    ...(kind === "part" ? [{
      key: "capacity_status", header: "Capacity Status", render: (row: MasterEntity) => {
        const capacity = capacities?.find((item) => item.part_id === row.id);
        return capacity ? <span className="inline-flex items-center gap-2"><CapacityStatusBadge value={capacity.line_status} />{capacity.bottleneck && <span className="text-xs text-muted-foreground">Bottleneck</span>}</span> : <span>-</span>;
      },
    }] : []),
    { key: "actions", header: "Actions", render: (row) => <div className="flex gap-2">
      {onOpen && <Button variant="ghost" onClick={() => onOpen(row)}>Open</Button>}
      {canManage && <>
        <Button variant="ghost" disabled={busy} onClick={() => onEdit(row)}>Edit</Button>
        <Button variant="ghost" disabled={busy} onClick={() => onDelete(row)}>Delete</Button>
      </>}
    </div> },
  ];
  return <section className="min-w-0 space-y-4">
    <h2 className="text-lg font-semibold">{definition.label} Records</h2>
    <Table<MasterEntity> columns={columns} data={filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)} getRowId={(row) => row.id}
      searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} toolbarLayout="vertical"
      toolbarActions={canManage && <div className="flex flex-wrap gap-2"><Button onClick={onAdd}>Add {definition.label}</Button><Button variant="outline" onClick={onStatuses}>Manage Statuses</Button></div>}
      emptyState={{ description: "No records found for this selection." }}
      pagination={{ page: currentPage, pageSize, totalEntries: filtered.length, pageSizeOptions: [10, 20, 50, 100],
        onPageChange: setPage, onPageSizeChange: (value) => { setPageSize(value); setPage(1); } }} />
  </section>;
}
