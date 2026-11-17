"use client";

import { useEffect, useMemo, useState } from "react";

import { useAssetList } from "../asset-list/use-assets";
import { useFrequencyTypeOptions } from "@/app/app/master-data/equipment/use-equipment";
import { LazySelect } from "@/components/LazySelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreatePreventive } from "./use-preventives";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const emptyForm = {
  assetId: "",
  frequencyType: "",
  thresholdValue: "",
  currentUsage: "",
  lastServiceUsage: "",
};

export function PreventiveFormDialog(props: Props) {
  return <PreventiveFormDialogContent key={String(props.open)} {...props} />;
}

function PreventiveFormDialogContent({ open, onOpenChange }: Props) {
  const create = useCreatePreventive();
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [frequencySearch, setFrequencySearch] = useState("");
  const [debouncedAssetSearch, setDebouncedAssetSearch] = useState("");
  const [debouncedFrequencySearch, setDebouncedFrequencySearch] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedAssetSearch(assetSearch.trim()),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [assetSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedFrequencySearch(frequencySearch.trim()),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [frequencySearch]);

  const assets = useAssetList({
    search: debouncedAssetSearch || undefined,
    page_size: 50,
  });
  const frequencies = useFrequencyTypeOptions(
    debouncedFrequencySearch || undefined,
    open,
  );
  const assetOptions = useMemo(
    () =>
      (assets.data?.items ?? []).map((asset) => ({
        value: asset.id,
        label: `${asset.code} - ${asset.name}`,
      })),
    [assets.data?.items],
  );
  const frequencyOptions = useMemo(
    () =>
      frequencies.items.map((frequency) => ({
        value: frequency.label,
        label: frequency.label,
      })),
    [frequencies.items],
  );

  const invalid =
    !form.assetId ||
    !form.frequencyType ||
    form.thresholdValue === "" ||
    Number(form.thresholdValue) <= 0 ||
    form.currentUsage === "" ||
    Number(form.currentUsage) < 0 ||
    form.lastServiceUsage === "" ||
    Number(form.lastServiceUsage) < 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    await create.mutateAsync({
      asset_id: form.assetId,
      frequency_type: form.frequencyType,
      threshold_value: Number(form.thresholdValue),
      current_usage: Number(form.currentUsage),
      last_service_usage: Number(form.lastServiceUsage),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Preventive Maintenance</DialogTitle>
          <DialogDescription>
            Add a preventive-maintenance rule for an equipment asset.
          </DialogDescription>
        </DialogHeader>
        <form id="preventive-form" onSubmit={submit} className="space-y-4 py-1">
          <LazySelect
            label="Asset"
            name="asset_id"
            required
            value={form.assetId}
            onChange={(value) => setForm((current) => ({ ...current, assetId: value }))}
            options={assetOptions}
            totalLoaded={assetOptions.length}
            isLoading={assets.isLoading}
            isFetchingNextPage={false}
            hasMore={false}
            onLoadMore={() => undefined}
            search={assetSearch}
            onSearchChange={setAssetSearch}
            placeholder="Select asset"
            searchPlaceholder="Search asset code or name..."
            emptyMessage="No asset found."
            error={submitted && !form.assetId ? "Asset is required." : undefined}
          />
          <LazySelect
            label="Frequency Type"
            name="frequency_type"
            required
            value={form.frequencyType}
            onChange={(value) => setForm((current) => ({ ...current, frequencyType: value }))}
            options={frequencyOptions}
            totalLoaded={frequencyOptions.length}
            isLoading={frequencies.isLoading}
            isFetchingNextPage={frequencies.isFetchingNextPage}
            hasMore={frequencies.hasMore}
            onLoadMore={() => void frequencies.loadMore()}
            search={frequencySearch}
            onSearchChange={setFrequencySearch}
            placeholder="Select frequency type"
            searchPlaceholder="Search frequency type..."
            emptyMessage="No frequency type found."
            error={submitted && !form.frequencyType ? "Frequency type is required." : undefined}
          />
          <NumberField
            label="Threshold Value"
            value={form.thresholdValue}
            onChange={(value) => setForm((current) => ({ ...current, thresholdValue: value }))}
            error={submitted && (form.thresholdValue === "" || Number(form.thresholdValue) <= 0)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Current Usage"
              value={form.currentUsage}
              onChange={(value) => setForm((current) => ({ ...current, currentUsage: value }))}
              error={submitted && (form.currentUsage === "" || Number(form.currentUsage) < 0)}
              allowZero
            />
            <NumberField
              label="Last Service Usage"
              value={form.lastServiceUsage}
              onChange={(value) => setForm((current) => ({ ...current, lastServiceUsage: value }))}
              error={submitted && (form.lastServiceUsage === "" || Number(form.lastServiceUsage) < 0)}
              allowZero
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={create.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="preventive-form" disabled={create.isPending}>
            {create.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({ label, value, onChange, error, allowZero = false }: { label: string; value: string; onChange: (value: string) => void; error: boolean; allowZero?: boolean }) {
  return (
    <label className="block text-xs font-medium">
      {label} <span className="text-red-500">*</span>
      <input type="number" min={allowZero ? 0 : 0.01} step="any" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" className={`mt-2 h-10 w-full rounded-sm border px-3 text-sm outline-none focus:ring-2 focus:ring-primary-200 ${error ? "border-red-500" : ""}`} />
      {error ? <span className="mt-1 block text-[11px] text-red-500">Enter a valid value.</span> : null}
    </label>
  );
}
