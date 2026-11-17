"use client";

import {
  ArrowLeft,
  ChevronDown,
  Plus,
  TriangleAlert,
  UploadCloud,
  X
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useEquipmentList } from "@/app/app/master-data/equipment/use-equipment";
import { useGenerateTemplate } from "../use-templates";
import { useProductList } from "../use-products";
import type { TemplateCategory } from "../types";

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const MAX_FILE_SIZE_MB = 20;

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function GenerateFromDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") ??
    "asset") as TemplateCategory;
  const isAsset = category === "asset";

  const { data: equipmentData, isLoading: equipmentLoading } = useEquipmentList(
    {
      page_size: 100,
      status: "Active"
    }
  );
  const equipmentOptions = useMemo(
    () =>
      (equipmentData?.items ?? []).map((item) => ({
        value: item.id,
        label: item.name || item.code
      })),
    [equipmentData]
  );

  const { data: productData, isLoading: productLoading } = useProductList({
    page_size: 100
  });
  const productOptions = useMemo(
    () =>
      (productData?.items ?? []).map((item) => ({
        value: item.id,
        label: `${item.partName} - ${item.partNumber}`
      })),
    [productData]
  );

  // Asset: single equipment id; Quality: multiple product ids
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateTemplate = useGenerateTemplate();

  const options = isAsset ? equipmentOptions : productOptions;
  const optionsLoading = isAsset ? equipmentLoading : productLoading;
  const selectLabel = isAsset ? "Machine" : "Product(s)";
  const selectPlaceholder = isAsset
    ? "Select a machine target..."
    : "Select product target(s)...";

  const hasSelection = isAsset ? Boolean(selectedId) : selectedIds.length > 0;
  const canGenerate = Boolean(hasSelection && files.length > 0);

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addFiles(newFiles: FileList | File[]) {
    const accepted = Array.from(newFiles).filter((file) => {
      const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      const typeOk = ACCEPTED_TYPES.split(",").includes(ext);
      const sizeOk = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      return typeOk && sizeOk;
    });
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  function handleGenerate() {
    if (!canGenerate || generateTemplate.isPending) return;
    generateTemplate.mutate({
      type: category,
      assetData: isAsset ? [selectedId] : selectedIds,
      files
    });
    // Navigate away immediately — the request continues in the background
    // and a global progress banner (in AppLayout) shows the status.
    router.push(`/app/inspection/templates?tab=${category}`);
  }

  const warningMessage =
    !hasSelection && files.length === 0
      ? `Please select ${isAsset ? "a machine" : "product(s)"} and upload at least one document to proceed`
      : !hasSelection
        ? `Please select ${isAsset ? "a machine" : "product(s)"} to proceed`
        : files.length === 0
          ? "Please upload at least one document to proceed"
          : "";

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <button
        onClick={() => router.push("/app/inspection/templates")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Generate from Document
      </button>

      <Card className="p-5 sm:p-7">
        <h1 className="text-xl font-bold text-gray-950">
          Generate from document
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload technical manuals, specs sheets, or previous inspection
          templates. Our AI will analyze the documents to build and configure a
          complete inspection checklist automatically.
        </p>

        <Card className="mt-5 gap-0 rounded-lg p-4 sm:p-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {selectLabel} <span className="text-red-500">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full justify-between font-normal"
                >
                  {isAsset
                    ? (options.find((o) => o.value === selectedId)?.label ??
                      selectPlaceholder)
                    : selectedIds.length > 0
                      ? `${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""} selected`
                      : selectPlaceholder}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                align="start"
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <div className="border-b p-2">
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder={`Search ${isAsset ? "machines" : "products"}...`}
                    className="h-8"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {optionsLoading ? (
                    <p className="p-2 text-sm text-gray-400">Loading...</p>
                  ) : filteredOptions.length === 0 ? (
                    <p className="p-2 text-sm text-gray-400">
                      No {isAsset ? "machines" : "products"} found
                    </p>
                  ) : isAsset ? (
                    filteredOptions.map((opt) => {
                      const checked = selectedId === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              setSelectedId(checked ? "" : opt.value)
                            }
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })
                  ) : (
                    filteredOptions.map((opt) => {
                      const checked = selectedIds.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleSelected(opt.value)}
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {isAsset && selectedId ? (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {options.find((o) => o.value === selectedId)?.label ??
                    selectedId}
                  <button
                    type="button"
                    onClick={() => setSelectedId("")}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            ) : !isAsset && selectedIds.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedIds.map((id) => {
                  const opt = options.find((o) => o.value === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {opt?.label ?? id}
                      <button
                        type="button"
                        onClick={() => toggleSelected(id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
            <p className="mt-1 text-xs text-gray-500">
              The checklist will be linked and customized for the selected{" "}
              {isAsset ? "machine" : "product"} profile{isAsset ? "" : "(s)"}.
            </p>
          </div>

          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Source document(s) <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  fileInputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                if (event.dataTransfer.files)
                  addFiles(event.dataTransfer.files);
              }}
              className={`mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragOver
                  ? "border-primary-400 bg-primary-50"
                  : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
              }`}
            >
              <UploadCloud className="h-8 w-8 text-primary-600" />
              <p className="mt-3 text-sm">
                <span className="font-semibold text-primary-600">
                  Click to upload
                </span>{" "}
                <span className="text-gray-500">or drag and drop</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PDF, DOCX, PNG, or JPG (up to {MAX_FILE_SIZE_MB}MB)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-1"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Plus className="h-3 w-3" />
                Select file(s)
              </Button>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate font-medium text-gray-700">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600"
                      onClick={() => removeFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {!canGenerate && warningMessage && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <TriangleAlert className="h-3.5 w-3.5" />
                {warningMessage}
              </p>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/app/inspection/templates")}
              >
                Cancel
              </Button>
              <Button disabled={!canGenerate} onClick={handleGenerate}>
                Generate template
              </Button>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
}

export default function GenerateFromDocumentPage() {
  return (
    <Suspense>
      <GenerateFromDocumentContent />
    </Suspense>
  );
}
