"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle
} from "@/components/ui/dialog";
import { DesignIcon } from "./design-icon";
import type { Formula } from "./formula-data";
import {
  engineError, errorMessage, getOnboardingFormulas, getOpenSignalCounts,
  type Onboarding
} from "./onboarding-api";
import { mapOnboardingFormulas } from "./onboarding-formulas";

function FormulaSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border-2 border-neutral-200 p-4 sm:p-6">
      <h3 className="flex items-center gap-4 text-lg font-semibold sm:text-2xl">
        <DesignIcon name={icon} size={32} /> {title}
      </h3>
      {children}
    </section>
  );
}

function FormulaCard({ formula }: { formula: Formula }) {
  return (
    <details open className={`rounded-[26px] border-2 border-primary-200 bg-white p-4 sm:p-8 ${formula.enabled === false ? "opacity-60" : ""}`}>
      <summary className="signals-formula-summary grid cursor-pointer grid-cols-[64px_minmax(0,1fr)] items-center gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 sm:flex sm:flex-wrap">
        <span className="grid size-16 shrink-0 place-items-center rounded-[15px] bg-primary-50 sm:size-20">
          <DesignIcon name={formula.icon} size={60} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="inline-block max-w-full wrap-break-word rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-500">
            {formula.category}
          </span>
          {formula.enabled === false && <span className="ml-2 text-xs text-neutral-500">Disabled</span>}
          <span className="mt-1 block wrap-break-word text-lg font-semibold leading-7 sm:text-xl">{formula.title}</span>
          <span className="mt-1 block wrap-break-word text-sm font-medium text-neutral-500">
            Detector {formula.id}{formula.version ? ` v${formula.version}` : ""}{formula.template ? ` · template ${formula.template}` : ""}
          </span>
        </span>
        <span className="col-span-2 flex items-center justify-between gap-4 sm:justify-start">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-500">
            {formula.openSignals === undefined ? "Signal count unavailable" : `${formula.openSignals} open signals`}
          </span>
          <DesignIcon name="chevron-up" size={30} className="signals-formula-chevron" />
        </span>
      </summary>
      <div className="mt-5 space-y-5">
        {formula.condition && <div className="flex items-start gap-3 rounded-2xl border border-red-600 bg-red-50 px-4 py-3 text-red-600">
          <DesignIcon name="warning" size={16} />
          <div>
            <h3 className="text-sm font-medium">SIGNAL WHEN</h3>
            <p className="mt-0.5 text-sm leading-5">{formula.condition}</p>
          </div>
        </div>}
        {formula.data.length > 0 && <FormulaSection title="DATA" icon="data">
          <dl className="space-y-3 text-sm">
            {formula.data.map(([label, value], index) => (
              <div key={index} className="grid gap-1 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-9">
                <dt className="font-semibold text-neutral-500">{label}</dt>
                <dd className="wrap-break-word font-medium leading-5">{value}</dd>
              </div>
            ))}
          </dl>
        </FormulaSection>}
        {formula.parameters.length > 0 && <FormulaSection title="PARAMETERS" icon="calculation">
          <dl className="flex flex-wrap gap-2">
            {formula.parameters.map(([label, value]) => (
              <div key={label} className="flex max-w-full flex-wrap items-center gap-x-3 rounded-2xl border border-primary-500 bg-primary-50 px-3 py-1 text-xs">
                <dt className="break-all font-medium">{label}</dt>
                <dd className="min-w-0 wrap-break-word font-semibold text-primary-500">{value}</dd>
              </div>
            ))}
          </dl>
        </FormulaSection>}
        {(formula.calculations.length > 0 || formula.note) && <FormulaSection title="CALCULATION" icon="calculation">
          <dl className="space-y-2">
            {formula.calculations.map(([label, value], index) => (
              <div key={index} className="flex flex-col items-start gap-3 rounded-lg border border-primary-500 bg-primary-50 px-4 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 rounded-full bg-primary-500 px-2 py-0.5 text-xs font-medium text-white">{label}</dt>
                <dd className="min-w-0 wrap-break-word text-sm font-semibold leading-5 text-primary-500">{value}</dd>
              </div>
            ))}
          </dl>
          {formula.note && <div className="flex items-start gap-3 rounded-lg bg-sky-50 px-4 py-3">
            <DesignIcon name="formula-info" size={16} />
            <p className="text-sm leading-5 text-sky-700">{formula.note}</p>
          </div>}
        </FormulaSection>}
      </div>
    </details>
  );
}

