"use client";

import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleCheck,
  GripVertical,
  Paperclip,
  Plus,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  useCreateAssetTemplate,
  useCreateQualityTemplate,
  useUpdateAssetTemplate,
  useUpdateQualityTemplate,
  getReferenceUploadUrl,
  uploadReferenceToS3,
  registerReference,
  useDeleteTemplateReference,
  type AttachmentUploadStatus
} from "../use-templates";
import { useProductList } from "../use-products";
import { TagListDialog } from "./tag-list-dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type {
  TemplateCategory,
  TemplateDetail,
  FrequencyType,
  ItemControlPoint
} from "../types";

type ChecklistItem = {
  id: number;
  serverId?: string;
  label: string;
  type: "pass_fail" | "number";
  minValue: string;
  maxValue: string;
  controlPoints: ItemControlPoint[];
};
type Section = {
  id: number;
  serverId?: string;
  name: string;
  items: ChecklistItem[];
};

type ReorderKind = "sections" | "items";

type AttachedFile = {
  name: string;
  file?: File;
  referenceId?: string;
  storageKey?: string;
  status: AttachmentUploadStatus;
  error?: string;
};

function savedTemplateId(response: unknown): string | undefined {
  type SavedTemplate = { id?: string; inspection_template?: { id?: string } };
  const result = response as SavedTemplate & { data?: SavedTemplate };
  const data = result?.data ?? result;
  return data?.inspection_template?.id || data?.id;
}

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" }
];

const ITEM_TYPE_OPTIONS = [
  { value: "pass_fail", label: "Pass/Fail" },
  { value: "number", label: "Number" }
] as const;

