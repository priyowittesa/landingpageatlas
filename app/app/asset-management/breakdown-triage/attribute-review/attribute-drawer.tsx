"use client";

import { useState } from "react";
import {
  AlertCircle,
  Clock,
  Cpu,
  FileCode,
  History,
  Info,
  Pencil,
  Save,
  ScanSearch,
  Sparkles,
  Undo2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ConfidenceBar, confidenceLabel } from "../components/triage-badges";
import type { Criticality, TriageAsset } from "../lib/types";
import { CriticalityTag, yesNo } from "./criticality-tag";

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t px-5 py-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-primary-600" />
        {title}
      </h4>
      {children}
    </section>
  );
}

function ValueCard({
  icon: Icon,
  label,
  inUse,
  children,
}: {
  icon: LucideIcon;
  label: string;
  inUse: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[10px] border p-3", inUse && "border-green-200 bg-green-50")}>
      <div className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {inUse && " · in use"}
      </div>
      {children}
    </div>
  );
}

function CorrectionForm({
  asset,
  onSave,
  onRevert,
}: {
  asset: TriageAsset;
  onSave: (criticality: Criticality, bottleneck: boolean, reason: string) => void;
  onRevert: () => void;
}) {
  const [criticality, setCriticality] = useState<Criticality>(asset.criticality);
  const [bottleneck, setBottleneck] = useState(asset.bottleneck);
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  const manual = asset.source === "manual";

  const save = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 4) {
      setError(true);
      return;
    }
    onSave(criticality, bottleneck, trimmed);
    setReason("");
    setError(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Criticality <span className="text-red-600">*</span>
          </label>
          <Select value={criticality} onValueChange={(value) => setCriticality(value as Criticality)}>
            <SelectTrigger className="w-full" aria-label="Criticality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["A", "B", "C"] as const).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Bottleneck <span className="text-red-600">*</span>
          </label>
          <Select value={bottleneck ? "yes" : "no"} onValueChange={(value) => setBottleneck(value === "yes")}>
            <SelectTrigger className="w-full" aria-label="Bottleneck">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor="attribute-reason" className="mb-1.5 block text-sm font-medium">
          Reason for correction <span className="text-red-600">*</span>
        </label>
        <Textarea
          id="attribute-reason"
          value={reason}
          aria-invalid={error}
          placeholder="Example: a full-capacity backup machine is available"
          onChange={(event) => {
            setReason(event.target.value);
            if (error) setError(false);
          }}
        />
        {error && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />A reason is required so the correction can be audited.
          </p>
        )}
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-snug text-gray-500">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        Manual corrections become the source of truth and aren&apos;t overwritten by later LLM runs. Scores for open
        reports on this asset are recalculated.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={save}>
          <Save className="h-4 w-4" />
          Save correction
        </Button>
        {manual && (
          <Button variant="outline" onClick={onRevert}>
            <Undo2 className="h-4 w-4" />
            Revert to LLM value
          </Button>
        )}
      </div>
    </>
  );
}

export function AttributeDrawer({
  assetId,
  asset,
  onOpenChange,
  onSave,
  onRevert,
}: {
  assetId: string | null;
  asset: TriageAsset | null;
  onOpenChange: (open: boolean) => void;
  onSave: (criticality: Criticality, bottleneck: boolean, reason: string) => void;
  onRevert: () => void;
}) {
  const manual = asset?.source === "manual";
  const latestAudit = asset?.audit?.[0];

  return (
    <Dialog open={Boolean(asset)} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 right-0 left-auto flex h-full max-h-screen w-full max-w-[560px] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-[560px]">
        {asset && assetId && (
          <>
            <div className="border-b px-5 py-4 pr-12">
              <DialogTitle className="text-base">{asset.name}</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {assetId} · {asset.type} · {asset.location}
              </DialogDescription>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5 px-5 py-4">
                <ValueCard icon={Sparkles} label="LLM value" inUse={!manual}>
                  {asset.llm ? (
                    <>
                      <div className="mt-2 flex items-center gap-2.5 text-[13.5px]">
                        <CriticalityTag value={asset.llm.criticality} />
                        Bottleneck: {yesNo(asset.llm.bottleneck)}
                      </div>
                      {asset.confidence != null && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                          Confidence <ConfidenceBar value={asset.confidence} /> · {confidenceLabel(asset.confidence)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">No LLM value</div>
                  )}
                </ValueCard>
                <ValueCard icon={UserCheck} label="Manual value" inUse={manual}>
                  {manual ? (
                    <>
                      <div className="mt-2 flex items-center gap-2.5 text-[13.5px]">
                        <CriticalityTag value={asset.criticality} />
                        Bottleneck: {yesNo(asset.bottleneck)}
                      </div>
                      {latestAudit && (
                        <div className="mt-1.5 text-xs text-gray-500">
                          {latestAudit.by} · {latestAudit.at}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">Not corrected</div>
                  )}
                </ValueCard>
              </div>

              <Section icon={ScanSearch} title="LLM assessment basis">
                <div className="text-xs text-gray-500">Input summary</div>
                <div className="mt-1 text-[13.5px]">{asset.inputs ?? "—"}</div>
                <div className="mt-2.5 text-xs text-gray-500">Rationale</div>
                <div className="mt-1 text-[13.5px]">{asset.reason}</div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 [&_svg]:h-3.5 [&_svg]:w-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Cpu />
                    LLM Atlas
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FileCode />
                    prompt attr-v1.2
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock />
                    02 Nov 05:06
                  </span>
                </div>
              </Section>

              <Section icon={Pencil} title="Manual correction">
                <CorrectionForm key={`${assetId}-${asset.audit?.length ?? 0}`} asset={asset} onSave={onSave} onRevert={onRevert} />
              </Section>

              {asset.audit && asset.audit.length > 0 && (
                <Section icon={History} title="Correction audit">
                  <ol className="space-y-3">
                    {asset.audit.map((entry, index) => (
                      <li key={`${entry.at}-${index}`} className="flex gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">
                          <UserCheck className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="text-sm text-gray-900">{entry.reason}</div>
                          <div className="text-xs text-gray-500">
                            {entry.by} · {entry.at}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
