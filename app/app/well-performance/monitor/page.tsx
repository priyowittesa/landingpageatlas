"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import {
  HorizontalBars,
  Panel,
  Provenance,
  SelectField,
  StatusBadge,
  TimeChart,
  chartColors
} from "../components";
import {
  dailySeries,
  formatNumber,
  producingWells,
  recommendations,
  replayDays,
  wells
} from "../data";

const formatMaybe = (value: number | null | undefined) =>
  value == null ? "–" : formatNumber(value);
function Gauge({
  label,
  value,
  unit,
  tag,
  max
}: {
  label: string;
  value: string;
  unit: string;
  tag: "Measured" | "Calculated";
  max: number;
}) {
  const numeric = Number(value.replaceAll(",", ""));
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-1">
        <p className="text-[10px] font-semibold uppercase text-gray-500">
          {label}
        </p>
        <Provenance type={tag} />
      </div>
      <div className="mx-auto mt-4 flex h-[75px] w-32 flex-col items-center justify-end rounded-t-full border-[8px] border-b-0 border-primary-500">
        <strong className="text-lg tabular-nums">{value}</strong>
        <span className="text-[11px] text-gray-500">{unit}</span>
      </div>
      <div className="mx-auto mt-2 h-1 w-32 rounded bg-gray-100">
        <div
          className="h-full rounded bg-primary-700"
          style={{
            width: `${Number.isFinite(numeric) ? Math.min(100, (numeric / max) * 100) : 0}%`
          }}
        />
      </div>
    </div>
  );
}
export default function HistoricalReplay() {
  const [wellId, setWellId] = useState("F-12");
  const [playing, setPlaying] = useState(false);
  const [dayIndex, setDayIndex] = useState(29);
  const [choke, setChoke] = useState(100);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setDayIndex((index) => {
          if (index >= 29) {
            setPlaying(false);
            return index;
          }
          return index + 1;
        }),
      5000
    );
    return () => clearInterval(timer);
  }, [playing]);
  const selected = wells.find((well) => well.id === wellId) ?? wells[0];
  const series = dailySeries[wellId];
  const oil = series.oil?.[dayIndex] ?? null;
  const injection = series.inj?.[dayIndex] ?? null;
  const thp = series.thp?.[dayIndex] ?? null;
  const ann = series.ann?.[dayIndex] ?? null;
  const bhp = series.bhp?.[dayIndex] ?? null;
  const wc = series.wc?.[dayIndex] ?? null;
  const initialChoke = selected.choke ?? 0;
  const date = replayDays[dayIndex];
  const gasMM =
    oil != null && selected.oil
      ? +((selected.gasMM! * oil) / selected.oil).toFixed(2)
      : null;
  const metrics: {
    label: string;
    value: string;
    unit: string;
    tag: "Measured" | "Calculated";
    max: number;
  }[] = [
    {
      label: "Tubing pressure (THP)",
      value: formatMaybe(thp),
      unit: "psi",
      tag: "Measured",
      max: 450
    },
    {
      label: "Annulus pressure",
      value: formatMaybe(ann),
      unit: "psi",
      tag: "Measured",
      max: 400
    },
    {
      label: "Bottom-hole pressure (BHP)",
      value: formatMaybe(bhp),
      unit: "psi",
      tag: "Measured",
      max: 4500
    },
    {
      label: selected.kind === "Injector" ? "Water injection" : "Oil rate",
      value: formatMaybe(selected.kind === "Injector" ? injection : oil),
      unit: selected.kind === "Injector" ? "bwpd" : "bopd",
      tag: "Calculated",
      max: 9000
    },
    {
      label: "Gas rate",
      value: gasMM == null ? "–" : gasMM.toFixed(2),
      unit: "MMscfd",
      tag: "Calculated",
      max: 8
    },
    {
      label: "Wellhead temperature",
      value: selected.temperature == null ? "–" : String(selected.temperature),
      unit: "°F",
      tag: "Measured",
      max: 240
    },
    {
      label: "Choke (normalised)",
      value: selected.choke == null ? "–" : String(selected.choke),
      unit: "%",
      tag: "Measured",
      max: 100
    }
  ];
  const pressureData = replayDays.map((day, index) => ({
    ...day,
    thp: series.thp?.[index] ?? null,
    ann: series.ann?.[index] ?? null,
    bhp: series.bhp?.[index] ?? null,
    oil: series.oil?.[index] ?? null
  }));
  const alarms =
    selected.id === "F-12"
      ? [
          `Rule 1: water cut ${wc ?? 81.5}% is above 70% and oil rate (${formatMaybe(oil)} bopd) is below the value 7 days earlier (1,803 bopd). Review water shut-off or zonal-isolation options.`,
          "Rule 5: Bottom-hole pressure (BHP) has no reading for 08 Feb 2016 (missing in the workbook). Data-quality flag raised."
        ]
      : selected.id === "F-4"
        ? [
            "Rule 3: water injection is more than 5% below its reference. Review injection capacity."
          ]
        : selected.kind === "Producer" && (wc ?? 0) > 70
          ? [`Rule 1: water cut ${wc}% is above 70%; review well performance.`]
          : [];
  return (
    <div className="space-y-4">
      <div className="rounded border border-gray-200 bg-white p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <strong className="rounded border border-gray-200 px-2 py-1 text-primary-800">
            REPLAY
          </strong>
          <p className="text-gray-500">
            Historical replay generated from Volve daily production data. 1
            production day every 5 seconds.
          </p>
          <span className="ml-auto">
            Well{" "}
            <SelectField
              label=""
              value={wellId}
              onChange={(id) => {
                setWellId(id);
                setChoke(wells.find((well) => well.id === id)?.choke ?? 0);
              }}
              options={wells.map((well) => ({
                value: well.id,
                label: `${well.id} · ${well.kind}`
              }))}
            />
          </span>
          <StatusBadge status={selected.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (dayIndex >= 29) setDayIndex(0);
              setPlaying((value) => !value);
            }}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-primary-700 hover:bg-primary-50"
          >
            {playing ? (
              <Pause className="size-3" />
            ) : (
              <Play className="size-3" />
            )}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            disabled={dayIndex >= 29}
            onClick={() => setDayIndex((value) => Math.min(29, value + 1))}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-primary-700 hover:bg-primary-50 disabled:opacity-50"
          >
            <SkipForward className="size-3" /> Step day
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setDayIndex(0);
            }}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-primary-700 hover:bg-primary-50"
          >
            <RotateCcw className="size-3" /> Restart
          </button>
          <span className="text-gray-500">10 Jan 2016</span>
          <input
            type="range"
            min={0}
            max={29}
            value={dayIndex}
            aria-label="Replay date"
            onChange={(event) => setDayIndex(Number(event.target.value))}
            className="min-w-32 flex-1 accent-primary-700"
          />
          <span className="text-gray-500">8 Feb 2016</span>
          <strong className="text-primary-800">{date.day} 2016</strong>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {metrics.map((item) => (
          <Gauge key={item.label} {...item} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Daily pressures and rate"
          aside={
            <>
              cursor at {date.day} 2016 <Provenance type="Measured" />
            </>
          }
        >
          <div className="p-4">
            <TimeChart
              data={pressureData}
              height={240}
              lines={[
                { key: "ann", name: "Annulus (psi)", color: chartColors.amber },
                { key: "thp", name: "THP (psi)", color: chartColors.primary },
                ...(selected.bhp == null
                  ? []
                  : [
                      {
                        key: "bhp",
                        name: "BHP (psi)",
                        color: chartColors.soft,
                        axis: "right" as const
                      }
                    ]),
                ...(selected.kind === "Injector"
                  ? []
                  : [
                      {
                        key: "oil",
                        name: "Oil (bopd)",
                        color: chartColors.blue,
                        axis: "right" as const
                      }
                    ])
              ]}
            />
          </div>
          {selected.bhp == null && selected.kind === "Producer" && (
            <p className="px-4 pb-3 text-[11px] text-gray-500">
              No BHP reading in the workbook for F-12, so that line is not
              drawn.
            </p>
          )}
        </Panel>
        <Panel title="Choke position" aside={<Provenance type="Measured" />}>
          <div className="space-y-3 p-4">
            <p className="text-3xl font-bold text-primary-700">{choke}%</p>
            <input
              type="range"
              min={0}
              max={100}
              value={choke}
              aria-label="Simulated choke position"
              onChange={(event) => setChoke(Number(event.target.value))}
              className="w-full accent-primary-700"
            />
            <p className="text-xs text-gray-500">
              simulated setpoint {initialChoke}%
            </p>
            <div className="flex gap-2">
              {[
                ["-2%", -2],
                ["+2%", 2]
              ].map(([label, delta]) => (
                <button
                  type="button"
                  key={label}
                  onClick={() =>
                    setChoke((current) =>
                      Math.max(0, Math.min(100, current + Number(delta)))
                    )
                  }
                  className="rounded border border-gray-200 px-3 py-1.5 text-xs text-primary-700"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setChoke(initialChoke)}
                className="rounded border border-gray-200 px-3 py-1.5 text-xs text-primary-700"
              >
                Reset
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Simulated control. Source data is never changed. Real changes need
              an authorised workflow.
            </p>
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Data availability" aside={date.day + " 2016"}>
          <div className="divide-y divide-gray-100 px-4">
            {[
              ["Oil", selected.kind === "Producer"],
              ["Gas", selected.kind === "Producer"],
              ["Water", selected.kind === "Producer"],
              ["On-stream hours", true],
              ["Bottom-hole pressure (BHP)", bhp != null],
              ["Tubing pressure (THP)", thp != null],
              ["Annulus pressure", ann != null],
              ["Wellhead temperature", selected.temperature != null],
              ["Choke", selected.choke != null]
            ].map(([key, present]) => (
              <div
                key={String(key)}
                className={`flex justify-between gap-2 py-2.5 text-xs ${!present && key === "Bottom-hole pressure (BHP)" ? "bg-amber-50 px-2" : ""}`}
              >
                <span>{key}</span>
                <span
                  className={present ? "text-emerald-700" : "text-amber-700"}
                >
                  {present ? "Present" : "Missing · view data quality"}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Active alarms"
          aside={
            <>
              {alarms.length} for {date.day} 2016{" "}
              <Provenance type="Synthetic" />
              <Provenance type="Calculated" />
            </>
          }
        >
          <div className="space-y-3 p-4">
            {alarms.length ? (
              alarms.map((alarm) => (
                <p
                  key={alarm}
                  className="rounded border border-amber-200 bg-amber-50 p-3 text-xs"
                >
                  <StatusBadge status="Warning" />{" "}
                  <span className="ml-2">{alarm}</span>
                </p>
              ))
            ) : (
              <p className="text-xs text-gray-500">
                No active alarms for this well on this day.
              </p>
            )}
            <p className="text-[11px] text-gray-500">
              Demo rules, evaluated on the workbook values of the replay day.
              Thresholds (70%, 90% water cut, 5% below injection reference, 0
              on-stream hours) are Synthetic; in the PoC these are replaced by
              your SOPs. Rule 2 (choke) is not defined in this demo. Injection
              reference = average injection of the 60 days before 10 Jan 2016
              (Calculated, demo definition, not a workbook field).
            </p>
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Potential versus actual by producer (bopd)"
          aside={
            <>
              {date.day} 2016 <Provenance type="Calculated" />
            </>
          }
        >
          <HorizontalBars
            items={producingWells.map((well) => ({
              id: well.id,
              oil: dailySeries[well.id].oil?.[dayIndex] ?? 0,
              potential: well.potential
            }))}
            max={10000}
          />
        </Panel>
        <Panel
          title="Recommendations"
          aside={
            <>
              <span className="font-semibold text-primary-700">RECOMMEND</span>
              <Provenance type="Synthetic" />
            </>
          }
        >
          <div className="divide-y divide-gray-100 px-4">
            {recommendations.map((item) => (
              <div key={item.id} className="space-y-1 py-3 text-xs">
                <p className="font-semibold text-primary-800">
                  {item.well}{" "}
                  <span className="font-normal text-gray-500">{item.id}</span>
                </p>
                <p>{item.action}</p>
                <p className="text-gray-500">
                  Uplift {item.uplift}{" "}
                  {item.uplift !== "not applicable" && (
                    <Provenance type="Synthetic" />
                  )}{" "}
                  · {item.constraint}
                </p>
                <p className="text-[11px] text-gray-500">
                  View only for this role
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Multi-well overview"
        aside={
          <>
            {date.day} 2016 · same daily values as the gauges{" "}
            <Provenance type="Measured" />
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="bg-primary-50 text-primary-800">
              <tr>
                {[
                  "Well",
                  "Rate",
                  "Water cut (%)",
                  "THP (psi)",
                  "Annulus (psi)",
                  "BHP (psi)",
                  "Gas (MMscfd)",
                  "Temp (°F)",
                  "Choke (%)",
                  "Status"
                ].map((key) => (
                  <th key={key} className="px-3 py-3 uppercase">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wells.map((well) => (
                <tr
                  key={well.id}
                  className={`border-t border-gray-100 ${well.id === wellId ? "bg-primary-50/50" : ""}`}
                >
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setWellId(well.id);
                        setChoke(well.choke ?? 0);
                      }}
                      className="font-semibold text-primary-800 hover:underline"
                    >
                      {well.id}
                    </button>
                  </td>
                  <td className="p-3">
                    {formatMaybe(
                      well.kind === "Injector"
                        ? dailySeries[well.id].inj?.[dayIndex]
                        : dailySeries[well.id].oil?.[dayIndex]
                    )}{" "}
                    {well.kind === "Injector" ? "bwpd" : "bopd"}
                  </td>
                  <td className="p-3">
                    {well.kind === "Injector"
                      ? "Not applicable"
                      : formatMaybe(dailySeries[well.id].wc?.[dayIndex])}
                  </td>
                  <td className="p-3">
                    {formatMaybe(dailySeries[well.id].thp?.[dayIndex])}
                  </td>
                  <td className="p-3">
                    {formatMaybe(dailySeries[well.id].ann?.[dayIndex])}
                  </td>
                  <td className="p-3">
                    {formatMaybe(dailySeries[well.id].bhp?.[dayIndex])}
                  </td>
                  <td className="p-3">
                    {well.gasMM == null
                      ? "Not applicable"
                      : well.gasMM.toFixed(2)}
                  </td>
                  <td className="p-3">{formatMaybe(well.temperature)}</td>
                  <td className="p-3">
                    {well.choke == null ? "–" : well.choke.toFixed(1)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={well.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
