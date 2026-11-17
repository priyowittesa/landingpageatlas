"use client";

import { TriangleAlert, Trash2 } from "lucide-react";
import { GuidanceBanner } from "./GuidanceBanner";
import { useFieldArray, useWatch, UseFormReturn } from "react-hook-form";
// import {
//   DailyDiaryFormValues,
//   DailyDiaryIssue,
// } from "@/types/type-daily-diaries";
import type {
  DailyDiaryFormValues,
  DailyDiaryIssue
} from "./dailyDiaryFormSchema";

import { Button } from "@/components/ui/button";
import FormTextField from "@/components/FormTextField";

const emptyIssue: DailyDiaryIssue = {
  type: "",
  delay_hours: 0,
  status: "",
  description: "",
  responsible_party: "",
  corrective_action: ""
};

export function IssuesStep({
  form,
  onBlurSave
}: {
  form: UseFormReturn<DailyDiaryFormValues>;
  onBlurSave?: () => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "issues"
  });

  const watchedIssues =
    useWatch({ control: form.control, name: "issues" }) ?? [];

  const totalDelayHours = watchedIssues.reduce(
    (total, issue) => total + Number(issue?.delay_hours || 0),
    0
  );

  return (
    <div>
      <GuidanceBanner step="issues" />
      {fields.length === 0 ? (
        <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-center py-7">
          <TriangleAlert size={28} className="text-gray-300" />
          <p className="mt-2.5 text-sm font-semibold text-gray-500">
            No Issues or Delays Recorded
          </p>
          <p className="text-xs text-gray-400">
            Click below to log a delay, issue, or risk.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-red-700 border border-red-200">
            <div>
              <span className="block font-extrabold">{fields.length}</span>
              <span className="text-xs">Issues Logged</span>
            </div>
            <div>
              <span className="block font-extrabold">{totalDelayHours}h</span>
              <span className="text-xs">Total Delay</span>
            </div>
            <div>
              <span className="block font-extrabold">{fields.length}</span>
              <span className="text-xs">Open Issues</span>
            </div>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-rose-100 text-center">
                  <span className="text-xs font-bold text-red-700">
                    {index + 1}
                  </span>
                </div>

                <div className="w-full">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <FormTextField
                      label="Issue Type"
                      name={`issues.${index}.type`}
                      register={form.register}
                      error={form.formState.errors.issues?.[index]?.type}
                      inputClassName="h-9"
                      onBlur={onBlurSave}
                    />
                    <FormTextField
                      label="Delay Hours"
                      type="number"
                      name={`issues.${index}.delay_hours`}
                      register={form.register}
                      error={form.formState.errors.issues?.[index]?.delay_hours}
                      inputClassName="h-9"
                      placeholder="0"
                      onBlur={onBlurSave}
                    />
                    <FormTextField
                      label="Status"
                      name={`issues.${index}.status`}
                      register={form.register}
                      error={form.formState.errors.issues?.[index]?.status}
                      inputClassName="h-9"
                      onBlur={onBlurSave}
                    />
                  </div>

                  <FormTextField
                    label="Description"
                    name={`issues.${index}.description`}
                    as="textarea"
                    rows={4}
                    placeholder="Describe the issue or delay in detail"
                    register={form.register}
                    error={form.formState.errors.issues?.[index]?.description}
                    onBlur={onBlurSave}
                  />

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <FormTextField
                      label="Responsible Party"
                      name={`issues.${index}.responsible_party`}
                      register={form.register}
                      error={
                        form.formState.errors.issues?.[index]?.responsible_party
                      }
                      inputClassName="h-9"
                      placeholder="Who is responsible?"
                      onBlur={onBlurSave}
                    />
                    <FormTextField
                      label="Corrective Action"
                      name={`issues.${index}.corrective_action`}
                      register={form.register}
                      error={
                        form.formState.errors.issues?.[index]?.corrective_action
                      }
                      inputClassName="h-9"
                      className="col-span-2"
                      placeholder="What action was or will be taken?"
                      onBlur={onBlurSave}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    remove(index);
                    onBlurSave?.();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outlinePrimary"
        onClick={() => {
          append({ ...emptyIssue });
          onBlurSave?.();
        }}
        className="w-full mt-3"
      >
        + Log Issue or Delay
      </Button>
    </div>
  );
}
