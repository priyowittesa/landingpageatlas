"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeleteKnowledgeDialogProps {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteKnowledgeDialog({ open, isPending, onOpenChange, onConfirm }: DeleteKnowledgeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className="rounded-full bg-red-50 p-3"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <DialogTitle>Are you sure you want to delete this item?</DialogTitle>
          <DialogDescription>This action cannot be undone. Please confirm before proceeding.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending && <LoaderCircle className="animate-spin" />}Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
