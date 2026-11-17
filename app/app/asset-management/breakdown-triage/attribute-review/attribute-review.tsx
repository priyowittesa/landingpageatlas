"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Cpu,
  Database,
  Eye,
  MoreHorizontal,
  Sparkles,
  Undo2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import { ConfidenceBar, SourceTag } from "../components/triage-badges";
import type { Criticality, TriageAsset } from "../lib/types";
import { CURRENT_USER, MOCK_NOW, useTriageStore } from "../lib/use-triage-store";
import { AttributeDrawer } from "./attribute-drawer";
import { AttributePickDialog } from "./attribute-pick-dialog";
import { BottleneckCell, CriticalityCell, yesNo } from "./criticality-tag";

type Filter = "all" | "low" | "manual";
type Row = TriageAsset & { id: string };

const LOW_CONFIDENCE = 0.7;
const AUDIT_AT = `02 Nov 2026, ${MOCK_NOW}`;

const isLowConfidence = (asset: TriageAsset) =>
  asset.source === "ai" && asset.confidence != null && asset.confidence < LOW_CONFIDENCE;

function StatCard({ icon: Icon, label, value, caption }: { icon: LucideIcon; label: string; value: number; caption: string }) {
  return (
    <div className="flex items-start gap-3.5 rounded-lg border bg-white px-[18px] py-4">
      <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] bg-primary-100 text-primary-600">
        <Icon className="h-[19px] w-[19px]" />
      </div>
      <div>
        <div className="text-[13px] text-gray-500">{label}</div>
        <div className="mt-0.5 font-mono text-2xl font-bold tracking-tight">{value}</div>
        <div className="mt-0.5 text-xs text-gray-500">{caption}</div>
      </div>
    </div>
  );
}

