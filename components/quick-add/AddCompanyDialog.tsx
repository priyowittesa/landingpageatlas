"use client";

import { useCreateCompany } from "@/hooks/useConstructionRefs";
import type { RefOption } from "@/hooks/useConstructionRefs";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues,
} from "./QuickAddDialog";

const FIELDS: QuickAddField[] = [
  {
    name: "name",
    label: "Company Name",
    required: true,
    placeholder: "Enter company name",
    colSpan: 2,
  },
  {
    name: "registration_no",
    label: "Registration No.",
    placeholder: "Enter registration number",
  },
  {
    name: "contact_name",
    label: "Contact Name",
    placeholder: "Enter contact name",
  },
  {
    name: "contact_email",
    label: "Contact Email",
    placeholder: "Enter contact email",
  },
  {
    name: "contact_phone",
    label: "Contact Phone",
    placeholder: "Enter contact phone",
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    placeholder: "Enter address",
    colSpan: 2,
  },
  {
    name: "is_active",
    label: "Active",
    type: "switch",
    desc: "Company is active and selectable.",
    colSpan: 2,
  },
];

export default function AddCompanyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreateCompany();

  const handleSubmit = async (values: QuickAddValues) => {
    const option = await mutateAsync({
      name: String(values.name).trim(),
      registration_no:
        String(values.registration_no ?? "").trim() || undefined,
      contact_name: String(values.contact_name ?? "").trim() || undefined,
      contact_email: String(values.contact_email ?? "").trim() || undefined,
      contact_phone: String(values.contact_phone ?? "").trim() || undefined,
      address: String(values.address ?? "").trim() || undefined,
      is_active: Boolean(values.is_active),
    });
    onCreated?.(option);
    onOpenChange(false);
  };

  return (
    <QuickAddDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Company"
      description="Create a new company / owner."
      submitLabel="Save Company"
      fields={FIELDS}
      initialValues={{ is_active: true }}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
