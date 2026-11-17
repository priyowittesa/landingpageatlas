"use client";

import { useCreateEquipmentCategory } from "@/hooks/useConstructionRefs";
import type { RefOption } from "@/hooks/useConstructionRefs";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues,
} from "./QuickAddDialog";

const FIELDS: QuickAddField[] = [
  {
    name: "name",
    label: "Category Name",
    required: true,
    placeholder: "Enter category name",
    colSpan: 2,
  },
  {
    name: "sort_order",
    label: "Sort Order",
    type: "number",
    placeholder: "0",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    colSpan: 2,
  },
];

export default function AddEquipmentCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreateEquipmentCategory();

  const handleSubmit = async (values: QuickAddValues) => {
    const option = await mutateAsync({
      name: String(values.name).trim(),
      description: String(values.description ?? "").trim() || undefined,
      sort_order: Number(values.sort_order) || 0,
    });
    onCreated?.(option);
    onOpenChange(false);
  };

  return (
    <QuickAddDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Category"
      description="Create a new equipment category."
      submitLabel="Save Category"
      fields={FIELDS}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