export function TemplateForm({
  editing = false,
  category = "asset",
  initialData
}: {
  editing?: boolean;
  category?: TemplateCategory;
  initialData?: TemplateDetail;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAsset = category === "asset";
  const isDraft = initialData?.status === "1" ||
    initialData?.status.toLowerCase().includes("draft") === true;
  const { user } = useCurrentUser();

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

  const createAssetTemplate = useCreateAssetTemplate();
  const createQualityTemplate = useCreateQualityTemplate();
  const updateAssetTemplate = useUpdateAssetTemplate();
  const updateQualityTemplate = useUpdateQualityTemplate();
  const deleteTemplateReference = useDeleteTemplateReference();

  const [name, setName] = useState(initialData?.name ?? "");
  const [equipmentId] = useState(
    initialData?.equipmentId || searchParams.get("asset") || ""
  );
  const [equipmentName] = useState(
    initialData?.equipmentName || searchParams.get("assetName") || ""
  );
  const [frequency, setFrequency] = useState<string>(
    initialData?.frequency ?? ""
  );
  const [customDays, setCustomDays] = useState(initialData?.customDays ?? 0);
  const [isUsageTracking, setIsUsageTracking] = useState(
    initialData?.isUsageTracking ?? false
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialData?.products.map((p) => p.productId) ?? []
  );
  const [productSearch, setProductSearch] = useState("");
  const [sections, setSections] = useState<Section[]>(
    initialData && initialData.sections.length > 0
      ? initialData.sections.map((s, si) => ({
          id: si + 1,
          serverId: s.id || undefined,
          name: s.name,
          items: s.items.map((it, ii) => ({
            id: ii + 1,
            serverId: it.id || undefined,
            label: it.label,
            type: (it.type === "number" ? "number" : "pass_fail") as
              | "pass_fail"
              | "number",
            minValue: it.minValue,
            maxValue: it.maxValue,
            controlPoints: it.controlPoints
          }))
        }))
      : [{ id: 1, name: "", items: [] }]
  );
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    initialData?.references.map((reference) => ({
      name: reference.storageKey.split("/").pop() || "reference",
      referenceId: reference.id,
      storageKey: reference.storageKey,
      status: "success" as AttachmentUploadStatus
    })) ?? []
  );
  const [tagDialogTarget, setTagDialogTarget] = useState<{
    sectionId: number;
    itemId: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    sectionId: number;
    itemId: number;
  } | null>(null);
  const [sectionDropTargetId, setSectionDropTargetId] = useState<number | null>(
    null
  );
  const [itemDropTarget, setItemDropTarget] = useState<{
    sectionId: number;
    itemId: number;
  } | null>(null);
  const sectionRefs = useRef(new Map<number, HTMLDivElement>());
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousLayout = useRef<{
    kind: ReorderKind;
    positions: Map<string, { left: number; top: number }>;
  } | null>(null);

  function getItemKey(sectionId: number, itemId: number) {
    return `${sectionId}:${itemId}`;
  }

  function captureLayout(kind: ReorderKind) {
    const positions = new Map<string, { left: number; top: number }>();
    const refs = kind === "sections" ? sectionRefs.current : itemRefs.current;
    refs.forEach((element, key) => {
      const rect = element.getBoundingClientRect();
      positions.set(String(key), { left: rect.left, top: rect.top });
    });
    return positions;
  }

  function prepareReorderAnimation(kind: ReorderKind) {
    previousLayout.current = {
      kind,
      positions: captureLayout(kind)
    };
  }

  useLayoutEffect(() => {
    const layout = previousLayout.current;
    if (!layout) return;
    previousLayout.current = null;

    const refs =
      layout.kind === "sections" ? sectionRefs.current : itemRefs.current;
    refs.forEach((element, key) => {
      const previous = layout.positions.get(String(key));
      if (!previous) return;

      const next = element.getBoundingClientRect();
      const offsetX = previous.left - next.left;
      const offsetY = previous.top - next.top;
      if (Math.abs(offsetX) < 1 && Math.abs(offsetY) < 1) return;

      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [
          {
            transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`
          },
          { transform: "translate3d(0, 0, 0)" }
        ],
        {
          duration: 220,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
        }
      );
    });
  }, [sections]);

  const tagDialogSelectedIds = useMemo(() => {
    if (!tagDialogTarget) return [];
    return (
      sections
        .find((section) => section.id === tagDialogTarget.sectionId)
        ?.items.find((item) => item.id === tagDialogTarget.itemId)
        ?.controlPoints.map((cp) => cp.control_point_id) ?? []
    );
  }, [sections, tagDialogTarget]);

  const hasSectionWithItem = sections.some(
    (section) => section.name && section.items.some((item) => item.label)
  );
  const hasRequiredFrequency = !isAsset || Boolean(frequency);

  const canPublish = Boolean(
    name &&
    hasRequiredFrequency &&
    (isAsset ? equipmentId : true) &&
    (!isAsset ? selectedProductIds.length > 0 : true) &&
    attachedFiles.length > 0 &&
    hasSectionWithItem
  );

  const canSaveDraft = hasRequiredFrequency;

  const isPending =
    createAssetTemplate.isPending ||
    createQualityTemplate.isPending ||
    updateAssetTemplate.isPending ||
    updateQualityTemplate.isPending ||
    deleteTemplateReference.isPending ||
    uploading;

  const updateSection = (id: number, update: Partial<Section>) =>
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, ...update } : section
      )
    );
  const addSection = () =>
    setSections((current) => [
      ...current,
      { id: Date.now(), name: "", items: [] }
    ]);
  const removeSection = (id: number) =>
    setSections((current) => current.filter((section) => section.id !== id));
  const moveSection = (fromId: number, toId: number | undefined) => {
    if (toId === undefined) return;
    const fromIndex = sections.findIndex((section) => section.id === fromId);
    const toIndex = sections.findIndex((section) => section.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    prepareReorderAnimation("sections");
    setSections((current) => {
      const next = [...current];
      const currentFromIndex = next.findIndex(
        (section) => section.id === fromId
      );
      const currentToIndex = next.findIndex((section) => section.id === toId);
      if (
        currentFromIndex < 0 ||
        currentToIndex < 0 ||
        currentFromIndex === currentToIndex
      ) {
        return current;
      }

      const [section] = next.splice(currentFromIndex, 1);
      next.splice(currentToIndex, 0, section);
      return next;
    });
  };
  const addItem = (sectionId: number) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: Date.now(),
                  label: "",
                  type: "pass_fail",
                  minValue: "",
                  maxValue: "",
                  controlPoints: []
                }
              ]
            }
          : section
      )
    );
  const moveItem = (
    sectionId: number,
    fromId: number,
    toId: number | undefined
  ) => {
    if (toId === undefined) return;
    const currentSection = sections.find((section) => section.id === sectionId);
    const fromIndex =
      currentSection?.items.findIndex((item) => item.id === fromId) ?? -1;
    const toIndex =
      currentSection?.items.findIndex((item) => item.id === toId) ?? -1;
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    prepareReorderAnimation("items");
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;

        const items = [...section.items];
        const currentFromIndex = items.findIndex((item) => item.id === fromId);
        const currentToIndex = items.findIndex((item) => item.id === toId);
        if (
          currentFromIndex < 0 ||
          currentToIndex < 0 ||
          currentFromIndex === currentToIndex
        ) {
          return section;
        }

        const [item] = items.splice(currentFromIndex, 1);
        items.splice(currentToIndex, 0, item);
        return { ...section, items };
      })
    );
  };
  const updateItem = (
    sectionId: number,
    itemId: number,
    update: Partial<ChecklistItem>
  ) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...update } : item
              )
            }
          : section
      )
    );
  const removeItem = (sectionId: number, itemId: number) =>
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== itemId)
            }
          : section
      )
    );

  function clearDragState() {
    setDraggedSectionId(null);
    setDraggedItem(null);
    setSectionDropTargetId(null);
    setItemDropTarget(null);
  }

  function handleSectionDragStart(
    event: React.DragEvent<HTMLSpanElement>,
    sectionId: number
  ) {
    setDraggedSectionId(sectionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(sectionId));
  }

  function handleItemDragStart(
    event: React.DragEvent<HTMLSpanElement>,
    sectionId: number,
    itemId: number
  ) {
    setDraggedItem({ sectionId, itemId });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${sectionId}:${itemId}`);
  }

  function handleSectionDrop(
    event: React.DragEvent<HTMLDivElement>,
    sectionId: number
  ) {
    event.preventDefault();
    if (draggedSectionId !== null) {
      moveSection(draggedSectionId, sectionId);
    }
    clearDragState();
  }

  function handleItemDrop(
    event: React.DragEvent<HTMLDivElement>,
    sectionId: number,
    itemId: number
  ) {
    event.preventDefault();
    if (draggedItem) {
      if (draggedItem.sectionId === sectionId) {
        moveItem(sectionId, draggedItem.itemId, itemId);
      }
      event.stopPropagation();
      clearDragState();
    }
  }

  function buildSectionsPayload() {
    return sections
      .filter((s) => s.name && s.items.some((i) => i.label))
      .map((section, sIndex) => ({
        ...(section.serverId ? { id: section.serverId } : {}),
        name: section.name,
        sort_order: sIndex,
        items: section.items
          .filter((i) => i.label)
          .map((item, iIndex) => ({
            ...(item.serverId ? { id: item.serverId } : {}),
            description: item.label,
            type: item.type,
            min_value: item.type === "number" ? Number(item.minValue) || 0 : 0,
            max_value: item.type === "number" ? Number(item.maxValue) || 0 : 0,
            sort_order: iIndex,
            control_points: item.controlPoints.map((cp) => ({
              control_point_id: cp.control_point_id
            }))
          }))
      }));
  }

  function addItemControlPoint(
    sectionId: number,
    itemId: number,
    tag: ItemControlPoint
  ) {
    const item = sections
      .find((section) => section.id === sectionId)
      ?.items.find((candidate) => candidate.id === itemId);
    if (
      item?.controlPoints.some(
        (cp) => cp.control_point_id === tag.control_point_id
      )
    )
      return;
    updateItem(sectionId, itemId, {
      controlPoints: [...(item?.controlPoints ?? []), tag]
    });
  }

  function removeItemControlPoint(
    sectionId: number,
    itemId: number,
    controlPointId: string
  ) {
    const item = sections
      .find((section) => section.id === sectionId)
      ?.items.find((candidate) => candidate.id === itemId);
    updateItem(sectionId, itemId, {
      controlPoints: (item?.controlPoints ?? []).filter(
        (cp) => cp.control_point_id !== controlPointId
      )
    });
  }

  function removeControlPointsFromItems(controlPointIds: string[]) {
    setSections((current) =>
      current.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          controlPoints: item.controlPoints.filter(
            (cp) => !controlPointIds.includes(cp.control_point_id)
          )
        }))
      }))
    );
  }

  function setFileStatus(
    index: number,
    update: Partial<Omit<AttachedFile, "file">>
  ) {
    setAttachedFiles((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...update } : entry))
    );
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).map((file) => ({
      name: file.name,
      file,
      status: "idle" as AttachmentUploadStatus
    }));
    setAttachedFiles((current) => [...current, ...newFiles]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    const entry = attachedFiles[index];
    // Removing a file from a new revision must not alter a historical snapshot.
    if (!entry?.referenceId || !initialData?.templateId || !isDraft) {
      setAttachedFiles((current) => current.filter((_, i) => i !== index));
      return;
    }

    deleteTemplateReference.mutate(
      {
        templateId: initialData.templateId,
        referenceId: entry.referenceId
      },
      {
        onSuccess: () =>
          setAttachedFiles((current) =>
            current.filter((item) => item.referenceId !== entry.referenceId)
          )
      }
    );
  }

  async function uploadAttachments(templateId: string) {
    if (attachedFiles.length === 0) return;
    setUploading(true);
    const uploadedBy = user?.name ?? "system";
    for (let i = 0; i < attachedFiles.length; i++) {
      const entry = attachedFiles[i];
      try {
        if (entry.referenceId) {
          // Retain the source revision's files and link them to a new revision.
          if (templateId === initialData?.templateId) continue;
          if (!entry.storageKey) throw new Error("Missing storage key");
          setFileStatus(i, { status: "registering", error: undefined });
          await registerReference(templateId, {
            storage_key: entry.storageKey,
            uploaded_by: uploadedBy
          });
          setFileStatus(i, { status: "success" });
          continue;
        }

        if (!entry.file) continue;
        setFileStatus(i, {
          status: "getting-upload-url",
          error: undefined
        });
        const { upload_url, storage_key } = await getReferenceUploadUrl(
          templateId,
          { file_name: entry.file.name }
        );

        setFileStatus(i, { status: "uploading-s3" });
        await uploadReferenceToS3(upload_url, entry.file);

        setFileStatus(i, { status: "registering" });
        await registerReference(templateId, {
          storage_key,
          uploaded_by: uploadedBy
        });

        setFileStatus(i, { status: "success" });
      } catch {
        setFileStatus(i, { status: "error", error: "Upload failed" });
      }
    }
    setUploading(false);
  }

  function handleSubmit(isPublished: boolean) {
    if (!hasRequiredFrequency) return;
    const sectionsPayload = buildSectionsPayload();

    if (isAsset) {
      if (editing && initialData?.templateId) {
        updateAssetTemplate.mutate(
          {
            templateId: initialData.templateId,
            payload: {
              updated_by: user?.name ?? user?.id ?? "system",
              equipment_id: equipmentId,
              frequency_type: frequency,
              is_published: isPublished,
              is_usage_tracking: isUsageTracking,
              name,
              sections: sectionsPayload
            }
          },
          {
            onSuccess: async (updated) => {
              const refId = savedTemplateId(updated) ?? initialData.templateId;
              await uploadAttachments(refId);
              router.push("/app/inspection/templates?tab=asset");
            }
          }
        );
        return;
      }
      createAssetTemplate.mutate(
        {
          created_by: user?.name ?? user?.id ?? "system",
          equipment_id: equipmentId,
          frequency_type: frequency,
          frequency_value: frequency === "custom" ? customDays : 0,
          is_published: isPublished,
          is_usage_tracking: isUsageTracking,
          name,
          sections: sectionsPayload
        },
        {
          onSuccess: async (created) => {
            const templateId = savedTemplateId(created);
            if (templateId) await uploadAttachments(templateId);
            router.push("/app/inspection/templates?tab=asset");
          }
        }
      );
    } else {
      if (editing && initialData?.templateId) {
        updateQualityTemplate.mutate(
          {
            templateId: initialData.templateId,
            payload: {
              is_published: isPublished,
              name,
              product_ids: selectedProductIds,
              sections: sectionsPayload
            }
          },
          {
            onSuccess: async (updated) => {
              const refId = savedTemplateId(updated) ?? initialData.templateId;
              await uploadAttachments(refId);
              router.push("/app/inspection/templates?tab=quality");
            }
          }
        );
        return;
      }
      const productIds = selectedProductIds.map((product_id) => ({
        product_id
      }));

      createQualityTemplate.mutate(
        {
          created_by: user?.name ?? user?.id ?? "system",
          is_published: isPublished,
          name,
          products: productIds,
          sections: sectionsPayload
        },
        {
          onSuccess: async (created) => {
            const templateId = savedTemplateId(created);
            if (templateId) await uploadAttachments(templateId);
            router.push("/app/inspection/templates?tab=quality");
          }
        }
      );
    }
  }

  const titleLabel = isAsset
    ? "Asset Inspection Template"
    : "Quality Inspection Template";

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <button
        onClick={() => router.push("/app/inspection/templates")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {titleLabel}
      </button>
      {editing && (
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded bg-primary-50 px-2 py-1 text-xs font-bold tracking-wide text-primary-700">
            {isAsset ? "ASSET TEMPLATE" : "QUALITY TEMPLATE"}
          </span>
          {initialData && initialData.version > 0 && (
            <span className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
              Rev {initialData.version}
            </span>
          )}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canPublish) handleSubmit(true);
        }}
      >
        {/* hidden helper for save draft outside form submit */}
        <Card className="p-5 sm:p-7">
          <h1 className="text-xl font-bold text-gray-950">
            {name || "Untitled Template"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAsset
              ? "Build and publish checklists for asset inspections"
              : "Build and publish checklists for quality inspections"}
          </p>
          <Card className="mt-5 gap-0 rounded-lg p-4 sm:p-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Template name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                isAsset
                  ? "e.g. CNC Mill Monthly Inspection"
                  : "e.g. Final Assembly QC Checklist"
              }
              className="mt-2"
            />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {isAsset ? (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Equipment <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={equipmentName || equipmentId}
                      disabled
                      placeholder="No equipment selected"
                      className="mt-2 bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      One template per equipment.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="inspection-frequency"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Inspection frequency{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      required
                      value={frequency}
                      onValueChange={setFrequency}
                    >
                      <SelectTrigger
                        id="inspection-frequency"
                        className="mt-2 w-full"
                      >
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!frequency && (
                      <p className="mt-1 text-xs text-red-600">
                        Select an inspection frequency to save or publish.
                      </p>
                    )}
                    {frequency === "custom" && (
                      <Input
                        type="number"
                        min={1}
                        value={customDays || ""}
                        onChange={(e) => setCustomDays(Number(e.target.value))}
                        placeholder="Custom days"
                        className="mt-2"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Products/Parts
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 w-full justify-between font-normal"
                      >
                        {selectedProductIds.length > 0
                          ? `${selectedProductIds.length} product${selectedProductIds.length > 1 ? "s" : ""} selected`
                          : "Select products"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-100 p-0" align="start">
                      <div className="border-b p-2">
                        <Input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products..."
                          className="h-8"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1">
                        {productLoading ? (
                          <p className="p-2 text-sm text-gray-400">
                            Loading...
                          </p>
                        ) : productOptions.length === 0 ? (
                          <p className="p-2 text-sm text-gray-400">
                            No products found
                          </p>
                        ) : (
                          productOptions
                            .filter((opt) =>
                              opt.label
                                .toLowerCase()
                                .includes(productSearch.toLowerCase())
                            )
                            .map((opt) => {
                              const checked = selectedProductIds.includes(
                                opt.value
                              );
                              return (
                                <label
                                  key={opt.value}
                                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => {
                                      setSelectedProductIds((prev) =>
                                        checked
                                          ? prev.filter(
                                              (id) => id !== opt.value
                                            )
                                          : [...prev, opt.value]
                                      );
                                    }}
                                  />
                                  <span className="truncate">{opt.label}</span>
                                </label>
                              );
                            })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedProductIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedProductIds.map((id) => {
                        const opt = productOptions.find((o) => o.value === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {opt?.label ?? id}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProductIds((prev) =>
                                  prev.filter((pid) => pid !== id)
                                )
                              }
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {isAsset && (
              <div className="mt-5">
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_usage_tracking"
                    checked={isUsageTracking}
                    onCheckedChange={setIsUsageTracking}
                  />
                  <label
                    htmlFor="is_usage_tracking"
                    className="text-sm font-semibold text-gray-900"
                  >
                    Usage Tracking
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Adds a usage/meter reading (hours, mileage, or cycles) from
                  the machine&apos;s own data that the Engineer records during
                  inspection, alongside the checklist.
                </p>
              </div>
            )}
            <div className="mt-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reference files
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              {attachedFiles.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition hover:border-gray-300"
                >
                  <UploadCloud className="h-7 w-7 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-400">
                    PDF, DOCX, PNG, JPG up to 20MB
                  </span>
                </button>
              ) : (
                <div className="mt-2 space-y-2">
                  {attachedFiles.map((entry, index) => (
                    <div
                      key={entry.referenceId ?? `${entry.name}-${index}`}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate font-medium text-gray-700">
                          {entry.name}
                        </span>
                        {(entry.status === "getting-upload-url" ||
                          entry.status === "uploading-s3" ||
                          entry.status === "registering") && (
                          <span className="shrink-0 text-xs text-gray-400">
                            {entry.status === "getting-upload-url" &&
                              "Getting URL..."}
                            {entry.status === "uploading-s3" && "Uploading..."}
                            {entry.status === "registering" && "Registering..."}
                          </span>
                        )}
                        {entry.status === "success" && (
                          <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        )}
                        {entry.status === "error" && (
                          <span className="shrink-0 text-xs text-red-600">
                            {entry.error ?? "Failed"}
                          </span>
                        )}
                      </div>
                      {entry.status !== "uploading-s3" &&
                        entry.status !== "getting-upload-url" &&
                        entry.status !== "registering" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600"
                            onClick={() => removeFile(index)}
                            disabled={deleteTemplateReference.isPending}
                            aria-label={`Remove ${entry.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-3 w-3" />
                    Add more files
                  </Button>
                </div>
              )}
            </div>
          </Card>
          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              Checklist Sections
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSection}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add section
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {sections.map((section, sectionIndex) => (
              <Card
                key={section.id}
                ref={(element) => {
                  if (element) {
                    sectionRefs.current.set(section.id, element);
                  } else {
                    sectionRefs.current.delete(section.id);
                  }
                }}
                className={`gap-0 overflow-hidden rounded-lg p-0 transition-[transform,box-shadow,opacity] duration-200 ease-out ${
                  draggedSectionId === section.id
                    ? "scale-[0.99] opacity-60 shadow-lg"
                    : sectionDropTargetId === section.id
                      ? "ring-2 ring-primary-300 ring-offset-1"
                      : ""
                }`}
                onDragOver={(event) => {
                  if (draggedSectionId !== null) {
                    event.preventDefault();
                    setSectionDropTargetId(section.id);
                  }
                }}
                onDrop={(event) => handleSectionDrop(event, section.id)}
              >
                <CardHeader className="flex-row items-center gap-2 bg-gray-50 p-3 space-y-0">
                  <span
                    draggable
                    onDragStart={(event) =>
                      handleSectionDragStart(event, section.id)
                    }
                    onDragEnd={clearDragState}
                    className="cursor-grab rounded text-gray-400 outline-none hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-primary-500 active:cursor-grabbing"
                    title="Drag to reorder section"
                    aria-label={`Drag ${section.name || "section"} to reorder`}
                    role="button"
                    tabIndex={0}
                  >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    value={section.name}
                    onChange={(event) =>
                      updateSection(section.id, { name: event.target.value })
                    }
                    placeholder="Section name (e.g. Electrical)"
                    className="h-8 flex-1 bg-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      moveSection(section.id, sections[sectionIndex - 1]?.id)
                    }
                    disabled={sectionIndex === 0}
                    className="h-7 w-7 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    aria-label={`Move ${section.name || "section"} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      moveSection(section.id, sections[sectionIndex + 1]?.id)
                    }
                    disabled={sectionIndex === sections.length - 1}
                    className="h-7 w-7 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    aria-label={`Move ${section.name || "section"} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id)}
                    className="h-7 w-7 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  {section.items.length === 0 && (
                    <p className="px-2 py-1 text-xs text-gray-400">
                      No items yet — add one below.
                    </p>
                  )}
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      ref={(element) => {
                        const key = getItemKey(section.id, item.id);
                        if (element) {
                          itemRefs.current.set(key, element);
                        } else {
                          itemRefs.current.delete(key);
                        }
                      }}
                      className={`flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-2 transition-[transform,box-shadow,opacity] duration-200 ease-out ${
                        draggedItem?.sectionId === section.id &&
                        draggedItem.itemId === item.id
                          ? "scale-[0.99] opacity-60 shadow-md"
                          : itemDropTarget?.sectionId === section.id &&
                              itemDropTarget.itemId === item.id
                            ? "ring-2 ring-primary-200 ring-offset-1"
                            : ""
                      }`}
                      onDragOver={(event) => {
                        if (draggedItem?.sectionId === section.id) {
                          event.preventDefault();
                          setItemDropTarget({
                            sectionId: section.id,
                            itemId: item.id
                          });
                        }
                      }}
                      onDrop={(event) =>
                        handleItemDrop(event, section.id, item.id)
                      }
                    >
                      <span
                        draggable
                        onDragStart={(event) =>
                          handleItemDragStart(event, section.id, item.id)
                        }
                        onDragEnd={clearDragState}
                        className="cursor-grab rounded text-gray-400 outline-none hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-primary-500 active:cursor-grabbing"
                        title="Drag to reorder question"
                        aria-label={`Drag ${item.label || "question"} to reorder`}
                        role="button"
                        tabIndex={0}
                      >
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <Input
                        value={item.label}
                        onChange={(event) =>
                          updateItem(section.id, item.id, {
                            label: event.target.value
                          })
                        }
                        placeholder="Checklist item"
                        className="h-9 min-w-50 flex-1 bg-white"
                      />
                      <Select
                        value={item.type}
                        onValueChange={(type: ChecklistItem["type"]) =>
                          updateItem(section.id, item.id, { type })
                        }
                      >
                        <SelectTrigger className="h-9 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.type === "number" && (
                        <>
                          <Input
                            value={item.minValue}
                            onChange={(e) =>
                              updateItem(section.id, item.id, {
                                minValue: e.target.value
                              })
                            }
                            placeholder="Min"
                            className="h-9 w-16 bg-white"
                          />
                          <span className="text-xs text-gray-400">to</span>
                          <Input
                            value={item.maxValue}
                            onChange={(e) =>
                              updateItem(section.id, item.id, {
                                maxValue: e.target.value
                              })
                            }
                            placeholder="Max"
                            className="h-9 w-16 bg-white"
                          />
                        </>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          moveItem(
                            section.id,
                            item.id,
                            section.items[itemIndex - 1]?.id
                          )
                        }
                        disabled={itemIndex === 0}
                        className="h-7 w-7 shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        aria-label={`Move ${item.label || "question"} up`}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          moveItem(
                            section.id,
                            item.id,
                            section.items[itemIndex + 1]?.id
                          )
                        }
                        disabled={itemIndex === section.items.length - 1}
                        className="h-7 w-7 shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        aria-label={`Move ${item.label || "question"} down`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(section.id, item.id)}
                        className="h-7 w-7 text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      {!isAsset && (
                        <div className="flex w-full flex-wrap items-center gap-1.5 pl-6 pt-0.5">
                          {item.controlPoints.map((cp) => (
                            <button
                              key={cp.control_point_id}
                              type="button"
                              onClick={() =>
                                removeItemControlPoint(
                                  section.id,
                                  item.id,
                                  cp.control_point_id
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:opacity-80"
                              style={{ backgroundColor: cp.color }}
                              aria-label={`Remove ${cp.label} tag`}
                            >
                              <span className="h-2 w-2 shrink-0 rounded-full bg-white/80" />
                              {cp.label}
                              <X className="h-3 w-3" />
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setTagDialogTarget({
                                sectionId: section.id,
                                itemId: item.id
                              })
                            }
                            className="px-1 py-1 text-xs text-slate-400 transition hover:text-primary-700"
                          >
                            + add tag
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(section.id)}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-xs font-medium ${
                canPublish
                  ? "text-emerald-600"
                  : name || equipmentId || hasSectionWithItem
                    ? "text-red-600"
                    : "text-gray-400"
              }`}
            >
              {canPublish
                ? "Template is ready to publish."
                : !name
                  ? "Add a template name to publish."
                  : isAsset && !equipmentId
                    ? "Select an equipment to publish."
                    : !isAsset && selectedProductIds.length === 0
                      ? "Select at least one product to publish."
                      : attachedFiles.length === 0
                        ? "Attach at least one reference file to publish."
                        : !hasSectionWithItem
                          ? "Add at least one section with one item to publish."
                          : "Complete all required fields to publish."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/app/inspection/templates")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canSaveDraft || isPending}
                onClick={() => handleSubmit(false)}
              >
                Save draft
              </Button>
              <Button type="submit" disabled={!canPublish || isPending}>
                {uploading
                  ? "Uploading files..."
                  : editing
                    ? `Publish Rev ${(initialData?.version ?? 0) + 1}`
                    : "Publish"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
      {!isAsset && (
        <TagListDialog
          open={tagDialogTarget !== null}
          onOpenChange={(next) => {
            if (!next) setTagDialogTarget(null);
          }}
          selectedIds={tagDialogSelectedIds}
          onToggleTag={(tag) => {
            if (!tagDialogTarget) return;
            if (tagDialogSelectedIds.includes(tag.id)) {
              removeItemControlPoint(
                tagDialogTarget.sectionId,
                tagDialogTarget.itemId,
                tag.id
              );
            } else {
              addItemControlPoint(
                tagDialogTarget.sectionId,
                tagDialogTarget.itemId,
                {
                  control_point_id: tag.id,
                  label: tag.label,
                  color: tag.color,
                  ...(tag.value ? { value: tag.value } : {})
                }
              );
            }
          }}
          onTagsDeleted={removeControlPointsFromItems}
          currentUser={user?.name ?? "system"}
        />
      )}
    </div>
  );
}
