import type { ReactNode } from "react";
import { CalendarClock, type LucideIcon } from "lucide-react";
import { epiData } from "../data";
import { getAsAtLabel } from "../selectors";

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
  /** Extra controls or badges on the right */
  actions?: ReactNode;
  /** Optional icon tile before the title */
  icon?: LucideIcon;
};

/** Page title with the as-at date as a pill, taken from the data. The page's only h1. */
export function ScreenHeader({ title, subtitle, actions, icon: Icon }: ScreenHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-white shadow-md shadow-primary-500/25">
            <Icon size={20} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-900">
          <CalendarClock size={16} aria-hidden />
          As at {getAsAtLabel(epiData)}
        </span>
      </div>
    </header>
  );
}
