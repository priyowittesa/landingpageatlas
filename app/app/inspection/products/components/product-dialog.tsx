"use client";

import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  productCategories,
  productStatuses,
  type InspectionProduct,
  type ProductCategory,
  type ProductStatus
} from "../data";

type ProductDialogProps = {
  product?: InspectionProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Omit<InspectionProduct, "id" | "revision">) => void;
};

const emptyProduct = {
  partNumber: "",
  partName: "",
  category: "" as ProductCategory | "",
  status: "" as ProductStatus | "",
  drawings: ""
};

export function ProductDialog({ product, open, onOpenChange, onSave }: ProductDialogProps) {
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    setForm(product
      ? { partNumber: product.partNumber, partName: product.partName, category: product.category, status: product.status, drawings: product.drawings }
      : emptyProduct);
  }, [product, open]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.partNumber || !form.partName || !form.category || !form.status) return;
    onSave({ ...form, category: form.category as ProductCategory, status: form.status as ProductStatus });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b border-gray-100 px-6 py-4">
          <DialogTitle>{product ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <Field label="Part Number" required>
            <Input value={form.partNumber} placeholder="Type here" onChange={(e) => setForm({ ...form, partNumber: e.target.value })} />
          </Field>
          <Field label="Part Name" required>
            <Input value={form.partName} placeholder="Type here" onChange={(e) => setForm({ ...form, partName: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required hint="Revision is automatic depending on category">
              <Select value={form.category} onValueChange={(category: ProductCategory) => setForm({ ...form, category })}>
                <SelectTrigger><SelectValue placeholder="Type here" /></SelectTrigger>
                <SelectContent>{productCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status" required>
              <Select value={form.status} onValueChange={(status: ProductStatus) => setForm({ ...form, status })}>
                <SelectTrigger><SelectValue placeholder="Type here" /></SelectTrigger>
                <SelectContent>{productStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Drawing Files" required>
            <div className="flex h-10 items-center overflow-hidden rounded-md border border-input bg-background">
              <Button type="button" size="sm" className="m-1 h-8 gap-1.5 bg-gray-900 hover:bg-gray-800"><Upload className="h-3.5 w-3.5" />Browse</Button>
              <span className="truncate px-2 text-xs text-gray-500">{form.drawings || "No file selected."}</span>
            </div>
          </Field>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-xs font-medium text-gray-700">
    <span>{label}{required && <span className="text-red-500"> *</span>}</span>
    {children}
    {hint && <span className="block text-[10px] font-normal text-gray-400">{hint}</span>}
  </label>;
}
