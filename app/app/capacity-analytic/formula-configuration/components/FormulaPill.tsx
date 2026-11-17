export function FormulaVariable({
  label,
  unit,
}: {
  label: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary-100 bg-primary-50 px-3.5 py-1.5">
      <span className="text-sm font-semibold text-primary-700">{label}</span>
      {unit && <span className="text-xs text-primary-400">{unit}</span>}
    </div>
  );
}

export function FormulaNumber({
  value,
  unit,
}: {
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5">
      <span className="text-sm font-semibold text-foreground">{value}</span>
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  );
}

export function FormulaOperator({ symbol }: { symbol: string }) {
  return (
    <div className="flex items-center justify-center rounded-md bg-gray-100 px-3.5 py-1.5">
      <span className="text-sm font-bold text-foreground">{symbol}</span>
    </div>
  );
}
