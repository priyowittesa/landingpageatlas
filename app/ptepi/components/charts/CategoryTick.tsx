"use client";

import { useRootScale } from "../../use-root-scale";

type CategoryTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
};

/**
 * Category label on one line, right-aligned to the axis. Recharts default tick
 * wraps by width and splits labels such as "5. Testing and Commissioning".
 * Sized in rem so it grows with the interface.
 */
export function CategoryTick({ x = 0, y = 0, payload }: CategoryTickProps) {
  const scale = useRootScale();
  return (
    <text
      x={Number(x) - 6 * scale}
      y={Number(y)}
      dy={4 * scale}
      textAnchor="end"
      fontSize="0.8125rem"
      fill="var(--color-muted-foreground)"
    >
      {String(payload?.value ?? "")}
    </text>
  );
}
