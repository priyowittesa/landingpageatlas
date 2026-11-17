"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
  XCircle
} from "lucide-react";
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
  type TokenBulkUpdateResult,
  type TokenClient,
  type TokenPolicyValues,
  type TokenResetPeriod
} from "../../types/admin";
import { useBulkUpdateClients } from "../../hooks/useAdminTokenPolicy";
import { formatTokens } from "../../lib/format";
import { DialogIcon } from "./AdminShared";
import { ApplyModeControl, PolicyFormFields } from "./PolicyFormFields";

type BulkEditDialogProps = {
  selected: TokenClient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Phase = "form" | "progress" | "result";

const DEFAULT_VALUES: TokenPolicyValues = {
  allowance: 0,
  resetPeriod: "monthly"
};

function BulkForm({
  selected,
  onClose
}: {
  selected: TokenClient[];
  onClose: () => void;
}) {
  const bulkUpdate = useBulkUpdateClients();
  const [values, setValues] = useState<TokenPolicyValues>(DEFAULT_VALUES);
  const [applyMode, setApplyMode] = useState<"immediate" | "scheduled">(
    "immediate"
  );
  const [effectiveAt, setEffectiveAt] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<TokenBulkUpdateResult | null>(null);

  const scheduledMissing = applyMode === "scheduled" && !effectiveAt;
  const canSubmit = selected.length >= 2 && !scheduledMissing;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("progress");
    try {
      const res = await bulkUpdate.mutateAsync({
        clientIds: selected.map((client) => client.id),
        allowance: values.allowance,
        resetPeriod: values.resetPeriod,
        applyMode,
        effectiveAt: applyMode === "scheduled" ? effectiveAt : undefined
      });
      setResult(res);
      setPhase("result");
      toast.success("Bulk update complete", {
        description: `${res.succeeded} succeeded, ${res.failed} failed.`
      });
    } catch {
      setPhase("form");
    }
  };

  const close = () => {
    setResult(null);
    setPhase("form");
    onClose();
  };

  if (phase === "progress") {
    return (
      <>
        <DialogHeader className="flex-row items-start gap-4 space-y-0">
          <DialogIcon
            icon={Loader2}
            className="bg-primary-50 text-primary-700"
          />
          <div>
            <DialogTitle>Applying bulk update…</DialogTitle>
            <DialogDescription className="mt-1">
              Updating {selected.length} clients. Each client gets its own audit
              entry.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-xs text-gray-500">
            Processing {selected.length} clients…
          </p>
        </div>
      </>
    );
  }

  if (phase === "result" && result) {
    return (
      <>
        <DialogHeader className="flex-row items-start gap-4 space-y-0">
          <DialogIcon
            icon={CheckCircle2}
            className="bg-emerald-50 text-emerald-600"
          />
          <div>
            <DialogTitle>Bulk update complete</DialogTitle>
            <DialogDescription className="mt-1">
              {result.succeeded} succeeded, {result.failed} failed.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-72 space-y-1.5 overflow-y-auto py-2">
          {result.rows.map((row) => (
            <div
              key={row.clientId}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2"
            >
              <span className="truncate text-sm text-gray-800">
                {row.clientName}
              </span>
              {row.success ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Success
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {row.message ?? "Failed"}
                </span>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            className="bg-primary-700 hover:bg-primary-800"
            onClick={close}
          >
            Done
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader className="flex-row items-start gap-4 space-y-0">
        <DialogIcon
          icon={SlidersHorizontal}
          className="bg-primary-50 text-primary-700"
        />
        <div>
          <DialogTitle>Bulk edit policy</DialogTitle>
          <DialogDescription className="mt-1">
            Apply the same policy to {selected.length} selected clients.
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
        />

        {/* per-client preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-2">
          <p className="py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Affected clients ({selected.length})
          </p>
          <div className="max-h-40 divide-y divide-gray-100 overflow-y-auto">
            {selected.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">
                    {client.name}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {client.email}
                  </span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <span className="text-gray-400 line-through">
                    {formatTokens(client.quota)}
                  </span>
                  <span className="mx-1 text-gray-300">→</span>
                  <span className="font-semibold text-primary-700">
                    {formatTokens(values.allowance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          className="gap-1.5 bg-primary-700 hover:bg-primary-800"
          onClick={handleSubmit}
          disabled={!canSubmit || bulkUpdate.isPending}
        >
          {bulkUpdate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Apply to {selected.length} clients
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * "Bulk edit" modal — applies one policy to many clients at once. Shows a
 * per-client preview, a progress state, and a result summary (succeeded /
 * failed per client).
 */
export function BulkEditDialog({
  selected,
  open,
  onOpenChange
}: BulkEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-155">
        {open && (
          <BulkForm selected={selected} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Re-export for convenience so the page can build the default form values.
export { DEFAULT_VALUES };
export type { TokenResetPeriod };
