"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ConfirmationModal from "@/components/ConfirmationModal";
import { initialProducts, type InspectionProduct, type ProductStatus } from "../data";
import { ProductDialog } from "./product-dialog";

const PAGE_SIZE = 10;

export function ProductList() {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProductStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InspectionProduct | null>(null);
  const [deleting, setDeleting] = useState<InspectionProduct | null>(null);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = [product.partNumber, product.partName, product.category].some((value) => value.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (status === "all" || product.status === status);
  }), [products, search, status]);

  const saveProduct = (value: Omit<InspectionProduct, "id" | "revision">) => {
    if (editing) {
      setProducts((current) => current.map((product) => product.id === editing.id ? { ...product, ...value } : product));
      return;
    }
    setProducts((current) => [...current, { ...value, id: String(Date.now()), revision: "Rev A" }]);
  };

  return <div className="mx-auto max-w-7xl space-y-4 pb-10">
    <div><h1 className="text-lg font-bold text-gray-900">Products</h1><p className="text-xs text-gray-500">Part master data used by quality templates</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Select value="10" onValueChange={() => undefined}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10 Rows</SelectItem></SelectContent></Select>
        <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." className="pl-9" /></div>
        <Select value={status} onValueChange={(value) => setStatus(value as "all" | ProductStatus)}><SelectTrigger className="w-30"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="In-Active">In-Active</SelectItem><SelectItem value="Obsolete">Obsolete</SelectItem><SelectItem value="Prototype">Prototype</SelectItem></SelectContent></Select>
      </div>
      <Button className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" />New Product</Button>
    </div>
    <Card className="gap-0 overflow-hidden p-0"><CardContent className="overflow-x-auto p-0"><Table className="min-w-225"><TableHeader className="bg-gray-50"><TableRow><TableHead className="w-11"><Checkbox aria-label="Select all products" /></TableHead><TableHead>Part Number</TableHead><TableHead>Part Name</TableHead><TableHead>Revision</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Drawing(s)</TableHead><TableHead className="w-30" /></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-gray-400">No products found</TableCell></TableRow> : filtered.map((product) => <TableRow key={product.id}><TableCell><Checkbox aria-label={`Select ${product.partName}`} /></TableCell><TableCell className="font-medium text-gray-800">{product.partNumber}</TableCell><TableCell>{product.partName}</TableCell><TableCell>{product.revision}</TableCell><TableCell className="text-gray-500">{product.category}</TableCell><TableCell><StatusBadge status={product.status} /></TableCell><TableCell className="text-gray-500">{product.drawings}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push(`/app/inspection/products/${product.id}`)} aria-label={`View ${product.partName}`}><Eye className="h-3.5 w-3.5" /></Button><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditing(product); setDialogOpen(true); }} aria-label={`Edit ${product.partName}`}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleting(product)} aria-label={`Delete ${product.partName}`}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent><CardFooter className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500"><span>Showing {filtered.length ? 1 : 0}-{filtered.length} of {filtered.length}</span><div className="flex gap-1"><Button variant="outline" size="sm" disabled><ChevronLeft className="h-3.5 w-3.5" />Previous</Button><Button size="sm" className="h-8 w-8 p-0">1</Button><Button variant="outline" size="sm" disabled><span>Next</span><ChevronRight className="h-3.5 w-3.5" /></Button></div></CardFooter></Card>
    <ProductDialog product={editing} open={dialogOpen} onOpenChange={setDialogOpen} onSave={saveProduct} />
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete product?" description="Are you sure you want to delete this item? This action cannot be undone." confirmLabel="Delete" onConfirm={() => { if (deleting) setProducts((current) => current.filter((product) => product.id !== deleting.id)); setDeleting(null); }} />
  </div>;
}

export function StatusBadge({ status }: { status: ProductStatus }) { return <Badge variant="outline" className={status === "Active" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-300 bg-gray-50 text-gray-600"}>{status}</Badge>; }
