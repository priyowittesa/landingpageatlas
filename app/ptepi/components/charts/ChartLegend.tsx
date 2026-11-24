type LegendItem = {
  label: string;
  color: string;
  /** square, dot or dashed line */
  shape?: "square" | "dot" | "dash";
};

type ChartLegendProps = {
  items: LegendItem[];
};

/** Own legend, so text stays in the text colour and every swatch has a text label. */
export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.shape === "dash" ? (
            <svg width="18" height="8" aria-hidden>
              <line x1="0" y1="4" x2="18" y2="4" stroke={item.color} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
          ) : (
            <span
              aria-hidden
              className={item.shape === "dot" ? "h-2.5 w-2.5 rounded-full" : "h-2.5 w-2.5 rounded-sm"}
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
