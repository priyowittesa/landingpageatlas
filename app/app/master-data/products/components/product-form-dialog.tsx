"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Product, ProductStatus } from "../types";
import {
  OTHER_CATEGORY,
  categoryOptions,
  statusLabels,
  statusOptions
} from "../types";
import {
  getProductDrawingUploadUrl,
  registerProductDrawing,
  uploadDrawingToS3,
  useDeleteProductDrawing,
  useProductDrawings,
  type DrawingUploadStatus
} from "../use-products";

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Product) => Promise<string> | string;
};

type AttachedFile = {
  file: File;
  status: DrawingUploadStatus;
  error?: string;
};

const emptyProduct: Product = {
  id: "",
  partNumber: "",
  partName: "",
  revision: 1,
  category: "",
  status: "active"
};

const uploadingLabel: Partial<Record<DrawingUploadStatus, string>> = {
  "getting-upload-url": "Preparing...",
  "uploading-s3": "Uploading...",
  registering: "Saving..."
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSave
}: ProductFormDialogProps) {
  const { user } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Product>(product ?? emptyProduct);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: drawings = [], isLoading: isDrawingsLoading } =
    useProductDrawings(open && product?.id ? product.id : undefined);
  const deleteDrawing = useDeleteProductDrawing(product?.id);

  useEffect(() => {
    setForm(product ?? emptyProduct);
    setAttachedFiles([]);
    const initialCategory = product?.category ?? "";
    setIsOtherCategory(
      Boolean(initialCategory) && !categoryOptions.includes(initialCategory)
    );
  }, [product, open]);

  const setField = <K extends keyof Product>(field: K, value: Product[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const setFileStatus = (index: number, update: Partial<AttachedFile>) =>
    setAttachedFiles((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...update } : entry))
    );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected) return;
    setAttachedFiles((current) => [
      ...current,
      ...Array.from(selected).map((file) => ({
        file,
        status: "idle" as DrawingUploadStatus
      }))
    ]);
    event.target.value = "";
  };

  const removeFile = (index: number) =>
    setAttachedFiles((current) => current.filter((_, i) => i !== index));

  async function uploadDrawings(productId: string) {
    const uploadedBy = user?.name ?? "system";
    let failed = 0;
    for (let i = 0; i < attachedFiles.length; i++) {
      const entry = attachedFiles[i];
      if (entry.status === "success") continue;
      try {
        setFileStatus(i, { status: "getting-upload-url", error: undefined });
        const { upload_url, storage_key } = await getProductDrawingUploadUrl(
          productId,
          { file_name: entry.file.name }
        );

        setFileStatus(i, { status: "uploading-s3" });
        await uploadDrawingToS3(upload_url, entry.file);

        setFileStatus(i, { status: "registering" });
        await registerProductDrawing(productId, {
          storage_key,
          uploaded_by: uploadedBy
        });

        setFileStatus(i, { status: "success" });
      } catch {
        failed += 1;
        setFileStatus(i, { status: "error", error: "Upload failed" });
      }
    }
    return failed;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !form.category.trim()) return;
    setSubmitting(true);
    try {
      const productId = await onSave({
        ...form,
        id: form.id || `product-${Date.now()}`
      });
      if (productId && attachedFiles.length > 0) {
        const failed = await uploadDrawings(productId);
        if (failed > 0) return;
      }
      onOpenChange(false);
    } catch {
      // mutation error toasts are handled by react-query meta
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = attachedFiles.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-135 gap-0 rounded-xl p-0">
        <DialogHeader className="border-b border-gray-100 px-5 py-4">
          <DialogTitle className="text-sm font-semibold">
            {product ? "Edit Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <label className="block space-y-1.5 text-xs font-medium text-gray-700">
            Part Number <span className="text-red-500">*</span>
            <Input
              required
              value={form.partNumber}
              onChange={(e) => setField("partNumber", e.target.value)}
              placeholder="Type here"
            />
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-gray-700">
            Part Name <span className="text-red-500">*</span>
            <Input
              required
              value={form.partName}
              onChange={(e) => setField("partName", e.target.value)}
              placeholder="Type here"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
              <Select
                value={isOtherCategory ? OTHER_CATEGORY : form.category}
                onValueChange={(value) => {
                  const isOther = value === OTHER_CATEGORY;
                  setIsOtherCategory(isOther);
                  setField("category", isOther ? "" : value);
                }}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Type here" />
                </SelectTrigger>
                <SelectContent>
                  {[...categoryOptions, OTHER_CATEGORY].map((option) => (
                    <SelectItem key={option} value={option} className="text-xs">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOtherCategory ? (
                <Input
                  required
                  autoFocus
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  placeholder="Type category here"
                />
              ) : null}
              <p className="text-[11px] font-normal text-gray-400">
                Revision is automatic depend on category
              </p>
            </label>
            <label className="space-y-1.5 text-xs font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setField("status", value as ProductStatus)
                }
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Type here" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-xs">
                      {statusLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <div className="space-y-1.5 text-xs font-medium text-gray-700">
            Drawing Files
            <div className="flex items-center overflow-hidden rounded-md border border-gray-200">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 shrink-0 bg-gray-900 px-4 text-xs font-medium text-white hover:bg-gray-800"
              >
                Browse
              </button>
              <span className="truncate px-3 text-xs font-normal text-gray-400">
                {pendingCount === 0
                  ? "No file selected."
                  : pendingCount === 1
                    ? attachedFiles[0].file.name
                    : `${pendingCount} files selected.`}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            {isDrawingsLoading ? (
              <p className="text-[11px] font-normal text-gray-400">
                Loading drawing files...
              </p>
            ) : null}
            {attachedFiles.length > 0 ? (
              <ul className="space-y-1">
                {attachedFiles.map((entry, index) => (
                  <li
                    key={`${entry.file.name}-${index}`}
                    className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-[11px] font-normal"
                  >
                    <span className="flex-1 truncate text-gray-700">
                      {entry.file.name}
                    </span>
                    {uploadingLabel[entry.status] ? (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {uploadingLabel[entry.status]}
                      </span>
                    ) : null}
                    {entry.status === "success" ? (
                      <span className="text-emerald-600">Uploaded</span>
                    ) : null}
                    {entry.status === "error" ? (
                      <span className="text-red-500">
                        {entry.error ?? "Upload failed"}
                      </span>
                    ) : null}
                    {entry.status === "idle" || entry.status === "error" ? (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove ${entry.file.name}`}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {drawings.length > 0 ? (
              <ul className="space-y-1">
                {drawings.map((drawing) => (
                  <li
                    key={drawing.id}
                    className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-[11px] font-normal"
                  >
                    {drawing.url ? (
                      <a
                        href={drawing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 truncate text-primary-700 hover:underline"
                      >
                        {drawing.fileName || drawing.storageKey}
                      </a>
                    ) : (
                      <span className="flex-1 truncate text-gray-700">
                        {drawing.fileName || drawing.storageKey}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={deleteDrawing.isPending}
                      onClick={() => deleteDrawing.mutate(drawing.id)}
                      aria-label={`Delete ${drawing.fileName}`}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
