import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A row of sections that only renders the ones with data. One section takes the
 * full width; none renders nothing, so a project never shows an empty panel.
 */
export function AdaptiveRow({ children, className }: { children: ReactNode; className?: string }) {
  const items = Children.toArray(children).filter(isValidElement);
  if (items.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-1 gap-5", items.length > 1 && "xl:grid-cols-2", className)}>
      {items}
    </div>
  );
}
