import { Tr } from "./Tr";
import { CircleAlert, CircleCheck, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatRupiahMillions } from "../format";
import type { PaymentSchedule, PaymentScheduleTone } from "../types";
import { RupiahText } from "./RupiahText";
import { SectionCard } from "./SectionCard";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

const TONE = {
  good: { Icon: CircleCheck, className: "bg-green-50 text-green-800 ring-green-700/15" },
  watch: { Icon: Clock, className: "bg-amber-50 text-amber-900 ring-amber-700/15" },
  bad: { Icon: CircleAlert, className: "bg-red-50 text-red-700 ring-red-700/15" },
  neutral: { Icon: Send, className: "bg-primary-50 text-primary-800 ring-primary-700/15" }
} satisfies Record<PaymentScheduleTone, { Icon: typeof CircleCheck; className: string }>;

type PaymentScheduleCardProps = {
  schedule: PaymentSchedule;
  title?: string;
  subtitle?: string;
  className?: string;
};

/** Every payment stage of the project, paid ones included, with how much of the value is collected. */
export function PaymentScheduleCard({
  schedule,
  title = "Payment stages",
  subtitle,
  className
}: PaymentScheduleCardProps) {
  return (
    <SectionCard
      title={title}
      subtitle={
        subtitle ??
        `${formatRupiahMillions(schedule.paid)} of ${formatRupiahMillions(schedule.total)} collected (${formatPercent(schedule.paidShare, 2)})`
      }
      badge={<SyntheticDataBadge />}
      className={className}
    >
      <div
        className="mb-5 h-2 overflow-hidden rounded-full bg-primary-50"
        role="img"
        aria-label={`${formatPercent(schedule.paidShare, 2)} of the scheduled value is paid`}
      >
        <div className="h-full rounded-full bg-primary-600" style={{ width: `${schedule.paidShare * 100}%` }} />
      </div>
      <ol className="divide-y divide-primary-100/60">
        {schedule.rows.map((row) => {
          const tone = TONE[row.tone];
          return (
            <li key={row.paymentId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900"><Tr>{row.label}</Tr></p>
                {row.condition && <p className="text-xs text-muted-foreground">{row.condition}</p>}
              </div>
              <div className="text-right">
                <RupiahText value={row.amount} millions className="text-sm font-semibold" />
                {row.dateLabel && <p className="text-xs text-muted-foreground">{row.dateLabel}</p>}
              </div>
              <span
                className={cn(
                  "inline-flex w-36 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                  tone.className
                )}
              >
                <tone.Icon size={14} aria-hidden />
                {row.statusLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

