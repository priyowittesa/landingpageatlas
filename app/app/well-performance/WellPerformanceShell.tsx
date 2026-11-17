"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download } from "lucide-react";
import { wells } from "./data";

const tabs = [
  { slug: "dashboard", label: "Dashboard" },
  { slug: "register", label: "Well Register" },
  { slug: "analytics", label: "Analytics" },
  { slug: "monitor", label: "Historical Replay" }
];

export function WellPerformanceShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  function exportRegister() {
    const columns = [
      "Well",
      "NPD code",
      "Field",
      "Facility",
      "Well type",
      "Flow kind",
      "Oil (bopd)",
      "Water injection (bwpd)",
      "Status",
      "Data quality (%)"
    ];
    const rows = wells.map((well) => [
      well.id,
      well.npdCode,
      "Volve",
      "MÆRSK INSPIRER",
      well.kind,
      well.flowKind,
      well.kind === "Producer" ? well.oil : "",
      well.kind === "Injector" ? well.injection : "",
      well.status,
      well.completeness
    ]);
    const csv = [columns, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "volve-well-register-historical-demo.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-5 pb-8 text-gray-950">
      <div className="flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-xs">
        <strong className="text-primary-800">Volve Historical Demo</strong>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">
          Equinor Volve open data, 2007 to 2016
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Not Pertamina operational data</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">
            Operational module
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Well Performance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review Volve producers and water injectors: rates, pressures, water
            cut, injection balance and data quality; analyse decline and losses.
          </p>
        </div>
        {/* {pathname.endsWith("/dashboard") && (
          <button
            type="button"
            onClick={exportRegister}
            className="inline-flex h-9 items-center gap-2 rounded border border-gray-200 bg-white px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
        )} */}
      </div>
      <nav
        aria-label="Well Performance pages"
        className="flex gap-1 overflow-x-auto border-b border-gray-200"
      >
        {tabs.map(({ slug, label }) => (
          <Link
            key={slug}
            href={`/app/well-performance/${slug}`}
            aria-current={pathname.endsWith(`/${slug}`) ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${pathname.endsWith(`/${slug}`) ? "border-primary-700 font-semibold text-primary-700" : "border-transparent text-gray-600 hover:text-primary-700"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
      <p className="pt-2 text-center text-[11px] text-gray-500">
        Volve Historical Demo. Targets, thresholds, owner names and
        injector-to-producer links are Synthetic. All Measured and Calculated
        values trace to Volve_Production_data.xlsx.
      </p>
    </div>
  );
}
