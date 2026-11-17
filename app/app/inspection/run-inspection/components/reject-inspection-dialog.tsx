"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { InspectionDetailItem } from "../use-available-inspections";

export interface RejectInspectionValues {
  isGeneral: boolean;
  reason: string;
  itemRejects: { item_id: string; reason: string }[];
}

interface RejectInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: InspectionDetailItem[];
  isPending: boolean;
  onReject: (values: RejectInspectionValues, closeDialog: () => void) => void;
}

type RejectMode = "general" | "specific";

export function RejectInspectionDialog({
  open,
  onOpenChange,
  title,
  items,
  isPending,
  onReject
}: RejectInspectionDialogProps) {
  const [mode, setMode] = useState<RejectMode>("general");
  const [generalReason, setGeneralReason] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});

  const selectedItems = items.filter((item) =>
    selectedItemIds.includes(item.id)
  );
  const canReject =
    mode === "general"
      ? Boolean(generalReason.trim())
      : selectedItems.length > 0 &&
        selectedItems.every((item) => itemReasons[item.id]?.trim());

  function resetForm() {
    setMode("general");
    setGeneralReason("");
    setSelectedItemIds([]);
    setItemReasons({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleReject() {
    if (!canReject) return;
    onReject(
      {
        isGeneral: mode === "general",
        reason: mode === "general" ? generalReason.trim() : "",
        itemRejects:
          mode === "specific"
            ? selectedItems.map((item) => ({
                item_id: item.id,
                reason: itemReasons[item.id].trim()
              }))
            : []
      },
      () => handleOpenChange(false)
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-gray-200 px-5 py-4 pr-12">
          <DialogTitle className="text-sm text-gray-800">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Reject the entire inspection or select specific inspection items.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as RejectMode)}
          className="flex min-h-0 flex-1 flex-col px-4 pt-3"
        >
          <TabsList className="h-8 w-full shrink-0 rounded-lg bg-gray-100 p-0.5">
            <TabsTrigger
              value="general"
              className="h-7 flex-1 py-1 text-xs data-[state=active]:shadow-sm"
            >
              General Reject
            </TabsTrigger>
            <TabsTrigger
              value="specific"
              className="h-7 flex-1 py-1 text-xs data-[state=active]:shadow-sm"
            >
              Specific Items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0 space-y-2 py-5">
            <label
              htmlFor="general-reject-reason"
              className="text-xs font-medium text-gray-800"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="general-reject-reason"
              value={generalReason}
              onChange={(event) => setGeneralReason(event.target.value)}
              placeholder="e.g. Wrong machine used for this inspection"
              className="min-h-20 resize-y text-xs"
            />
            <p className="text-[10px] leading-4 text-gray-400">
              This voids the whole inspection. The engineer will need to run a
              full corrective inspection rather than fix an individual item.
            </p>
          </TabsContent>

          <TabsContent
            value="specific"
            className="mt-0 min-h-0 overflow-y-auto py-5"
          >
            <p className="mb-4 text-xs text-gray-800">
              Select the item(s) you&apos;re rejecting, each needs its own
              reason.
            </p>
            {items.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">
                No inspection items are available.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const checked = selectedItemIds.includes(item.id);
                  const checkboxId = `reject-item-${item.id}`;
                  return (
                    <div key={item.id} className="space-y-2">
                      <label
                        htmlFor={checkboxId}
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-800"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onCheckedChange={(nextChecked) =>
                            setSelectedItemIds((current) =>
                              nextChecked
                                ? [...new Set([...current, item.id])]
                                : current.filter((id) => id !== item.id)
                            )
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                      {checked && (
                        <Textarea
                          value={itemReasons[item.id] ?? ""}
                          onChange={(event) =>
                            setItemReasons((current) => ({
                              ...current,
                              [item.id]: event.target.value
                            }))
                          }
                          placeholder="Reason for this item"
                          aria-label={`Reason for rejecting ${item.label}`}
                          className="min-h-16 resize-y text-xs"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-gray-200 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={!canReject || isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
