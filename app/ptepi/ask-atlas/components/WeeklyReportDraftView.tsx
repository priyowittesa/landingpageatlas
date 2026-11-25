"use client";

import { CircleAlert, CircleCheck, FilePenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatPctPoints, formatPoints } from "../../format";
import type { WeeklyReportDraft, WeeklyReportRow } from "../../types";
import { Tr } from "../../components/Tr";

const cell = (value: number | null, signed = false) =>
  value === null ? "-" : signed ? formatPoints(value) : formatPctPoints(value);

/**
 * Template T1 (Laporan Pekerjaan Mingguan) as a draft: cover, recap header, recap table
 * with columns 4 to 8, narrative, release checks and the two signature blocks.
 */
export function WeeklyReportDraftView({ report }: { report: WeeklyReportDraft }) {
  return (
    <article className="overflow-hidden rounded-lg border border-primary-200 bg-white" aria-label="Laporan Pekerjaan, template T1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
          <FilePenLine size={14} aria-hidden />
          <Tr>{report.status}</Tr>
        </span>
        <span className="text-[0.75rem] text-amber-900">
          <Tr>Template T1</Tr> · <Tr>Weekly cut-off</Tr> {formatDate(report.cutOff)}
        </span>
      </div>

      <header className="border-b border-gray-100 px-4 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">Laporan Pekerjaan</p>
        <p className="mt-1 text-sm font-semibold text-gray-950">{report.contractTitle}</p>
        <p className="mt-1 text-xs text-gray-700">
          Minggu ke-{report.weekNo} ({report.weekWords}) · {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
        </p>
        <p className="mt-1 text-[0.75rem] font-semibold uppercase tracking-wide text-gray-600">
          Kontraktor Pelaksana {report.contractor}
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 border-b border-gray-100 px-4 py-3 text-xs sm:grid-cols-2">
        <Field label="Owner" value={report.owner} />
        <Field label="Contract number" value={report.contractNumbers} />
        <Field label="Start" value={formatDate(report.startDate)} />
        <Field label="Finish" value={formatDate(report.finishDate)} />
        <Field label="Duration" value={report.durationDays === null ? "-" : `${report.durationDays} hari kalender`} />
        <Field label="Contractor" value={report.contractor} />
      </dl>

      <div className="overflow-x-auto px-4 py-3">
        <table className="w-full min-w-[38.75rem] text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="py-1.5 pr-2 font-medium"><Tr>Section</Tr></th>
              <th className="px-2 py-1.5 text-right font-medium">3 · <Tr>Weight</Tr></th>
              <th className="px-2 py-1.5 text-right font-medium">4 · <Tr>Last week</Tr></th>
              <th className="px-2 py-1.5 text-right font-medium">5 · <Tr>This week</Tr></th>
              <th className="px-2 py-1.5 text-right font-medium">6 · <Tr>To date</Tr></th>
              <th className="px-2 py-1.5 text-right font-medium">7 · <Tr>Plan</Tr></th>
              <th className="py-1.5 pl-2 text-right font-medium">8 · <Tr>Deviation</Tr></th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <ReportRow key={row.component} row={row} />
            ))}
            <ReportRow row={report.total} total />
          </tbody>
        </table>
        <p className="mt-2 text-[0.75rem] text-gray-600">
          <Tr>This week stays empty until the weekly cut-off is entered; ATLAS does not estimate it.</Tr>
        </p>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold text-gray-900"><Tr>Narrative</Tr></p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5 text-gray-800">
          {report.narrative.map((line) => (
            <li key={line}><Tr>{line}</Tr></li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold text-gray-900"><Tr>Checks before release</Tr></p>
        <ul className="mt-1.5 space-y-1">
          {report.checks.map((check) => (
            <li key={check.label} className="flex items-start gap-1.5 text-xs">
              {check.passed ? (
                <CircleCheck size={14} aria-hidden className="mt-px shrink-0 text-green-700" />
              ) : (
                <CircleAlert size={14} aria-hidden className="mt-px shrink-0 text-red-700" />
              )}
              <span className={check.passed ? "text-gray-800" : "font-semibold text-red-700"}>
                <Tr>{check.passed ? "Passed" : "Not passed"}</Tr>: <Tr>{check.label}</Tr>
                <span className="font-normal text-gray-600"> (<Tr>{check.detail}</Tr>)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 px-4 py-4 text-center text-xs">
        {report.signatures.map((signature) => (
          <div key={signature.block}>
            <p className="text-xs font-semibold text-gray-900">{signature.block}</p>
            <div className="mx-auto my-3 h-8 w-32 border-b border-dashed border-gray-300" aria-hidden />
            <p className="text-xs font-medium text-gray-950">{signature.name ?? "-"}</p>
            <p className="text-xs text-gray-600">{signature.role}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-gray-600"><Tr>{label}</Tr></dt>
      <dd className="min-w-0 break-words font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function ReportRow({ row, total = false }: { row: WeeklyReportRow; total?: boolean }) {
  return (
    <tr className={cn("border-b border-gray-100 tabular-nums", total && "border-t border-gray-300 font-semibold")}>
      <td className="py-1.5 pr-2 text-gray-900">{total ? <Tr>Total</Tr> : row.component}</td>
      <td className="px-2 py-1.5 text-right">{cell(row.weight)}</td>
      <td className="px-2 py-1.5 text-right">{cell(row.lastWeek)}</td>
      <td className="px-2 py-1.5 text-right text-gray-600">{row.thisWeek === null ? <Tr>At cut-off</Tr> : cell(row.thisWeek)}</td>
      <td className="px-2 py-1.5 text-right">{cell(row.toDate)}</td>
      <td className="px-2 py-1.5 text-right">{cell(row.plan)}</td>
      <td className={cn("py-1.5 pl-2 text-right", (row.deviation ?? 0) < 0 && "text-red-700")}>{cell(row.deviation, true)}</td>
    </tr>
  );
}
