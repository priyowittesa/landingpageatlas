"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, FolderKanban, Save, X } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import FormFieldLayout from "@/components/FormFieldLayout";
import FormDateField from "@/components/FormDateField";
import FormSection from "@/components/FormSection";
import FormSelectField from "@/components/FormSelectField";
import FormTextField from "@/components/FormTextField";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_PROJECT,
  projectSchema,
  type ProjectPayload,
} from "../types";
import {
  useLabours,
  useProjectEnums,
  useProjectTypes,
} from "../use-projects";
import { ProjectTeamSection } from "./project-team-section";

interface ProjectFormProps {
  title: string;
  description: string;
  initialValues?: ProjectPayload;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: ProjectPayload) => void | Promise<void>;
  showProjectTeam?: boolean;
}

function toUtcDate(value: string) {
  const [month, day, year] = value.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export function ProjectForm({
  title,
  description,
  initialValues = EMPTY_PROJECT,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
  showProjectTeam = false,
}: ProjectFormProps) {
  const methods = useForm<ProjectPayload>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues,
  });

  useEffect(() => methods.reset(initialValues), [initialValues, methods]);

  const submitProject = (payload: ProjectPayload) =>
    onSubmit({
      ...payload,
      start_date: toUtcDate(payload.start_date),
      end_date: toUtcDate(payload.end_date),
    });

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title={title} subtitle={description} />

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(submitProject)}
          className="space-y-5"
        >
          <BasicInformationSection />
          <ProjectDetailsSection />
          {showProjectTeam && <ProjectTeamSection />}

          <div className="flex justify-end gap-3 rounded-md bg-white px-5 py-4 shadow-md dark:bg-zinc-950">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={pending}
              className="min-w-28"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="min-w-32">
              <Save />
              {pending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function BasicInformationSection() {
  const {
    data: projectManagers = [],
    isLoading: isLoadingProjectManagers,
    isError: isProjectManagersError,
  } = useLabours();
  const { data: projectEnums } = useProjectEnums();
  const {
    data: projectTypes = [],
    isLoading: isLoadingProjectTypes,
    isError: isProjectTypesError,
  } = useProjectTypes();
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProjectPayload>();

  return (
    <FormSection
      title="Basic Information"
      subtitle="Provide general information about the project."
      icon={FolderKanban}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <FormTextField
          label="Project Code"
          name="code"
          register={register}
          error={errors.code}
          required
          placeholder="Enter project code"
          desc="Unique code to identify the project"
          className="md:col-span-3"
        />
        <FormTextField
          label="Project Name"
          name="title"
          register={register}
          error={errors.title}
          required
          placeholder="Enter project name"
          desc="Official name of the project"
          className="md:col-span-3"
        />
        <FormSelectField
          label="Project Type"
          name="type"
          control={control}
          error={errors.type}
          required
          search
          searchPlaceholder="Search project type..."
          placeholder={
            isLoadingProjectTypes
              ? "Loading project types..."
              : "Select project type"
          }
          emptyMessage={
            isProjectTypesError
              ? "Failed to load project types."
              : "No project type found."
          }
          options={projectTypes.map((projectType) => ({
            label: projectType.name,
            value: projectType.id,
          }))}
          className="md:col-span-3"
        />
        <FormTextField
          label="Client / Owner"
          name="client_name"
          register={register}
          error={errors.client_name}
          required
          placeholder="Enter client / owner name"
          desc="The organization or entity that owns the project"
          className="md:col-span-3"
        />
        <FormSelectField
          label="Project Manager"
          name="project_manager_id"
          control={control}
          error={errors.project_manager_id}
          required
          search
          searchPlaceholder="Search project manager..."
          placeholder={
            isLoadingProjectManagers
              ? "Loading project managers..."
              : "Select project manager"
          }
          emptyMessage={
            isProjectManagersError
              ? "Failed to load project managers."
              : "No project manager found."
          }
          options={projectManagers.map((labour) => ({
            label: labour.name,
            value: labour.id,
          }))}
          desc="Person responsible for managing the project"
          className="md:col-span-3"
        />
        <ControlledTextareaField
          label="Project Description"
          name="description"
          placeholder="Enter project description (optional)"
          maxLength={1000}
          className="md:col-span-6"
        />
        <FormSelectField
          label="Project Status"
          name="status"
          control={control}
          error={errors.status}
          required
          placeholder="Select project status"
          options={projectEnums?.project_status ?? []}
          desc="Current status of the project"
          className="md:col-span-3"
        />
        <FormSelectField
          label="Project Priority"
          name="priority"
          control={control}
          error={errors.priority}
          placeholder="Select priority"
          options={projectEnums?.project_priority ?? []}
          desc="Priority level of the project"
          className="md:col-span-3"
        />
      </div>
    </FormSection>
  );
}

function ProjectDetailsSection() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProjectPayload>();

  return (
    <FormSection
      title="Project Details"
      subtitle="Provide additional details about the project."
      icon={CalendarDays}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <FormTextField
          label="Location"
          name="location"
          register={register}
          error={errors.location}
          required
          placeholder="Enter project location"
          desc="Where the project is located"
          className="md:col-span-2"
        />
        <ControlledTextareaField
          label="Project Address"
          name="address"
          placeholder="Enter project address (optional)"
          maxLength={255}
          rows={3}
          desc="Detailed address of the project location"
          className="md:col-span-4"
        />
        <FormDateField
          label="Planned Start Date"
          name="start_date"
          control={control}
          error={errors.start_date}
          required
          toYear={new Date().getFullYear() + 50}
          placeholder="Select start date"
          desc="Expected project start date"
          className="md:col-span-3"
        />
        <FormDateField
          label="Planned End Date"
          name="end_date"
          control={control}
          error={errors.end_date}
          required
          toYear={new Date().getFullYear() + 50}
          placeholder="Select end date"
          desc="Expected project completion date"
          className="md:col-span-3"
        />
        <TagsField />
      </div>
    </FormSection>
  );
}

