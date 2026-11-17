"use client";

import { useEffect, useState } from "react";
import { DesignIcon } from "./design-icon";

const steps = [
  "Reading your integrated tables",
  "Choosing an industry pack and mapping columns",
  "Preparing and validating against your data"
];

export function SetupProgress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    // These are presentation stages, not backend-reported progress.
    const choosing = window.setTimeout(() => setStep(1), 5000);
    const preparing = window.setTimeout(() => setStep(2), 10000);
    return () => {
      window.clearTimeout(choosing);
      window.clearTimeout(preparing);
    };
  }, []);

  return (
    <div className="space-y-4">
      <ol className="space-y-5" aria-label="Setup progress">
        {steps.map((label, index) => {
          const active = index === step;
          const complete = index < step;
          return (
            <li key={label} className="flex items-center gap-3 text-sm text-neutral-500" aria-current={active ? "step" : undefined}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${complete ? "bg-green-600" : active ? "bg-primary-50" : "bg-neutral-100"}`}>
                <DesignIcon
                  name={complete ? "step-complete" : active ? "step-loading" : "step-pending"}
                  size={24}
                  className={active ? "motion-safe:animate-spin" : undefined}
                />
              </span>
              <span><span className="sr-only">{complete ? "Complete: " : active ? "In progress: " : "Pending: "}</span>{label}</span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs leading-5 text-neutral-500">These indicators are illustrative. Completion is confirmed by the AI engine.</p>
    </div>
  );
}
