import type { FormulaCatalog, FormulaToken } from "../../api-types";

export function ApiFormulaTokens({ tokens, removed = false, catalog }: { tokens: { token: FormulaToken; changed?: boolean }[]; removed?: boolean; catalog?: FormulaCatalog }) {
  return <div className="flex flex-wrap gap-2">
    {tokens.map(({ token, changed }, index) => {
      const variable = token.type === "variable";
      const definition = variable ? catalog?.variables?.find((item) => item.code === token.value) : undefined;
      const unit = token.unit ?? definition?.unit;
      const label = token.type === "number" ? token.number ?? "" : token.type === "lparen" ? "(" : token.type === "rparen" ? ")" : token.type === "comma" ? "," : token.label || definition?.label || token.value;
      return <span key={index} title={token.label || token.value} className={`inline-flex max-w-full flex-wrap items-center gap-1.5 break-words rounded-md border px-3 py-1.5 text-sm font-semibold ${changed ? removed ? "border-red-400 bg-red-50 text-red-700 line-through" : "border-emerald-400 bg-emerald-50 text-emerald-700" : variable ? "border-primary/20 bg-primary/10 text-primary" : token.type === "number" ? "border-border bg-background" : "border-transparent bg-muted"}`}>
        {label}{unit && <span className="text-xs font-normal opacity-70">{unit}</span>}
      </span>;
    })}
  </div>;
}
