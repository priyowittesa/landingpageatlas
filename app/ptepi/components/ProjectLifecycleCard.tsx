import { Tr } from "./Tr";
import type { ReactNode } from "react";
import { ArrowRight, Check, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectLifecycle } from "../types";
import { SectionCard } from "./SectionCard";

type ProjectLifecycleCardProps = {
  lifecycle: ProjectLifecycle;
  className?: string;
  /** A link in the header, e.g. "Open billing" */
  action?: ReactNode;
};

/** Where the project sits between offer and close, and what moves it forward. Every project has one. */
export function ProjectLifecycleCard({ lifecycle, className, action }: ProjectLifecycleCardProps) {
  return (
    <SectionCard
      title="Project lifecycle"
      subtitle={`Now: ${lifecycle.currentLabel}`}
      badge={action}
      className={className}
    >
      <ol className="grid grid-cols-4 gap-y-5 sm:grid-cols-8" aria-label="Lifecycle steps">
        {lifecycle.steps.map((step, index) => (
          <li key={step.label} className="relative flex flex-col items-center gap-2 text-center">
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2",
                  step.state === "next" ? "bg-primary-100" : "bg-primary-500"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                step.state === "done" && "bg-primary-600 text-white",
                step.state === "current" &&
                  "bg-white text-primary-800 ring-2 ring-primary-600 ring-offset-2 ring-offset-white",
                step.state === "next" && "bg-primary-50 text-primary-800"
              )}
            >
              {step.state === "done" ? <Check size={14} aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                "text-xs leading-tight",
                step.state === "current" ? "font-semibold text-gray-950" : "text-gray-600"
              )}
            >
              <Tr>{step.label}</Tr>
              <span className="sr-only">
                {step.state === "done" ? " (done)" : step.state === "current" ? " (current)" : ""}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-primary-100/60 pt-5 md:grid-cols-[1fr_auto]">
        <p className="flex items-start gap-2 text-sm text-gray-800">
          {lifecycle.nextMove ? (
            <>
              <ArrowRight size={16} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
              <span>
                <span className="font-semibold"><Tr>Next move</Tr>: </span>
                <Tr>{lifecycle.nextMove}</Tr>
              </span>
            </>
          ) : (
            <>
              <Flag size={16} className="mt-0.5 shrink-0 text-green-700" aria-hidden />
              <span><Tr>Project closed. Every stage is complete.</Tr></span>
            </>
          )}
        </p>
        {lifecycle.dates.length > 0 && (
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {lifecycle.dates.map((date) => (
              <div key={date.label}>
                <dt className="text-xs text-muted-foreground"><Tr>{date.label}</Tr></dt>
                <dd className="font-medium tabular-nums">{date.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </SectionCard>
  );
}
