import { CircleAlert, CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type StatusTone = "good" | "watch" | "bad" | "neutral";

const TONES = {
  good: { variant: "green", Icon: CircleCheck, text: "text-green-800" },
  watch: { variant: "yellow", Icon: TriangleAlert, text: "text-amber-900" },
  bad: { variant: "red", Icon: CircleAlert, text: "text-red-700" },
  neutral: { variant: "secondary", Icon: Clock, text: "text-gray-700" }
} as const;

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

/** Status is always icon + text, never color alone. */
export function StatusBadge({ tone, label }: StatusBadgeProps) {
  const { variant, Icon, text } = TONES[tone];
  return (
    <Badge variant={variant} className={`shrink-0 gap-1.5 whitespace-nowrap rounded-full px-2.5 ring-1 ring-inset ring-current/15 ${text}`}>
      <Icon size={16} aria-hidden />
      {label}
    </Badge>
  );
}
