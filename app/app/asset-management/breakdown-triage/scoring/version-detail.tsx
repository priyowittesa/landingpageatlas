"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  History,
  Info,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PriorityTag, StatusPill } from "../components/triage-badges";
import { format2 } from "../lib/scoring";
import type { Priority, ScoringConfig } from "../lib/types";
import {
  WEIGHT_KEYS,
  cloneConfig,
  diffConfig,
  sameConfig,
  slaDisplayValue,
  slaUnit,
  validateConfig,
} from "./config-utils";
import { ImpactPreview } from "./impact-preview";
import type { VersionActions } from "./scoring-configuration";
import { useScoringDraftStore } from "./use-draft-store";
import { formatVersionDate, useUpdateScoringDraft, type ScoringConfigurationVersion } from "./use-scoring-configurations";
import { VersionStatusBadge } from "./version-status";

const FLOW_STEPS = ["Edit draft", "Activate"];

/** Detail of a version; a draft is edited here and saved or activated through the API. */
export function VersionDetail({
  version,
  active,
  actions,
}: {
  version: ScoringConfigurationVersion;
  /** The active version, or `null` while none was activated yet. */
  active: ScoringConfigurationVersion | null;
  actions: VersionActions;
}) {
  const aiDismissed = useScoringDraftStore((state) => state.aiDismissed);
  const dismissAi = useScoringDraftStore((state) => state.dismissAi);
  const save = useUpdateScoringDraft();
  const [config, setConfig] = useState(() => cloneConfig(version.config));
  const [aiApplied, setAiApplied] = useState(false);
  const [keyword, setKeyword] = useState("");

  const isDraft = version.status === "draft";
  const locked = !isDraft || actions.busy || save.isPending;
  const number = version.version;
  const status = version.status;
  const activeVersion = active?.version;
  const validation = validateConfig(config);
  const changes = active ? diffConfig(active.config, config) : [];
  const dirty = !sameConfig(config, version.config);

  const edit = (update: (current: ScoringConfig) => void) =>
    setConfig((current) => {
      const next = cloneConfig(current);
      update(next);
      return next;
    });

  const addKeyword = () => {
    const value = keyword.trim().toLowerCase();
    if (value && !config.safetyKeywords.includes(value)) {
      edit((current) => {
        current.safetyKeywords.push(value);
      });
    }
    setKeyword("");
  };

  const applyAi = () => {
    edit((current) => {
      current.weights.history = 0.25;
      current.weights.production = 0.2;
    });
    setAiApplied(true);
    toast.success("LLM suggestion applied to draft");
  };

  const previewDescription =
    status === "active" || !active
      ? `Sample reports scored with v${number}`
      : `Sample reports recalculated with v${number}, compared to active v${activeVersion}`;

  return (
    <>
      <button
        type="button"
        onClick={actions.back}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All versions
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-2.5 text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
            Version v{number} <VersionStatusBadge status={status} />
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {isDraft
              ? `Created by ${version.author} · ${formatVersionDate(version.createdAt)}${active ? ` · based on active v${activeVersion}` : ""}`
              : [
                  version.note,
                  version.author,
                  version.activatedBy && `activated by ${version.activatedBy}`,
                  formatVersionDate(version.activatedAt || version.createdAt),
                ].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <>
              <Button variant="outline" disabled={locked} onClick={() => actions.deleteDraft(version)}>
                <Trash2 className="h-4 w-4" />
                Delete draft
              </Button>
              <Button
                variant="outline"
                disabled={locked || !dirty || !validation.valid}
                onClick={() => save.mutate({ id: version.id, config }, { onSuccess: () => toast.success(`Draft v${number} saved`) })}
              >
                <Save className="h-4 w-4" />
                Save draft
              </Button>
              <Button
                disabled={locked || !validation.valid || (Boolean(active) && !changes.length)}
                onClick={() => actions.publish(version, config, dirty)}
              >
                <CheckCheck className="h-4 w-4" />
                Activate
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={actions.busy} onClick={() => actions.duplicate(version)}>
                <Copy className="h-4 w-4" />
                Duplicate as new version
              </Button>
              {status === "archived" && (
                <Button disabled={actions.busy} onClick={() => actions.activate(version)}>
                  <History className="h-4 w-4" />
                  Activate this version
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {isDraft ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white px-4 py-3">
          {FLOW_STEPS.map((step, index) => {
            const current = 0;
            return (
              <div key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-medium",
                    index === current ? "text-primary-700" : index < current ? "text-green-700" : "text-gray-500"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                      index === current
                        ? "bg-primary-600 text-white"
                        : index < current
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {index < current ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  {step}
                </span>
                {index < FLOW_STEPS.length - 1 && <span className="h-px w-8 bg-gray-200" />}
              </div>
            );
          })}
          <span className="ml-auto text-sm text-gray-500">
            {dirty && "Unsaved changes · "}
            {!active
              ? "No active version yet"
              : changes.length
                ? `${changes.length} change${changes.length > 1 ? "s" : ""} from active v${activeVersion}`
                : `No changes from active v${activeVersion} yet`}
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            status === "active" ? "border-primary-200 bg-primary-50 text-primary-800" : "border-gray-200 bg-gray-50 text-gray-700"
          )}
        >
          {status === "active" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Archive className="mt-0.5 h-4 w-4 shrink-0" />}
          <div>
            {status === "active"
              ? "This is the active version. It is read-only: to change it, duplicate it as a new version."
              : "This version is archived and read-only. Activating it creates a new active version with the same settings."}
          </div>
        </div>
      )}

      {isDraft && !aiDismissed && (
        <section className="flex gap-4 rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="flex flex-wrap items-center gap-2 font-semibold text-gray-950">
              LLM-suggested weights <StatusPill tone="primary">Requires admin approval</StatusPill>
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Validated against outcome data, not just the formula: 50 pilot reports, 7 supervisor overrides, and actual
              downtime. 5 of 7 overrides raised the priority of repeat breakdowns, while “still running” reports were
              rarely lowered.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              {["S_hist 0.20 → 0.25", "S_prod 0.25 → 0.20", "Agreement with supervisors 84% → 88% (simulated, n = 50)"].map((item) => (
                <span key={item} className="rounded-md border border-primary-200 bg-white px-2 py-1 text-primary-800">{item}</span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {aiApplied ? (
                <StatusPill tone="green" icon={Check}>Applied to draft. Review the preview, then save or activate.</StatusPill>
              ) : (
                <>
                  <Button size="sm" disabled={locked} onClick={applyAi}>
                    <Wand2 className="h-4 w-4" />
                    Apply to draft
                  </Button>
                  <Button size="sm" variant="outline" onClick={dismissAi}>Dismiss</Button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Card title="Component weights" subtitle="Weights must total 1.00">
            <div className="space-y-4">
              {WEIGHT_KEYS.map(({ key, code, label, hint }) => (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm font-semibold text-gray-900">{label}</b>
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{code}</code>
                    </div>
                    <small className="text-xs text-gray-500">{hint}</small>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.6}
                    step={0.05}
                    value={config.weights[key]}
                    disabled={locked}
                    aria-label={label}
                    onChange={(event) =>
                      edit((current) => {
                        current.weights[key] = Number(event.target.value);
                      })
                    }
                    className="w-full accent-primary-600 disabled:opacity-60"
                  />
                  <div className="text-right font-mono text-sm font-semibold">{format2(config.weights[key])}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <ValidationRow ok={validation.weightsValid} value={format2(validation.weightSum)}>
                {validation.weightsValid ? "Weights total is valid" : "Weights must total 1.00"}
              </ValidationRow>
              {!validation.thresholdsValid && <ValidationRow ok={false}>The P1 threshold must be higher than P2</ValidationRow>}
              {!validation.slaValid && <ValidationRow ok={false}>The P1 response target must be shorter than P2</ValidationRow>}
            </div>
            <div className="mt-4">
              <div className="mb-1.5 text-xs text-gray-500">{locked ? "Formula" : "Draft formula"}</div>
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-gray-950 px-3 py-2.5 font-mono text-xs text-gray-100">
                <span className="text-primary-300">score</span>
                <span className="text-gray-500">=</span>
                {WEIGHT_KEYS.map(({ key, code }, index) => (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    {index > 0 && <span className="text-gray-500">+</span>}
                    <span className="text-amber-300">{format2(config.weights[key])}</span>
                    <span className="text-gray-500">×</span>
                    <span>{code}</span>
                  </span>
                ))}
              </div>
            </div>
            <Disclaimer icon={<Info className="h-4 w-4" />}>
              Statutory assets give S_safety 0.5 and are not automatically P1. Real safety signals are still automatically P1.
            </Disclaimer>
          </Card>

          <Card title="Priority thresholds" subtitle="Scores ≥ a threshold fall into that category; below the P2 threshold becomes P3">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["P1", "P2"] as const).map((priority) => {
                const field = priority === "P1" ? "p1Threshold" : "p2Threshold";
                return (
                  <label key={priority} className="space-y-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <PriorityTag priority={priority} /> from
                    </span>
                    <Input
                      type="number"
                      step={0.05}
                      min={0}
                      max={1}
                      value={config[field]}
                      disabled={locked}
                      className="font-mono"
                      onChange={(event) =>
                        edit((current) => {
                          current[field] = Number(event.target.value);
                        })
                      }
                    />
                  </label>
                );
              })}
            </div>
            <Disclaimer icon={<ShieldAlert className="h-4 w-4" />}>
              Safety signals (keywords or reporter flag) are always P1, regardless of score.
            </Disclaimer>
          </Card>

          <Card title="Response targets & escalation" subtitle="Used by the response target column, queue summary, and overdue alerts">
            <div className="grid gap-4 sm:grid-cols-3">
              {(["P1", "P2", "P3"] as Priority[]).map((priority) => (
                <label key={priority} className="space-y-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <PriorityTag priority={priority} /> respond ≤
                  </span>
                  <span className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={slaDisplayValue(config, priority)}
                      disabled={locked}
                      className="font-mono"
                      onChange={(event) =>
                        edit((current) => {
                          const value = Number(event.target.value);
                          current.slaMinutes[priority] = priority === "P3" ? value * 60 : value;
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">{slaUnit(priority)}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <b className="text-[13.5px] font-semibold text-gray-900">Automatic escalation</b>
                <div className="text-sm text-gray-500">
                  If a P1 isn&apos;t responded to within the target, the supervisor is notified
                </div>
              </div>
              <Switch
                checked={config.autoEscalate}
                disabled={locked}
                aria-label="Automatic escalation"
                onCheckedChange={(checked) =>
                  edit((current) => {
                    current.autoEscalate = checked;
                  })
                }
              />
            </div>
          </Card>

          <Card title="Safety keywords" subtitle="Matched against report descriptions (English and Indonesian)">
            <div className="flex flex-wrap gap-2">
              {config.safetyKeywords.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 py-1 pl-2.5 pr-1.5 text-sm text-red-700"
                >
                  {item}
                  {!locked && (
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      className="grid h-5 w-5 place-items-center rounded hover:bg-red-100"
                      onClick={() =>
                        edit((current) => {
                          current.safetyKeywords = current.safetyKeywords.filter((existing) => existing !== item);
                        })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!locked && (
              <div className="mt-3 flex gap-2">
                <Input
                  value={keyword}
                  placeholder="Add a keyword, e.g. short circuit"
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button variant="outline" onClick={addKeyword}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div>
          <ImpactPreview
            candidate={config}
            candidateVersion={number}
            active={active?.config ?? config}
            activeVersion={activeVersion ?? number}
            description={previewDescription}
          />
        </div>
      </div>
    </>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold text-gray-950">{title}</h3>
      <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ValidationRow({ ok, value, children }: { ok: boolean; value?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      )}
    >
      <span className="inline-flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {children}
      </span>
      {value && <b className="font-mono">{value}</b>}
    </div>
  );
}

function Disclaimer({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600 [&_svg]:mt-px [&_svg]:shrink-0">
      {icon}
      <span>{children}</span>
    </div>
  );
}
