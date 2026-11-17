"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import FormSection from "@/components/FormSection";
import FormTextField from "@/components/FormTextField";
import FormSelectField from "@/components/FormSelectField";
import FormDateField from "@/components/FormDateField";
import FormFieldLayout from "@/components/FormFieldLayout";

import {
  classificationOptions,
  priorityOptions,
  classificationLabelMap,
  type EngineeringRequest,
  type RequestClassification,
  type RequestFormDto,
  type RequestPriority,
} from "../../types";
import { useCreateRequest, useUpdateRequest } from "../../hooks/useRequests";
import { toFormDate } from "../../lib/date";

const customerOptions = [
  { label: "PT Sample Customer", value: "PT Sample Customer" },
  { label: "Medco Energi · CRM-MDC-007", value: "Medco Energi" },
];

const defaultValues: RequestFormDto = {
  customer: "Medco Energi",
  title: "",
  scope_summary: "",
  priority: "medium",
  due_date_at: "",
  classification: "new_product_design",
  notes: "",
};

export function RequestForm({
  mode,
  initialRequest,
}: {
  mode: "create" | "edit";
  initialRequest?: EngineeringRequest | null;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const create = useCreateRequest();
  const update = useUpdateRequest();
  const existingDocuments =
    mode === "edit" ? (initialRequest?.documents ?? []) : [];

  const formValues: RequestFormDto = initialRequest
    ? {
        customer: initialRequest.customer,
        title: initialRequest.title,
        scope_summary: initialRequest.scope_summary ?? "",
        priority: initialRequest.priority,
        due_date_at: toFormDate(initialRequest.due_date_at),
        classification: initialRequest.classification,
        notes: initialRequest.notes ?? "",
      }
    : defaultValues;

  const { control, handleSubmit, register, reset, watch, setValue } =
    useForm<RequestFormDto>({ defaultValues: formValues });

  // Re-seed the form once `initialRequest` arrives — the first render
  // captures `defaultValues` before the request finishes fetching. Reset
  // only when the id changes so we don't wipe user input on re-renders.
  useEffect(() => {
    if (initialRequest) {
      reset(formValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRequest?.id]);

  const watchPriority = watch("priority");
  const watchClassification = watch("classification");

  const onSubmit = handleSubmit((values) => {
    if (mode === "edit" && initialRequest) {
      // Build the same shape as create so backend accepts a uniform payload.
      // Edit keeps the original `status`; create forces "submitted".
      const dueDate = values.due_date_at;
      update.mutate(
        {
          id: initialRequest.id,
          payload: {
            status: initialRequest.status,
            customer: values.customer,
            priority: values.priority,
            title: values.title,
            due_date_at: dueDate,
            notes: values.notes,
            scope_summary: values.scope_summary,
            classification: values.classification,
          },
          attachments: files,
        },
        {
          onSuccess: () => {
            router.push(`/app/product-development/requests/${initialRequest.id}`);
          },
        }
      );
    } else {
      create.mutate(
        { ...values, attachments: files },
        {
          onSuccess: () => {
            reset(defaultValues);
            setFiles([]);
            router.push("/app/product-development/requests");
          },
        }
      );
    }
  });

  const isPending = create.isPending || update.isPending;
  const backHref =
    mode === "edit" && initialRequest
      ? `/app/product-development/requests/${initialRequest.id}`
      : "/app/product-development/requests";
  const submitLabel = mode === "edit" ? "Save Changes" : "Submit Request";

  return (
    <form onSubmit={onSubmit} className="space-y-7 rounded-lg border border-gray-200 bg-white p-6">
      <section className="space-y-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Customer &amp; Project
        </h2>
        <FormSelectField
          label="Customer"
          name="customer"
          control={control}
          options={customerOptions}
          required
          placeholder="Select customer"
          desc="Lookup from CRM - read-only, syncs automatically"
        />
        <FormTextField
          label="Project / Request Name"
          name="title"
          register={register}
          required
          placeholder="e.g. MV Cable Connector - IP68 Marine Grade"
        />
        <FormTextField
          label="Scope Summary"
          name="scope_summary"
          register={register}
          required
          placeholder="One line: what is in scope for this request"
          desc={'Read by the Gate 1 checklist item "Project name and scope defined". Kept separate from Technical Notes so scope stays reviewable at a glance.'}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Priority &amp; Timeline
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
        <FormFieldLayout label="Priority" htmlFor="priority" required desc="Default Medium">
          <div className="grid grid-cols-4 overflow-hidden rounded-md border border-gray-200">
            {priorityOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setValue("priority", option as RequestPriority)
                }
                className={`border-r border-gray-200 px-3 py-2.5 text-xs capitalize transition last:border-r-0 ${
                  watchPriority === option
                    ? "bg-primary-700 font-semibold text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </FormFieldLayout>

        <FormDateField
          label="Required By (Due Date)"
          name="due_date_at"
          control={control}
          required
          desc="Customer-facing deadline"
        />
        </div>
      </section>

      <div className="hidden">
      <FormSection
        title="Request Classification"
        subtitle="Helps engineering route and template the project."
      >
        <FormFieldLayout
          label="Classification"
          htmlFor="classification"
          required
        >
          <div className="space-y-2">
            {classificationOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setValue("classification", option as RequestClassification)
                }
                className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left text-xs transition ${
                  watchClassification === option
                    ? "border-primary-700 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <span
                  className={`mt-0.5 h-3 w-3 rounded-full border-2 ${
                    watchClassification === option
                      ? "border-primary-700 bg-primary-700"
                      : "border-gray-300"
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-800">
                    {classificationLabelMap[option]}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {option === "new_product_design" &&
                      "Full design → prototype cycle."}
                    {option === "product_modification" &&
                      "Change to an existing approved design."}
                    {option === "prototype_development" &&
                      "Prototype-first engineering request."}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </FormFieldLayout>
        <p className="text-[11px] text-gray-500">
          All classifications follow the same path: Project Planning → Design →
          Prototype.
        </p>
      </FormSection>
      </div>

      <section className="space-y-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Details &amp; Attachments
        </h2>
        <FormTextField
          label="Technical Notes / Requirements"
          name="notes"
          as="textarea"
          rows={7}
          register={register}
          placeholder="Specs, standards, environmental conditions, quantity, special requirements"
          desc="Include any standards: IEC, ISO, API, operating conditions, constraints"
        />

        <FormFieldLayout label="Supporting Documents" htmlFor="attachments">
          <label
            htmlFor="attachments"
            className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500 hover:border-primary-300"
          >
            <span className="font-medium text-gray-600">Drop files or click to upload</span>
            <span className="text-[11px] text-gray-400">
              PDF, DWG, XLSX - max 25 MB per file
            </span>
            <input
              id="attachments"
              type="file"
              multiple
              accept=".pdf,.dwg,.xlsx,.doc,.docx"
              className="hidden"
              onChange={(event) => {
                const list = event.target.files;
                if (list) {
                  setFiles((current) => [...current, ...Array.from(list)]);
                }
              }}
            />
          </label>
          {(existingDocuments.length > 0 || files.length > 0) && (
            <ul className="mt-2 space-y-1">
              {existingDocuments.map((document) => (
                <li
                  key={document.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600"
                >
                  <span className="truncate">
                    {document.original_name ||
                      document.display_name ||
                      "Untitled document"}
                  </span>
                  <span className="ml-3 shrink-0 text-[11px] text-gray-400">
                    Existing
                  </span>
                </li>
              ))}
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, idx) => idx !== index)
                      )
                    }
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FormFieldLayout>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push(backHref)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary-700 hover:bg-primary-800"
          disabled={isPending}
        >
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
