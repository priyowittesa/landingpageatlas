"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  statusLabels,
  statusOptions,
  type Product,
  type ProductStatus
} from "../types";
import {
  useProduct,
  useProductInspectionHistory,
  useUpdateProduct
} from "../use-products";

const templates = [
  ["QT-001", "Incoming Inspection", "Rev B", "ACTIVE"],
  ["QT-015", "Final Assembly Check", "Rev A", "ACTIVE"]
];

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
}

function formatStatus(status: string) {
  const value = status.replace("INSPECTION_STATUS_", "").toLowerCase();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

function statusBadgeClass(status: string) {
  const value = status.toLowerCase();
  if (value.includes("progress") || value.includes("draft"))
    return "border-amber-300 bg-amber-50 text-amber-600";
  if (value.includes("accept") || value.includes("checked"))
    return "border-emerald-300 bg-emerald-50 text-emerald-600";
  if (value.includes("reject") || value.includes("fail"))
    return "border-red-300 bg-red-50 text-red-600";
  return "border-gray-300 bg-gray-50 text-gray-600";
}

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: product, isLoading } = useProduct(productId);
  const { data: history, isLoading: isHistoryLoading } =
    useProductInspectionHistory(productId, { page_size: 20 });
  const updateProduct = useUpdateProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  function updateEditingProduct(update: Partial<Product>) {
    setEditingProduct((current) =>
      current ? { ...current, ...update } : current
    );
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;
    updateProduct.mutate(
      {
        id: productId,
        category: editingProduct.category,
        part_name: editingProduct.partName,
        part_number: editingProduct.partNumber,
        status: editingProduct.status,
        updated_by: user?.name ?? "system"
      },
      { onSuccess: () => setEditingProduct(null) }
    );
  }

  if (isLoading || !product) {
    return (
      <div className="mx-auto max-w-7xl pb-10 text-xs text-gray-400">
        Loading product...
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/app/master-data/products")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> {product.partNumber}
        </button>
        <div className="flex gap-2">
          {editingProduct ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={updateProduct.isPending}
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="product-detail-form"
                size="sm"
                className="h-8 text-xs"
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-gray-900 text-xs hover:bg-gray-800"
              onClick={() => setEditingProduct({ ...product })}
            >
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
        </div>
      </div>
      <form id="product-detail-form" onSubmit={saveProduct}>
        <Card>
          <CardHeader className="border-b border-gray-100 px-4 py-3">
            <CardTitle className="text-xs font-semibold">
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 py-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {editingProduct ? (
              <>
                <label className="space-y-1.5 text-[9px] text-gray-400">
                  PART NUMBER
                  <Input
                    required
                    className="h-9 text-xs text-gray-800"
                    value={editingProduct.partNumber}
                    onChange={(event) =>
                      updateEditingProduct({ partNumber: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-[9px] text-gray-400">
                  CATEGORY
                  <Input
                    required
                    className="h-9 text-xs text-gray-800"
                    value={editingProduct.category}
                    onChange={(event) =>
                      updateEditingProduct({ category: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-[9px] text-gray-400">
                  PART NAME
                  <Input
                    required
                    className="h-9 text-xs text-gray-800"
                    value={editingProduct.partName}
                    onChange={(event) =>
                      updateEditingProduct({ partName: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-[9px] text-gray-400">
                  STATUS
                  <Select
                    value={editingProduct.status}
                    onValueChange={(status) =>
                      updateEditingProduct({ status: status as ProductStatus })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <Detail label="REVISION" value={product.revision} />
                <Detail label="CREATED BY" value={product.createdBy || "-"} />
              </>
            ) : (
              <>
                <Detail label="PART NUMBER" value={product.partNumber} />
                <Detail label="CATEGORY" value={product.category} />
                <Detail label="PART NAME" value={product.partName} />
                <Detail
                  label="STATUS"
                  value={
                    <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {product.status}
                    </span>
                  }
                />
                <Detail label="REVISION" value={product.revision} />
                <Detail label="CREATED BY" value={product.createdBy || "-"} />
              </>
            )}
          </CardContent>
        </Card>
      </form>
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-xs font-semibold">
            Quality Inspection History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <DataTable
            headers={[
              "INSPECTION",
              "DATE",
              "TEMPLATE NAME",
              "STATUS",
              "INSPECTOR"
            ]}
            rows={(history?.items ?? []).map((item) => ({
              key: item.id,
              cells: [
                <button
                  key="name"
                  type="button"
                  onClick={() =>
                    router.push(`/app/inspection/run-inspection/view/${item.id}`)
                  }
                  className="font-medium text-primary-700 hover:underline"
                >
                  {item.inspectionName || item.id}
                </button>,
                formatDate(
                  item.submittedAt || item.startedAt || item.createdAt
                ),
                item.templateName || "-",
                <Badge
                  key="status"
                  variant="outline"
                  className={statusBadgeClass(item.status)}
                >
                  {formatStatus(item.status)}
                </Badge>,
                item.createdBy || "-"
              ]
            }))}
            empty={
              isHistoryLoading ? "Loading inspections..." : "No inspections yet"
            }
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-xs font-semibold">
            Linked Quality Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <DataTable
            headers={["TEMPLATE ID", "TEMPLATE NAME", "REVISION", "STATUS"]}
            rows={templates.map((row) => ({
              key: row[0],
              cells: row.map((value) =>
                value === "ACTIVE" ? (
                  <Badge
                    key={value}
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-emerald-600"
                  >
                    {value}
                  </Badge>
                ) : (
                  value
                )
              )
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-gray-400">{label}</p>
      <div className="mt-1 font-medium text-gray-800">{value}</div>
    </div>
  );
}
function DataTable({
  headers,
  rows,
  empty = "No data"
}: {
  headers: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <table className="w-full text-left text-[10px]">
        <thead className="bg-gray-50 text-[9px] text-gray-400">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-gray-100">
              <td
                colSpan={headers.length}
                className="px-3 py-4 text-center text-gray-400"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.key}
                className="border-t border-gray-100 text-gray-700"
              >
                {row.cells.map((cell, index) => (
                  <td key={`${row.key}-${index}`} className="px-3 py-2.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
