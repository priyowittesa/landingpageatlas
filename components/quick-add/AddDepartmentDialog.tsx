"use client";

import { useCreateDepartment } from "@/hooks/useConstructionRefs";
import type { RefOption } from "@/hooks/useConstructionRefs";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues,
} from "./QuickAddDialog";

const FIELDS: QuickAddField[] = [
  {
    name: "name",
    label: "Department Name",
    required: true,
    placeholder: "Enter department name",
    colSpan: 2,
  },
  {
    name: "cost_center_code",
    label: "Cost Center Code",
    placeholder: "Enter cost center code",
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
    desc: "Department is active and selectable.",
    colSpan: 2,
  },
];

export default function AddDepartmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreateDepartment();

  const handleSubmit = async (values: QuickAddValues) => {
    const option = await mutateAsync({
      name: String(values.name).trim(),
      cost_center_code:
        String(values.cost_center_code ?? "").trim() || undefined,
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
      title="Add Department"
      description="Create a new department / cost center."
      submitLabel="Save Department"
      fields={FIELDS}
      initialValues={{ is_active: true }}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
