import type { ApiSignal } from "./use-signals";

type Sample = {
  title: string;
  description: string;
  type: "insight" | "recommendation" | "prediction";
  module: string;
  entity: string;
  metric: [string, number, string?];
  confidence: number;
  priority: number;
  severity?: string;
  valueTags?: string[];
  action: string;
};

const samples: Sample[] = [
  {
    title: "Annulus pressure rising on well 15/9-F-5",
    description: "Annulus pressure on well 15/9-F-5 increased 18.2% to 24.9 bar over the last 30 days, up from 21.1 bar two months earlier, exceeding the 15% watch threshold.",
    type: "recommendation", module: "asset maintenance", entity: "15/9-F-5",
    metric: ["Annulus pressure change", 18.2, "%"],
    confidence: 0.75, priority: 0.58, valueTags: ["cost"],
    action: "Review the annulus pressure trend and schedule a well-integrity inspection before planning an intervention."
  },
  {
    title: "Volve monthly production table stores 29.4 rows per well-month instead of 1",
    description: "Volve monthly production stores 3327 rows for 113 well-months, averaging 29.4 rows per well-month. Check the dataset grain before aggregating.",
    type: "insight", module: "data quality", entity: "Volve monthly production",
    metric: ["Rows per well-month", 29.4], confidence: 0.95, priority: 0.35,
    action: "Validate the well-month key and deduplicate records before calculating monthly totals."
  },
  {
    title: "Record completeness: well 15/9-F-4 has no volumes on 95.2% of reported days",
    description: "15/9-F-4 has empty volume records on 20 of 21 reported days (95.2%), far above the completeness threshold.",
    type: "insight", module: "data quality", entity: "15/9-F-4",
    metric: ["Days with no volumes", 95.2, "%"], confidence: 0.95, priority: 0.48,
    action: "Reconcile missing daily production volumes with source records and confirm whether the well was shut in."
  },
  {
    title: "15/9-F-5 injectivity down 40.4% from 2009 peak",
    description: "Forecast 2016 injectivity is 176.9 Sm3/h, 40.4% below the 296.6 Sm3/h 2009 peak. This is an illustrative forecast, not a live operational prediction.",
    type: "prediction", module: "water injection", entity: "15/9-F-5",
    metric: ["Injectivity 2016 vs peak", -40.4, "%"],
    confidence: 0.836, priority: 0.4, valueTags: ["production", "cost"],
    action: "Review injection performance and assess potential formation damage with the reservoir team."
  },
  {
    title: "Well 15/9-F-5: 41161 Sm3 oil since conversion, 13.8 Sm3/h",
    description: "Since conversion on 2016-04-20 (151 days), the well produced 41161 Sm3 oil at 13.8 Sm3/h.",
    type: "insight", module: "well performance", entity: "15/9-F-5",
    metric: ["Oil since conversion", 41161, "Sm3"],
    confidence: 0.9, priority: 0.3, severity: "info", valueTags: ["production"],
    action: "Continue monitoring post-conversion production against the agreed baseline."
  },
  {
    title: "Well 15/9-F-5 choke at 97.7%, headroom nearly exhausted",
    description: "Choke over the last 30 days is 97.7%, above the 95% threshold and up from 83.8% two months earlier.",
    type: "recommendation", module: "well performance", entity: "15/9-F-5",
    metric: ["Choke last 30d", 97.7, "%"], confidence: 0.8, priority: 0.68,
    valueTags: ["production"],
    action: "Review choke settings and production constraints with the well-performance team."
  },
  {
    title: "Volve net production declined 21% year over year",
    description: "Sample annual production is 21% below the previous year, exceeding the 15% watch threshold.",
    type: "insight", module: "production performance", entity: "Volve",
    metric: ["Year-over-year change", -21, "%"], confidence: 0.9, priority: 0.61,
    valueTags: ["production"],
    action: "Compare well-level production and downtime to identify the main contributors to the decline."
  },
  {
    title: "Remaining reserves indicate fewer than 2.5 years of production",
    description: "The sample reserves-to-production ratio is 2.1 years, below the 2.5-year risk threshold.",
    type: "prediction", module: "reservoir & reserves", entity: "Volve",
    metric: ["Reserves / production", 2.1, "years"],
    confidence: 0.85, priority: 0.82, severity: "risk", valueTags: ["production"],
    action: "Review the reserves estimate and production forecast before making development decisions."
  },
  {
    title: "Review water handling capacity as produced-water share increases",
    description: "Water accounts for 83% of the sample field's produced liquid. Review water handling and operating costs.",
    type: "recommendation", module: "water injection", entity: "Volve",
    metric: ["Produced-water share", 83, "%"], confidence: 0.88, priority: 0.55,
    valueTags: ["cost"],
    action: "Assess water-handling capacity and compare treatment costs with production value."
  },
  {
    title: "Historical production reference is complete",
    description: "The reference series includes monthly gross oil and produced water from February 2008 through September 2016.",
    type: "insight", module: "data quality", entity: "Volve monthly production",
    metric: ["Months available", 104], confidence: 0.99, priority: 0.1, severity: "info",
    action: "Use this historical series for reference only, not as current operational data."
  }
];

// Keep fixtures in the existing signal shape so the presentation can accept API data later.
export const mockSignals: ApiSignal[] = samples.map((sample, index) => ({
  id: `demo-signal-${index + 1}`,
  code: `DEMO-${String(index + 1).padStart(3, "0")}`,
  title: sample.title,
  description: sample.description,
  reason_nexa: `Illustrative signal based on historical Volve reference data. ${sample.description}`,
  suggested_action: sample.action,
  type: sample.type,
  status: index === 9 ? "actioned" : "open",
  module_name: sample.module,
  confidence: sample.confidence,
  metrics: {
    primary: {
      label: sample.metric[0], value: sample.metric[1],
      unit: sample.metric[2], primary: true
    }
  },
  metadata: {
    detector: index === 6 ? "production_yoy_decline" : index === 7 ? "reserves_rp_low" : `demo_${sample.module.replaceAll(" ", "_")}`,
    entity: {
      kind: sample.entity.includes("monthly") ? "dataset" : sample.entity === "Volve" ? "field" : "wellbore",
      name: sample.entity
    },
    severity: sample.severity ?? "watch",
    priority_score: sample.priority,
    value_tags: sample.valueTags ?? [],
    is_illustrative: true,
    source: "Local UI demo",
    model_version: "demo",
    evidence: [{ collection: "historical_volve_reference", period: "2008-02 to 2016-09", count: 104 }]
  },
  flags: [{ id: sample.severity ?? "watch", name: sample.severity ?? "watch" }],
  created_at: "2026-11-03T08:00:00.000Z",
  created_by: "UI demo",
  updated_at: "2026-11-03T08:00:00.000Z",
  updated_by: "UI demo",
  tenant_id: "demo"
}));
