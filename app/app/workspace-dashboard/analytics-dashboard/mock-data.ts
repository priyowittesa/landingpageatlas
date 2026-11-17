// AI insights for the ATLAS analytics dashboard.
// All values mirror the Figma design (node 2044:2619).

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type InsightCategory = "ANOMALY" | "PREDICTION" | "RECOMMENDATION";
export type InsightSeverity = "High" | "Medium" | "Low";

export type Insight = {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  source: string;
  actions: string[];
};

export type KpiCard = {
  id: string;
  label: string;
  value: string;
};

// ---------------------------------------------------------------------------
// AI insights
// ---------------------------------------------------------------------------

/** AI insights for the "Daily Diaries" tab. */
export const dailyDiariesInsights: Insight[] = [
  {
    id: "qi1",
    category: "ANOMALY",
    severity: "High",
    title: "Missing Diary Submissions Detected",
    description:
      "7 daily diaries from last week remain unsubmitted across 3 active projects. Northline Rail and Harbour Terminal have the most gaps.",
    source: "Based on submission records · All Projects · Last 7 days",
    actions: ["View Missing", "Follow Up"],
  },
  {
    id: "qi2",
    category: "PREDICTION",
    severity: "Medium",
    title: "Abnormal Man-Hours on Kestral Solar",
    description:
      "Reported man-hours are 38% above baseline for current project phase. Potential over-reporting or scope creep detected in electrical works.",
    source: "Based on diary entries · Kestral Solar Farm · Last 14 days",
    actions: ["Review Hours", "Snooze"],
  },
  {
    id: "qi3",
    category: "RECOMMENDATION",
    severity: "Low",
    title: "Weather Impact on Productivity Trend",
    description:
      "Sites reporting rain delays show 22% lower productivity. Consider adjusting schedules for Depot 12 Retrofit during forecasted wet period.",
    source: "Based on weather + diary data · All Sites · Last 30 days",
    actions: ["View Details", "Dismiss"],
  },
];

/** AI insights for the "Labour Rostering" tab. */
export const labourRosteringInsights: Insight[] = [
  {
    id: "wi1",
    category: "RECOMMENDATION",
    severity: "High",
    title: "Understaffed Night Shifts Next Week",
    description:
      "3 night shifts between Mon-Wed have only 60% of required coverage. Consider reassigning 4 workers from overstaffed day shifts.",
    source: "Based on roster data · Night Shift Pool · Last 30 days",
    actions: ["View Roster", "Dismiss"],
  },
  {
    id: "wi2",
    category: "PREDICTION",
    severity: "Medium",
    title: "Overtime Risk for 6 Employees",
    description:
      "Current allocation patterns suggest A. Okafor, M. Devlin, and 4 others will exceed 45h this week, triggering overtime rates.",
    source: "Based on shift history · Employee Hours · Last 7 days",
    actions: ["Review Allocations", "Snooze"],
  },
  {
    id: "wi3",
    category: "ANOMALY",
    severity: "Low",
    title: "Skill Mismatch on Kestral Solar Farm",
    description:
      "2 workers assigned to electrical tasks lack the required certification. Swap with qualified personnel from Depot 12 Retrofit.",
    source: "Based on certifications · Skill Matrix · Current roster",
    actions: ["Follow Up", "Accept"],
  },
];
