"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  statusLabels,
  statusOptions,
  type Product,
  type ProductStatus
} from "../types";
import {
  useCreateProduct,
  useProductList,
  useUpdateProduct
} from "../use-products";
import { ProductFormDialog } from "./product-form-dialog";

const PAGE_SIZE = 4;
const API_PAGE_SIZE = 100;
const statusClass: Record<ProductStatus, string> = {
  active: "border-emerald-400 bg-emerald-50 text-emerald-600",
  inactive: "border-gray-300 bg-gray-50 text-gray-500",
  obsolete: "border-red-300 bg-red-50 text-red-600",
  prototype: "border-blue-300 bg-blue-50 text-blue-600"
};

export function ProductList() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data, isLoading } = useProductList({ page_size: API_PAGE_SIZE });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const query = search.toLowerCase().trim();
        return (
          (!query ||
            [item.partNumber, item.partName, item.category].some((value) =>
              value.toLowerCase().includes(query)
            )) &&
          (status === "all" || item.status === status)
        );
      }),
    [items, search, status]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const currentUser = user?.name ?? "system";
  const saveProduct = async (product: Product) => {
    if (editing) {
      await updateProduct.mutateAsync({
        id: product.id,
        category: product.category,
        part_name: product.partName,
        part_number: product.partNumber,
        status: product.status,
        updated_by: currentUser
      });
      return product.id;
    }
    return createProduct.mutateAsync({
      category: product.category,
      created_by: currentUser,
      part_name: product.partName,
      part_number: product.partNumber,
      status: product.status
    });
  };
  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">Products</h1>
        <p className="mt-1 text-sm text-gray-500">
          Part master data used by quality templates
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value="10" onValueChange={() => undefined}>
            <SelectTrigger className="h-9 w-25 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Rows</SelectItem>
              <SelectItem value="25">25 Rows</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="h-9 w-45 pl-8 text-xs"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-25 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {statusLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="h-9 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> New Product
        </Button>
      </div>
      <Card className="gap-0 overflow-hidden p-0">
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-190">
            <TableHeader>
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead>Part Number</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Revision</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((product) => (
                  <TableRow
                    key={product.id}
                    className="border-gray-100 hover:bg-gray-50/70"
                  >
                    <TableCell className="font-semibold text-gray-800">
                      {product.partNumber}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {product.partName}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {product.revision}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {product.category}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${statusClass[product.status]}`}
                      >
                        {product.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {product.createdBy || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            router.push(`/app/master-data/products/${product.id}`)
                          }
                          aria-label={`View ${product.partNumber}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.partNumber}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-[11px] text-gray-500">
          <span>
            Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}-
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft className="h-3 w-3" /> Previous
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={page === value ? "default" : "outline"}
                  className="h-7 w-7 p-0 text-[11px]"
                  onClick={() => setPage(value)}
                >
                  {value}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px]"
              disabled={page === totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        onSave={saveProduct}
      />
    </div>
  );
}
