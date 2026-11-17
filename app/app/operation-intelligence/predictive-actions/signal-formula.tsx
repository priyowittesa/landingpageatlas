function FormulaValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">None</span>;
    return (
      <ol className="min-w-0 list-decimal space-y-3 pl-4 marker:text-slate-400">
        {value.map((item, index) => (
          <li key={index} className="min-w-0 pl-1">
            <FormulaValue value={item} />
          </li>
        ))}
      </ol>
    );
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-slate-400">None</span>;
    return (
      <dl className="min-w-0 space-y-3">
        {entries.map(([key, item]) => (
          <div key={key} className="min-w-0 space-y-1">
            <dt className="wrap-anywhere text-[11px] font-semibold capitalize text-slate-500">
              {key === "params" ? "Parameters" : key.replaceAll("_", " ")}
            </dt>
            <dd className="min-w-0 border-l border-slate-200 pl-3">
              <FormulaValue value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere font-mono text-[11px] leading-relaxed text-slate-800">
      {value == null ? "-" : String(value)}
    </span>
  );
}

export function SignalFormula({ value }: { value: unknown }) {
  if (value == null) return null;
  return (
    <section
      aria-label="Formula calculation"
      className="min-w-0 rounded-md border border-slate-200 p-3.5"
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Formula Calculation
      </h3>
      <div className="mt-3 min-w-0 text-xs">
        <FormulaValue value={value} />
      </div>
    </section>
  );
}
