"use client";

import { useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
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
import {
  resetPeriodLabels,
  type TokenClientDetail,
  type TokenOverridePayload,
  type TokenPolicyValues
} from "../../types/admin";
import { useApplyClientOverride } from "../../hooks/useAdminTokenPolicy";
import { formatTokens } from "../../lib/format";
import { DialogIcon } from "./AdminShared";
import { ApplyModeControl, PolicyFormFields } from "./PolicyFormFields";

type EditPolicyDialogProps = {
  client: TokenClientDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** One old → new row in the preview block. */
function PreviewRow({
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
        <span className="text-gray-400 line-through">{old}</span>
        <span className="text-gray-300">→</span>
        <span
          className={
            changed ? "font-semibold text-primary-700" : "text-gray-800"
          }
        >
          {next}
        </span>
      </div>
    </div>
  );
}

function valuesLabel(values: TokenPolicyValues): Record<string, string> {
  return {
    allowance: formatTokens(values.allowance),
    resetPeriod: resetPeriodLabels[values.resetPeriod]
  };
}

function EditPolicyForm({
  client,
  onClose
}: {
  client: TokenClientDetail;
  onClose: () => void;
}) {
  const applyOverride = useApplyClientOverride(client.id);

  // Seed the form from the in-force policy (or the default when no override).
  const [values, setValues] = useState<TokenPolicyValues>(
    client.policySource === "override"
      ? client.inForcePolicy
      : client.defaultPolicy
  );
  const [applyMode, setApplyMode] = useState<"immediate" | "scheduled">(
    "immediate"
  );
  const [effectiveAt, setEffectiveAt] = useState("");

  const oldLabels = valuesLabel(client.inForcePolicy);
  const newLabels = valuesLabel(values);
  const hasChanges =
    JSON.stringify(client.inForcePolicy) !== JSON.stringify(values);

  const scheduledMissing = applyMode === "scheduled" && !effectiveAt;
  const canSave = hasChanges && !scheduledMissing && !applyOverride.isPending;

  const handleSave = async () => {
    if (!canSave) return;
    const payload: TokenOverridePayload = {
      allowance: values.allowance,
      resetPeriod: values.resetPeriod,
      applyMode,
      effectiveAt: applyMode === "scheduled" ? effectiveAt : undefined
    };
    const result = await applyOverride.mutateAsync(payload);
    const undoSeconds = result.undoWindowSeconds ?? 300;

    if (applyMode === "scheduled") {
      toast.success("Scheduled change created", {
        description: `Pending until ${effectiveAt}. Old policy stays in force.`
      });
    } else {
      toast.success("Policy override applied", {
        description: `${client.name} is now on a custom policy.`,
        action: {
          label: "Undo",
          onClick: () => toast.info("Undo triggered — revert the override.")
        },
        duration: undoSeconds * 1000
      });
    }
    onClose();
  };

  return (
    <>
      <DialogHeader className="flex-row items-start gap-4 space-y-0">
        <DialogIcon
          icon={SlidersHorizontal}
          className="bg-primary-50 text-primary-700"
        />
        <div>
          <DialogTitle>Edit policy — {client.name}</DialogTitle>
          <DialogDescription className="mt-1">
            Override the default token policy for this client. Changes take
            effect immediately or at a scheduled date.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="space-y-5 py-2">
        <PolicyFormFields values={values} onChange={setValues} />

        <ApplyModeControl
          value={applyMode}
          onChange={setApplyMode}
          effectiveAt={effectiveAt}
          onEffectiveAtChange={setEffectiveAt}
          disabled={applyOverride.isPending}
        />

        {/* old → new preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-2">
          <p className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Preview
          </p>
          <div className="divide-y divide-gray-100">
            <PreviewRow
              label="Token allowance"
              old={oldLabels.allowance}
              next={newLabels.allowance}
            />
            <PreviewRow
              label="Reset period"
              old={oldLabels.resetPeriod}
              next={newLabels.resetPeriod}
            />
          </div>
          {applyMode === "immediate" && hasChanges && (
            <p className="py-2 text-xs text-amber-600">
              The client&apos;s balance will be recalculated against the new
              quota.
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={applyOverride.isPending}
        >
          Cancel
        </Button>
        <Button
          className="gap-1.5 bg-primary-700 hover:bg-primary-800"
          onClick={handleSave}
          disabled={!canSave}
        >
          {applyOverride.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {applyMode === "scheduled" ? "Schedule change" : "Apply override"}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * "Edit policy" modal — creates or updates a per-client override. Shows an
 * old → new preview and lets the admin choose immediate vs scheduled
 * application. A 5-minute undo toast is offered for immediate changes.
 */
export function EditPolicyDialog({
  client,
  open,
  onOpenChange
}: EditPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-155">
        {open && (
          <EditPolicyForm client={client} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