function ControlledTextareaField({
  label,
  name,
  placeholder,
  maxLength,
  rows = 4,
  desc,
  className,
}: {
  label: string;
  name: "description" | "address";
  placeholder: string;
  maxLength: number;
  rows?: number;
  desc?: string;
  className?: string;
}) {
  const { control } = useFormContext<ProjectPayload>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormFieldLayout
          label={label}
          htmlFor={name}
          error={fieldState.error?.message}
          desc={desc}
          className={className}
        >
          <div className="relative">
            <Textarea
              {...field}
              id={name}
              rows={rows}
              maxLength={maxLength}
              placeholder={placeholder}
              className="border border-border shadow-none rounded-sm px-4 py-2 text-sm"
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {field.value.length}/{maxLength}
            </span>
          </div>
        </FormFieldLayout>
      )}
    />
  );
}

function TagsField() {
  const { control } = useFormContext<ProjectPayload>();
  const [tagInput, setTagInput] = useState("");

  return (
    <Controller
      name="tags"
      control={control}
      render={({ field, fieldState }) => {
        const addTag = () => {
          const tag = tagInput.trim();
          if (!tag || field.value.includes(tag)) return;
          field.onChange([...field.value, tag]);
          setTagInput("");
        };

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag();
          }
        };

        return (
          <FormFieldLayout
            label="Project Tags"
            htmlFor="tags"
            error={fieldState.error?.message}
            desc="Add relevant tags to help organize and filter projects"
            className="md:col-span-6"
          >
            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-sm border px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
              {field.value.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs text-primary-700"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => field.onChange(field.value.filter((item) => item !== tag))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={field.value.length ? "Add another tag" : "Add tags and press Enter"}
                className="min-w-48 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </FormFieldLayout>
        );
      }}
    />
  );
}
