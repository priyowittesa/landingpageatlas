import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-gray-100",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary-700 transition-all",
          indicatorClassName
        )}
        style={{ width: `${safe}%` }}
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export default Progress;