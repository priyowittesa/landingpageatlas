"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  HorizontalBars,
  Panel,
  Provenance,
  Segmented,
  SelectField,
  TimeChart,
  chartColors
} from "../components";
import {
  dailySeries,
  declineOil,
  formatNumber,
  lossWells,
  monthlyProduction,
  producingWells,
  recommendations,
  replayDays,
  wells
} from "../data";

type Mode =
  | "Production trend"
  | "Decline curve"
  | "Well comparison"
  | "Loss identification"
  | "Opportunities";
const modes: Mode[] = [
  "Production trend",
  "Decline curve",
  "Well comparison",
  "Loss identification",
  "Opportunities"
];
export default function WellAnalytics() {
  const [mode, setMode] = useState<Mode>("Production trend");
  const [field, setField] = useState("Field (monthly)");
  const [wellId, setWellId] = useState("F-12");
  const [model, setModel] = useState("Exponential");
  const [compared, setCompared] = useState(["F-12", "F-14", "F-15"]);
  const [metric, setMetric] = useState("Rate");
  const [injector, setInjector] = useState("F-4");
  const selected = wells.find((well) => well.id === wellId) ?? wells[0];
  const trend =
    field === "Field (monthly)"
      ? monthlyProduction.map((row, index, all) => ({
          day: row.day,
          bopd: row.bopd,
          wc: row.wc,
          avg:
            index < 2
              ? row.bopd
              : Math.round(
                  (all[index].bopd +
                    all[index - 1].bopd +
                    all[index - 2].bopd) /
                    3
                )
        }))
      : replayDays.map((day, index) => ({
          day: day.day,
          bopd: dailySeries[field].oil?.[index] ?? 0,
          avg:
            index < 2
              ? (dailySeries[field].oil?.[index] ?? 0)
              : Math.round(
                  ((dailySeries[field].oil?.[index] ?? 0) +
                    (dailySeries[field].oil?.[index - 1] ?? 0) +
                    (dailySeries[field].oil?.[index - 2] ?? 0)) /
                    3
                ),
          wc: dailySeries[field].wc?.[index] ?? null
        }));
  const curve = Array.from({ length: 165 }, (_, i) => ({
    day: new Date(Date.UTC(2015, 10, 11 + i)).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC"
    }),
    model: Math.round(
      (selected.id === "F-12" ? 2503 : declineOil[selected.id][0]) *
        Math.exp((-1.45 * i) / 365)
    ),
    measured: i < 90 ? declineOil[selected.id]?.[i] : undefined
  }));
  const comparison = compared
    .map((id) => wells.find((well) => well.id === id))
    .filter((well): well is (typeof wells)[number] => !!well);
  return (
    <div className="space-y-5">
      <Segmented
        value={mode}
        onChange={setMode}
        options={modes.map((value) => ({ value, label: value }))}
      />
      {mode === "Production trend" && (
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Panel
            title="Production trend analysis"
            aside={
              <>
                {field === "Field (monthly)"
                  ? "Feb 08 to Sep 16, monthly"
                  : "10 Jan to 8 Feb 2016, daily"}{" "}
                <Provenance type="Calculated" />
              </>
            }
          >
            <div className="p-4">
              <Segmented
                value={field}
                onChange={setField}
                options={[
                  "Field (monthly)",
                  ...producingWells.map((well) => well.id)
                ].map((value) => ({ value, label: value }))}
              />
              <div className="mt-4 h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trend}
                    margin={{ left: -10, right: 8, top: 8, bottom: 4 }}
                  >
                    <CartesianGrid vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="oil"
                      tick={{ fontSize: 10 }}
                      domain={[0, "auto"]}
                    />
                    <YAxis
                      yAxisId="wc"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      unit="%"
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      dataKey="avg"
                      name="3-month moving average"
                      yAxisId="oil"
                      stroke={chartColors.primary}
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      dataKey="bopd"
                      name="Oil (bopd)"
                      yAxisId="oil"
                      stroke={chartColors.soft}
                      dot={false}
                    />
                    <Line
                      dataKey={field === "Field (monthly)" ? "wc" : "wc"}
                      name="Water cut"
                      yAxisId="wc"
                      stroke={chartColors.blue}
                      dot={false}
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Panel>
          <div className="space-y-4">
            <div className="rounded border border-gray-200 border-l-4 border-l-primary-700 bg-white p-4 text-sm">
              <p className="mb-2 text-xs uppercase text-gray-500">
                Oil rate change
              </p>
              <p>
                Field oil rate changed by an average of{" "}
                <strong>-1.7% per month</strong> (compound) from Feb 08 to Sep
                16, across producing months <Provenance type="Calculated" />
              </p>
            </div>
            <div className="rounded border border-gray-200 border-l-4 border-l-primary-700 bg-white p-4 text-sm">
              <p className="mb-2 text-xs uppercase text-gray-500">Water cut</p>
              <p>
                Field water cut moved from <strong>0.8% to 84.5%</strong>:{" "}
                <strong>+0.81 points per month</strong> on average{" "}
                <Provenance type="Calculated" />. The workbook record ends in
                2016-12, so no forward crossing date is projected. Select a
                producer for its 30-day trend.
              </p>
            </div>
          </div>
        </div>
      )}
      {mode === "Decline curve" && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Panel
            title={`Decline curve analysis (Arps) · ${wellId}`}
            aside={
              <>
                <Provenance type="Estimated" />
                <SelectField
                  label=""
                  value={wellId}
                  onChange={setWellId}
                  options={producingWells.map((well) => ({
                    value: well.id,
                    label: `${well.id} · Producer`
                  }))}
                />
              </>
            }
          >
            <div className="h-[350px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curve}>
                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={14} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    domain={[
                      0,
                      Math.ceil(Math.max(2800, ...declineOil[wellId]) / 1000) *
                        1000
                    ]}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    dataKey="model"
                    name="Decline model"
                    stroke={chartColors.primary}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="measured"
                    name="Measured daily oil (bopd)"
                    stroke={chartColors.blue}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="px-4 pb-4 text-xs text-gray-500">
              Forecast → · economic limit 80 bopd
            </p>
          </Panel>
          <Panel
            title="Model parameters"
            aside={<Provenance type="Estimated" />}
          >
            <div className="space-y-4 p-4">
              <Segmented
                value={model}
                onChange={setModel}
                options={["Exponential", "Hyperbolic", "Harmonic"].map(
                  (value) => ({ value, label: value })
                )}
              />
              {[
                ["Initial decline Di (per yr)", "1.45"],
                [
                  "b-factor",
                  model === "Exponential"
                    ? "0.00"
                    : model === "Harmonic"
                      ? "1.00"
                      : "0.70"
                ],
                ["Model", `Arps ${model.toLowerCase()}`],
                [
                  "Fitting period",
                  wellId === "F-12"
                    ? "11 Nov 2015 to 8 Feb 2016 (90 producing days of 90)"
                    : "11 Nov 2015 to 8 Feb 2016 (demo window)"
                ],
                [
                  "Initial rate (qi, 11 Nov 2015)",
                  wellId === "F-12"
                    ? "2,503 bopd"
                    : `${formatNumber(declineOil[wellId][0])} bopd · illustrative`
                ],
                [
                  "Fitted exponential Di",
                  wellId === "F-12"
                    ? "1.45 per yr"
                    : "1.45 per yr · illustrative"
                ],
                [
                  "Fit error",
                  wellId === "F-12"
                    ? "5.4% mean absolute error versus daily oil"
                    : "Not fitted for this well"
                ],
                [
                  "Remaining volume above 80 bopd",
                  wellId === "F-12"
                    ? "0.45 MMbbl · Estimated"
                    : "Not fitted for this well"
                ]
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-3 border-b border-gray-100 pb-2 text-xs"
                >
                  <span className="text-gray-500">{key}</span>
                  <strong className="text-right">{value}</strong>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                {wellId === "F-12"
                  ? "qi and Di are fitted to the 90 days to 8 Feb 2016 only (log-linear fit on producing days); b is a user setting, not fitted."
                  : "Only F-12 has fitted decline parameters in this demo; this well's model is illustrative."}{" "}
                The workbook record continues to 2016-12-01.
              </p>
            </div>
          </Panel>
        </div>
      )}
      {mode === "Well comparison" && (
        <div className="space-y-4">
          <Panel
            title="Well performance comparison"
            aside={<Provenance type="Calculated" />}
          >
            <div className="flex flex-wrap gap-1 p-4">
              {producingWells.map((well) => (
                <button
                  key={well.id}
                  type="button"
                  aria-pressed={compared.includes(well.id)}
                  onClick={() =>
                    setCompared((current) =>
                      current.includes(well.id)
                        ? current.filter((id) => id !== well.id)
                        : current.length < 3
                          ? [...current, well.id]
                          : [...current.slice(1), well.id]
                    )
                  }
                  className={`rounded border px-2 py-1 text-[11px] ${compared.includes(well.id) ? "border-primary-700 bg-primary-700 text-white" : "border-gray-200 hover:bg-primary-50"}`}
                >
                  {well.id}
                </button>
              ))}
            </div>
            <div className="px-4">
              <Segmented
                value={metric}
                onChange={setMetric}
                options={[
                  "Rate",
                  "Rate / potential",
                  "Low water cut",
                  "Uptime",
                  "Completeness",
                  "Health"
                ].map((value) => ({ value, label: value }))}
              />
            </div>
            <HorizontalBars
              items={comparison.map((well) => ({
                id: well.id,
                oil:
                  metric === "Rate"
                    ? well.oil
                    : metric === "Rate / potential"
                      ? Math.round((well.oil / well.potential) * 100)
                      : metric === "Low water cut"
                        ? 100 - (well.waterCut ?? 0)
                        : metric === "Uptime"
                          ? well.uptime
                          : metric === "Completeness"
                            ? well.completeness
                            : well.status === "Critical"
                              ? 40
                              : 80,
                potential: metric === "Rate" ? well.potential : 100
              }))}
            />
          </Panel>
          <Panel title="Side-by-side">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="p-3">Metric</th>
                    {comparison.map((well) => (
                      <th key={well.id} className="p-3 text-primary-800">
                        {well.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Oil (bopd)",
                      (well: (typeof wells)[number]) => formatNumber(well.oil)
                    ],
                    [
                      "Reference potential (bopd)",
                      (well: (typeof wells)[number]) =>
                        formatNumber(well.potential)
                    ],
                    [
                      "Attainment",
                      (well: (typeof wells)[number]) =>
                        `${Math.round((well.oil / well.potential) * 100)}%`
                    ],
                    [
                      "Water cut",
                      (well: (typeof wells)[number]) => `${well.waterCut}%`
                    ],
                    ["GOR (scf/stb)", () => "892"],
                    [
                      "THP (psi)",
                      (well: (typeof wells)[number]) => String(well.thp ?? "–")
                    ],
                    [
                      "BHP (psi)",
                      (well: (typeof wells)[number]) =>
                        well.bhp == null ? "–" : formatNumber(well.bhp)
                    ],
                    [
                      "Choke (normalised, %)",
                      (well: (typeof wells)[number]) => `${well.choke}%`
                    ],
                    [
                      "Uptime (%)",
                      (well: (typeof wells)[number]) => `${well.uptime}%`
                    ],
                    [
                      "Data completeness (%)",
                      (well: (typeof wells)[number]) => `${well.completeness}%`
                    ]
                  ].map(([name, format]) => (
                    <tr key={String(name)} className="border-t border-gray-100">
                      <th className="p-3 font-medium">{String(name)}</th>
                      {comparison.map((well) => (
                        <td key={well.id} className="p-3">
                          {(format as (well: (typeof wells)[number]) => string)(
                            well
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel
            title="Injector versus supported producers"
            aside={<Provenance type="Synthetic" />}
          >
            <div className="p-4">
              <Segmented
                value={injector}
                onChange={setInjector}
                options={["F-4", "F-5"].map((value) => ({
                  value,
                  label: `${value} · Injector`
                }))}
              />
              <div className="mt-4">
                <TimeChart
                  data={replayDays.map((day, index) => ({
                    ...day,
                    ...Object.fromEntries(
                      producingWells
                        .filter((well) => well.support === injector)
                        .map((well) => [
                          well.id,
                          dailySeries[well.id].oil?.[index] ?? 0
                        ])
                    ),
                    inj: dailySeries[injector].inj?.[index] ?? 0
                  }))}
                  height={240}
                  lines={[
                    ...producingWells
                      .filter((well) => well.support === injector)
                      .map((well, index) => ({
                        key: well.id,
                        name: `${well.id} oil (bopd)`,
                        color: [
                          chartColors.primary,
                          chartColors.blue,
                          chartColors.amber
                        ][index]
                      })),
                    {
                      key: "inj",
                      name: `${injector} injection (bwpd)`,
                      color: chartColors.soft,
                      axis: "right"
                    }
                  ]}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                {injector} supports{" "}
                {producingWells
                  .filter((well) => well.support === injector)
                  .map((well) => well.id)
                  .join(", ")}
                . Link basis: Configured for demo, not stated in the workbook.
                Injection{" "}
                {injector === "F-4"
                  ? "29,455 bwpd (4,683 Sm3/d), 92% of its reference"
                  : "29,084 bwpd (4,624 Sm3/d), on target"}
                . Injection reference = average injection of the 60 days before
                10 Jan 2016 (Calculated, demo definition, not a workbook field).
                Under target = more than 5% below reference.
              </p>
            </div>
          </Panel>
        </div>
      )}
      {mode === "Loss identification" && (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Panel
            title="Indicated loss drivers (analytical classification, not a confirmed diagnosis)"
            aside={
              <>
                bopd, 5 producers <Provenance type="Calculated" />
                <Provenance type="Synthetic" />
              </>
            }
          >
            <div className="space-y-4 p-5">
              <div className="flex justify-between text-xs">
                <strong>Gap to potential</strong>
                <strong>5,651 bopd</strong>
              </div>
              {[
                ["Downtime", 2218],
                ["High water cut", 306],
                ["Reduced choke", 0],
                ["Reduced injection support", 768],
                ["Reservoir decline", 2359],
                ["Unclassified", 0]
              ].map(([name, value]) => (
                <div
                  key={name}
                  className="grid grid-cols-[155px_1fr_65px] items-center gap-2 text-xs"
                >
                  <span>{name}</span>
                  <div className="h-5 rounded bg-gray-100">
                    <div
                      className="h-full rounded bg-primary-700"
                      style={{ width: `${(Number(value) / 2359) * 100}%` }}
                    />
                  </div>
                  <span className="text-right">
                    {formatNumber(Number(value))}
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Reference potential = highest 7-day average oil rate in the 90
                days to 8 Feb 2016 (Calculated, demo definition, not a workbook
                field). Gap = reference potential minus the 8 Feb 2016 oil rate.
              </p>
            </div>
          </Panel>
          <Panel
            title="Largest loss wells"
            aside={<Provenance type="Calculated" />}
          >
            <div className="divide-y divide-gray-100">
              {lossWells.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 p-3 text-xs"
                >
                  <div>
                    <strong>{item.id}</strong>
                    <p className="mt-1 text-gray-500">
                      {item.driver}: {item.basis}
                    </p>
                  </div>
                  <strong className="shrink-0 text-red-700">
                    −{formatNumber(item.loss)} bopd
                  </strong>
                </div>
              ))}
              <p className="p-3 text-[11px] text-gray-500">
                Total 5,651 bopd across the 5 wells (matches the dashboard
                potential gap of 5,651 bopd).
              </p>
            </div>
          </Panel>
        </div>
      )}
      {mode === "Opportunities" && (
        <div className="space-y-4">
          <Panel
            title="Optimisation opportunities"
            aside="Recommendation master list"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead className="bg-primary-50 text-primary-800">
                  <tr>
                    {[
                      "Well",
                      "Recommended action",
                      "Uplift",
                      "Constraint",
                      "Basis",
                      "Decision"
                    ].map((key) => (
                      <th key={key} className="p-3 uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 align-top"
                    >
                      <td className="p-3 font-semibold">
                        {item.well}
                        <small className="mt-1 block text-gray-500">
                          {item.id}
                        </small>
                      </td>
                      <td className="p-3">{item.action}</td>
                      <td className="p-3">
                        {item.uplift}{" "}
                        {item.uplift !== "not applicable" && (
                          <Provenance type="Synthetic" />
                        )}
                      </td>
                      <td className="p-3">{item.constraint}</td>
                      <td className="p-3">{item.basis}</td>
                      <td className="p-3 text-gray-500">
                        View only for this role
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="p-4 text-[11px] text-gray-500">
              Uplift ranges (Synthetic) are set at 30% to 60% of the computed
              gap of the wells concerned and never exceed it. Uplift ranges for
              F-4 and the producers it supports are separate estimates and are
              not added together.
            </p>
          </Panel>
          <Panel title="Action plan">
            <div className="p-4 text-xs">
              <p className="uppercase text-gray-500">Accepted or modified</p>
              <p className="mt-1 text-xl font-bold">0</p>
              <p className="mt-2 text-gray-500">
                Accept an opportunity to build a plan.
              </p>
              <p className="mt-3 text-gray-500">View only for this role</p>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
