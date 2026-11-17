"use client";

import { useCapacityOptions } from "@/app/app/capacity-analytic/use-capacity";
import type { MasterEntity, MasterStatus } from "./api";
import type { LineItem, PartItem, ProductNode } from "./types";

export function useProductStructure() {
  const products = useCapacityOptions<MasterEntity>("/products");
  const groups = useCapacityOptions<MasterEntity>("/production-line-groups");
  const lines = useCapacityOptions<MasterEntity>("/production-lines");
  const parts = useCapacityOptions<MasterEntity>("/parts");
  const productStatuses = useCapacityOptions<MasterStatus>("/statuses", { entity_type: "product" });
  const groupStatuses = useCapacityOptions<MasterStatus>("/statuses", { entity_type: "production_line_group" });
  const lineStatuses = useCapacityOptions<MasterStatus>("/statuses", { entity_type: "production_line" });
  const partStatuses = useCapacityOptions<MasterStatus>("/statuses", { entity_type: "part" });
  const statuses = {
    product: productStatuses.data ?? [], group: groupStatuses.data ?? [],
    line: lineStatuses.data ?? [], part: partStatuses.data ?? [],
  };
  const statusLabel = (kind: keyof typeof statuses, id: string) => statuses[kind].find((status) => status.id === id)?.label || "-";
  const tree: ProductNode[] = (products.data ?? []).map((product) => ({
    id: product.id, code: String(product.product_code ?? ""), name: String(product.product_name ?? ""),
    status: statusLabel("product", product.status_id),
    groups: (groups.data ?? []).filter((group) => group.product_id === product.id).map((group) => ({
      id: group.id, groupCode: String(group.group_code ?? ""), groupName: String(group.group_name ?? ""),
      productionLines: (lines.data ?? []).filter((line) => line.production_line_group_id === group.id).length,
      status: statusLabel("group", group.status_id),
    })),
  }));
  const getLinesForGroup = ({ id }: { id: string }): LineItem[] => (lines.data ?? []).filter((line) => line.production_line_group_id === id).map((line) => ({
    id: line.id, code: String(line.line_code ?? ""), name: String(line.line_name ?? ""),
    efficiency: Number(line.efficiency_pct ?? 0), status: statusLabel("line", line.status_id),
  }));
  const getPartsForLine = ({ id }: { id: string }): PartItem[] => (parts.data ?? []).filter((part) => part.production_line_id === id).map((part) => ({
    id: part.id, number: String(part.part_number ?? ""), name: String(part.part_name ?? ""),
    back_number: String(part.back_number ?? ""), model: String(part.model ?? ""),
    cycle_time: Number(part.cycle_time_seconds ?? 0), spm: Number(part.spm ?? 0), status: statusLabel("part", part.status_id),
  }));
  return {
    products, groups, lines, parts, tree, statuses, statusLabel, getLinesForGroup, getPartsForLine,
    queries: [products, groups, lines, parts, productStatuses, groupStatuses, lineStatuses, partStatuses],
  };
}