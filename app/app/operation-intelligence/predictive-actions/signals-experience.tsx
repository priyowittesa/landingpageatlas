"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { DesignIcon } from "./design-icon";
import { FormulasDialog } from "./formulas-dialog";
import { errorMessage } from "./onboarding-api";
import { useOnboarding } from "./use-onboarding";
import { SetupProgress } from "./setup-progress";
import { ActivatedSignals } from "./activated-signals";
import "./signals.css";

const primaryButton = "h-10 rounded-lg bg-primary-700 px-6 text-white hover:bg-primary-800";

export function SignalsExperience() {
  const flow = useOnboarding();
  const { record, reload } = flow;
  const stage =
    record?.is_active === true
      ? "results"
      : record?.status === "generating"
        ? "setup"
        : record?.status === "failed"
          ? "error"
          : record
            ? "ready"
            : "intro";
  const [formulaRecord, setFormulaRecord] = useState<string | null>(null);
  const recordKey = `${flow.scope}:${record?.id}`;
  const formulasOpen =
    formulaRecord === recordKey && (stage === "ready" || stage === "results");
  const closeMissing = useCallback(() => {
    setFormulaRecord(null);
    void reload();
  }, [reload]);

  useEffect(() => {
    const breadcrumbs = useBreadcrumbStore.getState();
    breadcrumbs.setItems([
      { title: "Operations Intelligence & Predictive Actions" }
    ]);
    return () => breadcrumbs.clear();
  }, []);

  if (flow.loading && !flow.error) {
    return (
      <div
        className="signals-page py-20 text-center text-sm text-neutral-500"
        role="status"
      >
        Loading your data source...
      </div>
    );
  }

  return (
    <div className="signals-page min-w-0 md:p-4">
      {!!flow.error && (
        <div
          role="alert"
          className="mx-auto mb-5 max-w-[938px] space-y-3 rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="whitespace-pre-line wrap-break-word">
            {errorMessage(flow.error, "Unable to load your data source.")}
          </p>
          <Button variant="outline" onClick={() => void flow.refresh()}>
            Try Again
          </Button>
        </div>
      )}
      {flow.actionError && (
        <p
          role="alert"
          className="mx-auto mb-5 max-w-[938px] whitespace-pre-line wrap-break-word rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {errorMessage(
            flow.actionError,
            "The request could not be completed. Please try again."
          )}
        </p>
      )}
      {flow.warnings.length > 0 && (
        <aside
          className="mx-auto mb-5 max-w-[938px] whitespace-pre-line wrap-break-word rounded-lg bg-amber-50 p-4 text-sm text-amber-800"
          role="status"
        >
          {flow.warnings.map((warning, index) => (
            <p key={index}>{warning}</p>
          ))}
        </aside>
      )}
      {!flow.canManage && !flow.error && (
        <p className="mx-auto mb-4 max-w-[938px] text-sm text-neutral-500">
          {stage === "results"
            ? "You have view-only access."
            : "You have view-only access. An editor can generate or activate the configuration."}
        </p>
      )}
      {stage === "results" && record && flow.scope ? (
        <ActivatedSignals
          key={`signals:${recordKey}`}
          scope={flow.scope}
          onboardingId={record.id}
          canManage={flow.canManage}
          onReviewFormulas={() => setFormulaRecord(recordKey)}
        />
      ) : stage === "intro" && !flow.error ? (
        <section className="mx-auto flex max-w-[938px] flex-col items-center gap-5 text-center">
          <Image
            src="/images/operations-intelligence/intro.webp"
            alt="AI connects industry, production, data, and maintenance information"
            width={600}
            height={400}
            priority
            className="h-auto w-full max-w-[600px]"
          />
          <div>
            <h1 className="text-[26px] font-semibold leading-9 sm:text-[30px]">
              Operations Intelligence &amp; Predictive Actions
            </h1>
            <p className="mt-2 text-base leading-7 text-neutral-500 sm:text-lg">
              Let our AI read your integrated data and automatically generate
              actionable insights and predictions based on your industry and
              data classification.
            </p>
          </div>
          <Button
            className={primaryButton}
            disabled={!flow.canManage || flow.busy}
            onClick={flow.generate}
          >
            <DesignIcon name="analyze" size={16} />
            {flow.busy ? "Starting analysis..." : "Analyze & Generate"}
          </Button>
          <aside className="flex w-full gap-3 rounded-[10px] bg-primary-50 px-4 py-3 text-left text-primary-500">
            <DesignIcon name="info" size={16} />
            <div>
              <h2 className="text-sm font-medium">How it works?</h2>
              <p className="mt-0.5 text-sm leading-5">
                Our AI analyzes your integrated data, identifies the relevant
                sector (e.g. oil &amp; gas, mining, manufacturing, etc.), and
                applies predefined formulas to generate Operation Intelligence
                and Predictive Actions tailored to your data.
              </p>
            </div>
          </aside>
        </section>
      ) : record ? (
        <section className="signals-onboarding mx-auto max-w-[938px]">
          <div className="signals-setup-card rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-10">
            <div className="min-w-0 space-y-5">
              <div aria-live="polite" aria-atomic="true">
                <h1 className="text-xl font-semibold leading-7">
                  {stage === "setup"
                    ? "Setting up your data source"
                    : stage === "ready"
                      ? "Your data source is ready"
                      : "Setup did not finish"}
                </h1>
                <p className="mt-1 text-base leading-6 text-neutral-500">
                  {stage === "setup" ? (
                    "The AI engine is reading your tables, choosing an industry pack and mapping columns. This can take a few minutes, the page updates by itself."
                  ) : stage === "ready" ? (
                    <>
                      The AI engine mapped your tables to{" "}
                      <strong className="font-semibold text-neutral-950">
                        {flow.pack.data?.name ?? "the selected industry pack"}{" "}
                        {record.industry_pack_version ??
                          flow.pack.data?.version}
                      </strong>{" "}
                      and set up {record.detectors?.length ?? "--"} detectors in{" "}
                      {record.modules?.length ?? "--"} modules. Scans start once
                      you activate it.
                    </>
                  ) : (
                    "The AI engine could not produce a valid configuration for your tables."
                  )}
                </p>
              </div>
              {stage === "setup" ? (
                <SetupProgress />
              ) : stage === "ready" ? (
                <>
                  <dl className="grid grid-cols-2 gap-3">
                    {[
                      [
                        record.datasets
                          ? Object.keys(record.datasets).length
                          : "--",
                        "Datasets mapped"
                      ],
                      [record.detectors?.length ?? "--", "Detectors"]
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-xl border border-neutral-200 p-3"
                      >
                        <dd className="text-xl font-bold leading-7">{value}</dd>
                        <dt className="mt-1 text-xs leading-4 text-slate-500">
                          {label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                  {record.generation?.pack_generated === true && (
                    <p className="text-xs text-neutral-500">
                      Industry pack generated automatically.
                    </p>
                  )}
                  {flow.pack.isError && (
                    <p className="text-sm text-neutral-500">
                      Pack details are unavailable.{" "}
                      <button
                        className="underline"
                        onClick={() => void flow.pack.refetch()}
                      >
                        Retry pack details
                      </button>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      className={primaryButton}
                      disabled={!flow.canManage || flow.busy || !!flow.error}
                      onClick={flow.activate}
                    >
                      {flow.busy ? "Activating..." : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-lg px-6"
                      onClick={() => setFormulaRecord(recordKey)}
                    >
                      Review Formulas in Use
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    role="alert"
                    className="whitespace-pre-line wrap-break-word rounded-lg bg-red-50 px-4 py-3 text-sm leading-5 text-red-500"
                  >
                    {record.status_message ||
                      "The AI engine could not finish generating a valid configuration. Please try again."}
                  </p>
                  <Button
                    className={primaryButton}
                    disabled={!flow.canManage || flow.busy || !!flow.error}
                    onClick={flow.regenerate}
                  >
                    {flow.busy ? "Regenerating..." : "Regenerate"}
                  </Button>
                </>
              )}
            </div>
            <Image
              src={`/images/operations-intelligence/${stage === "setup" ? "setup" : stage === "ready" ? "ready" : "error"}.webp`}
              alt={
                stage === "setup"
                  ? "AI maps and validates data tables"
                  : stage === "ready"
                    ? "Data source setup completed"
                    : "Data source validation failed"
              }
              width={360}
              height={296}
              priority
              className="mx-auto h-auto w-full max-w-[360px]"
            />
          </div>
        </section>
      ) : null}
      {record && flow.scope && formulasOpen && (
        <FormulasDialog
          key={`formulas:${recordKey}`}
          open={formulasOpen}
          onOpenChange={(open) => setFormulaRecord(open ? recordKey : null)}
          onboarding={record}
          scope={flow.scope}
          onMissing={closeMissing}
        />
      )}
    </div>
  );
}
