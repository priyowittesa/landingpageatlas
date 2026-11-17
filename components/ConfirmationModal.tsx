"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import {
  CircleQuestionMarkIcon,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";

export type ConfirmationVariant = "delete" | "submit";

type VariantConfig = {
  icon: LucideIcon;
  iconClassName: string;
  iconWrapperClassName: string;
  confirmButtonClassName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultConfirmLabel: string;
};

const variantConfig: Record<ConfirmationVariant, VariantConfig> = {
  delete: {
    icon: FileWarning,
    iconClassName: "text-red-500",
    iconWrapperClassName: "bg-red-50",
    confirmButtonClassName: "bg-red-600 hover:bg-red-600/90 text-white",
    defaultTitle: "Are you sure you want to delete this item?",
    defaultDescription:
      "Are you sure you want to delete this item? This action cannot be undone.",
    defaultConfirmLabel: "Delete File",
  },
  submit: {
    icon: CircleQuestionMarkIcon,
    iconClassName: "text-primary",
    iconWrapperClassName: "bg-primary/10",
    confirmButtonClassName: "bg-primary text-primary-foreground hover:bg-primary/90",
    defaultTitle: "Are you sure you want to submit this item?",
    defaultDescription: "Are you sure you want to submit this item?",
    defaultConfirmLabel: "Submit",
  },
};

type ConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;

  variant?: ConfirmationVariant;
  title?: string;
  description?: ReactNode;
  role?: "dialog" | "alertdialog";
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
};

export default function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  variant = "delete",
  title,
  description,
  role = "dialog",
  confirmLabel,
  cancelLabel = "Cancel",
  isLoading = false,
}: ConfirmationModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:pointer-events-none" />

        <DialogPrimitive.Content
          role={role}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-105 max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
            "rounded-2xl bg-white p-6 shadow-xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:pointer-events-none",
          )}
          onEscapeKeyDown={() => onOpenChange(false)}
          onPointerDownOutside={() => onOpenChange(false)}
          onInteractOutside={() => onOpenChange(false)}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                config.iconWrapperClassName,
              )}
            >
              <Icon size={28} className={cn(config.iconClassName)} />
            </div>

            <DialogPrimitive.Title className="text-lg text-foreground font-semibold">
              {title ?? config.defaultTitle}
            </DialogPrimitive.Title>

            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {description ?? config.defaultDescription}
            </DialogPrimitive.Description>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full"
            >
              {cancelLabel}
            </Button>

            <Button
              variant={variant === "delete" ? "destructive" : "default"}
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`w-full ${config.confirmButtonClassName}`}
            >
              {isLoading
                ? "Please wait..."
                : (confirmLabel ?? config.defaultConfirmLabel)}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
