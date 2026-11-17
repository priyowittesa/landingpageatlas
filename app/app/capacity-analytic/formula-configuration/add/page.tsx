"use client";

import React, { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  FileText,
  Layers,
  Calendar,
  Info,
  ChevronDown,
  Undo2,
  Redo2,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useCapacityMutation, useCapacityOptions, useCapacityPreview, useCapacityQuery } from "../../use-capacity";
import type { FormulaCatalog, FormulaDraft, FormulaValidation, FormulaVersion, MasterRecord, ScopeInfo } from "../../api-types";
import { capacityError, masterLabel } from "../../api";
import { fromApiTokens, saveFormulaTargets, toApiTokens } from "../formula-api";
import { ApiState } from "../../components/ApiState";
import { ApiFormulaPreview } from "../components/ApiFormulaPreview";
import { ApiFormulaReview } from "../components/ApiFormulaReview";
import { ScopeSummaries } from "../components/ScopeSummaries";

// =====================================================================
// Types
// =====================================================================

interface VariableToken {
  uid: string;
  kind: "variable";
  code: string;
  label: string;
  unit?: string;
}

interface OperatorToken {
  uid: string;
  kind: "operator";
  symbol: string;
}

interface ConstantToken {
  uid: string;
  kind: "constant";
  value: string;
  unit?: string;
  label?: string;
}

type FormulaToken = VariableToken | OperatorToken | ConstantToken;

interface VariableDef {
  code: string;
  label: string;
  unit?: string;
  category: "Time available" | "Output rate" | "Labour";
  description: string;
  source: string;
  value: string;
}

interface QuickNumber {
  id: string;
  value: string;
  label: string;
  unit?: string;
}

interface Template {
  id: string;
  title: string;
  summary: string;
  tokens: () => FormulaToken[];
}

// =====================================================================
// Static data
// =====================================================================

const LEVELS = ["Global Default", "Product", "Line group", "Line"];

const VARIABLE_CATEGORIES: VariableDef["category"][] = [
  "Time available",
  "Output rate",
  "Labour",
];

const OPERATOR_BUTTONS = ["+", "-", "x", "÷", "(", ")", "MIN(", "MAX(", ","];

let uidCounter = 0;
const nextUid = () => `t${++uidCounter}`;

const operatorToken = (symbol: string): OperatorToken => ({
  uid: nextUid(),
  kind: "operator",
  symbol,
});
const constantToken = (
  value: string,
  unit?: string,
  label?: string,
): ConstantToken => ({
  uid: nextUid(),
  kind: "constant",
  value,
  unit,
  label,
});

// =====================================================================
// Small pill / token renderers
// =====================================================================

function TokenPill({
  token,
  showCodeNames,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onClick,
  dropIndicator,
  invalid,
}: {
  token: FormulaToken;
  showCodeNames: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  dropIndicator?: "before" | "after";
  invalid?: boolean;
}) {
  const base =
    `relative select-none cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold ${invalid ? "ring-2 ring-red-500" : ""}`;

  const indicator = dropIndicator && (
    <span
      className={`absolute top-0 bottom-0 w-0.5 bg-primary-500 ${
        dropIndicator === "before" ? "-left-1" : "-right-1"
      }`}
    />
  );

  if (token.kind === "operator") {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`${base} bg-neutral-100 text-neutral-600 font-bold`}
      >
        {indicator}
        {token.symbol}
      </div>
    );
  }

  if (token.kind === "constant") {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`${base} border border-border bg-background text-foreground`}
      >
        {indicator}
        {token.value}
        {token.unit && (
          <span className="text-xs font-normal text-primary-400">
            {token.unit}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`${base} border border-primary-100 bg-primary-50 text-primary-900`}
    >
      {indicator}
      {showCodeNames ? token.code : token.label}
      {token.unit && (
        <span className="text-xs font-normal text-primary-400">
          {token.unit}
        </span>
      )}
    </div>
  );
}

function FormSection({
  children,
  button,
  step,
  title,
}: {
  children: React.ReactNode;
  step: number;
  title: string;
  button?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-lg font-semibold text-primary-700">
            {step}
          </span>

          <h2 className="text-lg font-bold text-primary-700">{title}</h2>
        </div>

        {button}
      </div>

      {children}
    </section>
  );
}

