"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
import type { PreventiveMaintenance } from "./types";
import {
  usePreventiveList,
  useReportPreventiveBreakdown,
  type PreventiveBreakdownPayload,
} from "./use-preventives";

type Props = {
  open: boolean;
  item?: PreventiveMaintenance | null;
  onOpenChange: (open: boolean) => void;
};

const emptyForm = {
  preventiveId: "",
  breakdownDescription: "",
  severity: "",
  impactDescription: "",
  occurredAt: "",
  estimatedReturnAt: "",
};

export function PreventiveBreakdownDialog(props: Props) {
  return <PreventiveBreakdownDialogForm key={`${props.item?.id ?? "new"}-${props.open}`} {...props} />;
}

function PreventiveBreakdownDialogForm({ open, item, onOpenChange }: Props) {
  const report = useReportPreventiveBreakdown();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    preventiveId: item?.id ?? "",
  }));
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const preventives = usePreventiveList({
    search: debouncedSearch || undefined,
    pageSize: 50,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const options = useMemo(() => {
    const rows = preventives.data?.items ?? [];
    const values = rows.map((row) => ({
      value: row.id,
      label: `${row.assetCode} - ${row.assetName}`,
    }));
    if (item && !values.some((option) => option.value === item.id)) {
      values.unshift({ value: item.id, label: `${item.assetCode} - ${item.assetName}` });
    }
    return values;
  }, [item, preventives.data?.items]);

  const selected = item?.id === form.preventiveId
    ? item
    : preventives.data?.items.find((row) => row.id === form.preventiveId);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  const invalid =
    !selected ||
    !form.breakdownDescription.trim() ||
    !form.severity ||
    !form.impactDescription.trim() ||
    !form.occurredAt ||
    !form.estimatedReturnAt ||
    files.length === 0;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((file) => file.type.startsWith("image/"));
    setFiles((current) => [...current, ...incoming].slice(0, 5));
  }

  function close(force = false) {
    if (report.isPending && !force) return;
    previews.forEach(({ url }) => URL.revokeObjectURL(url));
    onOpenChange(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!selected || invalid) return;
    const payload: PreventiveBreakdownPayload = {
      preventive_id: selected.id,
      asset_id: selected.assetId,
      breakdown_description: form.breakdownDescription.trim(),
      severity: form.severity as PreventiveBreakdownPayload["severity"],
      impact_description: form.impactDescription.trim(),
      occurred_at: new Date(form.occurredAt).toISOString(),
      estimated_return_at: new Date(form.estimatedReturnAt).toISOString(),
    };
    await report.mutateAsync({ payload, files });
    close(true);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Report Breakdown</DialogTitle>
          <DialogDescription className="sr-only">
            Report a breakdown from preventive maintenance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="mx-6 my-5 space-y-4 rounded-xl border p-5">
            <LazySelect
              label="Preventive Asset"
              name="preventive_id"
              required
              value={form.preventiveId}
              onChange={(value) => setForm((current) => ({ ...current, preventiveId: value }))}
              options={options}
              totalLoaded={options.length}
              isLoading={preventives.isLoading}
              isFetchingNextPage={false}
              hasMore={false}
              onLoadMore={() => undefined}
              search={search}
              onSearchChange={setSearch}
              placeholder="Select preventive asset"
              searchPlaceholder="Search asset code or name..."
              emptyMessage="No preventive asset found."
            />
            {submitted && !selected ? <Error /> : null}

            <Field label="Breakdown Description">
              <textarea
                value={form.breakdownDescription}
                onChange={(event) => setForm((current) => ({ ...current, breakdownDescription: event.target.value }))}
                placeholder="Type here"
                className="min-h-20 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-primary-200"
              />
              {submitted && !form.breakdownDescription.trim() ? <Error /> : null}
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm"
              >
                <option value="">Select severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {submitted && !form.severity ? <Error /> : null}
            </Field>
            <Field label="Impact Description">
              <textarea
                value={form.impactDescription}
                onChange={(event) => setForm((current) => ({ ...current, impactDescription: event.target.value }))}
                placeholder="Type here"
                className="min-h-20 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-primary-200"
              />
              {submitted && !form.impactDescription.trim() ? <Error /> : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Occurred At">
                <input type="datetime-local" value={form.occurredAt} onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))} className="h-10 w-full rounded-lg border px-3 text-sm" />
                {submitted && !form.occurredAt ? <Error /> : null}
              </Field>
              <Field label="Estimated Return to Service">
                <input type="datetime-local" value={form.estimatedReturnAt} onChange={(event) => setForm((current) => ({ ...current, estimatedReturnAt: event.target.value }))} className="h-10 w-full rounded-lg border px-3 text-sm" />
                {submitted && !form.estimatedReturnAt ? <Error /> : null}
              </Field>
            </div>
            <Field label="Photos">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  addFiles(event.dataTransfer.files);
                }}
                className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border bg-gray-50 text-xs text-gray-500 hover:bg-gray-100"
              >
                <ImagePlus className="h-5 w-5" />
                Upload or drag files to here
              </button>
              <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
              {submitted && files.length === 0 ? <Error /> : null}
              {previews.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-3">
                  {previews.map(({ file, url }, index) => (
                    <div key={`${file.name}-${file.lastModified}`} className="relative h-20 w-20">
                      <Image src={url} alt={file.name} fill unoptimized className="rounded-lg object-cover" />
                      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </Field>
          </div>
          <DialogFooter className="border-t px-6 py-5">
            <Button type="button" variant="outline" disabled={report.isPending} onClick={() => close()}>Cancel</Button>
            <Button type="submit" disabled={report.isPending} className="bg-gray-950 hover:bg-gray-800">
              {report.isPending ? "Reporting..." : "Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium">{label} <span className="text-red-500">*</span><div className="mt-2">{children}</div></label>;
}

function Error() {
  return <p className="mt-1 text-[11px] text-red-500">This field is required.</p>;
}
