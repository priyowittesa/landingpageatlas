"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";

export default function SubmitBridgingModal({ open, pending, error, onCancel, onConfirm }: {
  open: boolean; pending: boolean; error?: string; onCancel: () => void; onConfirm: () => void;
}) {
  return <Dialog open={open} onOpenChange={(next) => !next && !pending && onCancel()}>
    <DialogPortal>
      <DialogOverlay className="bg-black/20" />
      <DialogPrimitive.Content role="alertdialog"
        onEscapeKeyDown={(event) => pending && event.preventDefault()}
        onInteractOutside={(event) => pending && event.preventDefault()}
        className="fixed top-1/2 left-1/2 z-50 w-[291px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg bg-popover p-4 shadow-md outline-none"
      >
        <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-info/10 text-info"><CircleHelp size={24} /></div>
        <div className="space-y-1.5 text-center">
          <DialogTitle className="text-base font-medium leading-6">Submit Bridging Line Part?</DialogTitle>
          <DialogDescription className="text-xs leading-4">Make sure all part mappings are correct before submitting. Capacity changes only after approval.</DialogDescription>
        </div>
        {error && <p role="alert" className="break-words text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="h-7 flex-1 text-xs" disabled={pending} onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="h-7 flex-1 bg-info text-xs text-white hover:bg-info/90" disabled={pending} onClick={onConfirm}>{pending ? "Submitting..." : "Submit"}</Button>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  </Dialog>;
}
