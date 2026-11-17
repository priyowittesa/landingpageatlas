"use client";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  SCHEDULE_TYPES, WEEKDAYS, scheduleHour, type SignalSchedule
} from "./signal-schedule-data";

export function ScheduleFieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} role="alert" className="text-xs text-red-600">{message}</p> : null;
}

export function SignalScheduleFields({
  id, draft, disabled, errors, onChange
}: {
  id: string;
  draft: SignalSchedule;
  disabled: boolean;
  errors: Record<string, string>;
  onChange: <K extends keyof SignalSchedule>(key: K, value: SignalSchedule[K]) => void;
}) {
  const field = (key: string) => ({
    id: `${id}-${key}`,
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${id}-${key}-error` : undefined
  });
  const error = (key: string) => (
    <ScheduleFieldError id={`${id}-${key}-error`} message={errors[key]} />
  );

  return (
    <>
      <div className="space-y-1">
        <label htmlFor={`${id}-schedule_type`} className="block text-sm font-medium">
          Schedule Type
        </label>
        <Select
          value={draft.type}
          disabled={disabled}
          onValueChange={(value: SignalSchedule["type"]) => {
            onChange("type", value);
            onChange("interval", Math.min(draft.interval || 1, SCHEDULE_TYPES[value].max));
          }}
        >
          <SelectTrigger {...field("schedule_type")} className="h-9 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SCHEDULE_TYPES).map(([value, type]) => (
              <SelectItem key={value} value={value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error("schedule_type")}
      </div>
      {draft.type !== "weekly" && (
        <div className="space-y-1">
          <label htmlFor={`${id}-interval`} className="block text-sm font-medium">
            {SCHEDULE_TYPES[draft.type].interval} Between Triggers
          </label>
          <Input
            {...field("interval")}
            type="number"
            required
            min={1}
            max={SCHEDULE_TYPES[draft.type].max}
            step={1}
            value={Number.isNaN(draft.interval) ? "" : draft.interval}
            onChange={(event) => onChange("interval", event.target.valueAsNumber)}
            className="h-9 rounded-lg px-3"
          />
          {error("interval")}
        </div>
      )}
      {draft.type === "weekly" && (
        <fieldset
          aria-describedby={errors.days_of_week ? `${id}-days_of_week-error` : undefined}
          className="space-y-2"
        >
          <legend className="text-sm font-medium">Days</legend>
          <div className="grid grid-cols-2 gap-2">
            {WEEKDAYS.map((day, index) => (
              <label key={day} className="flex items-center gap-2 text-xs font-normal">
                <input
                  type="checkbox"
                  checked={draft.daysOfWeek.includes(index)}
                  onChange={(event) => onChange("daysOfWeek", event.target.checked
                    ? [...draft.daysOfWeek, index].sort((a, b) => a - b)
                    : draft.daysOfWeek.filter((value) => value !== index))}
                  className="size-4 accent-primary-700"
                />
                {day}
              </label>
            ))}
          </div>
          {error("days_of_week")}
        </fieldset>
      )}
      {draft.type === "monthly" && (
        <div className="space-y-1">
          <label htmlFor={`${id}-day_of_month`} className="block text-sm font-medium">
            Day of month
          </label>
          <Input
            {...field("day_of_month")}
            type="number"
            required
            min={1}
            max={31}
            step={1}
            value={Number.isNaN(draft.dayOfMonth) ? "" : draft.dayOfMonth}
            onChange={(event) => onChange("dayOfMonth", event.target.valueAsNumber)}
            className="h-9 rounded-lg px-3"
          />
          <p className="text-xs leading-4 text-neutral-500">
            Months without this day are skipped.
          </p>
          {error("day_of_month")}
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor={`${id}-trigger_hour`} className="block text-sm font-medium">
          Trigger at Hour
        </label>
        <Select
          value={String(draft.hour)}
          disabled={disabled}
          onValueChange={(value) => onChange("hour", Number(value))}
        >
          <SelectTrigger {...field("trigger_hour")} className="h-9 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, hour) => (
              <SelectItem key={hour} value={String(hour)}>
                {scheduleHour(hour).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error("trigger_hour")}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${id}-trigger_minute`} className="block text-sm font-medium">
          Trigger at Minute
        </label>
        <Input
          {...field("trigger_minute")}
          type="number"
          required
          min={0}
          max={59}
          step={1}
          value={Number.isNaN(draft.minute) ? "" : draft.minute}
          onChange={(event) => onChange("minute", event.target.valueAsNumber)}
          className="h-9 rounded-lg px-3"
        />
        {draft.type === "hourly" && draft.interval === 1 && (
          <p className="text-xs leading-4 text-neutral-500">
            Runs every hour at this minute; the trigger hour has no effect.
          </p>
        )}
        {error("trigger_minute")}
      </div>
      <div className="space-y-1">
        <label htmlFor={`${id}-timezone`} className="block text-sm font-medium">
          Timezone
        </label>
        <Input
          {...field("timezone")}
          required
          value={draft.timeZone}
          onChange={(event) => onChange("timeZone", event.target.value)}
          placeholder="Asia/Jakarta"
          className="h-9 rounded-lg px-3"
        />
        <p className="text-xs leading-4 text-neutral-500">
          Trigger times use this IANA timezone.
        </p>
        {error("timezone")}
      </div>
    </>
  );
}
