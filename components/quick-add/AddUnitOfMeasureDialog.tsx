"use client";

import { useCreateUnitOfMeasure } from "@/hooks/useConstructionRefs";
import type { RefOption } from "@/hooks/useConstructionRefs";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues,
} from "./QuickAddDialog";

const FIELDS: QuickAddField[] = [
  {
    name: "code",
    label: "Code",
    required: true,
    placeholder: "e.g. TON",
  },
  {
    name: "label",
    label: "Label",
    required: true,
    placeholder: "e.g. Ton",
  },
  {
    name: "measure_type",
    label: "Measure Type",
    placeholder: "e.g. weight, volume",
  },
  {
    name: "sort_order",
    label: "Sort Order",
    type: "number",
    placeholder: "0",
  },
];

export default function AddUnitOfMeasureDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreateUnitOfMeasure();

  const handleSubmit = async (values: QuickAddValues) => {
    const option = await mutateAsync({
      code: String(values.code).trim(),
      label: String(values.label).trim(),
      measure_type: String(values.measure_type ?? "").trim() || undefined,
      sort_order: Number(values.sort_order) || 0,
    });
    onCreated?.(option);
    onOpenChange(false);
  };

  return (
    <QuickAddDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Unit of Measure"
      description="Create a new unit of measure."
      submitLabel="Save Unit"
      fields={FIELDS}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
