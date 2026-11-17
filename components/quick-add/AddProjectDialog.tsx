"use client";

import { useCreateProject } from "@/hooks/useConstructionRefs";
import type { RefOption } from "@/hooks/useConstructionRefs";
import QuickAddDialog, {
  type QuickAddField,
  type QuickAddValues,
} from "./QuickAddDialog";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const STATUS_OPTIONS = [
  { label: "Planning", value: "planning" },
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const FIELDS: QuickAddField[] = [
  {
    name: "title",
    label: "Project Title",
    required: true,
    placeholder: "Enter project title",
    colSpan: 2,
  },
  { name: "code", label: "Code", placeholder: "Enter project code" },
  {
    name: "client_name",
    label: "Client Name",
    placeholder: "Enter client name",
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    placeholder: "Select priority",
    options: PRIORITY_OPTIONS,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: STATUS_OPTIONS,
  },
  { name: "start_date", label: "Start Date", type: "date" },
  { name: "end_date", label: "End Date", type: "date" },
  {
    name: "location",
    label: "Location",
    placeholder: "Enter location",
    colSpan: 2,
  },
  {
    name: "project_manager_id",
    label: "Project Manager ID",
    placeholder: "Enter project manager ID",
  },
  {
    name: "project_type_id",
    label: "Project Type ID",
    placeholder: "Enter project type ID",
  },
  {
    name: "tags",
    label: "Tags",
    type: "tags",
    placeholder: "Comma separated tags",
    colSpan: 2,
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    placeholder: "Enter address",
    colSpan: 2,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter description",
    colSpan: 2,
  },
];

export default function AddProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (option: RefOption) => void;
}) {
  const { mutateAsync, isPending } = useCreateProject();

  const handleSubmit = async (values: QuickAddValues) => {
    const trim = (key: string) => String(values[key] ?? "").trim() || undefined;
    const option = await mutateAsync({
      title: String(values.title).trim(),
      code: trim("code"),
      client_name: trim("client_name"),
      description: trim("description"),
      location: trim("location"),
      address: trim("address"),
      priority: trim("priority"),
      status: trim("status"),
      start_date: trim("start_date"),
      end_date: trim("end_date"),
      project_manager_id: trim("project_manager_id"),
      project_type_id: trim("project_type_id"),
      tags: Array.isArray(values.tags) ? values.tags : undefined,
    });
    onCreated?.(option);
    onOpenChange(false);
  };

  return (
    <QuickAddDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Project"
      description="Create a new project."
      submitLabel="Save Project"
      fields={FIELDS}
      isLoading={isPending}
      onSubmit={handleSubmit}
    />
  );
}
