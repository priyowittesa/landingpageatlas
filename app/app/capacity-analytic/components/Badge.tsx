import { cn } from "@/lib/utils";
import { BadgeColor } from "../dashboard/types";

const badgeColorClasses: Record<
  BadgeColor,
  Record<"light" | "normal", string>
> = {
  blue: {
    light: "bg-blue-50 text-blue-600",
    normal: "bg-blue-600 text-white",
  },
  red: {
    light: "bg-red-50 text-red-600",
    normal: "bg-destructive text-white",
  },
  orange: {
    light: "bg-orange-50 text-orange-600",
    normal: "bg-orange-500 text-white",
  },
  green: {
    light: "bg-emerald-50 text-emerald-600",
    normal: "bg-success text-white",
  },
};

const badgeVariantClasses = {
  light: "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium leading-4",
  normal: "rounded-full px-2.5 py-1 text-xs font-medium",
};

type BadgeProps = React.ComponentPropsWithoutRef<"span"> & {
  color?: BadgeColor;
  variant?: "light" | "normal";
};

export function Badge({
  color = "green",
  variant = "light",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariantClasses[variant],
        badgeColorClasses[color][variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
