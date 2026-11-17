"use client";

import { CalendarClock, Infinity as InfinityIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  resetPeriodLabels,
  resetPeriodOptions,
  type TokenPolicyValues,
  type TokenResetPeriod
} from "../../types/admin";

/** Shared form fields for editing a token policy. Controlled via `values`. */
export function PolicyFormFields({
  values,
  onChange,
  disabled
}: {
  values: TokenPolicyValues;
  onChange: (next: TokenPolicyValues) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof TokenPolicyValues>(
    field: K,
    next: TokenPolicyValues[K]
  ) => onChange({ ...values, [field]: next });

  const resetDayMax = values.resetPeriod === "monthly" ? 31 : 6;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="policy-allowance" className="text-sm text-gray-800">
          Token allowance
        </label>
        <Input
          id="policy-allowance"
          type="number"
          min={0}
          disabled={disabled}
          value={values.allowance}
          onChange={(event) =>
            set("allowance", Math.max(0, Number(event.target.value) || 0))
          }
        />
        <p className="text-xs text-gray-500">
          Tokens granted to the client each reset cycle.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-gray-800">Reset period</label>
        <Select
          value={values.resetPeriod}
          onValueChange={(value) =>
            set("resetPeriod", value as TokenResetPeriod)
          }
          disabled={disabled}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resetPeriodOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {resetPeriodLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Segmented control for choosing immediate vs scheduled application. */
export function ApplyModeControl({
  value,
  onChange,
  effectiveAt,
  onEffectiveAtChange,
  disabled
}: {
  value: "immediate" | "scheduled";
  onChange: (next: "immediate" | "scheduled") => void;
  effectiveAt: string;
  onEffectiveAtChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("immediate")}
          className={
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
            (value === "immediate"
              ? "bg-primary-50 text-primary-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700")
          }
        >
          Immediately
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("scheduled")}
          className={
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
            (value === "scheduled"
              ? "bg-primary-50 text-primary-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700")
          }
        >
          Schedule for later
        </button>
      </div>

      {value === "scheduled" && (
        <div className="space-y-1.5">
          <label className="text-sm text-gray-800">Effective date</label>
          <DatePicker
            value={effectiveAt}
            onChange={onEffectiveAtChange}
            min={new Date().toISOString().slice(0, 10)}
            placeholder="Select effective date"
            disabled={disabled}
          />
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <CalendarClock className="h-3 w-3" />
            Old policy stays in force until this date.
          </p>
        </div>
      )}

      {value === "immediate" && (
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <InfinityIcon className="h-3 w-3" />
          Override is active at once and the balance is recalculated.
        </p>
      )}
    </div>
  );
}
