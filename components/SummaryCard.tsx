import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils"; // remove this import if you don't have a cn/clsx helper

type SummaryCardProps = {
  title: string;
  subtitle: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "horizontal" | "stacked";
  trend?: {
    value: number;
    direction?: "up" | "down";
  };
};

export default function SummaryCard({
  title,
  subtitle,
  value,
  icon: Icon,
  variant = "horizontal",
  trend,
}: SummaryCardProps) {
  // Variant Stacked: Vertical layout with trend element added (percentage)
  if (variant === "stacked") {
    const isUp = trend?.direction !== "down";

    return (
      <div className="border shadow-sm rounded-lg px-5 py-4 flex flex-col gap-0 min-w-55">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{title}</span>
          <div className="bg-primary-50 rounded-full h-9 w-9 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary-700" />
          </div>
        </div>

        <strong className="text-2xl font-bold">{value}</strong>

        {trend && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
                isUp
                  ? "bg-primary-50 text-primary-700"
                  : "bg-red-50 text-red-600",
              )}
            >
              {isUp ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-500">{subtitle}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border shadow-sm rounded-lg px-4 py-3 flex items-center gap-3">
      <div className="bg-primary-50 rounded-xl h-17 w-17 flex items-center justify-center">
        <Icon className="h-8 w-8 text-primary-700" />
      </div>

      <div className="flex flex-col">
        <strong className="text-sm">{title}</strong>
        <strong className="text-lg">{value}</strong>
        <span className="text-[10px] text-gray-500">{subtitle}</span>
      </div>
    </div>
  );
}
