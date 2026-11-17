"use client";

import AddButton from "@/components/AddButton";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  LineItem,
  PartItem,
  ProductionLineGroup,
  ProductNode,
  ProductStructureSelection,
} from "../types";

interface ProductSidebarProps {
  products: ProductNode[];
  selection: ProductStructureSelection;
  onSelect: (selection: ProductStructureSelection) => void;
  onAddProduct?: () => void;
  getLinesForGroup: (group: ProductionLineGroup) => LineItem[];
  getPartsForLine: (line: LineItem) => PartItem[];
}

export function ProductSidebar({
  products,
  selection,
  onSelect,
  onAddProduct,
  getLinesForGroup,
  getPartsForLine,
}: ProductSidebarProps) {
  return (
    <aside className="w-full min-w-0 shrink-0 rounded-2xl border border-border bg-background p-4 lg:w-80">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Products</h2>
        {onAddProduct && <AddButton label="Add Product" onClick={onAddProduct} />}
      </div>

      <div className="flex flex-col gap-0.5">
        {products.map((product) => (
          <ProductTreeItem
            key={product.id}
            product={product}
            selection={selection}
            onSelect={onSelect}
            getLinesForGroup={getLinesForGroup}
            getPartsForLine={getPartsForLine}
          />
        ))}
      </div>
    </aside>
  );
}

function ProductTreeItem({
  product,
  selection,
  onSelect,
  getLinesForGroup,
  getPartsForLine,
}: {
  product: ProductNode;
  selection: ProductStructureSelection;
  onSelect: (s: ProductStructureSelection) => void;
  getLinesForGroup: (group: ProductionLineGroup) => LineItem[];
  getPartsForLine: (line: LineItem) => PartItem[];
}) {
  const onPath = selection.productId === product.id;
  const [expanded, setExpanded] = useState(onPath);
  const isSelected = selection.level === "product" && onPath;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect({ level: "product", productId: product.id });
          setExpanded((prev) => !prev);
        }}
        className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
          isSelected
            ? "bg-primary-50 font-medium text-primary-700"
            : "text-muted-foreground hover:bg-primary-50"
        }`}
      >
        {expanded ? (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">
          {product.code}: {product.name}
        </span>
      </button>

      {expanded && (
        <div className="ml-5 flex flex-col gap-0.5 border-l border-border pl-3">
          {product.groups.map((group) => (
            <GroupTreeItem
              key={group.id}
              productId={product.id}
              group={group}
              selection={selection}
              onSelect={onSelect}
              getLinesForGroup={getLinesForGroup}
              getPartsForLine={getPartsForLine}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupTreeItem({
  productId,
  group,
  selection,
  onSelect,
  getLinesForGroup,
  getPartsForLine,
}: {
  productId: string;
  group: ProductionLineGroup;
  selection: ProductStructureSelection;
  onSelect: (s: ProductStructureSelection) => void;
  getLinesForGroup: (group: ProductionLineGroup) => LineItem[];
  getPartsForLine: (line: LineItem) => PartItem[];
}) {
  const onPath =
    "groupId" in selection &&
    selection.productId === productId &&
    selection.groupId === group.id;
  const [expanded, setExpanded] = useState(onPath);
  const isSelected = selection.level === "group" && onPath;
  const lines = getLinesForGroup(group);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect({ level: "group", productId, groupId: group.id });
          setExpanded((prev) => !prev);
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
          isSelected
            ? "bg-primary-50 font-medium text-primary-700"
            : "text-muted-foreground hover:bg-primary-50"
        }`}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{group.groupCode}</span>
      </button>

      {expanded && (
        <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
          {lines.map((line) => (
            <LineTreeItem
              key={line.id}
              productId={productId}
              groupId={group.id}
              line={line}
              selection={selection}
              onSelect={onSelect}
              getPartsForLine={getPartsForLine}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LineTreeItem({
  productId,
  groupId,
  line,
  selection,
  onSelect,
  getPartsForLine,
}: {
  productId: string;
  groupId: string;
  line: LineItem;
  selection: ProductStructureSelection;
  onSelect: (s: ProductStructureSelection) => void;
  getPartsForLine: (line: LineItem) => PartItem[];
}) {
  const onPath =
    "lineId" in selection &&
    selection.productId === productId &&
    selection.groupId === groupId &&
    selection.lineId === line.id;
  const [expanded, setExpanded] = useState(onPath);
  const isSelected = selection.level === "line" && onPath;
  const parts = getPartsForLine(line);
  const preview = parts.slice(0, 12);

  const selectLine = () =>
    onSelect({ level: "line", productId, groupId, lineId: line.id });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          selectLine();
          setExpanded((prev) => !prev);
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
          isSelected
            ? "bg-primary-50 font-medium text-primary-700"
            : "text-foreground hover:bg-primary-50"
        }`}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{line.code}</span>
      </button>

      {expanded && (
        <div className="ml-4 flex flex-col gap-0.5 border-l border-border pl-3">
          {preview.map((part) => {
            const isPartSelected =
              selection.level === "part" && selection.partId === part.id;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() =>
                  onSelect({
                    level: "part",
                    productId,
                    groupId,
                    lineId: line.id,
                    partId: part.id,
                  })
                }
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  isPartSelected
                    ? "border-l-2 border-primary-600 bg-primary-50 font-medium text-primary-700"
                    : "text-muted-foreground hover:bg-primary-50"
                }`}
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
                <span className="truncate">{part.number}</span>
              </button>
            );
          })}

          {parts.length > 0 && (
            <button
              type="button"
              onClick={selectLine}
              className="mt-0.5 flex items-center gap-1 px-2 py-1 text-left text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all ({parts.length})
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
