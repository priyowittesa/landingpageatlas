"use client";

import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import FormFieldLayout from "./FormFieldLayout";
import type {
  FieldError,
  FieldValues,
  Path,
  UseFormRegister
} from "react-hook-form";
import { useState } from "react";

type BaseProps<TFieldValues extends FieldValues> = {
  label: string;
  name: Path<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  desc?: string;
  suffix?: React.ReactNode;
  onBlur?: () => void;
};

type InputVariantProps<TFieldValues extends FieldValues> =
  BaseProps<TFieldValues> & {
    as?: "input";
    type?: "text" | "number" | "email" | "password";
    rows?: never;
  };

type TextareaVariantProps<TFieldValues extends FieldValues> =
  BaseProps<TFieldValues> & {
    as: "textarea";
    rows?: number;
    type?: never;
  };

type FormTextFieldProps<TFieldValues extends FieldValues> =
  | InputVariantProps<TFieldValues>
  | TextareaVariantProps<TFieldValues>;

export default function FormTextField<TFieldValues extends FieldValues>(
  props: FormTextFieldProps<TFieldValues>
) {
  const {
    label,
    name,
    register,
    error,
    required = false,
    placeholder,
    disabled,
    className,
    inputClassName
  } = props;

  const [textAreaValue, setTextAreaValue] = useState<string>("");

  const isTextarea = props.as === "textarea";
  const isNumber = !isTextarea && props.type === "number";

  const registration = register(name, {
    valueAsNumber: isNumber
  });

  const composedOnBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    registration.onBlur(e);
    props.onBlur?.();
  };

  return (
    <FormFieldLayout
      label={label}
      htmlFor={name}
      required={required}
      error={error?.message}
      className={cn(className)}
      desc={props.desc}
    >
      {/* Suitable for text area, text, and number type input */}
      {isTextarea ? (
        <div className="relative">
          <Textarea
            id={name}
            placeholder={placeholder}
            rows={(props as TextareaVariantProps<TFieldValues>).rows ?? 4}
            disabled={disabled}
            aria-invalid={!!error}
            maxLength={255}
            onInput={(e) => {
              setTextAreaValue(e.currentTarget.value);
            }}
            className={cn(
              "border border-border shadow-none rounded-sm px-4 py-2 text-sm",
              error && "border-red-500 focus-visible:ring-red-500",
              inputClassName
            )}
            {...registration}
            onBlur={composedOnBlur}
          />
          <span className="absolute right-3 bottom-1 text-sm text-muted-foreground">
            {textAreaValue.length}/255
          </span>
        </div>
      ) : (
        <div className="flex w-full">
          <Input
            id={name}
            type={(props as InputVariantProps<TFieldValues>).type ?? "text"}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              "h-10 rounded-sm border px-4 text-sm",
              props.suffix && "rounded-r-none",
              error && "border-red-500 focus-visible:ring-red-500",
              inputClassName
            )}
            {...registration}
            onBlur={composedOnBlur}
          />
          {props.suffix && (
            <span
              className={cn(
                "flex h-10 shrink-0 items-center rounded-r-sm border border-l-0 bg-muted/50 px-3 text-sm text-muted-foreground",
                error && "border-red-500",
              )}
            >
              {props.suffix}
            </span>
          )}
        </div>
      )}
    </FormFieldLayout>
  );
}
