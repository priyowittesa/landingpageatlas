"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { resetPeriodLabels, type TokenClientDetail } from "../../types/admin";
import { useRevertClientOverride } from "../../hooks/useAdminTokenPolicy";
import { formatTokens } from "../../lib/format";
import { DialogIcon } from "./AdminShared";

type RevertPolicyDialogProps = {
  client: TokenClientDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** A single diff row in the revert dialog. */
function DiffRow({
  label,
  old,
  next
}: {
  label: string;
  old: string;
  next: string;
}) {
  const changed = old !== next;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={changed ? "text-gray-400 line-through" : "text-gray-800"}
        >
          {old}
        </span>
        {changed && (
          <>
            <span className="text-gray-300">→</span>
            <span className="font-semibold text-primary-700">{next}</span>
          </>
        )}
      </div>
    </div>
  );
}

function RevertForm({
  client,
  onClose
}: {
  client: TokenClientDetail;
  onClose: () => void;
}) {
  const revert = useRevertClientOverride(client.id);
  const [confirmed, setConfirmed] = useState(false);

  const inForce = client.inForcePolicy;
  const def = client.defaultPolicy;

  const handleRevert = async () => {
    if (!confirmed) return;
    const result = await revert.mutateAsync();
    const undoSeconds = result.undoWindowSeconds ?? 300;
    toast.success("Reverted to default policy", {
      description: `${client.name} is now using the default policy.`,
      action: {
        label: "Undo",
        onClick: () => toast.info("Undo triggered — restore the override.")
      },
      duration: undoSeconds * 1000
    });
    onClose();
  };

  return (
    <>
      <DialogHeader className="flex-row items-start gap-4 space-y-0">
        <DialogIcon icon={RotateCcw} className="bg-gray-100 text-gray-600" />
        <div>
          <DialogTitle>Revert to default policy</DialogTitle>
          <DialogDescription className="mt-1">
            Remove the custom override for {client.name}. The client will follow
            the tenant-wide default policy again.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-2">
          <p className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            What will change
          </p>
          <div className="divide-y divide-gray-100">
            <DiffRow
              label="Token allowance"
              old={formatTokens(inForce.allowance)}
              next={formatTokens(def.allowance)}
            />
            <DiffRow
              label="Reset period"
              old={resetPeriodLabels[inForce.resetPeriod]}
              next={resetPeriodLabels[def.resetPeriod]}
            />
            <DiffRow label="Policy source" old="Custom" next="Default" />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-3 py-2.5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-xs text-gray-600">
            I understand the override will be removed and the client&apos;s
            quota recalculated against the default. An undo is available for 5
            minutes after saving.
          </span>
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={revert.isPending}>
          Cancel
        </Button>
        <Button
          className="gap-1.5 bg-primary-700 hover:bg-primary-800"
          onClick={handleRevert}
          disabled={!confirmed || revert.isPending}
        >
          {revert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Revert to default
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * "Revert to default" modal — shows the diff between the in-force override and
 * the default policy, requires confirmation, and offers a 5-minute undo toast.
 */
export function RevertPolicyDialog({
  client,
  open,
  onOpenChange
}: RevertPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-155">
        {open && (
          <RevertForm client={client} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
