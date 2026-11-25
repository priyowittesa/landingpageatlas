"use client";

import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tr, useT } from "../../components/Tr";
import { downloadReport, type PortfolioReport } from "../report";

/**
 * A finished report inside a Nexa answer: the file, a preview of its key figures, and the
 * download. The figures are the first of the file, so the reader sees the story before opening it.
 */
export function ReportCard({ report }: { report: PortfolioReport }) {
  const t = useT();
  const preview = report.kpis.slice(0, 4);
  return (
    <div className="@container overflow-hidden rounded-xl border border-primary-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-primary-100 bg-primary-50/60 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
          <FileText size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-950">
            <Tr>{report.title}</Tr>
          </p>
          <p className="truncate text-xs text-gray-700" title={report.fileName}>
            {report.fileName} · <Tr>{report.dataTag}</Tr>
          </p>
        </div>
        <Button
          type="button"
          className="bg-primary-700 text-white hover:bg-primary-800"
          onClick={() => {
            downloadReport(report, t);
            toast.success(`${t("Report downloaded")}: ${report.fileName}`);
          }}
        >
          <Download size={16} aria-hidden />
          <Tr>Download report</Tr>
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-primary-100/60 @xl:grid-cols-4">
        {preview.map((kpi) => (
          <div key={kpi.label} className="bg-white px-4 py-3">
            <dt className="text-xs text-gray-600">
              <Tr>{kpi.label}</Tr>
            </dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-gray-950">
              <Tr>{kpi.value}</Tr>
            </dd>
          </div>
        ))}
      </dl>
      <p className="px-4 py-2.5 text-xs text-gray-700">
        <Tr>The file holds all key figures, the highlights and every exception. Open it in a browser or print it to PDF.</Tr>
      </p>
    </div>
  );
}