export function FormulasDialog({
  open,
  onOpenChange,
  onboarding,
  scope,
  onMissing
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onboarding: Onboarding;
  scope: string;
  onMissing: () => void;
}) {
  const enabled = open && onboarding.status === "ready";
  const query = useQuery({
    queryKey: ["ai-engine", scope, "formulas", onboarding.id, onboarding.version],
    queryFn: ({ signal }) => getOnboardingFormulas(onboarding.id, signal),
    enabled,
    staleTime: 0,
    retry: false,
    meta: { suppressErrorStatuses: [404, 409, 422, 502] }
  });
  const signals = useQuery({
    queryKey: ["ai-engine", scope, "formula-signal-counts", onboarding.id, onboarding.version],
    queryFn: ({ signal }) => getOpenSignalCounts(onboarding.id, signal),
    enabled,
    staleTime: 0,
    retry: false,
    meta: { suppressErrorStatuses: [404, 409, 422, 502] }
  });
  useEffect(() => {
    if (engineError(query.error).status === 404) onMissing();
  }, [query.error, onMissing]);
  const formulas = mapOnboardingFormulas(query.data?.detectors ?? [], signals.isError ? undefined : signals.data);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] w-250 flex-col gap-0 overflow-hidden rounded-[20px] border-2 border-[#e4e5ea] p-0 sm:max-w-[calc(100%-2rem)] lg:max-w-250"
      >
        <div className="shrink-0 border-b border-neutral-100 p-5 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="hidden size-16 shrink-0 place-items-center rounded-xl bg-primary-50 sm:grid">
              <DesignIcon name="formulas" size={48} />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl leading-8 sm:text-2xl">Formulas in use</DialogTitle>
              <DialogDescription className="mt-1 text-sm font-medium leading-5">
                How the AI engine decides when to raise a signal for {onboarding.name || "your data source"}
                {query.data?.onboarding_version !== undefined ? ` (onboarding v${query.data.onboarding_version})` : ""}.
                One section per detector: the data it reads, each calculation step and the parameters it uses.
              </DialogDescription>
            </div>
            <DialogClose className="rounded-lg p-2 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-500" aria-label="Close formulas">
              <DesignIcon name="close" size={28} />
            </DialogClose>
          </div>
        </div>
        <div className="min-h-0 space-y-3.5 overflow-y-auto p-4 sm:p-8">
          {query.isPending && <p role="status" className="py-8 text-center text-sm text-neutral-500">Loading formulas...</p>}
          {query.isError && (
            <div role="alert" className="space-y-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="whitespace-pre-line wrap-break-word">{engineError(query.error).status === 502
                ? "Formulas are not available right now."
                : errorMessage(query.error, "Unable to load formulas.")}</p>
              <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Try Again</Button>
            </div>
          )}
          {signals.isPending && <p role="status" className="text-xs text-neutral-500">Loading open signal counts...</p>}
          {signals.isError && (
            <p role="alert" className="text-sm text-neutral-500">
              Open signal counts are unavailable. <button className="underline" onClick={() => void signals.refetch()}>Retry signal counts</button>
            </p>
          )}
          {formulas.map((formula) => <FormulaCard key={formula.id} formula={formula} />)}
          {query.isSuccess && formulas.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">No formulas were returned for this configuration.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
