"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface WorkflowFormValues {
  name: string;
  description: string;
}

export function WorkflowFormDialog({
  open,
  title,
  submitLabel = "Create",
  initialValues,
  isSubmitting,
  onClose,
  onSubmit
}: {
  open: boolean;
  title: string;
  submitLabel?: string;
  initialValues?: WorkflowFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: WorkflowFormValues) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? "");
      setDescription(initialValues?.description ?? "");
    }
  }, [open, initialValues]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
    
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              className="w-full border-slate-300 bg-white focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="min-h-24 w-full resize-y border-slate-300 bg-white text-sm focus-visible:border-primary-500 focus-visible:ring-primary-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-slate-300">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
