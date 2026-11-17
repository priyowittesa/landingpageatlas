"use client";

import { useMemo } from "react";

import { useCreateEquipmentTypeClass } from "@/hooks/useConstructionRefs";
import type { RefOption } from "@/hooks/useConstructionRefs";
import { useEquipmentCategories } from "@/app/app/master-data/equipment/use-equipment";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues
} from "./QuickAddDialog";

export default function AddEquipmentTypeClassDialog({
  open,
  onOpenChange,
  categoryId,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreateEquipmentTypeClass();
  const categories = useEquipmentCategories();

  const fields = useMemo<QuickAddField[]>(
    () => [
      {
        name: "category_id",
        label: "Category",
        type: "select",
        required: true,
        placeholder: "Select category",
        options: categories.data ?? [],
        colSpan: 2
      },
      {
        name: "name",
        label: "Type / Class Name",
        required: true,
        placeholder: "Enter type / class name",
        colSpan: 2
      }
    ],
    [categories.data]
  );

  const initialValues = useMemo<QuickAddValues>(
    () => ({
      category_id: categoryId || "",
      name: ""
    }),
    [categoryId]
  );

  const handleSubmit = async (values: QuickAddValues) => {
    const option = await mutateAsync({
      category_id: String(values.category_id),
      name: String(values.name).trim()
    });
    onCreated?.(option);
    onOpenChange(false);
  };

  return (
    <QuickAddDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Type / Class"
      description="Create a new equipment type / class under a category."
      submitLabel="Save Type / Class"
      fields={fields}
      initialValues={initialValues}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
