"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CapacitySidePanel({ title, description, icon, onClose, children }: {
  title: string; description: string; icon: ReactNode; onClose: () => void; children: ReactNode;
}) {
  return <Dialog.Root open modal={false} onOpenChange={(open) => !open && onClose()}>
    <Dialog.Portal>
      <Dialog.Content
        onInteractOutside={(event) => event.preventDefault()}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col border-l border-border bg-background shadow-xl outline-none motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-right"
      >
        <div className="flex items-center gap-3 border-b border-border p-6">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <Dialog.Title className="text-base font-bold">{title}</Dialog.Title>
            <Dialog.Description className="text-xs text-muted-foreground">{description}</Dialog.Description>
          </div>
          <Dialog.Close asChild><Button variant="outline" size="icon" className="size-8 shrink-0" aria-label={`Close ${title}`}><X size={16} /></Button></Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-6">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
