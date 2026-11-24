import { cn } from "@/lib/utils";
import { formatRupiah, formatRupiahMillions } from "../format";

type RupiahTextProps = {
  value: number | null | undefined;
  /** Compact form: "Rp 6.683,1 m" */
  millions?: boolean;
  className?: string;
};

export function RupiahText({ value, millions, className }: RupiahTextProps) {
  if (value == null) return <span className={cn("tabular-nums", className)}>-</span>;
  return (
    <span className={cn("tabular-nums", className)}>
      {millions ? formatRupiahMillions(value) : formatRupiah(value)}
    </span>
  );
}