// =====================================================================
// Main page
// =====================================================================

export default function NewFormulaPage() {
  return <Suspense fallback={<p>Loading formula...</p>}><FormulaEditorLoader /></Suspense>;
}

function FormulaEditorLoader() {
  const editId = useSearchParams().get("id") ?? "";
  const catalog = useCapacityQuery<FormulaCatalog>("/formulas/catalog");
  const record = useCapacityQuery<FormulaVersion>(`/formulas/${encodeURIComponent(editId)}`, undefined, !!editId);
  if (!catalog.data || catalog.error || (editId && (!record.data || record.error))) {
    return <><ApiState query={catalog} />{editId && <ApiState query={record} />}</>;
  }
  return <FormulaEditor key={editId} editId={editId} catalog={{ data: catalog.data }} record={{ data: record.data }} />;
}

function FormulaEditor({ editId, catalog, record }: { editId: string; catalog: { data: FormulaCatalog }; record: { data?: FormulaVersion } }) {
  const router = useRouter();
  const products = useCapacityOptions<MasterRecord>("/products");
  const groups = useCapacityOptions<MasterRecord>("/production-line-groups");
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  // ---- Scope ----
  const [level, setLevel] = useState(() => {
    const levels: Record<string, string> = { GLOBAL: "Global Default", PRODUCT: "Product", LINE_GROUP: "Line group", LINE: "Line" };
    return levels[record.data?.scope_level.replace("FORMULA_SCOPE_LEVEL_", "") ?? "GLOBAL"] || "Global Default";
  });
  const [targetOpen, setTargetOpen] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(
    new Set(record.data?.scope_id ? [record.data.scope_id] : []),
  );
  const [effectiveFrom, setEffectiveFrom] = useState(() => record.data?.effective_from || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`);
  const scopeLevel = `FORMULA_SCOPE_LEVEL_${({ "Global Default": "GLOBAL", Product: "PRODUCT", "Line group": "LINE_GROUP", Line: "LINE" } as Record<string, string>)[level]}`;
  const targets = level === "Product" ? products.data ?? [] : level === "Line group" ? groups.data ?? [] : level === "Line" ? lines.data ?? [] : [];
  const TARGET_GROUPS = [{ group: level, options: targets.map((item) => item.id) }];
  const targetName = (id: string) => {
    const target = targets.find((item) => item.id === id);
    return target ? masterLabel(target) : id;
  };
  const scopeIds = level === "Global Default" ? [] : Array.from(selectedTargets).sort();
  const scopeInfo = useCapacityQuery<ScopeInfo>("/formulas/scope-info", {
    scope_level: scopeLevel, scope_id: scopeIds[0], effective_from: effectiveFrom,
  }, !!effectiveFrom && (level === "Global Default" || !!scopeIds.length));
  const VARIABLES: VariableDef[] = (catalog.data?.variables ?? []).map((item) => ({
    ...item, category: item.group === "labour" ? "Labour" : item.group === "output_rate" ? "Output rate" : "Time available", value: "",
  }));
  const variableToken = (code: string): VariableToken => {
    const variable = VARIABLES.find((item) => item.code === code)!;
    return { ...variable, uid: nextUid(), kind: "variable" };
  };
  const TEMPLATES: Template[] = [
    ...(scopeInfo.data?.inherited || scopeInfo.data?.current ? [{
      id: "current", title: scopeIds.length > 1 ? "Current Formula (first target)" : "Current Formula", summary: (scopeInfo.data.current ?? scopeInfo.data.inherited)?.reads_as || "",
      tokens: () => fromApiTokens((scopeInfo.data!.current ?? scopeInfo.data!.inherited)?.tokens ?? [], catalog.data) as FormulaToken[],
    }] : []),
    ...(catalog.data?.templates ?? []).map((item) => ({
      id: item.code, title: item.name, summary: item.description || item.reads_as,
      tokens: () => fromApiTokens(item.tokens, catalog.data) as FormulaToken[],
    })),
  ];

  const allTargetOptions = TARGET_GROUPS.flatMap((g) => g.options);
  const targetLabel =
    selectedTargets.size > 0
      ? `${selectedTargets.size} selected target`
      : "Select target";

  const toggleTarget = (opt: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  // ---- Start from ----
  const [selectedTemplateId, setSelectedTemplateId] = useState("current");

  // ---- Formula name ----
  const [formulaName, setFormulaName] = useState(record.data?.name ?? "");

  // ---- Formula tokens + history ----
  const [tokens, setTokens] = useState<FormulaToken[]>(() => fromApiTokens(record.data?.tokens ?? [], catalog.data) as FormulaToken[]);
  const [draftIds, setDraftIds] = useState<FormulaVersion[]>([]);
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const apiTokens = useMemo(() => toApiTokens(tokens), [tokens]);
  const stableTokens = useDebouncedValue(apiTokens, 350);
  const validation = useCapacityPreview<FormulaValidation>("/formulas/validate", { tokens: stableTokens });
  const validationCurrent = JSON.stringify(apiTokens) === JSON.stringify(stableTokens) && !validation.isFetching && !validation.error;
  const draft: FormulaDraft = { scope_level: scopeLevel, scope_ids: scopeIds, name: formulaName, tokens: apiTokens, effective_from: effectiveFrom };
  const fingerprint = JSON.stringify(draft);
  const save = useCapacityMutation(async () => {
    if (!effectiveFrom || (level !== "Global Default" && !scopeIds.length)) throw new Error("Select the scope targets and effective date.");
    if (draftIds.length && fingerprint === savedFingerprint) return draftIds;
    const versions = await saveFormulaTargets(draft, draftIds, editId || undefined);
    setDraftIds(versions);
    setSavedFingerprint(fingerprint);
    return versions;
  });
  const historyRef = useRef<FormulaToken[][]>([]);
  const futureRef = useRef<FormulaToken[][]>([]);
  const [, forceRender] = useState(0);

  const commitTokens = (next: FormulaToken[]) => {
    historyRef.current.push(tokens);
    futureRef.current = [];
    setTokens(next);
  };

  const undo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    futureRef.current.push(tokens);
    setTokens(prev);
    forceRender((n) => n + 1);
  };

  const redo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(tokens);
    setTokens(next);
    forceRender((n) => n + 1);
  };

  const clearTokens = () => commitTokens([]);

  const applyTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    commitTokens(template.tokens());
  };

  const startBlank = () => {
    setSelectedTemplateId("blank");
    commitTokens([]);
  };

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId);

  // ---- Code names toggle ----
  const [showCodeNames, setShowCodeNames] = useState(false);

  // ---- Insert / reorder / remove tokens ----
  const insertTokenAt = (token: FormulaToken, index: number) => {
    const next = [...tokens];
    next.splice(index, 0, token);
    commitTokens(next);
  };

  const appendToken = (token: FormulaToken) =>
    insertTokenAt(token, tokens.length);

  const removeTokenAt = (index: number) => {
    const next = tokens.filter((_, i) => i !== index);
    commitTokens(next);
  };

  const replaceTokenAt = (index: number, token: FormulaToken) => {
    const next = [...tokens];
    next[index] = token;
    commitTokens(next);
  };

  const moveToken = (fromIndex: number, toIndex: number) => {
    const next = [...tokens];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, moved);
    commitTokens(next);
  };

  // ---- Drag and drop ----
  const dragRef = useRef<
    | { source: "field"; index: number }
    | { source: "palette"; token: FormulaToken }
    | null
  >(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleFieldDrop = () => {
    if (dropIndex === null || !dragRef.current) return;
    if (dragRef.current.source === "field") {
      moveToken(dragRef.current.index, dropIndex);
    } else {
      insertTokenAt(
        { ...dragRef.current.token, uid: nextUid() } as FormulaToken,
        dropIndex,
      );
    }
    dragRef.current = null;
    setDropIndex(null);
  };

  // ---- Token detail / replace popup ----
  const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(null);
  const activeToken =
    activeTokenIndex !== null ? tokens[activeTokenIndex] : null;
  const activeVarDef =
    activeToken?.kind === "variable"
      ? VARIABLES.find((d) => d.code === activeToken.code)
      : null;

  // ---- Autocomplete ----
  const [inputValue, setInputValue] = useState("");
  const suggestions = (() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return VARIABLES.filter((d) => d.label.toLowerCase().includes(q)).slice(
      0,
      6,
    );
  })();

  const insertFromInput = () => {
    if (suggestions.length === 0) return;
    appendToken(variableToken(suggestions[0].code));
    setInputValue("");
  };

  // ---- Custom numbers ----
  const [customNumbers, setQuickNumbers] = useState<QuickNumber[]>([]);
  const quickNumbers: QuickNumber[] = [
    ...(catalog.data?.constants ?? []).map((item, index) => ({ id: `catalog-${index}`, value: String(item.number), label: item.label ?? "", unit: item.unit })),
    ...customNumbers,
  ];
  const [customPopupOpen, setCustomPopupOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const insertCustomNumber = () => {
    if (!customValue.trim() || !Number.isFinite(Number(customValue.replaceAll(",", "")))) return;
    const id = `custom-${nextUid()}`;
    setQuickNumbers((prev) => [
      ...prev,
      { id, value: customValue.trim(), label: customLabel.trim() },
    ]);
    setCustomValue("");
    setCustomLabel("");
    setCustomPopupOpen(false);
  };

  // ---- Impact Preview ----
  const [impactOpen, setImpactOpen] = useState(false);

  // ---- Review and activate ----
  const [reviewOpen, setReviewOpen] = useState(false);

  // ---- Reads as ----
  const readsAs = validationCurrent ? validation.data?.reads_as : "";

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <section className="flex justify-between">
          <PageHeader
            title=" New Formula"
            subtitle=" Define how available capacity is calculated for this scope, then
              confirm the result before it goes live."
          />

          <Button
            className="h-10 gap-1.5 px-4"
            onClick={() => setImpactOpen(true)}
          >
            <FileText size={16} /> Impact Preview
          </Button>
        </section>
        {[products, groups, lines].filter((q) => q.error).map((q, i) => <ApiState key={i} query={q} />)}
        {(level === "Global Default" || scopeIds.length > 0) && <ApiState query={scopeInfo} />}
        {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}

        {/* 1. Scope */}
        <FormSection step={1} title="Scope">
          <div className="space-y-2.5">
            <div className="mt-6 flex flex-wrap items-end gap-8">
              <div>
                <span className="mb-1 block text-sm font-medium text-foreground">
                  Level
                </span>
                <div className="inline-flex rounded-lg bg-purple-50 p-1">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLevel(l); setSelectedTargets(new Set()); }}
                      className={cn(
                        `rounded-md px-3 py-1 font-medium transition-colors`,
                        level === l
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span className="mb-1 block text-sm font-medium text-foreground">
                  Target
                </span>

                <button
                  disabled={level === "Global Default"}
                  onClick={() => setTargetOpen((o) => !o)}
                  className="flex h-10 w-64 items-center justify-between rounded-md border border-border px-3.5 text-sm text-foreground"
                >
                  <span
                    className={
                      selectedTargets.size === 0 ? "text-muted-foreground" : ""
                    }
                  >
                    {targetLabel}
                  </span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </button>

                {targetOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setTargetOpen(false)}
                    />

                    <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-95 rounded-md border border-border bg-background shadow-lg">
                      <div className="flex items-start gap-3.5 p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                          <Layers size={16} className="text-purple-600" />
                        </div>

                        <div>
                          <p className="font-semibold text-foreground">
                            Where this formula applies
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tick one or more products.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border" />

                      <div className="max-h-64 overflow-y-auto p-4">
                        {TARGET_GROUPS.map((g) => (
                          <div key={g.group} className="mb-3 last:mb-0">
                            <p className="mb-2 text-sm text-muted-foreground">
                              {g.group}
                            </p>

                            <div className="flex flex-col gap-2">
                              {g.options.map((opt) => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2 text-foreground"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedTargets.has(opt)}
                                    onChange={() => toggleTarget(opt)}
                                    className="h-4 w-4 border rounded accent-primary-600"
                                  />
                                  {targetName(opt)}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-border p-3">
                        <button
                          onClick={() => setSelectedTargets(new Set())}
                          className="px-2 text-sm font-medium text-foreground"
                        >
                          Clear compared
                        </button>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className=""
                            onClick={() =>
                              setSelectedTargets(new Set(allTargetOptions))
                            }
                          >
                            Compare all line
                          </Button>
                          <Button
                            className=""
                            onClick={() => setTargetOpen(false)}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-foreground">
                  Effective From
                </span>

                <div className="flex h-10 w-52 items-center gap-2 rounded-lg border border-border px-3">
                  <Calendar size={15} className="text-muted-foreground" />
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground outline-none"
                  />
                </div>
              </div>
            </div>

            <ScopeSummaries scopeLevel={scopeLevel} scopeIds={scopeIds} effectiveFrom={effectiveFrom} targetName={targetName} />
          </div>
        </FormSection>

        {/* 2. Start from */}
        <FormSection
          step={2}
          title="Start from"
          button={
            <Button variant="outline" onClick={startBlank}>
              Start blank
            </Button>
          }
        >
          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => {
              const active = t.id === selectedTemplateId;

              return (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className={
                    "rounded-md border p-2.5 text-left transition-colors " +
                    (active
                      ? "border-primary-700 bg-purple-50 ring-1 ring-primary-700"
                      : "border-border")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground">{t.title}</span>
                    {active && (
                      <CheckCircle2 size={16} className="text-primary-700" />
                    )}
                  </div>

                  <p className="mt-2.5 text-sm text-muted-foreground">
                    {t.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* 3. Available Capacity Formula */}
        <FormSection step={3} title="Available Capacity Formula">
          <div className="space-y-2.5">
            {/* [] Change to form component */}
            <div className="mt-6">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Formula&apos;s Name
              </span>
              <Input
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
                placeholder="Input formula's name"
                className="h-11"
              />
            </div>

            <div className="flex items-start gap-2 rounded-md bg-background px-4 py-3 text-sm text-muted-foreground border border-border shadow-xs">
              <Info size={16} />
              <span>
                Capacity % is always Loading ÷ Available capacity x 100. Here
                you only define Available capacity
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.6">
                <span className="font-semibold text-foreground">
                  Available capacity (pcs) =
                </span>
                <span className="rounded-xs bg-gray-100 px-3.5 py-1 text-sm font-medium text-muted-foreground">
                  Based on {selectedTemplate?.title ?? "blank formula"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={undo}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground shadow-sm"
                >
                  <Undo2 size={16} />
                </button>

                <button
                  onClick={redo}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground shadow-sm"
                >
                  <Redo2 size={16} />
                </button>

                <Button
                  variant="outline"
                  className="text-xs px-2 py-1 shadow-xs h-7"
                  onClick={clearTokens}
                >
                  Clear
                </Button>

                <button
                  onClick={() => setShowCodeNames((s) => !s)}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span
                    className={
                      "relative h-5 w-8 rounded-full transition-colors border " +
                      (showCodeNames ? "bg-purple-600" : "bg-muted-foreground")
                    }
                  >
                    <span
                      className={
                        "absolute top-px h-4 w-4 rounded-full bg-white transition-transform " +
                        (showCodeNames ? "right-0.5" : "left-0.5")
                      }
                    />
                  </span>
                  Code names
                </button>
              </div>
            </div>

            {/* Formula field */}
            <div
              className="flex min-h-16 flex-wrap items-center gap-2 rounded-md border border-border px-4 py-2.5"
              onDragOver={(e) => {
                e.preventDefault();
                setDropIndex(tokens.length);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleFieldDrop();
              }}
            >
              {tokens.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Drag variables in, or type below to search.
                </span>
              )}
              {tokens.map((token, index) => (
                <TokenPill
                  key={token.uid}
                  token={token}
                  invalid={validationCurrent && validation.data?.error?.token_index !== undefined && validation.data.error.token_index >= toApiTokens(tokens.slice(0, index)).length && validation.data.error.token_index < toApiTokens(tokens.slice(0, index + 1)).length}
                  showCodeNames={showCodeNames}
                  draggable
                  onDragStart={() => {
                    dragRef.current = { source: "field", index };
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropIndex(index);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFieldDrop();
                  }}
                  onDragEnd={() => {
                    dragRef.current = null;
                    setDropIndex(null);
                  }}
                  onClick={() => setActiveTokenIndex(index)}
                  dropIndicator={dropIndex === index ? "before" : undefined}
                />
              ))}

              {/* inline autocomplete input */}
              <div className="relative">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      insertFromInput();
                    }
                  }}
                  placeholder="Type to search..."
                  className="w-40 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm outline-none focus:border-purple-400"
                />

                {suggestions.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-56 rounded-lg border border-border bg-background py-1 shadow-lg">
                    {suggestions.map((s) => (
                      <button
                        key={s.code}
                        onClick={() => {
                          appendToken(variableToken(s.code));
                          setInputValue("");
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="text-foreground">{s.label}</span>

                        {s.unit && (
                          <span className="text-xs text-neutral-400">
                            {s.unit}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold" role="status">
              <span>
                {!validationCurrent ? "Validating formula..." : validation.data?.valid ? "Valid formula. The result is in pcs." : validation.data?.error?.message || "Add tokens to build a formula."}
              </span>
              {validationCurrent && validation.data?.error?.suggestion && <Button variant="outline" onClick={() => commitTokens(fromApiTokens(validation.data!.error!.suggestion!.tokens, catalog.data) as FormulaToken[])}>Apply Suggestion</Button>}
            </div>
            <ApiState query={validation} />

            <div className="rounded-md bg-gray-100 px-4 py-2.5 text-sm text-muted-foreground">
              <span className="font-semibold">Reads as </span>
              {readsAs || "—"}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4 space-y-2.5">
            <h3 className="font-semibold text-foreground">Variables</h3>

            {VARIABLE_CATEGORIES.map((category) => (
              <div key={category} className="mt-1">
                <p className="mb-1 text-sm text-muted-foreground">{category}</p>

                <div className="flex flex-wrap gap-2">
                  {VARIABLES.filter((d) => d.category === category).map((d) => (
                    <div
                      key={d.code}
                      draggable
                      onDragStart={() => {
                        dragRef.current = {
                          source: "palette",
                          token: variableToken(d.code),
                        };
                      }}
                      onClick={() => appendToken(variableToken(d.code))}
                      className="cursor-pointer select-none rounded-sm border border-primary-100 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700"
                    >
                      {d.label}

                      {d.unit && (
                        <span className="ml-1.5 text-xs text-primary-400">
                          {d.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="mb-1 font-semibold text-foreground">
                Operators and brackets
              </p>

              <div className="flex flex-wrap gap-2">
                {OPERATOR_BUTTONS.map((symbol) => (
                  <div
                    key={symbol}
                    draggable
                    onDragStart={() => {
                      dragRef.current = {
                        source: "palette",
                        token: operatorToken(symbol),
                      };
                    }}
                    onClick={() => appendToken(operatorToken(symbol))}
                    className="cursor-pointer select-none rounded-sm border border-border bg-background px-3.5 py-1.5 text-sm font-bold text-foreground hover:bg-slate-50"
                  >
                    {symbol}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 font-semibold text-foreground">Numbers</p>

              <p className="mb-1 text-sm text-muted-foreground">
                Quick actions
              </p>

              <div className="flex flex-wrap gap-2">
                {quickNumbers.map((q) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={() => {
                      dragRef.current = {
                        source: "palette",
                        token: constantToken(q.value, q.unit, q.label),
                      };
                    }}
                    onClick={() =>
                      appendToken(constantToken(q.value, q.unit, q.label))
                    }
                    className="flex cursor-pointer select-none items-center gap-1.5 rounded-sm border border-border bg-background px-3.5 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <span className="font-semibold text-foreground">
                      {q.value}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {q.label}
                    </span>
                  </div>
                ))}

                <button
                  onClick={() => setCustomPopupOpen(true)}
                  className="flex items-center gap-1.5 rounded-sm border border-dashed border-primary-300 px-3.5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                >
                  <Plus size={16} /> Custom number
                </button>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pb-5">
          <button className="text-sm font-medium" onClick={() => router.push("/app/capacity-analytic/formula-configuration")}>Discard</button>

          <Button variant="outline" disabled={save.isPending || !save.canManage} onClick={async () => {
            try { await save.mutateAsync(); toast.success("Formula draft saved."); } catch { /* Error is displayed above. */ }
          }}>Save draft</Button>

          <Button className="h-10 px-4" disabled={save.isPending || !save.canManage || !validationCurrent || !validation.data?.valid || !formulaName.trim()} onClick={async () => {
            try { await save.mutateAsync(); setReviewOpen(true); } catch { /* Error is displayed above. */ }
          }}>
            Review and activate
          </Button>
        </div>
      </div>

      {/* Token detail / replace popup */}
      {activeToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-full max-w-lg rounded-md border border-border bg-background p-4 shadow-lg space-y-3.5">
            {activeToken.kind === "variable" && activeVarDef ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-100">
                    <RefreshCw size={16} className="text-purple-600" />
                  </div>

                  <div>
                    <p className="font-bold text-foreground">
                      {activeVarDef.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeVarDef.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 border-t border-border pt-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="text-foreground">
                      {activeVarDef.source}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code name</span>
                    <span className="text-foreground">{activeVarDef.code}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value</span>
                    <span className="text-foreground">
                      {activeVarDef.value}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    Replace with
                  </p>

                  {VARIABLE_CATEGORIES.map((category) => (
                    <div key={category} className="mt-1">
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        {category}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {VARIABLES.filter((d) => d.category === category).map(
                          (d) => (
                            <button
                              key={d.code}
                              onClick={() => {
                                replaceTokenAt(
                                  activeTokenIndex!,
                                  variableToken(d.code),
                                );
                                setActiveTokenIndex(null);
                              }}
                              className={
                                "rounded-md border px-3.5 py-1.5 text-sm font-semibold " +
                                (d.code === activeVarDef.code
                                  ? "border-primary-400 bg-primary-100 text-primary-900"
                                  : "border-primary-100 bg-primary-50 text-primary-900 hover:bg-primary-100")
                              }
                            >
                              {d.label}

                              {d.unit && (
                                <span className="ml-1 text-xs font-normal text-primary-400">
                                  {d.unit}
                                </span>
                              )}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <p className="font-semibold text-foreground">
                  {activeToken.kind === "operator"
                    ? `Operator "${activeToken.symbol}"`
                    : "Number"}
                </p>

                {activeToken.kind === "constant" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeToken.value}
                    {activeToken.unit ? ` ${activeToken.unit}` : ""}
                    {activeToken.label ? ` — ${activeToken.label}` : ""}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTokenIndex(null)}
              >
                Close
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  removeTokenAt(activeTokenIndex!);
                  setActiveTokenIndex(null);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom number popup */}
      {customPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-sm rounded-md border border-border bg-background p-4 shadow-lg space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <Plus size={16} className="text-purple-600" />
              </div>

              <div>
                <p className="font-bold text-foreground">Custom Number</p>
                <p className="text-xs text-muted-foreground">
                  Use a unit conversion when the number turns one unit into
                  another, so the unit check can follow it.
                </p>
              </div>
            </div>

            {/* [] Change to form component */}
            <div className="space-y-3 border-t border-border pt-3.5">
              <div>
                <span className="mb-1 block text-sm font-medium text-foreground">
                  Value
                </span>

                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="0.95"
                  className="h-10"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium text-foreground">
                  Label
                </span>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="What is stands for, e.g. yield factor"
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border pt-3.5">
              <Button
                variant="outline"
                onClick={() => setCustomPopupOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={insertCustomNumber}>Insert Number</Button>
            </div>
          </div>
        </div>
      )}

      {impactOpen && (
        <ApiFormulaPreview
          scopeLevel={scopeLevel}
          scopeIds={scopeIds}
          tokens={apiTokens}
          onClose={() => setImpactOpen(false)}
        />
      )}

      {reviewOpen && (
        <ApiFormulaReview
          versions={draftIds}
          onClose={() => setReviewOpen(false)}
          onActivated={() => router.push("/app/capacity-analytic/formula-configuration")}
        />
      )}
    </>
  );
}
