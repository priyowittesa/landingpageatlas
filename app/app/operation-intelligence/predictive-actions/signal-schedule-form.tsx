"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { schedulePayload, schedulePayloadSchema, type SignalSchedule } from "./signal-schedule-data";
import { ScheduleFieldError, SignalScheduleFields } from "./signal-schedule-fields";

export function SignalScheduleForm({
  schedule,
  canStop,
  canManage,
  busy,
  fieldErrors,
  onEdit,
  onUpdate,
  onStop
}: {
  schedule: SignalSchedule;
  canStop: boolean;
  canManage: boolean;
  busy: boolean;
  fieldErrors: Record<string, string>;
  onEdit: () => void;
  onUpdate: (draft: SignalSchedule) => void;
  onStop: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(schedule);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const errors = { ...fieldErrors, ...validationErrors };
  const disabled = !canManage || busy;

  function change<K extends keyof SignalSchedule>(key: K, value: SignalSchedule[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setValidationErrors({});
    onEdit();
  }

  return (
    <form
      aria-label="Schedule settings"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        const result = schedulePayloadSchema.safeParse(schedulePayload(draft));
        if (!result.success) {
          setValidationErrors(Object.fromEntries(result.error.issues.map((issue) =>
            [issue.path.join("."), issue.message]
          )));
          return;
        }
        onUpdate(draft);
      }}
    >
      <fieldset disabled={disabled} className="space-y-4">
        <SignalScheduleFields id={id} draft={draft} disabled={disabled} errors={errors} onChange={change} />
        <fieldset className="space-y-3 border-t border-neutral-200 pt-4">
          <legend className="sr-only">Schedule end</legend>
          <div className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 gap-y-1">
            <input
              id={`${id}-never`}
              type="radio"
              name={`${id}-end`}
              checked={draft.end === "never"}
              onChange={() => change("end", "never")}
              className="mt-0.5 size-4 accent-neutral-900"
              aria-describedby={`${id}-never-description`}
            />
            <label htmlFor={`${id}-never`} className="text-sm font-medium">
              No end date
            </label>
            <p
              id={`${id}-never-description`}
              className="col-start-2 text-sm leading-5 text-neutral-500"
            >
              The schedule will run indefinitely until manually stopped.
            </p>
          </div>
          <div className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 gap-y-2">
            <input
              id={`${id}-runs`}
              type="radio"
              name={`${id}-end`}
              checked={draft.end === "runs"}
              onChange={() => change("end", "runs")}
              className="mt-0.5 size-4 accent-neutral-900"
            />
            <label htmlFor={`${id}-runs`} className="text-sm font-medium">
              End after runs
            </label>
            <Input
              aria-label="Number of runs"
              aria-invalid={!!errors.end_after_runs}
              aria-describedby={errors.end_after_runs ? `${id}-end_after_runs-error` : undefined}
              type="number"
              min={1}
              step={1}
              required={draft.end === "runs"}
              disabled={draft.end !== "runs"}
              value={Number.isNaN(draft.runs) ? "" : draft.runs}
              onChange={(event) => change("runs", event.target.valueAsNumber)}
              className="col-start-2 h-9 rounded-lg px-3"
            />
            <div className="col-start-2">
              <ScheduleFieldError id={`${id}-end_after_runs-error`} message={errors.end_after_runs} />
            </div>
          </div>
          <div className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 gap-y-2">
            <input
              id={`${id}-date`}
              type="radio"
              name={`${id}-end`}
              checked={draft.end === "date"}
              onChange={() => change("end", "date")}
              className="mt-0.5 size-4 accent-neutral-900"
            />
            <label htmlFor={`${id}-date`} className="text-sm font-medium">
              End on
            </label>
            <div className="relative col-start-2">
              <Image
                src="/images/operations-intelligence/schedule/calendar.svg"
                alt=""
                width={16}
                height={16}
                className="pointer-events-none absolute left-3 top-2.5"
              />
              <Input
                aria-label="End date"
                aria-invalid={!!errors.end_date}
                aria-describedby={errors.end_date ? `${id}-end_date-error` : undefined}
                type="date"
                required={draft.end === "date"}
                disabled={draft.end !== "date"}
                value={draft.date}
                onChange={(event) => change("date", event.target.value)}
                className="h-9 rounded-lg pl-9 pr-3"
              />
              <ScheduleFieldError id={`${id}-end_date-error`} message={errors.end_date} />
            </div>
          </div>
          <ScheduleFieldError id={`${id}-end_type-error`} message={errors.end_type} />
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={!canStop || disabled}
            onClick={onStop}
            className="h-7 rounded-lg px-2 text-xs"
          >
            Stop Now
          </Button>
          <Button
            type="submit"
            className="h-7 rounded-lg bg-neutral-900 px-2 text-xs hover:bg-neutral-800"
          >
            Update
          </Button>
        </div>
      </fieldset>
      {!canManage && (
        <p className="mt-3 text-xs text-neutral-500">You have view-only access.</p>
      )}
      <p className="mt-3 text-xs leading-4 text-neutral-500">
        Updating restarts the schedule and resets its run count.
      </p>
      <p className="mt-2 text-xs leading-4 text-neutral-500">
        Custom trigger timing is pending AI-engine support. Stop and end
        conditions already apply.
      </p>
    </form>
  );
}
