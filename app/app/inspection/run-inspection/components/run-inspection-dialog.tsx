"use client";

import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Check,
  ImageIcon,
  Lock,
  Paperclip,
  Plus,
  Search,
  X
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { OfficeFilePreview } from "@/components/ai-assistant/OfficeFilePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateReferences } from "../../templates/use-templates";
import type { InspectionUsageTracking } from "../use-available-inspections";
import { canCompleteInspectionItem } from "./inspection-validation";

const OfficeFilePreviewPane = dynamic(
  () =>
    import("@/components/ai-assistant/OfficeFilePreviewDialog").then(
      (module) => module.OfficeFilePreviewPane
    ),
  { ssr: false }
);

const PREVIEWABLE_REFERENCE_EXTENSIONS = new Set([
  // Images (@file-viewer/renderer-image)
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "ico",
  "jpeg",
  "jpg",
  "jxl",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
  // Office documents (pdf, word, spreadsheet and presentation renderers)
  "dbf",
  "doc",
  "docm",
  "dot",
  "dotm",
  "dotx",
  "docx",
  "fods",
  "odp",
  "ods",
  "odt",
  "pdf",
  "pot",
  "potm",
  "potx",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "rtf",
  "xla",
  "xlam",
  "xls",
  "xlsb",
  "xlsm",
  "xlt",
  "xltm",
  "xltx",
  "xlsx",
  // Spreadsheets / delimited text (@file-viewer/renderer-spreadsheet)
  "csv",
  "tsv",
  // Text, markdown, and code (@file-viewer/renderer-text)
  "bash",
  "bdl",
  "bundle",
  "c",
  "cc",
  "cjs",
  "cpp",
  "cs",
  "css",
  "diff",
  "go",
  "gv",
  "h",
  "hcl",
  "hpp",
  "htm",
  "html",
  "http",
  "ini",
  "ipynb",
  "java",
  "js",
  "json",
  "json5",
  "jsonc",
  "jsx",
  "kt",
  "log",
  "markdown",
  "md",
  "mjs",
  "patch",
  "php",
  "proto",
  "py",
  "rb",
  "react",
  "rs",
  "sh",
  "sql",
  "swift",
  "tex",
  "toml",
  "ts",
  "tsx",
  "txt",
  "vue",
  "xml",
  "yaml",
  "yml"
]);

