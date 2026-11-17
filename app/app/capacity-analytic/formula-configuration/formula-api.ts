import type { FormulaCatalog, FormulaDraft, FormulaToken, FormulaVersion } from "../api-types";
import { capacityGet, capacityWrite } from "../api";

export interface EditorToken {
  uid: string;
  kind: "variable" | "operator" | "constant";
  code?: string;
  label?: string;
  unit?: string;
  symbol?: string;
  value?: string;
}

export function toApiTokens(tokens: EditorToken[]): FormulaToken[] {
  return tokens.flatMap((token): FormulaToken[] => {
    if (token.kind === "variable") return [{ type: "variable", value: token.code }];
    if (token.kind === "constant") return [{ type: "number", number: Number(token.value?.replaceAll(",", "")), ...(token.unit ? { unit: token.unit } : {}), ...(token.label ? { label: token.label } : {}) }];
    if (token.symbol === "(") return [{ type: "lparen" }];
    if (token.symbol === ")") return [{ type: "rparen" }];
    if (token.symbol === ",") return [{ type: "comma" }];
    if (token.symbol === "MIN(" || token.symbol === "MAX(") return [{ type: "function", value: token.symbol.slice(0, -1).toLowerCase() }, { type: "lparen" }];
    return [{ type: "operator", value: token.symbol === "x" ? "*" : token.symbol === "\u00f7" ? "/" : token.symbol }];
  });
}

export function fromApiTokens(tokens: FormulaToken[], catalog?: FormulaCatalog): EditorToken[] {
  const result: EditorToken[] = [];
  tokens.forEach((token, index) => {
    const uid = `api-${index}-${token.type}`;
    if (token.type === "variable") {
      const variable = catalog?.variables?.find((item) => item.code === token.value);
      result.push({ uid, kind: "variable", code: token.value, label: variable?.label || token.value, unit: variable?.unit });
    } else if (token.type === "number") {
      result.push({ uid, kind: "constant", value: String(token.number ?? 0), unit: token.unit, label: token.label });
    } else if (token.type === "function") {
      result.push({ uid, kind: "operator", symbol: `${token.value?.toUpperCase()}(` });
    } else if (token.type !== "lparen" || tokens[index - 1]?.type !== "function") {
      const symbol = token.type === "lparen" ? "(" : token.type === "rparen" ? ")" : token.type === "comma" ? "," : token.value;
      result.push({ uid, kind: "operator", symbol });
    }
  });
  return result;
}

export function formulaLabel(formula?: FormulaVersion) {
  if (!formula) return "-";
  if (formula.is_system_default) return formula.name || "Standard";
  const scope = formula.scope_level === "FORMULA_SCOPE_LEVEL_GLOBAL" ? "Global default"
    : `${formula.scope_code || formula.name}${formula.scope_level === "FORMULA_SCOPE_LEVEL_LINE_GROUP" ? " group" : ""}`;
  return `${scope} v${formula.version_no}`;
}

export async function saveFormulaDraft(draft: FormulaDraft, id?: string) {
  if (id) {
    // Active versions are immutable. Re-check before deciding whether to update or fork.
    const existing = await capacityGet<FormulaVersion>(`/formulas/${encodeURIComponent(id)}`);
    const sameScope = existing.scope_level === draft.scope_level &&
      (draft.scope_level === "FORMULA_SCOPE_LEVEL_GLOBAL" || (draft.scope_ids.length === 1 && draft.scope_ids[0] === existing.scope_id));
    if (existing.status === "FORMULA_VERSION_STATUS_DRAFT" && sameScope) {
      const record = await capacityWrite<FormulaVersion>(`/formulas/${encodeURIComponent(id)}`, {
        name: draft.name, tokens: draft.tokens, effective_from: draft.effective_from,
      }, "PUT");
      if (!record?.id) throw new Error("The API did not return the saved formula version.");
      return [record];
    }
  }
  const result = await capacityWrite<{ formula_versions: FormulaVersion[] }>("/formulas", draft);
  if (!result?.formula_versions?.length || result.formula_versions.some((version) => !version.id)) throw new Error("The API did not return the saved formula versions.");
  return result.formula_versions;
}

export async function saveFormulaTargets(draft: FormulaDraft, existing: FormulaVersion[], editId?: string) {
  const sameTargets = existing.length > 0 && existing.every((version) =>
    version.scope_level === draft.scope_level && (draft.scope_level === "FORMULA_SCOPE_LEVEL_GLOBAL" || draft.scope_ids.includes(version.scope_id ?? ""))) &&
    existing.length === (draft.scope_level === "FORMULA_SCOPE_LEVEL_GLOBAL" ? 1 : draft.scope_ids.length);
  if (!sameTargets) return saveFormulaDraft(draft, editId);
  const versions: FormulaVersion[] = [];
  for (const version of existing) {
    const saved = await saveFormulaDraft({
      ...draft, scope_ids: draft.scope_level === "FORMULA_SCOPE_LEVEL_GLOBAL" ? [] : [version.scope_id!],
    }, version.id);
    versions.push(...saved);
  }
  return versions;
}
