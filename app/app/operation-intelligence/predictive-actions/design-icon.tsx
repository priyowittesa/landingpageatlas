import Image from "next/image";
import { cn } from "@/lib/utils";

export function DesignIcon({
  name,
  size = 14,
  className
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={`/images/operations-intelligence/${name}.webp`}
      alt=""
      width={size}
      height={size}
      unoptimized
      style={{ width: size, height: size }}
      className={cn("shrink-0", className)}
    />
  );
}
