"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquareText, ShieldCheck, TrendingDown } from "lucide-react";
import { formatPoints } from "../format";
import { HEALTH_LABELS } from "../labels";
import type { PortfolioRow } from "../types";
import { DetailDrawer, DrawerSection } from "./DetailDrawer";
import { PercentText } from "./PercentText";
import { ReasonText } from "./ReasonText";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";
import { Tr } from "./Tr";
import { HEALTH_TONE } from "./status";

type PreviewRequest = {
  projectId: string;
  /** Why the reader opened it: the exception, flag or stage they clicked */
  reason?: string;
};

type ProjectPreviewApi = {
  /** Opens the project drawer. Ids the page does not know are ignored. */
  open: (projectId: string, reason?: string) => void;
};

const ProjectPreviewContext = createContext<ProjectPreviewApi | null>(null);

/** Opens the project drawer from anywhere inside a ProjectPreviewProvider; a no-op outside one. */
export function useProjectPreview(): ProjectPreviewApi {
  return useContext(ProjectPreviewContext) ?? { open: () => undefined };
}

/**
 * Items on a screen (exceptions, flags, stages, table rows) open a drawer with the project
 * summary first. The drawer links on to the cockpit and the evidence gate.
 */
export function ProjectPreviewProvider({ rows, children }: { rows: PortfolioRow[]; children: ReactNode }) {
  const [request, setRequest] = useState<PreviewRequest | null>(null);
  const [lastRow, setLastRow] = useState<PortfolioRow | null>(null);
  const open = useCallback(
    (projectId: string, reason?: string) => {
      const row = rows.find((item) => item.projectId === projectId);
      if (!row) return;
      setLastRow(row);
      setRequest({ projectId, reason });
    },
    [rows]
  );
  const api = useMemo(() => ({ open }), [open]);
  const row = lastRow;

  return (
    <ProjectPreviewContext.Provider value={api}>
      {children}
      <DetailDrawer
        open={request !== null}
        onOpenChange={(next) => !next && setRequest(null)}
        title={row ? `${row.projectId}: ${row.customer}` : ""}
        description={row?.description}
        badges={
          row && (
            <>
              <StatusBadge tone={HEALTH_TONE[row.health.rating]} label={HEALTH_LABELS[row.health.rating]} />
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-900">
                <Tr>{row.stageLabel}</Tr>
              </span>
            </>
          )
        }
      >
        {row && (
          <>
            {request?.reason && (
              <DrawerSection title="Why you are seeing this">
                <ReasonText
                  text={request.reason}
                  className="rounded-lg bg-primary-50 px-3 py-2.5 text-sm leading-relaxed text-primary-950"
                />
              </DrawerSection>
            )}

            <DrawerSection title="Health">
              <div className="flex items-start gap-2 text-sm text-gray-900">
                <ShieldCheck size={16} aria-hidden className="mt-0.5 shrink-0 text-primary-700" />
                <ReasonText text={row.health.reason} />
              </div>
            </DrawerSection>

            <DrawerSection title="Progress">
              <dl className="grid grid-cols-3 gap-3">
                <Fact label="Plan" value={<PercentText fraction={row.plan} digits={1} />} />
                <Fact label="Actual" value={<PercentText fraction={row.actual} digits={1} />} />
                <Fact
                  label="Deviation"
                  value={
                    <span className={row.deviationAlert ? "inline-flex items-center gap-1 text-red-700" : undefined}>
                      {row.deviationAlert && <TrendingDown size={16} aria-hidden />}
                      {row.deviationPts === null ? "-" : <Tr>{formatPoints(row.deviationPts)}</Tr>}
                    </span>
                  }
                />
              </dl>
            </DrawerSection>

            <DrawerSection title="Contract">
              <dl className="grid grid-cols-2 gap-3">
                <Fact label="Final contract value" value={<RupiahText value={row.contractValue} millions />} />
                <Fact label="Exceptions" value={row.exceptionCount} />
              </dl>
            </DrawerSection>

            <DrawerSection title="Open">
              <div className="flex flex-col gap-2">
                <DrawerLink href={`/ptepi/project/${row.projectId}`} label="Project cockpit" primary />
                <DrawerLink href={`/ptepi/project/${row.projectId}/evidence`} label="Evidence gate" />
                <DrawerLink href={`/ptepi/commercial?project=${row.projectId}`} label="Commercial and billing" />
                <Link
                  href="/ptepi/ask-atlas"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-800 hover:underline"
                >
                  <MessageSquareText size={16} aria-hidden />
                  <Tr>Ask Nexa about this</Tr>
                </Link>
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </ProjectPreviewContext.Provider>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <dt className="text-xs text-gray-600">
        <Tr>{label}</Tr>
      </dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-gray-950">{value}</dd>
    </div>
  );
}

function DrawerLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-between gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
          : "inline-flex items-center justify-between gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-primary-50"
      }
    >
      <Tr>{label}</Tr>
      <ArrowRight size={16} aria-hidden />
    </Link>
  );
}
