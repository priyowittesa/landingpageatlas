export type Formula = {
  id: string;
  category: string;
  title: string;
  template: string;
  icon: string;
  openSignals?: number;
  version?: string;
  enabled?: boolean;
  condition: string;
  data: [string, string][];
  parameters: [string, string][];
  calculations: [string, string][];
  note: string;
};

const parameters: [string, string][] = [
  ["threshold", "0.15"], ["min_value", "0.15"], ["risk_multiplier", "2"],
  ["confidence.min_history_periods", "5"], ["confidence.high", "0.9"],
  ["confidence.low", "0.75"], ["priority.decline_weight", "0.5"],
  ["priority.share_weight", "10"], ["priority.share_cap", "0.5"]
];

// Read-only examples from the design, not executable detector configuration.
export const formulas: Formula[] = [
  {
    id: "production_yoy_decline",
    category: "Production Performance",
    title: "Production decline year over year",
    template: "period_decline",
    icon: "production",
    openSignals: 3,
    condition: "A field's net production in the last complete year is at least 15% below the year before. Risk when the drop is 30% or more.",
    data: [
      ["field", "production.net_oe (mill Sm3)"],
      ["from", "table field_production_yearly · column net_oil_equivalents"]
    ],
    parameters,
    calculations: [
      ["Change", "(current - previous) / previous"],
      ["Condition", "change <= -threshold"],
      ["Severity", "risk if -change >= risk_multiplier * threshold, else watch"],
      ["Confidence", "confidence.high if periods of history >= confidence.min_history_periods, else confidence.low"],
      ["Priority", "min(1, -change * priority.decline_weight + min(share * priority.share_weight, priority.share_cap)), share = previous / sum of current over all entities"]
    ],
    note: "Previous production must be at least min_value. The detector evaluates the last complete year against the year before."
  },
  {
    id: "reserves_rp_low",
    category: "Reservoir & Reserves",
    title: "Reserves running out (R/P)",
    template: "ratio_below",
    icon: "reserves",
    openSignals: 2,
    condition: "Remaining reserves divided by last year's production is under 5 years. Risk when under 2.5 years.",
    data: [
      ["numerator", "reserves.remaining_oe (mill Sm3)"],
      ["from", "table field_reserves · column remaining_oil_eq, else expr coalesce(remaining_oil, 0) + coalesce(remaining_gas, 0) + 1.9 * coalesce(remaining_ngl, 0) + coalesce(remaining_cond, 0)"]
    ],
    parameters,
    calculations: [
      ["Ratio", "numerator / denominator"],
      ["Condition", "ratio < threshold"],
      ["Severity", "risk if ratio < threshold / risk_multiplier, else watch"],
      ["Confidence", "confidence.fresh if every snapshot >= the evaluated period, else confidence.stale"],
      ["Priority", "min(1, 1 - ratio / threshold + priority.offset)"]
    ],
    note: "Reference formula only. The denominator uses production from the last complete year; the reserves snapshot must be available for the evaluated field."
  }
];
