import { Tr } from "./Tr";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  /** Usually a SyntheticDataBadge */
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Anchor target for links on the page */
  id?: string;
  /** Tight body, for a table that brings its own padding */
  flush?: boolean;
};

/** A section of a screen: raised card, accent bar on the title, tinted header. */
export function SectionCard({ title, subtitle, badge, children, className, id, flush = false }: SectionCardProps) {
  return (
    <section id={id} className={cn("ptepi-card scroll-mt-24 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-6 py-5">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden className="mt-1 h-5 w-1 shrink-0 rounded-full bg-primary-600" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold"><Tr>{title}</Tr></h2>
            {subtitle && <p className="text-sm text-muted-foreground"><Tr>{subtitle}</Tr></p>}
          </div>
        </div>
        {badge}
      </div>
      <div className={flush ? "p-2" : "p-6"}>{children}</div>
    </section>
  );
}
