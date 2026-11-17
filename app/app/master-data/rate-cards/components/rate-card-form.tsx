"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeDollarSign, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import FormSection from "@/components/FormSection";
import FormSelectField from "@/components/FormSelectField";
import FormTextField from "@/components/FormTextField";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormFieldLayout from "@/components/FormFieldLayout";
import {
  EMPTY_RATE_CARD,
  calculateDailyRate,
  rateCardSchema,
  type RateCardPayload,
} from "../types";
import { useRateCardRoles } from "../use-rate-cards";

interface RateCardFormProps {
  title: string;
  description: string;
  initialValues?: RateCardPayload;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: RateCardPayload) => void | Promise<void>;
}

export function RateCardForm({
  title,
  description,
  initialValues = EMPTY_RATE_CARD,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
}: RateCardFormProps) {
  const { data: roles = [], isLoading: loadingRoles, isError: rolesError } = useRateCardRoles();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RateCardPayload>({
    resolver: zodResolver(rateCardSchema),
    defaultValues: initialValues,
  });

  useEffect(() => reset(initialValues), [initialValues, reset]);

  const baseRate = useWatch({ control, name: "base_rate" });
  const unit = useWatch({ control, name: "unit" });
  const currency = useWatch({ control, name: "currency" });
  const dailyRate = calculateDailyRate(Number(baseRate), unit);

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title={title} subtitle={description} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          icon={BadgeDollarSign}
          title="Rate Card Information"
          subtitle="Enter the rate card basic details."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <FormTextField
              label="Rate Card Code"
              name="code"
              register={register}
              error={errors.code}
              required
              placeholder="e.g. RC-009"
              className="md:col-span-3"
            />
            <FormTextField
              label="Rate Card Name"
              name="name"
              register={register}
              error={errors.name}
              required
              placeholder="e.g. Senior Developer"
              className="md:col-span-3"
            />
            <FormSelectField
              label="Applicable Roles"
              name="role_ids"
              control={control}
              error={errors.role_ids}
              options={roles.map((role) => ({ label: role.name, value: role.id }))}
              multiple
              search
              required
              placeholder={loadingRoles ? "Loading roles..." : "Select roles"}
              searchPlaceholder="Search role..."
              emptyMessage={rolesError ? "Failed to load roles." : "No role found."}
              className="md:col-span-6"
            />
            <FormSelectField
              label="Currency"
              name="currency"
              control={control}
              error={errors.currency}
              required
              options={[
                { label: "IDR", value: "IDR" },
                { label: "USD", value: "USD" },
              ]}
              className="md:col-span-2"
            />
            <FormTextField
              label="Base Rate"
              name="base_rate"
              register={register}
              error={errors.base_rate}
              required
              type="number"
              placeholder="0.00"
              className="md:col-span-2"
            />
            <FormSelectField
              label="Per Unit"
              name="unit"
              control={control}
              error={errors.unit}
              required
              options={["Hour", "Day", "Week", "Month"].map((unit) => ({ label: unit, value: unit }))}
              className="md:col-span-2"
            />
            <FormFieldLayout
              label="Calculated Rate / Day (Read-only)"
              htmlFor="calculated_daily_rate"
              className="md:col-span-6"
            >
              <Input
                id="calculated_daily_rate"
                readOnly
                value={`${currency} ${formatAmount(dailyRate)} / Day`}
                className="h-10 rounded-sm bg-slate-50 font-semibold"
              />
            </FormFieldLayout>
          </div>
        </FormSection>

        <div className="flex justify-between rounded-md bg-white px-5 py-4 shadow-md dark:bg-zinc-950">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} className="min-w-36">
            <Save />
            {pending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
