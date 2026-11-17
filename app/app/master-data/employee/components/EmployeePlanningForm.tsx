import { BadgeDollarSign } from "lucide-react";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import FormFieldLayout from "@/components/FormFieldLayout";
import FormSelectField from "@/components/FormSelectField";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EmployeeForm } from "@/types/type-employee";
import { EmployeeSection } from "./employee-section";
import type { RateCardOption } from "./employee-form";

export default function EmployeePlanningForm({
  rateCards,
}: {
  rateCards: RateCardOption[];
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<EmployeeForm>();
  const selectedRateCardId = useWatch({
    control,
    name: "rate_card_id",
  });

  useEffect(() => {
    if (!rateCards.length) return;

    const match = selectedRateCardId
      ? rateCards.find((card) => card.value === selectedRateCardId)
      : undefined;

    setValue("cost_rate", match ? String(match.baseRate) : "", {
      shouldValidate: true,
    });
  }, [rateCards, selectedRateCardId, setValue]);

  const selectedUnit = selectedRateCardId
    ? rateCards.find((card) => card.value === selectedRateCardId)?.unit
    : undefined;

  return (
    <EmployeeSection
      title="Planning & Financial"
      subtitle="Set rate cards and financial information."
      icon={BadgeDollarSign}
    >
      <div className="grid grid-cols-6 gap-4">
        <FormSelectField
          label="Rate Card"
          name="rate_card_id"
          control={control}
          error={errors.rate_card_id}
          placeholder="Select rate card"
          options={rateCards}
          search
          tooltip="Rate card used for employee planning."
          className="col-span-6"
        />

        <div className="col-span-6 rounded-lg border bg-muted/10 p-4">
          <p className="mb-3 text-sm font-medium">Cost Rate</p>
          <FormFieldLayout
            label="Rate"
            htmlFor="cost_rate"
            error={errors.cost_rate?.message}
          >
            <div
              className={cn(
                "flex h-10 overflow-hidden rounded-sm border bg-white",
                errors.cost_rate && "border-red-500",
              )}
            >
              <Input
                id="cost_rate"
                inputMode="decimal"
                placeholder="0.00"
                readOnly
                className="h-full flex-1 rounded-none border-0 shadow-none focus-visible:ring-0"
                {...register("cost_rate")}
              />
              <span className="flex shrink-0 items-center px-4 text-xs text-muted-foreground">
                / {selectedUnit ?? "Hour"}
              </span>
            </div>
          </FormFieldLayout>
        </div>
      </div>
    </EmployeeSection>
  );
}