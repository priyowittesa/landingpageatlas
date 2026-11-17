"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import Link from "next/link";
import {
  AreaTrend,
  chartColors,
  HorizontalBars,
  MetricCard,
  Panel,
  Provenance,
  SelectField,
  TimeChart
} from "../components";
import {
  dailyData,
  dailySeries,
  monthlyProduction,
  producingWells,
  replayDays,
  wells
} from "../data";

function FieldRecord() {
  const stats = [
    [
      "Field status",
      "Shut down",
      "OIL · North Sea · Equinor Energy AS",
      "Measured"
    ],
    [
      "Cumulative oil",
      "10.17 mill Sm3",
      "100% of 10.17 recoverable",
      "Measured"
    ],
    [
      "Peak month",
      "277k Sm3",
      "Dec 2008 (about 56,100 bopd, 277k Sm3 over 31 days; workbook monthly sheet, matches Sodir)",
      "Calculated"
    ],
    [
      "Water share 2016",
      "83%",
      "70% in 2015 · produced water ÷ liquid",
      "Measured"
    ],
    [
      "Export",
      "NAVION SAGA",
      "FSU, 90 m water depth · 2008-02-12 to 2016-10-06",
      "Measured"
    ]
  ] as const;
  return (
    <Panel
      title="Volve field record · Sodir FactPages"
      aside={
        <>
          <Provenance type="Measured" />
          <a
            href="https://factpages.sodir.no/field/pageview/all/3420717"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary-700 hover:underline"
          >
            Open FactPage ↗
          </a>
        </>
      }
    >
      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map(([label, value, detail, type]) => (
            <div key={label} className="rounded border border-gray-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] font-semibold uppercase text-gray-500">
                  {label}
                </p>
                <Provenance type={type} />
              </div>
              <p className="mt-1 text-lg font-bold text-primary-800">{value}</p>
              <p className="text-[11px] text-gray-500">{detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-semibold text-primary-800">
          Monthly gross oil and produced water, Feb 2008 to Sep 2016 (thousand
          Sm3)
        </p>
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyProduction}
              margin={{ top: 10, right: 10, left: -18 }}
            >
              <CartesianGrid vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={11} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 300]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="oil"
                name="Gross oil"
                stroke={chartColors.primary}
                fill="var(--atlas-primary-100)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="water"
                name="Produced water"
                stroke={chartColors.blue}
                dot={false}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Water overtook oil in 2010 and peaked in Oct 2014. The last full
          production month was Aug 2016. Production stopped in Sep 2016 and the
          FSU was removed on 2016-10-06.
        </p>
      </div>
    </Panel>
  );
}

function SemanticCard() {
  const context = [
    "Field contains Facility",
    "Facility serves Wellbore",
    "Wellbore has role Producer or Injector",
    "Wellbore has Daily production record",
    "Wellbore measured by Pressure, temperature and choke readings",
    "Wellbore described by Document"
  ];
  const examples = [
    [
      "1 · Injector",
      "F-4 injection fell 32% to a low on 25 Jan, now 7.8% below its 60-day reference",
      "Daily Production Data, BORE_WI_VOL"
    ],
    [
      "2 · Pressure",
      "BHP change on supported producers: F-12 no BHP, F-14 -0.4%, F-1 C +3.9%",
      "AVG_DOWNHOLE_PRESSURE, first 7 versus last 7 days"
    ],
    [
      "3 · Producer",
      "Oil change: F-12 -14.8%, F-14 -8.4%, F-1 C -29.2%",
      "BORE_OIL_VOL by well"
    ],
    [
      "4 · Water cut",
      "F-14 is 95.4% and flat; F-1 C is 93.6% after its 16-day shut-in",
      "Water ÷ (oil + water) × 100"
    ]
  ];
  return (
    <Panel title="Data that carries its meaning">
      <div className="space-y-4 p-4 text-xs">
        <p className="max-w-3xl leading-relaxed text-gray-500">
          ATLAS does not only store numbers. Every value is tied to the object
          it describes, the relationships around it, one definition and its
          original source. That is why the same figure reads the same on every
          page, and why an alert can be followed from a symptom to a possible
          contributing factor.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-gray-200 p-3">
            <h3 className="font-bold uppercase text-primary-800">Context</h3>
            <p className="my-2 text-gray-500">
              A well is linked to what surrounds it, so one question can cross
              domains.
            </p>
            {context.map((item) => (
              <p key={item} className="py-0.5">
                {item}
              </p>
            ))}
          </div>
          <div className="rounded border border-gray-200 p-3">
            <h3 className="font-bold uppercase text-primary-800">Semantics</h3>
            <p className="my-2 text-gray-500">
              Each indicator has one definition, shown with its formula.
            </p>
            {[
              ["Water cut", "Produced water ÷ total liquid, %"],
              [
                "Gas–oil ratio",
                "gas Sm3 × 35.3147 ÷ (oil Sm3 × 6.28981), scf/stb"
              ],
              ["Well uptime", "On-stream hours ÷ 24, %"],
              ["Injection balance", "Injected volume ÷ produced liquid"]
            ].map(([key, value]) => (
              <p key={key} className="py-0.5">
                <b>{key}</b> {value}{" "}
                <span className="text-gray-500">· Demo definition</span>
              </p>
            ))}
          </div>
          <div className="rounded border border-gray-200 p-3">
            <h3 className="font-bold uppercase text-primary-800">Lineage</h3>
            <p className="my-2 text-gray-500">
              Any number traces back to the original record, with every step
              kept.
            </p>
            {[
              "Volve_Production_data.xlsx",
              "Daily Production Data",
              "Validate",
              "Semantic model",
              "Demo metric definition"
            ].map((item, index) => (
              <p key={item} className="py-0.5">
                <b className="text-primary-700">{index + 1}.</b> {item}
              </p>
            ))}
          </div>
        </div>
        <p className="font-bold uppercase text-primary-800">
          Worked example · follow an alert through connected data
        </p>
        <div className="grid gap-2 md:grid-cols-4">
          {examples.map(([title, value, source]) => (
            <div key={title} className="rounded bg-primary-50 p-3">
              <p className="font-bold uppercase text-primary-800">
                {title} <Provenance type="Calculated" />
              </p>
              <p className="mt-2 font-semibold">{value}</p>
              <p className="mt-1 text-gray-500">{source}</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500">
          Observed in the Volve record as of 8 Feb 2016. The
          injector-to-producer links are Synthetic and the data does not confirm
          a cause; this is a hypothesis for review.
        </p>
        <div className="flex gap-4 font-semibold text-primary-700">
          <Link
            href="/app/well-performance/analytics"
            className="hover:underline"
          >
            Open the full semantic model →
          </Link>
          <Link
            href="/app/well-performance/register"
            className="hover:underline"
          >
            Trace to source →
          </Link>
        </div>
      </div>
    </Panel>
  );
}

export default function WellDashboard() {
  const [pressureId, setPressureId] = useState("F-12");
  const [compared, setCompared] = useState(["F-12", "F-14", "F-15"]);
  const selected = wells.find((well) => well.id === pressureId) ?? wells[0];
  const pressureData = replayDays.map((day, index) => ({
    ...day,
    thp: dailySeries[pressureId].thp?.[index] ?? null,
    ann: dailySeries[pressureId].ann?.[index] ?? null,
    bhp: dailySeries[pressureId].bhp?.[index] ?? null
  }));
  return (
    <div className="space-y-5">
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
            <span className="text-gray-500">{label}</span>{" "}
            <strong className="ml-2 text-base">{count}</strong>
          </div>
        ))}
        <Provenance type="Calculated" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Oil rate"
          value="10,180"
          unit="bopd · 1,618 Sm3/d · 5 producers"
          delta="↘ 3.5%"
          negative
        />
        <MetricCard label="Gas rate" value="9.1" unit="MMscfd" />
        <MetricCard label="Water cut" value="82.8" unit="%" />
        <MetricCard
          label="Producing wells"
          value="5"
          unit="of 5 producers · 2 injectors"
        />
        <MetricCard
          label="Potential gap"
          value="5,651"
          unit="bopd · 5 producers"
        />
      </div>
      <p className="text-xs text-gray-500">
        Reference potential = highest 7-day average oil rate in the 90 days to 8
        Feb 2016 (Calculated, demo definition, not a workbook field)
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Producer versus injector performance"
          aside="as of 8 Feb 2016"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="bg-primary-50 text-primary-800">
                <tr>
                  {["Group", "Wells", "Volume", "Indicator", "Uptime"].map(
                    (h) => (
                      <th key={h} className="px-3 py-3 uppercase">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <th className="p-3 text-primary-800">Producers</th>
                  <td className="p-3">5 wells</td>
                  <td className="p-3">
                    10,180 bopd
                    <br />
                    <small>1,618 Sm3/d</small>
                  </td>
                  <td className="p-3">
                    Water cut 82.8% <Provenance type="Calculated" />
                  </td>
                  <td className="p-3">
                    81.3% <Provenance type="Calculated" />
                  </td>
                </tr>
                <tr>
                  <th className="p-3 text-primary-800">Injectors</th>
                  <td className="p-3">2 wells</td>
                  <td className="p-3">
                    58,539 bwpd
                    <br />
                    <small>9,307 Sm3/d</small>
                  </td>
                  <td className="p-3">
                    94% of 62,243 bwpd reference{" "}
                    <Provenance type="Calculated" />
                  </td>
                  <td className="p-3">
                    97.5% <Provenance type="Calculated" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-2 p-4 text-xs text-gray-600">
            <p>
              Injection balance 0.99 (injected divided by produced liquid of
              59,041 bbl/d, 9,387 Sm3/d). <Provenance type="Calculated" />
            </p>
            <p>
              Injection reference = average injection of the 60 days before 10
              Jan 2016 (Calculated, demo definition, not a workbook field).
              Under target = more than 5% below reference.
            </p>
            <p className="rounded bg-amber-50 p-2 text-amber-900">
              Under-injection: F-4 is at 29,455 bwpd (4,683 Sm3/d), 7.8% below
              its 31,960 bwpd reference. <Provenance type="Calculated" />
            </p>
          </div>
        </Panel>
        <Panel
          title="Producer response after injection changes"
          aside={
            <>
              first 7 versus last 7 producing days{" "}
              <Provenance type="Calculated" />
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[490px] text-left text-xs">
              <thead className="bg-primary-50 text-primary-800">
                <tr>
                  {[
                    "Producer",
                    "Injector",
                    "Oil",
                    "BHP",
                    "Water cut",
                    "Link basis"
                  ].map((h) => (
                    <th key={h} className="p-3 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["F-12", "F-4", "-14.8%", "–", "+1.0 pt"],
                  ["F-14", "F-4", "-8.4%", "-0.4%", "-0.2 pt"],
                  ["F-11", "F-5", "-12.5%", "+1.0%", "+3.2 pt"],
                  ["F-15", "F-5", "-5.6%", "-9.4%", "-7.3 pt"],
                  ["F-1 C", "F-4", "-29.2%", "+3.9%", "+3.9 pt"]
                ].map(([id, inj, oil, bhp, wc]) => (
                  <tr key={id} className="border-t border-gray-100">
                    <th className="p-3 text-primary-800">{id}</th>
                    <td className="p-3">{inj}</td>
                    <td className="p-3 text-red-700">{oil}</td>
                    <td className="p-3">{bhp}</td>
                    <td className="p-3">{wc}</td>
                    <td className="p-3">
                      Configured for demo, not stated in the workbook
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="p-4 text-[11px] text-gray-500">
            F-15 D and F-1 C compare only producing days (oil above 0), because
            of the idle and shut-in periods in the window. BHP is shown as –
            where the workbook has no reading (F-12). This is a hypothesis for
            review, not a confirmed cause.
          </p>
        </Panel>
      </div>
      <FieldRecord />
      <SemanticCard />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Production trend · oil, water cut"
          aside={
            <>
              30 days from 10 Jan 2016 <Provenance type="Calculated" />
            </>
          }
        >
          <div className="p-4">
            <AreaTrend data={dailyData} />
          </div>
        </Panel>
        <Panel
          title="Pressure monitoring"
          aside={
            <>
              <Provenance type="Measured" />
              <SelectField
                label=""
                value={pressureId}
                onChange={setPressureId}
                options={wells.map((well) => ({
                  value: well.id,
                  label: `${well.id} · ${well.kind}`
                }))}
              />
            </>
          }
        >
          <div className="p-4">
            <TimeChart
              data={pressureData}
              height={210}
              lines={[
                {
                  key: "ann",
                  name: "Annulus pressure (psi)",
                  color: chartColors.amber
                },
                { key: "thp", name: "THP (psi)", color: chartColors.primary },
                ...(selected.bhp != null
                  ? [
                      {
                        key: "bhp",
                        name: "BHP (psi)",
                        color: chartColors.blue,
                        axis: "right" as const
                      }
                    ]
                  : [])
              ]}
            />
          </div>
          <p className="px-4 pb-4 text-[11px] text-gray-500">
            Annulus pressure is AVG_ANNULUS_PRESS, the closest available measure
            to casing pressure.
            {selected.bhp == null &&
              " No BHP reading in the workbook for F-12."}
          </p>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Flow rate by well · actual vs potential"
          aside={
            <>
              bopd <Provenance type="Calculated" />
            </>
          }
        >
          <HorizontalBars
            items={[...producingWells].sort((a, b) => b.oil - a.oil)}
            max={10000}
          />
          <p className="px-4 pb-3 text-[11px] text-gray-500">
            Reference potential = highest 7-day average oil rate in the 90 days
            to 8 Feb 2016 (Calculated, demo definition, not a workbook field)
          </p>
        </Panel>
        <Panel
          title="Water cut by well"
          aside={
            <>
              producers · alarm 85% <Provenance type="Calculated" />
              <Provenance type="Synthetic" />
            </>
          }
        >
          <div className="space-y-3 p-4">
            {[...producingWells]
              .sort((a, b) => (b.waterCut ?? 0) - (a.waterCut ?? 0))
              .map((well) => (
                <div
                  key={well.id}
                  className="grid grid-cols-[50px_1fr_40px] items-center gap-2 text-xs"
                >
                  <span>{well.id}</span>
                  <div className="h-5 rounded bg-gray-100">
                    <div
                      className={`h-full rounded ${well.waterCut! >= 90 ? "bg-primary-700" : well.waterCut! >= 80 ? "bg-amber-600" : "bg-gray-500"}`}
                      style={{ width: `${well.waterCut}%` }}
                    />
                  </div>
                  <span className="text-right">{well.waterCut}%</span>
                </div>
              ))}
          </div>
          <p className="px-4 pb-3 text-[11px] text-gray-500">
            F-14 has the highest water cut at 95.4%; over the 30-day window it
            is essentially flat (-0.10 pt per week, linear fit).{" "}
            <Provenance type="Calculated" />
          </p>
        </Panel>
      </div>
      <Panel
        title="Production comparison between wells"
        aside={<Provenance type="Calculated" />}
      >
        <div className="flex flex-wrap gap-1 p-4 pb-0">
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
        <div className="p-4">
          <TimeChart
            data={dailyData}
            height={230}
            lines={compared.map((id, index) => ({
              key: id,
              name: id,
              color: [chartColors.primary, chartColors.blue, chartColors.amber][
                index
              ]
            }))}
            yDomain={[0, 9000]}
          />
        </div>
      </Panel>
    </div>
  );
}
