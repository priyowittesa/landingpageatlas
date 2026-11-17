"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Panel, Provenance, Segmented, StatusBadge } from "../components";
import { formatNumber, wells, type Well } from "../data";

type DetailTab = "Overview" | "History" | "Docs & DQ";
const statusOptions = [
  "All statuses",
  "Producing",
  "Injecting",
  "Shut-in",
  "Warning",
  "Critical",
  "Offline"
];
function downloadCsv(rows: Well[]) {
  const header = [
    "Well",
    "NPD code",
    "Field",
    "Facility",
    "Well type",
    "Flow kind",
    "Oil bopd",
    "Water injection bwpd",
    "Status",
    "Completeness %"
  ];
  const csv = [
    header,
    ...rows.map((well) => [
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
    ])
  ]
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "volve-well-register-historical-demo.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function WellRegister() {
  const [group, setGroup] = useState("All wells");
  const [status, setStatus] = useState("All statuses");
  const [selected, setSelected] = useState<Well | null>(null);
  const [tab, setTab] = useState<DetailTab>("Overview");
  const filtered = wells.filter(
    (well) =>
      (group === "All wells" ||
        (group === "Producers"
          ? well.kind === "Producer"
          : well.kind === "Injector")) &&
      (status === "All statuses" ||
        (status === "Producing"
          ? well.kind === "Producer"
          : status === "Injecting"
            ? well.kind === "Injector"
            : well.status === status))
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[
          ["Producing", 5],
          ["Injecting", 2],
          ["Shut-in", 0],
          ["Warning (computed)", 5],
          ["Offline", 0]
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded border border-gray-200 bg-white px-3 py-2 text-xs"
          >
            <span className="text-gray-500">{label}</span>
            <strong className="ml-2 text-base">{count}</strong>
          </div>
        ))}
        <Provenance type="Calculated" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={group}
          onChange={setGroup}
          options={["All wells", "Producers", "Injectors"].map((value) => ({
            value,
            label: value
          }))}
        />
        <select
          aria-label="Filter well status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 rounded border border-gray-200 bg-white px-2 text-xs"
        >
          {statusOptions.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => downloadCsv(filtered)}
          className="inline-flex h-9 items-center gap-1.5 rounded border border-gray-200 px-3 text-xs font-semibold text-primary-700 hover:bg-primary-50"
        >
          <Download className="size-3" /> Export CSV
        </button>
      </div>
      <Panel
        title="Well register"
        aside={
          <>
            as of 8 Feb 2016 <Provenance type="Measured" />
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-xs">
            <thead className="bg-primary-50 text-primary-800">
              <tr>
                {[
                  "Well",
                  "NPD code",
                  "Field",
                  "Facility",
                  "Well type",
                  "Flow kind",
                  "Latest oil rate",
                  "Latest water injection",
                  "Status",
                  "Data quality"
                ].map((h) => (
                  <th key={h} className="px-3 py-3 font-semibold uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((well) => (
                <tr
                  key={well.id}
                  className="border-t border-gray-100 hover:bg-primary-50/50"
                >
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(well);
                        setTab("Overview");
                      }}
                      className="text-left font-bold text-primary-800 hover:underline"
                    >
                      {well.id}
                      <small className="block font-normal text-gray-500">
                        {well.fullName}
                      </small>
                    </button>
                  </td>
                  <td className="p-3">{well.npdCode}</td>
                  <td className="p-3">Volve</td>
                  <td className="p-3">MÆRSK INSPIRER</td>
                  <td className="p-3">{well.kind}</td>
                  <td className="p-3">{well.flowKind}</td>
                  <td className="p-3">
                    {well.kind === "Producer" ? (
                      <>
                        {formatNumber(well.oil)}
                        <small className="block text-gray-500">
                          {formatNumber(well.oilSm3)} Sm3/d
                        </small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    {well.kind === "Injector" ? (
                      <>
                        {formatNumber(well.injection)}
                        <small className="block text-gray-500">
                          {formatNumber(well.injectionSm3)} Sm3/d
                        </small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={well.status} />
                  </td>
                  <td className="p-3">{well.completeness}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="py-10 text-center text-sm text-gray-500">
              No wells match these filters.
            </p>
          )}
        </div>
        <p className="border-t border-gray-100 p-3 text-[11px] text-gray-500">
          {filtered.length} of {wells.length} wells. Status rule: Producing =
          FLOW_KIND production and ON_STREAM_HRS &gt; 0; Injecting = FLOW_KIND
          injection and BORE_WI_VOL &gt; 0; Shut-in = recent record but
          ON_STREAM_HRS = 0; Offline = no record in the period.
        </p>
      </Panel>
      <Panel title="Data quality and source documents" aside="as of 8 Feb 2016">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-primary-50 text-primary-800">
              <tr>
                {[
                  "Well",
                  "Completeness",
                  "Missing values",
                  "Daily rows",
                  "First to last record",
                  "Unit conformity",
                  "Source documents"
                ].map((h) => (
                  <th key={h} className="px-3 py-3 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((well) => (
                <tr
                  key={well.id}
                  className="border-t border-gray-100 align-top"
                >
                  <td className="p-3 font-semibold text-primary-800">
                    {well.id}
                    <small className="block font-normal text-gray-500">
                      {well.fullName}
                    </small>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded bg-gray-100">
                        <div
                          className="h-full rounded bg-primary-700"
                          style={{ width: `${well.completeness}%` }}
                        />
                      </div>
                      {well.completeness}%
                    </div>
                    <Provenance type="Calculated" />
                  </td>
                  <td className="p-3">{well.missing} values</td>
                  <td className="p-3">{formatNumber(well.rows)}</td>
                  <td className="p-3">
                    {well.first} to {well.last}
                  </td>
                  <td className="p-3">
                    100% <Provenance type="Calculated" />
                  </td>
                  <td className="space-y-1 p-3">
                    {[
                      `Daily drilling report ${well.id}`,
                      `Final well report ${well.id}`,
                      `Well logs ${well.id} (GR, density, porosity, resistivity)`
                    ].map((doc) => (
                      <p key={doc}>
                        <strong className="text-primary-800">{doc}</strong>
                        <br />
                        <span className="text-gray-500">
                          Revision and Page: Not captured
                        </span>
                      </p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="p-3 text-[11px] text-gray-500">
          Completeness, missing values and unit conformity are calculated over
          the replay window (10 Jan to 8 Feb 2016) from the role-relevant fields
          of each well; the rows and record range cover the full workbook. Volve
          reports in Sm3/d; values here are converted to bbl units (1 Sm3 =
          6.28981 bbl) with the original Sm3/d shown beside them.
        </p>
      </Panel>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="fixed inset-y-0 right-0 left-auto top-0 flex h-dvh w-full max-w-[480px] translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 p-0 sm:max-w-[480px]"
        >
          {selected && (
            <>
              <div className="flex items-start justify-between border-b p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-primary-700">
                    Well record
                  </p>
                  <DialogTitle className="mt-1 text-xl">
                    {selected.id}
                  </DialogTitle>
                  <DialogDescription>{selected.fullName}</DialogDescription>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <span className="text-xs">{selected.kind}</span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close well record"
                  onClick={() => setSelected(null)}
                  className="rounded p-2 hover:bg-gray-100"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="border-b p-4">
                <Segmented
                  value={tab}
                  onChange={setTab}
                  options={(["Overview", "History", "Docs & DQ"] as const).map(
                    (value) => ({ value, label: value })
                  )}
                />
              </div>
              <div className="flex-1 space-y-4 p-5 text-xs">
                {tab === "Overview" ? (
                  <dl className="grid grid-cols-2 gap-4">
                    {[
                      ["Well", `${selected.id} (${selected.fullName})`],
                      ["Field", "Volve"],
                      ["Operator", "Equinor ASA (Volve open data)"],
                      ["NPD code", String(selected.npdCode)],
                      ["Facility", "MÆRSK INSPIRER"],
                      ["Well type", selected.kind],
                      ["Flow kind", selected.flowKind],
                      [
                        "Oil rate",
                        selected.kind === "Producer"
                          ? `${formatNumber(selected.oil)} bopd (${selected.oilSm3} Sm3/d)`
                          : "—"
                      ],
                      [
                        "Water injection",
                        selected.kind === "Injector"
                          ? `${formatNumber(selected.injection)} bwpd`
                          : "—"
                      ],
                      [
                        "Gas rate",
                        selected.gasMM == null
                          ? "—"
                          : `${selected.gasMM.toFixed(2)} MMscfd`
                      ],
                      [
                        "Water cut",
                        selected.waterCut == null
                          ? "—"
                          : `${selected.waterCut}%`
                      ],
                      [
                        "Potential",
                        selected.kind === "Producer"
                          ? `${formatNumber(selected.potential)} bopd · Calculated`
                          : "—"
                      ],
                      [
                        "Tubing head pressure",
                        selected.thp == null ? "—" : `${selected.thp} psi`
                      ],
                      [
                        "Bottom-hole pressure",
                        selected.bhp == null
                          ? "—"
                          : `${formatNumber(selected.bhp)} psi`
                      ],
                      [
                        "Annulus pressure",
                        selected.annulus == null
                          ? "—"
                          : `${selected.annulus} psi`
                      ],
                      [
                        "Choke (normalised)",
                        selected.choke == null ? "—" : `${selected.choke}%`
                      ],
                      ["Uptime", `${selected.uptime}%`]
                    ].map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-gray-500">{key}</dt>
                        <dd className="mt-1 font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : tab === "Docs & DQ" ? (
                  <div className="space-y-3">
                    <p>
                      Completeness: <strong>{selected.completeness}%</strong> ·
                      Missing values: <strong>{selected.missing}</strong>
                    </p>
                    <p>
                      Daily rows: {formatNumber(selected.rows)} ·{" "}
                      {selected.first} to {selected.last}
                    </p>
                    <p>
                      Source documents: Daily drilling report, Final well
                      report, Well logs (GR, density, porosity, resistivity).
                      Revision and Page: Not captured.
                    </p>
                  </div>
                ) : (
                  <p className="rounded border border-gray-200 p-4 text-gray-500">
                    Historical records cover {selected.first} to {selected.last}
                    . No additional event history is available in this demo.
                  </p>
                )}
              </div>
              <div className="border-t p-5">
                <Link
                  href="/app/well-performance/monitor"
                  className="text-xs font-semibold text-primary-700 hover:underline"
                >
                  Open historical replay →
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
