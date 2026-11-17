"use client";

import { useState } from "react";
import { GuidanceBanner } from "./GuidanceBanner";
import { LocationPickerDialog } from "./LocationPickerDialog";
import FormTextField from "@/components/FormTextField";
import { useApplyProjectWeather } from "../../hooks/useDailyDiaries";

import type { UseFormReturn } from "react-hook-form";
import { DailyDiaryFormValues } from "./dailyDiaryFormSchema";

const inputClass =
  "h-9 w-full rounded-md border border-gray-200 px-3 text-xs outline-none focus:border-primary-400";

export function SiteInfoStep({
  form,
  projectId,
  onBlurSave
}: {
  form: UseFormReturn<DailyDiaryFormValues>;
  projectId: string;
  onBlurSave?: () => void;
}) {
  const applyWeather = useApplyProjectWeather();
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleConfirmLocation({
    latitude,
    longitude
  }: {
    latitude: number;
    longitude: number;
  }) {
    try {
      const weather = await applyWeather.mutateAsync({
        projectId,
        latitude,
        longitude
      });

      form.setValue("weather_condition", weather.weather_condition, {
        shouldValidate: true
      });
      form.setValue("weather_temperature_c", weather.weather_temperature_c, {
        shouldValidate: true
      });
      form.setValue("weather_humidity_pct", weather.weather_humidity_pct, {
        shouldValidate: true
      });
      form.setValue("weather_wind_kmh", weather.weather_wind_kmh, {
        shouldValidate: true
      });
    } catch {
      // surfaced via mutation meta
    }
  }

  return (
    <div>
      <GuidanceBanner
        step="site"
        onAction={() => setPickerOpen(true)}
        actionLoading={applyWeather.isPending}
      />

      <LocationPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onConfirm={handleConfirmLocation}
      />

      <section className="mt-3 rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm">
        <h3 className="text-base font-semibold">Weather Conditions</h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormTextField
            label="Condition"
            name="weather_condition"
            register={form.register}
            inputClassName={inputClass}
            error={form.formState.errors.weather_condition}
            required
            onBlur={onBlurSave}
          />
          <FormTextField
            label="Temperature (°C)"
            name="weather_temperature_c"
            type="number"
            register={form.register}
            inputClassName={inputClass}
            error={form.formState.errors.weather_temperature_c}
            required
            onBlur={onBlurSave}
          />
          <FormTextField
            label="Humidity (%)"
            name="weather_humidity_pct"
            type="number"
            register={form.register}
            inputClassName={inputClass}
            error={form.formState.errors.weather_humidity_pct}
            required
            onBlur={onBlurSave}
          />
          <FormTextField
            label="Wind (km/h)"
            name="weather_wind_kmh"
            type="number"
            register={form.register}
            inputClassName={inputClass}
            error={form.formState.errors.weather_wind_kmh}
            required
            onBlur={onBlurSave}
          />
        </div>

        <FormTextField
          label="Impact on Work"
          name="weather_impact_on_work"
          register={form.register}
          error={form.formState.errors.weather_impact_on_work}
          inputClassName={inputClass}
          required
          onBlur={onBlurSave}
        />

        <h3 className="text-base font-semibold text-gray-900">
          Site Conditions
        </h3>
        <div className="mt-2">
          <FormTextField
            label="General Site Conditions & Observations"
            name="site_conditions_notes"
            as="textarea"
            rows={4}
            placeholder="Describe overall site status, any notable conditions, or general observations..."
            register={form.register}
            error={form.formState.errors.site_conditions_notes}
            required
            onBlur={onBlurSave}
          />
        </div>
      </section>
    </div>
  );
}