function getReferenceFileExtension(fileName: string, fileUrl: string) {
  const extension = (value: string) =>
    value
      .split(/[?#]/)[0]
      .match(/\.([^.\/]+)$/)?.[1]
      ?.toLowerCase() ?? "";
  return extension(fileName) || extension(fileUrl);
}

export interface InspectionSectionInfo {
  id?: string;
  name: string;
}

export interface RunInspectionItem {
  id: string;
  label: string;
  type: "pass_fail" | "number";
  minValue?: number;
  maxValue?: number;
  controlPoint?: "SURVEILLANCE" | "WITNESS" | "HOLD_POINT";
  holdPoint?: boolean;
  sectionId?: string;
  sectionName?: string;
}

export type ItemResult = {
  value: string;
  passed?: boolean;
  file_names: string[];
  files: File[];
  notes: string;
};

export interface ProductOption {
  id: string;
  label: string;
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUsageNumber(value: number, unitName: string) {
  const amount = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unitName ? `${amount} ${titleCase(unitName)}` : amount;
}

function formatUsageDate(value: string) {
  const date = parseISO(value);
  return isValid(date) ? format(date, "d MMMM yyyy") : "-";
}

function UsageTrackingStep({
  currentUsage,
  onCurrentUsageChange,
  usage
}: {
  currentUsage: string;
  onCurrentUsageChange: (value: string) => void;
  usage: InspectionUsageTracking;
}) {
  const threshold = Math.max(0, usage.threshold);
  let usageAmount = 0;
  if (usage.isDateBased) {
    const previousDate = parseISO(usage.previousUsageRecordedAt);
    const currentDate = currentUsage ? parseISO(currentUsage) : new Date();
    if (isValid(previousDate) && isValid(currentDate)) {
      usageAmount = Math.max(
        0,
        differenceInCalendarDays(currentDate, previousDate)
      );
    }
  } else {
    const value = Number(currentUsage || 0);
    usageAmount = Number.isFinite(value) ? Math.max(0, value) : 0;
  }
  const progress =
    threshold > 0 ? Math.min((usageAmount / threshold) * 100, 100) : 0;
  const remaining = Math.max(threshold - usageAmount, 0);
  const previousUsage = usage.isDateBased
    ? formatUsageDate(usage.previousUsageRecordedAt)
    : formatUsageNumber(Number(usage.previousUsage || 0), usage.unitName);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Usage</h2>
      </div>
      <div className="space-y-5 px-5 py-4">
        {!usage.canUpdate && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">
              This asset is currently{" "}
              {titleCase(usage.equipmentStatus || "unavailable")}. You can
              continue the inspection, but usage cannot be updated until the
              asset is active.
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium tracking-wide text-slate-500">
              Current Usage
            </label>
            <div className="mt-1.5">
              {usage.isDateBased ? (
                <DatePicker
                  value={currentUsage}
                  onChange={onCurrentUsageChange}
                  placeholder="Pick a date"
                  disabled={!usage.canUpdate}
                />
              ) : (
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={currentUsage}
                    onChange={(event) =>
                      onCurrentUsageChange(event.target.value)
                    }
                    placeholder="Enter current usage"
                    disabled={!usage.canUpdate}
                    className={
                      usage.unitName || !usage.canUpdate ? "pr-24" : undefined
                    }
                  />
                  {(usage.unitName || !usage.canUpdate) && (
                    <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs text-slate-400">
                      {usage.unitName && titleCase(usage.unitName)}
                      {!usage.canUpdate && <Lock className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500">
              Service Interval
            </p>
            <p className="mt-1.5 text-base font-medium text-slate-800">
              {threshold > 0
                ? formatUsageNumber(threshold, usage.unitName)
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500">
              Usage Since Last Service
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {previousUsage}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500">
              Remaining
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {threshold > 0
                ? formatUsageNumber(remaining, usage.unitName)
                : "-"}
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span className="text-sm text-slate-800">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SelectProductDialog({
  open,
  onOpenChange,
  title,
  products,
  onSelect
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  products: ProductOption[];
  onSelect: (productId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => p.label.toLowerCase().includes(query));
  }, [search, products]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setSearch("");
          setSelected("");
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-1">
            Select the product or part you&apos;re inspecting.
          </DialogDescription>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="pl-9"
          />
        </div>

        <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {filtered.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-gray-400">
              No products found
            </p>
          ) : (
            filtered.map((product) => {
              const isSelected = selected === product.id;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelected(product.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary-600" : "bg-primary-50"
                    }`}
                  >
                    <ImageIcon
                      className={`h-4 w-4 ${isSelected ? "text-white" : "text-primary-600"}`}
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {product.label}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) onSelect(selected);
            }}
          >
            Start
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RunInspectionDialog({
  open,
  onOpenChange,
  title,
  items,
  sections,
  templateId,
  initialResults,
  initialCurrentUsage = "",
  usageTracking,
  isLoading = false,
  isSubmitting = false,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: RunInspectionItem[];
  sections?: InspectionSectionInfo[];
  templateId?: string;
  initialResults?: Record<string, ItemResult>;
  initialCurrentUsage?: string;
  usageTracking?: InspectionUsageTracking;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (
    isDraft: boolean,
    results: Record<string, ItemResult>,
    currentUsage?: string
  ) => void;
}) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<Record<string, ItemResult>>(
    initialResults ?? {}
  );
  const [currentUsage, setCurrentUsage] = useState(initialCurrentUsage);
  const [previewFile, setPreviewFile] = useState<OfficeFilePreview | null>(
    null
  );
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: references = [] } = useTemplateReferences(
    open ? templateId : undefined
  );

  function handlePreviewReference(reference: (typeof references)[number]) {
    const fileName = reference.storageKey.split("/").pop() || "reference";
    const fileType = getReferenceFileExtension(fileName, reference.url);
    if (!reference.url || !PREVIEWABLE_REFERENCE_EXTENSIONS.has(fileType))
      return;
    setPreviewFile({
      fileId: reference.id || reference.storageKey || reference.url,
      displayName: fileName,
      fileName,
      fileUrl: reference.url,
      fileType
    });
  }

  const hasUnsavedData = (() => {
    if (usageTracking && currentUsage !== initialCurrentUsage) return true;
    const values = Object.values(results);
    return values.some(
      (r) =>
        r.passed !== undefined ||
        r.value.trim().length > 0 ||
        r.notes.trim().length > 0 ||
        r.file_names.length > 0
    );
  })();

  const total = items.length;
  const hasUsageStep = Boolean(usageTracking);
  const totalSteps = total + (hasUsageStep ? 1 : 0);
  const isUsageStep = hasUsageStep && step === 0;
  const itemStep = hasUsageStep ? step - 1 : step;
  const current = items[itemStep];
  const currentResult = results[current?.id] ?? {
    value: "",
    notes: "",
    file_names: [],
    files: []
  };

  const inspectionSections = useMemo(() => {
    if (sections && sections.length > 0) {
      return sections;
    }
    const list: InspectionSectionInfo[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const key = item.sectionId || item.sectionName || "";
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({
          id: item.sectionId,
          name: item.sectionName || "Section"
        });
      }
    }
    return list;
  }, [sections, items]);

  const currentSectionIndex = useMemo(() => {
    if (!current || inspectionSections.length === 0) return 0;
    const sectionIdIndex = current.sectionId
      ? inspectionSections.findIndex((sec) => sec.id === current.sectionId)
      : -1;
    if (sectionIdIndex >= 0) return sectionIdIndex;

    const sectionNameIndex = current.sectionName
      ? inspectionSections.findIndex((sec) => sec.name === current.sectionName)
      : -1;
    return sectionNameIndex >= 0 ? sectionNameIndex : 0;
  }, [current, inspectionSections]);

  const totalSections = Math.max(inspectionSections.length, 1);
  const currentSectionNumber = currentSectionIndex + 1;
  const currentSectionName =
    current?.sectionName?.trim() ||
    inspectionSections[currentSectionIndex]?.name?.trim() ||
    `Section ${currentSectionNumber}`;

  const passCount = Object.values(results).filter(
    (r) => r.passed === true
  ).length;
  const failCount = Object.values(results).filter(
    (r) => r.passed === false
  ).length;
  const answeredCount = Object.values(results).filter(
    (r) => r.passed !== undefined
  ).length;
  const progress = total === 0 ? 0 : Math.round((answeredCount / total) * 100);

  function updateResult(patch: Partial<ItemResult>) {
    if (!current) return;
    setResults((prev) => ({
      ...prev,
      [current.id]: { ...currentResult, ...patch }
    }));
  }

  function handleNumberChange(value: string) {
    if (value === "") {
      updateResult({ value, passed: undefined });
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num)) return;
    let passed: boolean | undefined;
    if (current.minValue != null && current.maxValue != null) {
      passed = num >= current.minValue && num <= current.maxValue;
    }
    updateResult({ value, passed });
  }

  function resetState() {
    setStep(0);
    setResults({});
    setCurrentUsage(initialCurrentUsage);
    setPreviewFile(null);
  }

  function handleClose(openValue: boolean) {
    if (!openValue) {
      resetState();
    }
    onOpenChange(openValue);
  }

  function requestClose() {
    if (hasUnsavedData) {
      setShowCloseConfirm(true);
    } else {
      handleClose(false);
    }
  }

  function submit(isDraft: boolean) {
    onSubmit(isDraft, results, usageTracking ? currentUsage : undefined);
  }

  function handleSaveDraftAndClose() {
    setShowCloseConfirm(false);
    submit(true);
  }

  function handleDiscardAndClose() {
    setShowCloseConfirm(false);
    handleClose(false);
  }

  const canGoNext = canCompleteInspectionItem(
    currentResult,
    references.length > 0,
    current?.holdPoint
  );
  const parsedCurrentUsage = Number(currentUsage);
  const hasValidCurrentUsage =
    usageTracking && !usageTracking.canUpdate
      ? true
      : usageTracking?.isDateBased
        ? isValid(parseISO(currentUsage))
        : currentUsage.trim().length > 0 &&
          Number.isFinite(parsedCurrentUsage) &&
          parsedCurrentUsage >= 0;
  const canContinue = isUsageStep ? hasValidCurrentUsage : canGoNext;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          requestClose();
        } else {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent
        className={
          previewFile
            ? "h-[90vh] max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]"
            : "sm:max-w-xl"
        }
        onInteractOutside={(event) => {
          event.preventDefault();
          requestClose();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          requestClose();
        }}
      >
        <div
          className={
            previewFile
              ? "grid h-full min-h-0 grid-cols-1 md:grid-cols-2"
              : "contents"
          }
        >
          <div
            className={
              previewFile
                ? "flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-slate-200 p-6"
                : "contents"
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>{title}</DialogTitle>
                {usageTracking && !usageTracking.canUpdate && !isLoading && (
                  <Badge variant="secondary" className="bg-red-50 text-red-600">
                    {titleCase(usageTracking.equipmentStatus || "Unavailable")}
                  </Badge>
                )}
              </div>
              <DialogDescription className="sr-only">
                Inspection step {step + 1} of {totalSteps}
              </DialogDescription>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                <Spinner className="h-6 w-6 text-primary-600" />
                <p className="text-sm">Loading inspection items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-16 text-gray-500">
                <p className="text-sm font-medium text-gray-700">
                  No inspection items
                </p>
                <p className="text-xs">
                  This template does not have any items to inspect.
                </p>
              </div>
            ) : (
              <>
                {isUsageStep && usageTracking ? (
                  <UsageTrackingStep
                    currentUsage={currentUsage}
                    onCurrentUsageChange={setCurrentUsage}
                    usage={usageTracking}
                  />
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-3">
                          <span className="text-emerald-600">
                            <Check className="mr-0.5 inline h-3 w-3" />
                            {passCount} pass
                          </span>
                          <span className="text-red-600">
                            <X className="mr-0.5 inline h-3 w-3" />
                            {failCount} fail
                          </span>
                          <span>{progress}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-primary-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex gap-1">
                        {items.map((item, index) => {
                          const result = results[item.id];
                          let segmentClass = "bg-gray-200";
                          if (result?.passed === true)
                            segmentClass = "bg-emerald-500";
                          else if (result?.passed === false)
                            segmentClass = "bg-red-500";
                          else if (index === itemStep)
                            segmentClass = "bg-primary-500";
                          return (
                            <div
                              key={item.id}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${segmentClass}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {current && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-5 py-3.5">
                          <h3 className="text-sm font-bold text-slate-900">
                            {currentSectionName}
                          </h3>
                          <span className="text-sm font-medium text-slate-500">
                            Section {currentSectionNumber} of {totalSections}
                          </span>
                        </div>

                        <div className="p-5 sm:p-6">
                          <p
                            aria-live="polite"
                            className="mb-2 text-xs font-medium tabular-nums text-slate-500"
                          >
                            {itemStep + 1}/{total} checklist items
                          </p>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-base font-semibold text-slate-900">
                              {current.label}
                            </h4>

                            {current.controlPoint && (
                              <Badge
                                variant="secondary"
                                className={
                                  current.controlPoint === "WITNESS"
                                    ? "bg-primary-50 text-primary-700"
                                    : current.controlPoint === "HOLD_POINT"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-blue-50 text-blue-700"
                                }
                              >
                                {current.controlPoint}
                              </Badge>
                            )}
                          </div>

                          {current.holdPoint && (
                            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              <span>
                                This item is a <strong>Hold Point</strong>. If
                                this item fails, you cannot proceed to the next
                                step - it can only be saved as a draft until the
                                hold point is released.
                              </span>
                            </div>
                          )}

                          {current.type === "number" ? (
                            <div className="mt-4 flex items-center gap-3">
                              <Input
                                value={currentResult.value}
                                onChange={(event) =>
                                  handleNumberChange(event.target.value)
                                }
                                placeholder="Input Value"
                                inputMode="decimal"
                                className="flex-1 max-w-sm"
                              />
                              <span className="shrink-0 text-xs text-slate-400">
                                Pass range: {current.minValue} -{" "}
                                {current.maxValue}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => updateResult({ passed: true })}
                                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                                  currentResult.passed === true
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                <Check className="h-4 w-4" /> PASS
                              </button>
                              <button
                                type="button"
                                onClick={() => updateResult({ passed: false })}
                                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                                  currentResult.passed === false
                                    ? "border-red-500 bg-red-50 text-red-700"
                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                }`}
                              >
                                <X className="h-4 w-4" /> FAIL
                              </button>
                            </div>
                          )}

                          <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-700">
                              Attachment
                            </label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                const files = Array.from(
                                  event.target.files ?? []
                                ).filter((file) =>
                                  file.type.startsWith("image/")
                                );
                                if (files.length > 0) {
                                  updateResult({
                                    file_names: [
                                      ...currentResult.file_names,
                                      ...files.map((f) => f.name)
                                    ],
                                    files: [...currentResult.files, ...files]
                                  });
                                }
                                event.target.value = "";
                              }}
                            />
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {currentResult.file_names.length > 0 &&
                                currentResult.file_names.map((name, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700"
                                  >
                                    <span className="max-w-32 truncate">
                                      {name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateResult({
                                          file_names:
                                            currentResult.file_names.filter(
                                              (_, i) => i !== idx
                                            ),
                                          files: currentResult.files.filter(
                                            (_, i) => i !== idx
                                          )
                                        })
                                      }
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500"
                                aria-label="Add attachment"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-700">
                              Notes
                            </label>
                            <Textarea
                              value={currentResult.notes}
                              onChange={(event) =>
                                updateResult({ notes: event.target.value })
                              }
                              placeholder={
                                currentResult.passed === false
                                  ? "Result notes (required)"
                                  : "Result notes (optional)"
                              }
                              className="mt-1.5 min-h-20"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {references.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reference files
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {references.map((ref) => {
                        const fileName =
                          ref.storageKey.split("/").pop() || "reference";
                        const fileType = getReferenceFileExtension(
                          fileName,
                          ref.url
                        );
                        const canPreview =
                          Boolean(ref.url) &&
                          PREVIEWABLE_REFERENCE_EXTENSIONS.has(fileType);
                        const referenceId = ref.id || ref.storageKey || ref.url;
                        const isSelected = previewFile?.fileId === referenceId;
                        return (
                          <button
                            key={referenceId}
                            type="button"
                            disabled={!canPreview}
                            onClick={() => handlePreviewReference(ref)}
                            title={
                              canPreview
                                ? `Preview ${fileName}`
                                : "Preview is unavailable for this file type"
                            }
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              isSelected
                                ? "border-primary-300 bg-primary-50 text-primary-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="max-w-40 truncate font-medium">
                              {fileName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div>
                    {step === 0 ? (
                      <Button variant="outline" onClick={() => requestClose()}>
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setStep((s) => s - 1)}
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => submit(true)}
                    >
                      Save as draft
                    </Button>
                    {step < totalSteps - 1 ? (
                      <Button
                        disabled={!canContinue || isSubmitting}
                        title={
                          current?.holdPoint && currentResult.passed === false
                            ? "Cannot proceed: this hold point item failed"
                            : undefined
                        }
                        onClick={() => setStep((s) => s + 1)}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        disabled={!canContinue || isSubmitting}
                        title={
                          current?.holdPoint
                            ? "Cannot submit: this item is a hold point"
                            : undefined
                        }
                        onClick={() => submit(false)}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {previewFile && (
            <aside className="flex min-h-0 flex-col bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 pr-12">
                <h2 className="min-w-0 truncate text-sm font-semibold text-slate-900">
                  {previewFile.displayName}
                </h2>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label="Close file preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 p-4">
                <OfficeFilePreviewPane file={previewFile} className="h-full" />
              </div>
            </aside>
          )}
        </div>
      </DialogContent>

      <Dialog
        open={showCloseConfirm}
        onOpenChange={(value) => {
          if (!value) setShowCloseConfirm(false);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogTitle>Save as draft?</DialogTitle>
          <DialogDescription>
            You have unsaved inspection data. Save it as a draft so you can
            continue later, or discard your changes.
          </DialogDescription>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCloseConfirm(false)}
              disabled={isSubmitting}
            >
              Keep editing
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardAndClose}
              disabled={isSubmitting}
            >
              Discard
            </Button>
            <Button onClick={handleSaveDraftAndClose} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save as draft"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
