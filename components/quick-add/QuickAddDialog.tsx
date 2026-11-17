"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import FormFieldLayout from "@/components/FormFieldLayout";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type QuickAddFieldType =
  | "text"
  | "number"
  | "textarea"
  | "switch"
  | "select"
  | "date"
  | "tags";

export type QuickAddField = {
  name: string;
  label: string;
  type?: QuickAddFieldType;
  required?: boolean;
  placeholder?: string;
  desc?: string;
  colSpan?: 1 | 2;
  options?: { label: string; value: string }[];
};

export type QuickAddValue = string | boolean | string[];
export type QuickAddValues = Record<string, QuickAddValue>;

type QuickAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: QuickAddField[];
  initialValues?: QuickAddValues;
  submitLabel?: string;
  isLoading?: boolean;
  onSubmit: (values: QuickAddValues) => void | Promise<void>;
};

function defaultValue(field: QuickAddField): QuickAddValue {
  if (field.type === "switch") return false;
  if (field.type === "tags") return [];
  return "";
}

function isEmpty(value: QuickAddValue): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return false;
  return value.trim() === "";
}

export default function QuickAddDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialValues,
  submitLabel = "Save",
  isLoading = false,
  onSubmit,
}: QuickAddDialogProps) {
  const buildDefaults = (): QuickAddValues => {
    const base: QuickAddValues = {};
    fields.forEach((field) => {
      base[field.name] = initialValues?.[field.name] ?? defaultValue(field);
    });
    return base;
  };

  const [values, setValues] = useState<QuickAddValues>(buildDefaults);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset the form each time the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setValues(buildDefaults());
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (name: string, value: QuickAddValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && isEmpty(values[field.name])) {
        nextErrors[field.name] = `${field.label} is required.`;
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={(value) => setField(field.name, value)}
            />
          ))}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-32"
          >
            <Save className="h-4 w-4" /> {isLoading ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: QuickAddField;
  value: QuickAddValue;
  error?: string;
  onChange: (value: QuickAddValue) => void;
}) {
  const type = field.type ?? "text";
  const spanClass = field.colSpan === 2 ? "sm:col-span-2" : undefined;

  if (type === "switch") {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-md border border-gray-200 px-4 py-3",
          spanClass,
        )}
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {field.label}
          </span>
          {field.desc && (
            <span className="text-xs text-muted-foreground">{field.desc}</span>
          )}
        </div>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  return (
    <FormFieldLayout
      label={field.label}
      htmlFor={field.name}
      required={field.required}
      error={error}
      desc={field.desc}
      className={spanClass}
    >
      {type === "textarea" ? (
        <Textarea
          id={field.name}
          rows={3}
          placeholder={field.placeholder}
          className="rounded-sm px-4 py-2 text-sm"
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : type === "select" ? (
        <Select
          value={String(value || "")}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger
            id={field.name}
            aria-invalid={!!error}
            className={cn(
              "h-10 w-full rounded-sm",
              error && "border-red-500 focus:ring-red-100",
            )}
          >
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "tags" ? (
        <Input
          id={field.name}
          placeholder={field.placeholder ?? "Comma separated values"}
          aria-invalid={!!error}
          className={cn(
            "h-10 rounded-sm px-4 text-sm",
            error && "border-red-500 focus-visible:ring-red-500",
          )}
          value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          onChange={(event) =>
            onChange(
              event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            )
          }
        />
      ) : (
        <Input
          id={field.name}
          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
          placeholder={field.placeholder}
          aria-invalid={!!error}
          className={cn(
            "h-10 rounded-sm px-4 text-sm",
            error && "border-red-500 focus-visible:ring-red-500",
          )}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormFieldLayout>
  );
}
