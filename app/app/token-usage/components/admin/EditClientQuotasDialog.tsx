"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useUpdateClientQuotas } from "../../hooks/useAdminTokenPolicy";
import { formatTokens } from "../../lib/format";
import {
  resetPeriodLabels,
  type TokenPolicyValues,
  type TokenResetPeriod
} from "../../types/admin";
import { DialogIcon } from "./AdminShared";
import { PolicyFormFields } from "./PolicyFormFields";

/** One edit target — a tenant and its current (baseline) policy values. */
export type ClientQuotaEditTarget = {
  tenantId: string;
  name: string;
  allowance: number;
  resetPeriod: TokenResetPeriod;
};

type EditClientQuotasDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: ClientQuotaEditTarget[];
};

function ValuePill({ value, kind }: { value: string; kind: "old" | "new" }) {
  return (
    <span
      className={
        kind === "old"
          ? "inline-flex items-center justify-center rounded bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700"
          : "inline-flex items-center justify-center rounded bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700"
      }
    >
      {value}
    </span>
  );
}

/** One old → new pill row in the diff preview. */
function DiffRow({
  label,
  old,
  next
}: {
  label: string;
  old: string;
  next: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2.5">
        <ValuePill value={old} kind="old" />
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
        <ValuePill value={next} kind="new" />
      </div>
    </div>
  );
}

/**
 * Form body of the "Edit client quotas" dialog. Rendered only while the dialog
 * is open so its state is seeded from the first target's current values on
 * every open — no effect sync.
 */
function EditClientQuotasForm({
  targets,
  onClose
}: {
  targets: ClientQuotaEditTarget[];
  onClose: () => void;
}) {
  const updateQuotas = useUpdateClientQuotas();
  const [values, setValues] = useState<TokenPolicyValues>({
    allowance: targets[0]?.allowance ?? 0,
    resetPeriod: targets[0]?.resetPeriod ?? "monthly"
  });

  const allowanceValid =
    Number.isFinite(values.allowance) && values.allowance >= 0;
  const hasChanges = targets.some(
    (target) =>
      target.allowance !== values.allowance ||
      target.resetPeriod !== values.resetPeriod
  );
  const canSave =
    targets.length > 0 &&
    allowanceValid &&
    hasChanges &&
    !updateQuotas.isPending;

  const title =
    targets.length === 1
      ? `Edit ${targets[0].name} policy?`
      : `Edit ${targets.length} clients' policies?`;

  const handleSave = async () => {
    if (!canSave) return;
    await updateQuotas.mutateAsync(
      targets.map((target) => ({
        tenant_id: target.tenantId,
        allowance: values.allowance,
        reset_period: values.resetPeriod
      }))
    );
    onClose();
  };

  return (
    <>
      <DialogHeader className="flex-row items-start gap-4 space-y-0">
        <DialogIcon icon={Pencil} className="bg-primary-50 text-primary-700" />
        <div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-1">
            Set a new token allowance and reset period. The same values are
            applied to every selected client.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="space-y-5 py-2">
        <PolicyFormFields
          values={values}
          onChange={setValues}
          disabled={updateQuotas.isPending}
        />

        {/* old → new diff preview */}
        <div className="rounded-lg border border-gray-200 px-4 py-2">
          <p className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            What will change
          </p>
          <div className="divide-y divide-gray-100">
            {targets.map((target) => (
              <div key={target.tenantId} className="py-1">
                {targets.length > 1 && (
                  <p className="py-1 text-xs font-semibold text-gray-800">
                    {target.name}
                  </p>
                )}
                <div className="divide-y divide-gray-100">
                  <DiffRow
                    label="allowance"
                    old={formatTokens(target.allowance)}
                    next={formatTokens(values.allowance)}
                  />
                  <DiffRow
                    label="reset_period"
                    old={resetPeriodLabels[target.resetPeriod]}
                    next={resetPeriodLabels[values.resetPeriod]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={updateQuotas.isPending}
        >
          Cancel
        </Button>
        <Button
          className="gap-1.5 bg-gray-900 hover:bg-gray-800"
          onClick={handleSave}
          disabled={!canSave}
        >
          {updateQuotas.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save changes
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * "Edit client quotas" modal — sets a new allowance + reset period for one or
 * more tenants via PUT /v1/portal/token-usage/client-quotas. Shows an old →
 * new diff preview for every target before saving.
 */
export function EditClientQuotasDialog({
  open,
  onOpenChange,
  targets
}: EditClientQuotasDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-155">
        {open && targets.length > 0 && (
          <EditClientQuotasForm
            targets={targets}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
