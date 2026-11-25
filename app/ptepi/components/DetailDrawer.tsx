"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { useT } from "./Tr";

type DetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One line under the title, e.g. the source of the item */
  description?: string;
  /** Badges above the title: type, tags, status */
  badges?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Side drawer for the detail of one item. Items on the screens open it first, so the
 * reader sees the reason and the options before leaving the page. Focus is trapped,
 * Escape and the backdrop close it.
 */
export function DetailDrawer({ open, onOpenChange, title, description, badges, children, className }: DetailDrawerProps) {
  const t = useT();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-[1px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(32rem,100vw)] flex-col border-l border-primary-100 bg-background shadow-2xl outline-none duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
            className
          )}
        >
          <header className="flex items-start gap-3 border-b border-border px-6 py-5">
            <div className="min-w-0 flex-1 space-y-2">
              {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
              <DialogPrimitive.Title className="text-xl font-semibold leading-snug text-gray-950">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className={cn("text-sm text-gray-700", !description && "sr-only")}>
                {description ?? title}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label={t("Close")}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <X size={20} aria-hidden />
            </DialogPrimitive.Close>
          </header>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** A titled block inside a drawer. */
export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{t(title)}</h3>
      {children}
    </section>
  );
}
