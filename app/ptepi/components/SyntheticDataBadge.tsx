import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SyntheticDataBadgeProps = {
  /** Real elements (e.g. Kapasitor Bank S-curve) carry "Actual data" instead. */
  real?: boolean;
};

export function SyntheticDataBadge({ real = false }: SyntheticDataBadgeProps) {
  return (
    <Badge
      variant={real ? "green" : "yellow"}
      className={`gap-1.5 rounded-full px-2.5 ring-1 ring-inset ring-current/15 ${real ? "text-green-800" : "text-amber-900"}`}
    >
      <FlaskConical size={16} aria-hidden />
      {real ? "Actual data" : "Synthetic data"}
    </Badge>
  );
}