export function AttributeReview() {
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const assets = useTriageStore((state) => state.assets);
  const updateAsset = useTriageStore((state) => state.updateAsset);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ title: "Asset Management" }, { title: "Breakdown Triage" }, { title: "LLM Attribute Review" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);

  const reviewable = useMemo<Row[]>(
    () =>
      Object.entries(assets)
        .filter(([, asset]) => asset.source !== "fabrix")
        .map(([id, asset]) => ({ id, ...asset })),
    [assets]
  );
  const lowConfidence = reviewable.filter(isLowConfidence);
  const manual = reviewable.filter((asset) => asset.source === "manual");
  const llmDerived = reviewable.filter((asset) => asset.source === "ai");
  const fromFabrix = Object.keys(assets).length - reviewable.length;

  // Lowest confidence first; manual corrections (source of truth) last.
  const rows = (filter === "low" ? lowConfidence : filter === "manual" ? manual : reviewable)
    .slice()
    .sort(
      (a, b) =>
        (a.source === "manual" ? 2 : (a.confidence ?? 0)) - (b.source === "manual" ? 2 : (b.confidence ?? 0))
    );

  const saveCorrection = (criticality: Criticality, bottleneck: boolean, reason: string) => {
    if (!selectedId) return;
    const asset = assets[selectedId];
    updateAsset(selectedId, {
      criticality,
      bottleneck,
      source: "manual",
      audit: [{ by: CURRENT_USER, at: AUDIT_AT, reason }, ...(asset.audit ?? [])],
    });
    toast.success("Correction saved · related report scores recalculated");
  };

  const revert = (assetId: string) => {
    const asset = assets[assetId];
    if (!asset.llm) return;
    updateAsset(assetId, {
      criticality: asset.llm.criticality,
      bottleneck: asset.llm.bottleneck,
      source: "ai",
      audit: [
        { by: CURRENT_USER, at: AUDIT_AT, reason: "Manual correction removed, reverted to LLM value" },
        ...(asset.audit ?? []),
      ],
    });
    toast.success("Reverted to LLM value · related report scores recalculated");
  };

  const columns: TableColumn<Row>[] = [
    {
      key: "asset",
      header: "Asset",
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">
            {row.id} · {row.type}
          </div>
        </div>
      ),
    },
    { key: "criticality", header: "Criticality", render: (row) => <CriticalityCell asset={row} /> },
    { key: "bottleneck", header: "Bottleneck", render: (row) => <BottleneckCell asset={row} /> },
    { key: "source", header: "Source", render: (row) => <SourceTag source={row.source} /> },
    {
      key: "confidence",
      header: "LLM confidence",
      render: (row) =>
        row.source === "manual" ? <span className="text-sm text-gray-500">—</span> : <ConfidenceBar value={row.confidence} />,
    },
    {
      key: "reason",
      header: "Rationale",
      render: (row) => (
        <div className="max-w-[300px] truncate text-sm" title={row.source === "manual" ? row.audit?.[0]?.reason : row.reason}>
          {row.source === "manual" ? (row.audit?.[0]?.reason ?? row.reason) : row.reason}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${row.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setSelectedId(row.id)}>
                <Eye className="h-4 w-4" />
                Review &amp; correct
              </DropdownMenuItem>
              {row.source === "manual" && (
                <DropdownMenuItem onSelect={() => setReverting(row.id)}>
                  <Undo2 className="h-4 w-4" />
                  Revert to LLM value
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const revertAsset = reverting ? assets[reverting] : null;

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="LLM Attribute Review"
        subtitle="Criticality and bottleneck values not available in Fabrix are derived by an LLM in Atlas. They are not ground truth: review them, especially those with low confidence. Manual corrections always take precedence."
        addBtnLabel="Correct Attribute"
        handleAdd={() => setPicking(true)}
      />

      <div className="flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
          <Cpu className="h-3.5 w-3.5" />
          Model: LLM Atlas · prompt attr-v1.2
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Sparkles} label="LLM-derived" value={llmDerived.length} caption="With rationale & confidence" />
        <StatCard icon={AlertTriangle} label="Low confidence" value={lowConfidence.length} caption="Below 70% · review recommended" />
        <StatCard icon={UserCheck} label="Manual corrections" value={manual.length} caption="Source of truth" />
        <StatCard icon={Database} label="From Fabrix" value={fromFabrix} caption="No review needed" />
      </div>

      {lowConfidence.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            <b>{lowConfidence.length} assets need review.</b> Incorrect criticality leads to wrong priorities for every
            report on those assets.
          </div>
          <Button variant="outline" size="sm" onClick={() => setFilter("low")}>
            Show
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Table
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          name="asset"
          onRowClick={(row) => setSelectedId(row.id)}
          filters={[
            {
              key: "source",
              placeholder: "All",
              value: filter,
              onChange: (value) => setFilter(value as Filter),
              options: [
                { label: `All (${reviewable.length})`, value: "all" },
                { label: `Low confidence (${lowConfidence.length})`, value: "low" },
                { label: `Manual (${manual.length})`, value: "manual" },
              ],
            },
          ]}
          onResetFilters={() => setFilter("all")}
          emptyState={{ description: filter === "low" ? "No low-confidence attributes left to review." : "No manual corrections yet." }}
        />
        <div className="flex justify-between px-1 text-xs text-gray-500">
          <span>Showing {rows.length} assets</span>
          <span>Attribute version 02 Nov 05:12</span>
        </div>
      </div>

      <AttributeDrawer
        assetId={selectedId}
        asset={selectedId ? assets[selectedId] : null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onSave={saveCorrection}
        onRevert={() => selectedId && setReverting(selectedId)}
      />

      <AttributePickDialog
        open={picking}
        assets={reviewable.map((row) => [row.id, row] as [string, TriageAsset])}
        onOpenChange={setPicking}
        onPick={(assetId) => {
          setPicking(false);
          setSelectedId(assetId);
        }}
      />

      <ConfirmationModal
        open={Boolean(revertAsset)}
        onOpenChange={(open) => !open && setReverting(null)}
        variant="submit"
        title="Revert to LLM value?"
        description={
          revertAsset?.llm
            ? `Criticality and bottleneck revert to the LLM result (${revertAsset.llm.criticality}, bottleneck ${yesNo(revertAsset.llm.bottleneck)}). The manual correction stays in the audit log. Scores for open reports on this asset are recalculated.`
            : undefined
        }
        confirmLabel="Revert"
        onConfirm={() => {
          if (reverting) revert(reverting);
          setReverting(null);
        }}
      />
    </div>
  );
}
