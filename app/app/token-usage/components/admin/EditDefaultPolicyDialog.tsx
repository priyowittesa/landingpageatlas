"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useUpdateDefaultPolicy } from "../../hooks/useAdminTokenPolicy";
import type { TokenPolicyValues } from "../../types/admin";
import { DialogIcon } from "./AdminShared";
import { PolicyFormFields } from "./PolicyFormFields";

type EditDefaultPolicyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current default policy — seeds the form on every open. */
  defaultPolicy: TokenPolicyValues;
};

/**
 * Form body of the "Edit default policy" dialog. Rendered only while the dialog
 * is open so its state is seeded from the current default policy on every open.
 */
function EditDefaultPolicyForm({
  defaultPolicy,
  onClose
}: {
  defaultPolicy: TokenPolicyValues;
  onClose: () => void;
}) {
  const updateDefaultPolicy = useUpdateDefaultPolicy();
  const [values, setValues] = useState<TokenPolicyValues>(defaultPolicy);

  const hasChanges =
    JSON.stringify(defaultPolicy) !== JSON.stringify(values);
  const allowanceValid = Number.isFinite(values.allowance) && values.allowance >= 0;
  const canSave = hasChanges && allowanceValid && !updateDefaultPolicy.isPending;

  const handleSave = async () => {
    if (!canSave) return;
    await updateDefaultPolicy.mutateAsync({
      allowance: values.allowance,
      resetPeriod: values.resetPeriod
    });
    onClose();
  };

  return (
    <>
      <DialogHeader className="flex-row items-start gap-4 space-y-0">
        <DialogIcon
          icon={Pencil}
          className="bg-primary-50 text-primary-700"
        />
        <div>
          <DialogTitle>Edit default policy</DialogTitle>
          <DialogDescription className="mt-1">
            Set the baseline token allowance and reset cycle every new client
            starts with. Existing clients keep their overrides.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="py-2">
        <PolicyFormFields
          values={values}
          onChange={setValues}
          disabled={updateDefaultPolicy.isPending}
        />
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={updateDefaultPolicy.isPending}
        >
          Cancel
        </Button>
        <Button
          className="gap-1.5 bg-primary-700 hover:bg-primary-800"
          onClick={handleSave}
          disabled={!canSave}
        >
          {updateDefaultPolicy.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save policy
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * "Edit default policy" modal — updates the tenant-wide default allowance and
 * reset period via PUT /v1/portal/token-usage/default-allowance.
 */
export function EditDefaultPolicyDialog({
  open,
  onOpenChange,
  defaultPolicy
}: EditDefaultPolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-155">
        {open && (
          <EditDefaultPolicyForm
            defaultPolicy={defaultPolicy}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
