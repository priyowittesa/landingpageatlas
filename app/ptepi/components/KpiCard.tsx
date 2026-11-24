import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type KpiTone = "default" | "good" | "watch" | "bad";

type KpiCardProps = {
  title: string;
  value: ReactNode;
  /** One line under the value: what it counts or compares with */
  subtitle?: string;
  icon: LucideIcon;
  /** Tints the icon tile when the figure is a status, never the value text alone */
  tone?: KpiTone;
  /** Small status badge in the footer, for example a StatusBadge */
  footer?: ReactNode;
  className?: string;
};

const TILE: Record<KpiTone, string> = {
  default: "from-primary-600 to-primary-800",
  good: "from-green-600 to-green-800",
  watch: "from-amber-500 to-amber-700",
  bad: "from-red-500 to-red-700"
};

/**
 * KPI card in the pattern of the shadcn dashboard blocks: small title, icon tile,
 * a large tabular figure and a one-line explanation, on a faint violet wash.
 */
export function KpiCard({ title, value, subtitle, icon: Icon, tone = "default", footer, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "ptepi-card ptepi-card--lift relative overflow-hidden bg-gradient-to-br from-primary-50/80 via-background to-background p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            TILE[tone]
          )}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
