type CategoryTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
};

/**
 * Category label on one line, right-aligned to the axis. Recharts' default tick
 * wraps by width and splits labels such as "5. Testing and Commissioning".
 */
export function CategoryTick({ x = 0, y = 0, payload }: CategoryTickProps) {
  return (
    <text
      x={Number(x) - 6}
      y={Number(y)}
      dy={4}
      textAnchor="end"
      fontSize={12}
      fill="var(--color-muted-foreground)"
    >
      {String(payload?.value ?? "")}
    </text>
  );
}
