"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, SYNONYM_CATEGORIES, type SynonymCategory, type SynonymDraft, type SynonymTerm } from "./use-synonyms";

type Errors = { term?: string; synonyms?: string; submit?: string };

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

/** Words already used by another term are rejected by the API (409); its message is shown under the form. */
function SynonymForm({
  entry,
  initialTerm,
  saving,
  onCancel,
  onSave,
}: {
  entry: SynonymTerm | null;
  initialTerm: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (draft: SynonymDraft) => Promise<void>;
}) {
  const [term, setTerm] = useState(entry?.term ?? initialTerm);
  const [items, setItems] = useState<string[]>(entry?.synonyms ?? []);
  const [category, setCategory] = useState<SynonymCategory>(entry?.category ?? "symptom");
  const [enabled, setEnabled] = useState(entry?.isActive ?? true);
  const [pending, setPending] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const addSynonym = (raw: string): string[] => {
    const value = raw.trim().toLowerCase();
    if (!value) return items;
    const next = items.includes(value) || value === term.trim().toLowerCase() ? items : [...items, value];
    setItems(next);
    setPending("");
    setErrors((current) => ({ ...current, synonyms: undefined, submit: undefined }));
    return next;
  };

  const save = () => {
    const normalizedTerm = term.trim().toLowerCase();
    const nextItems = pending.trim() ? addSynonym(pending) : items;
    const nextErrors: Errors = {};
    if (!normalizedTerm) nextErrors.term = "A primary term is required.";
    if (!nextItems.length) nextErrors.synonyms = "Add at least one synonym.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ term: normalizedTerm, synonyms: nextItems, category, isActive: enabled }).catch((error: Error) =>
      setErrors({ submit: error.message })
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry ? "Edit term" : "Add term"}</DialogTitle>
        <DialogDescription>All synonyms are read as the primary term when searching for similar cases</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label htmlFor="synonym-term" className="mb-1.5 block text-sm font-medium">
            Primary term <span className="text-red-600">*</span>
          </label>
          <Input
            id="synonym-term"
            value={term}
            placeholder="Example: bearing"
            aria-invalid={Boolean(errors.term)}
            onChange={(event) => setTerm(event.target.value)}
          />
          {errors.term && <FieldError message={errors.term} />}
        </div>

        <div>
          <label htmlFor="synonym-input" className="mb-1.5 block text-sm font-medium">
            Synonyms <span className="text-red-600">*</span>
          </label>
          <div
            className={cn(
              "flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 focus-within:border-primary-400 focus-within:ring-[3px] focus-within:ring-primary-100",
              errors.synonyms && "border-red-500"
            )}
          >
            {items.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 py-0.5 pl-2 pr-1 text-sm text-primary-800"
              >
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  className="grid h-[18px] w-[18px] place-items-center rounded hover:bg-primary-100"
                  onClick={() => setItems((current) => current.filter((value) => value !== item))}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              id="synonym-input"
              value={pending}
              placeholder={items.length ? "" : "Type, then press Enter"}
              className="h-7 min-w-[120px] flex-1 border-0 bg-transparent text-sm outline-none"
              onChange={(event) => setPending(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addSynonym(pending);
                } else if (event.key === "Backspace" && !pending && items.length) {
                  setItems((current) => current.slice(0, -1));
                }
              }}
            />
          </div>
          {errors.synonyms ? (
            <FieldError message={errors.synonyms} />
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">
              Abbreviations, shop-floor slang, or Indonesian terms. Press Enter to add.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(value) => setCategory(value as SynonymCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYNONYM_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="synonym-enabled" className="mb-1.5 block text-sm font-medium">
              Status
            </label>
            <div className="flex h-9 items-center justify-between rounded-md border px-3">
              <span className="text-sm">Active</span>
              <Switch id="synonym-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </div>
        {errors.submit && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {errors.submit}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={saving} onClick={save}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {entry ? "Save changes" : "Add term"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function SynonymDialog({
  open,
  entry,
  initialTerm = "",
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  entry: SynonymTerm | null;
  initialTerm?: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: SynonymDraft) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <SynonymForm
            key={entry?.id ?? `new-${initialTerm}`}
            entry={entry}
            initialTerm={initialTerm}
            saving={saving}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
