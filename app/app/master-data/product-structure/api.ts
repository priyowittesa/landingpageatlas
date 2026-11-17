import { capacityGet, capacityWrite } from "@/app/app/capacity-analytic/api";

export type EntityKind = "product" | "group" | "line" | "part" | "assembly";
export interface MasterEntity {
  id: string;
  status_id: string;
  product_id?: string;
  production_line_group_id?: string;
  production_line_id?: string;
  parent_part_id?: string;
  component_part_id?: string;
  [field: string]: string | number | boolean | undefined;
}
export interface MasterStatus {
  id: string;
  entity_type: string;
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}
export interface MasterField {
  key: string;
  label: string;
  numeric?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  optional?: boolean;
  initial?: number;
}
export interface EntityDefinition {
  path: string;
  entityType: string;
  label: string;
  parentKey?: string;
  code: string;
  name?: string;
  fields: MasterField[];
}

// Request field names and immutable parent relationships come from the v1 protos.
export const entityDefinitions: Record<EntityKind, EntityDefinition> = {
  product: {
    path: "/products", entityType: "product", label: "Product", code: "product_code", name: "product_name",
    fields: [{ key: "product_code", label: "Product Code" }, { key: "product_name", label: "Product Name" }],
  },
  group: {
    path: "/production-line-groups", entityType: "production_line_group", label: "Line Group", parentKey: "product_id",
    code: "group_code", name: "group_name",
    fields: [{ key: "group_code", label: "Group Code" }, { key: "group_name", label: "Group Name" }],
  },
  line: {
    path: "/production-lines", entityType: "production_line", label: "Production Line", parentKey: "production_line_group_id",
    code: "line_code", name: "line_name",
    fields: [
      { key: "line_code", label: "Line Code" }, { key: "line_name", label: "Line Name" },
      { key: "efficiency_pct", label: "Efficiency (%)", numeric: true, min: 0, max: 100 },
      { key: "shifts_per_day", label: "Shifts per Day", numeric: true, min: 1, max: 4, integer: true, optional: true, initial: 1 },
      { key: "hours_per_shift", label: "Hours per Shift", numeric: true, min: 0.01, max: 24, optional: true, initial: 8 },
      { key: "parallel_stations", label: "Parallel Stations", numeric: true, min: 1, integer: true, optional: true, initial: 1 },
    ],
  },
  part: {
    path: "/parts", entityType: "part", label: "Part", parentKey: "production_line_id", code: "part_number", name: "part_name",
    fields: [
      { key: "part_number", label: "Part Number" }, { key: "part_name", label: "Part Name" },
      { key: "back_number", label: "Back Number", optional: true }, { key: "model", label: "Model", optional: true },
      { key: "cycle_time_seconds", label: "Cycle Time (seconds)", numeric: true, min: 0 },
      { key: "spm", label: "SPM", numeric: true, min: 0 },
      { key: "standard_labor_time_minutes", label: "Standard Labor Time (minutes)", numeric: true, min: 0, optional: true },
    ],
  },
  assembly: {
    path: "/assembly-parts", entityType: "assembly_part", label: "Assembly Component", parentKey: "parent_part_id",
    code: "component_part_id",
    fields: [{ key: "usage", label: "Usage", numeric: true, min: 0.000001 }],
  },
};

export function masterDraft(kind: EntityKind, record?: MasterEntity): Record<string, string> {
  const draft: Record<string, string> = { status_id: record?.status_id ?? "", component_part_id: record?.component_part_id ?? "" };
  for (const field of entityDefinitions[kind].fields) {
    const stored = record?.[field.key];
    const fallback = record ? field.numeric && !field.optional ? "0" : "" :
      field.initial?.toString() ?? (field.numeric && !field.optional ? "0" : "");
    draft[field.key] = stored?.toString() ?? fallback;
  }
  return draft;
}

export function masterPayload(kind: EntityKind, draft: Record<string, string>, parentId?: string, editing = false) {
  const definition = entityDefinitions[kind];
  const payload: Record<string, string | number> = { status_id: draft.status_id };
  if (!draft.status_id) throw new Error("Select a status.");
  for (const field of definition.fields) {
    const value = (draft[field.key] ?? "").trim();
    if (!value && field.optional && field.numeric) continue;
    if (!value && !field.optional) throw new Error(`${field.label} is required.`);
    if (!field.numeric) { payload[field.key] = value; continue; }
    const number = Number(value);
    if (!Number.isFinite(number) || (field.min != null && number < field.min) || (field.max != null && number > field.max) || (field.integer && !Number.isInteger(number))) {
      throw new Error(`${field.label} is outside its allowed range.`);
    }
    payload[field.key] = number;
  }
  if (!editing && definition.parentKey) {
    if (!parentId) throw new Error("Select the parent record first.");
    payload[definition.parentKey] = parentId;
  }
  if (kind === "assembly" && !editing) {
    if (!draft.component_part_id || draft.component_part_id === parentId) throw new Error("Select a different component part.");
    payload.component_part_id = draft.component_part_id;
  }
  return payload;
}

export async function saveMaster(kind: EntityKind, draft: Record<string, string>, parentId?: string, id?: string) {
  const path = entityDefinitions[kind].path;
  return capacityWrite<MasterEntity>(id ? `${path}/${encodeURIComponent(id)}` : path, masterPayload(kind, draft, parentId, !!id), id ? "PUT" : "POST");
}
export function getMaster(kind: EntityKind, id: string) {
  return capacityGet<MasterEntity>(`${entityDefinitions[kind].path}/${encodeURIComponent(id)}`);
}
export function deleteMaster(kind: EntityKind, id: string) {
  return capacityWrite(`${entityDefinitions[kind].path}/${encodeURIComponent(id)}`, undefined, "DELETE");
}
