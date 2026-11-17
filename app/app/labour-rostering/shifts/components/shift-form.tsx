"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Clock3, Info, NotebookPen, Save, TimerReset } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import FormFieldLayout from "@/components/FormFieldLayout";
import FormSection from "@/components/FormSection";
import FormTextField from "@/components/FormTextField";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_SHIFT,
  calculateWorkingHours,
  shiftSchema,
  type ShiftPayload,
} from "../types";

interface ShiftFormProps {
  isEdit?: boolean;
  title: string;
  description: string;
  initialValues?: ShiftPayload;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: ShiftPayload) => void | Promise<void>;
}

export function ShiftForm({
  isEdit = false,
  title,
  description,
  initialValues = EMPTY_SHIFT,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
}: ShiftFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShiftPayload>({
    resolver: zodResolver(shiftSchema),
    defaultValues: initialValues,
  });

  useEffect(() => reset(initialValues), [initialValues, reset]);

  const startTime = useWatch({ control, name: "start_time" });
  const endTime = useWatch({ control, name: "end_time" });
  const breakDuration = useWatch({ control, name: "break_duration" });
  const overnight = useWatch({ control, name: "is_overnight" });
  const autoCalculate = useWatch({ control, name: "auto_calculate_working_hours" });
  const allowOvertime = useWatch({ control, name: "allow_overtime" });
  const workingHours = useWatch({ control, name: "working_hours" });
  const descriptionValue = useWatch({ control, name: "description" });
  const notes = useWatch({ control, name: "notes" });

  useEffect(() => {
    if (!autoCalculate || !startTime || !endTime || !breakDuration) return;
    const calculated = calculateWorkingHours(startTime, endTime, breakDuration, overnight);
    if (calculated !== workingHours) {
      setValue("working_hours", calculated, { shouldValidate: true });
    }
  }, [autoCalculate, breakDuration, endTime, overnight, setValue, startTime, workingHours]);

  const submit = handleSubmit((payload) => {
    const finalPayload = payload.auto_calculate_working_hours
      ? {
          ...payload,
          working_hours: calculateWorkingHours(
            payload.start_time,
            payload.end_time,
            payload.break_duration,
            payload.is_overnight,
          ),
        }
      : payload;
    return onSubmit(finalPayload);
  });

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title={title} subtitle={description} />

      <form onSubmit={submit} className="space-y-5">
        <FormSection icon={Info} title="Basic Information" subtitle="Provide the basic details for this shift.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormTextField
              label="Shift Code"
              name="code"
              register={register}
              error={errors.code}
              required={!isEdit}
              disabled={isEdit}
              placeholder="e.g. SH-001"
              desc="Unique code to identify this shift (e.g. DS-001)"
            />
            <FormTextField
              label="Shift Name"
              name="name"
              register={register}
              error={errors.name}
              required
              placeholder="e.g. Day Shift"
              desc="Name to identify this shift (e.g. Day Shift)"
            />
            <FormFieldLayout
              label="Description (Optional)"
              htmlFor="description"
              error={errors.description?.message}
              desc="Additional notes about this shift"
              className="md:col-span-2"
            >
              <div className="relative">
                <Textarea id="description" maxLength={255} rows={4} placeholder="Describe this shift..." {...register("description")} />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">{descriptionValue?.length ?? 0}/255</span>
              </div>
            </FormFieldLayout>
          </div>
        </FormSection>

        <FormSection icon={Clock3} title="Working Schedule" subtitle="Set the start and end time for this shift.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TimeField label="Start Time" name="start_time" register={register} error={errors.start_time?.message} required />
            <TimeField label="End Time" name="end_time" register={register} error={errors.end_time?.message} required />
            <Controller
              name="is_overnight"
              control={control}
              render={({ field }) => (
                <div className="md:col-span-2">
                  <ToggleField
                    id="is_overnight"
                    label="Overnight Shift"
                    description="Enable if this shift crosses midnight (e.g. 22:00 - 06:00)"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
            {overnight && (
              <div className="flex gap-3 rounded-md border border-primary-100 bg-primary-50 p-3 text-sm text-primary-800 md:col-span-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div><strong className="block">Note</strong>For overnight shifts, the end time must be on the next day.</div>
              </div>
            )}
          </div>
        </FormSection>

        <FormSection icon={CalendarClock} title="Working Hours & Break" subtitle="Configure break duration and view calculated working hours.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TimeField
              label="Break Duration"
              name="break_duration"
              register={register}
              error={errors.break_duration?.message}
              description="Total break duration (e.g. 01:00 for 1 hour)"
            />
            <div className="space-y-3">
              <Controller
                name="auto_calculate_working_hours"
                control={control}
                render={({ field }) => (
                  <ToggleField
                    id="auto_calculate_working_hours"
                    label="Auto Calculate Working Hours"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              {autoCalculate ? (
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                  <span className="text-xs text-emerald-700">Working Hours</span>
                  <strong className="mt-1 block text-lg text-emerald-900">{formatDuration(workingHours)}</strong>
                  <span className="text-xs text-emerald-700">Calculated based on start time, end time, and break duration</span>
                </div>
              ) : (
                <TimeField label="Working Hours" name="working_hours" register={register} error={errors.working_hours?.message} required />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary-700" {...register("allow_overtime")} />
                <span>Allow Overtime <span className="font-normal text-muted-foreground">(Optional)</span>
                  <small className="mt-1 block font-normal text-muted-foreground">Enable if overtime is allowed for this shift</small>
                </span>
              </label>
            </div>

            <TimeField
              label="Overtime Threshold (Optional)"
              name="overtime_threshold"
              register={register}
              error={errors.overtime_threshold?.message}
              disabled={!allowOvertime}
              description="Overtime after working hours (e.g. 00:30 for 30 minutes)"
            />
            <div className="hidden md:block" />
            <TimeField
              label="Minimum Working Hours (Optional)"
              name="minimum_working_hours"
              register={register}
              error={errors.minimum_working_hours?.message}
              description="Minimum working hours required per day"
            />
            <TimeField
              label="Maximum Working Hours (Optional)"
              name="maximum_working_hours"
              register={register}
              error={errors.maximum_working_hours?.message}
              description="Maximum working hours allowed per day"
            />
          </div>
        </FormSection>

        <FormSection icon={NotebookPen} title="Notes (Optional)" subtitle="Add any additional notes or remarks.">
          <FormFieldLayout label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <div className="relative">
              <Textarea id="notes" maxLength={255} rows={4} placeholder="Enter notes (optional)" {...register("notes")} />
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">{notes?.length ?? 0}/255</span>
            </div>
          </FormFieldLayout>
        </FormSection>

        <div className="flex justify-between rounded-md bg-white px-5 py-4 shadow-md">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Cancel</Button>
          <Button type="submit" disabled={pending} className="min-w-36">
            <Save className="h-4 w-4" /> {pending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

function TimeField({
  label,
  name,
  register,
  error,
  required,
  disabled,
  description,
}: {
  label: string;
  name: keyof ShiftPayload;
  register: ReturnType<typeof useForm<ShiftPayload>>["register"];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
}) {
  return (
    <FormFieldLayout label={label} htmlFor={name} required={required} error={error} desc={description}>
      <div className="relative">
        <TimerReset className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input id={name} type="time" disabled={disabled} className="h-10 rounded-sm pl-9" {...register(name)} />
      </div>
    </FormFieldLayout>
  );
}

function ToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

function formatDuration(value: string) {
  const [hours = "0", minutes = "0"] = (value || "00:00").split(":");
  return `${Number(hours)}h ${String(minutes).padStart(2, "0")}m`;
}
