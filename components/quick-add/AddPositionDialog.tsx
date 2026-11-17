"use client";

import {
  useCreatePosition,
  type RefOption,
} from "@/hooks/useConstructionRefs";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues,
} from "./QuickAddDialog";

const FIELDS: QuickAddField[] = [
  {
    name: "name",
    label: "Position Name",
    required: true,
    placeholder: "Enter position name",
    colSpan: 2,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    colSpan: 2,
  },
  {
    name: "is_active",
    label: "Active",
    type: "switch",
    desc: "Position is active and selectable.",
    colSpan: 2,
  },
];

export default function AddPositionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreatePosition();

  const handleSubmit = async (values: QuickAddValues) => {
    const option = await mutateAsync({
      name: String(values.name).trim(),
      description: String(values.description ?? "").trim() || undefined,
      is_active: Boolean(values.is_active),
    });
    onCreated?.(option);
    onOpenChange(false);
  };

  return (
    <QuickAddDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Position"
      description="Create a new employee position."
      submitLabel="Save Position"
      fields={FIELDS}
      initialValues={{ is_active: true }}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
