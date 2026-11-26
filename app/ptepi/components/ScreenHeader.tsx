import { Tr } from "./Tr";
import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { DemoSnapshotPill } from "./DemoSnapshotPill";
import { RevealHeader } from "./RevealHeader";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

export type DataTag = "synthetic" | "real";

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
  /** Extra controls or badges on the right */
  actions?: ReactNode;
  /** Optional icon tile before the title */
  icon?: LucideIcon;
  /** Data tags of the screen (NF-06); every header shows at least "Data sintetis" */
  dataTags?: DataTag[];
};

/** Page title with the data tags and the demo snapshot date as pills. The page's only h1. */
export function ScreenHeader({ title, subtitle, actions, icon: Icon, dataTags = ["synthetic"] }: ScreenHeaderProps) {
  return (
    // Pulled out to the edges of <main>, so content scrolls cleanly under the whole bar.
    <RevealHeader className="-mx-6 -mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-6 py-3 lg:-mx-15 lg:px-15">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-white shadow-md shadow-primary-500/25">
            <Icon size={20} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-gray-950"><Tr>{title}</Tr></h1>
        <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground"><Tr>{subtitle}</Tr></p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {dataTags.map((tag) => (
          <SyntheticDataBadge key={tag} real={tag === "real"} />
        ))}
        <DemoSnapshotPill />
      </div>
    </RevealHeader>
  );
}
