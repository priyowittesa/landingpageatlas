"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateWarningThreshold } from "../hooks/useTokenUsage";

type WarningThresholdDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warningThresholdPercent: number;
};

/**
 * Form body of the warning threshold dialog. Rendered only while the dialog is
 * open so its state is seeded from the current settings on every open — no
 * effect sync.
 */
function ThresholdForm({
  warningThresholdPercent,
  onClose
}: {
  warningThresholdPercent: number;
  onClose: () => void;
}) {
  const updateThreshold = useUpdateWarningThreshold();
  const [threshold, setThreshold] = useState(String(warningThresholdPercent));

  const thresholdValue = Number(threshold);
  const thresholdError =
    !Number.isFinite(thresholdValue) ||
    thresholdValue < 1 ||
    thresholdValue > 100
      ? "Enter a percentage between 1 and 100."
      : "";

  const handleSave = async () => {
    if (thresholdError) return;
    await updateThreshold.mutateAsync({
      warning_threshold: thresholdValue
    });
    onClose();
  };

  return (
    <>
      <DialogHeader className="flex-row items-start gap-4 space-y-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50">
          <TriangleAlert className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <DialogTitle>Token warning threshold</DialogTitle>
          <DialogDescription className="mt-1">
            Users are warned once their remaining balance drops below this share
            of their quota.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="space-y-1.5 py-2">
        <label
          htmlFor="token-warning-threshold"
          className="text-sm font-medium text-gray-800"
        >
          Warning threshold (%)
        </label>
        <Input
          id="token-warning-threshold"
          type="number"
          min={1}
          max={100}
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
        />
        <p
          className={
            thresholdError ? "text-xs text-red-600" : "text-xs text-gray-500"
          }
        >
          {thresholdError || "Applies to every user in this workspace."}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={updateThreshold.isPending}
        >
          Cancel
        </Button>
        <Button
          className="gap-1.5 bg-primary-700 hover:bg-primary-800"
          onClick={handleSave}
          disabled={Boolean(thresholdError) || updateThreshold.isPending}
        >
          {updateThreshold.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save threshold
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * "Token warning threshold" modal — sets the tenant-wide low-balance warning
 * percentage via PUT /v1/portal/token-usage/settings.
 */
export function WarningThresholdDialog({
  open,
  onOpenChange,
  warningThresholdPercent
}: WarningThresholdDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-155">
        <ThresholdForm
          warningThresholdPercent={warningThresholdPercent}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
