/**
 * Mock dataset for the Token Usage module.
 *
 * The backend does not expose token-usage endpoints yet. `hooks/useTokenUsage.ts`
 * reads from this file so the UI is fully functional today; swapping to the real
 * API only requires replacing the fetchers in that hook file.
 */

import type {
  TokenConsumptionSeries,
  TokenMonitoring,
  TokenUsageHistory,
  TokenUsageLogEntry,
  TokenUsageOverview,
  TokenTenantUser,
} from "../types";

/**
 * Reference "now", captured once at module load so timestamps stay stable
 * across renders while remaining plausible whatever the current date is.
 */
const MOCK_NOW = new Date();

/** An ISO timestamp `minutes` in the past, relative to MOCK_NOW. */
function minutesAgo(minutes: number): string {
  return new Date(MOCK_NOW.getTime() - minutes * 60_000).toISOString();
}

/** An ISO date (YYYY-MM-DD) `days` from MOCK_NOW — negative values are past. */
function daysFromNow(days: number): string {
  return new Date(MOCK_NOW.getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Consumption series
// ---------------------------------------------------------------------------

/** Daily tokens for Sep 1-31, averaging ~610/day (matches the design). */
const DAILY_TOKENS = [
  262, 865, 404, 793, 571, 714, 666, 571, 714, 404, 714, 270, 714, 301, 888,
  658, 714, 468, 714, 801, 230, 714, 555, 714, 857, 428, 714, 555, 857, 428,
  714,
];

function toSeries(
  granularity: TokenConsumptionSeries["granularity"],
  points: { label: string; tokens: number }[],
): TokenConsumptionSeries {
  const total = points.reduce((sum, point) => sum + point.tokens, 0);
  return {
    granularity,
    points,
    average: points.length ? Math.round(total / points.length) : 0,
  };
}

export const dailyConsumption: TokenConsumptionSeries = toSeries(
  "daily",
  DAILY_TOKENS.map((tokens, index) => ({
    label: String(index + 1),
    tokens,
  })),
);

/** Weekly buckets — the daily series collapsed into 7-day chunks. */
export const weeklyConsumption: TokenConsumptionSeries = toSeries(
  "weekly",
  Array.from({ length: Math.ceil(DAILY_TOKENS.length / 7) }, (_, week) => ({
    label: `W${week + 1}`,
    tokens: DAILY_TOKENS.slice(week * 7, week * 7 + 7).reduce(
      (sum, tokens) => sum + tokens,
      0,
    ),
  })),
);

/** Monthly buckets for the trailing 12 months. */
export const monthlyConsumption: TokenConsumptionSeries = toSeries(
  "monthly",
  [
    { label: "Oct", tokens: 12_400 },
    { label: "Nov", tokens: 14_100 },
    { label: "Dec", tokens: 9_800 },
    { label: "Jan", tokens: 15_600 },
    { label: "Feb", tokens: 13_200 },
    { label: "Mar", tokens: 17_400 },
    { label: "Apr", tokens: 16_050 },
    { label: "May", tokens: 18_900 },
    { label: "Jun", tokens: 15_750 },
    { label: "Jul", tokens: 19_400 },
    { label: "Aug", tokens: 17_800 },
    { label: "Sep", tokens: 18_750 },
  ],
);

/** Tenant-wide consumption is roughly 10x a single user's. */
export const tenantConsumption: TokenConsumptionSeries = toSeries(
  "daily",
  DAILY_TOKENS.map((tokens, index) => ({
    label: String(index + 1),
    tokens: tokens * 10,
  })),
);

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export const overview: TokenUsageOverview = {
  usedToday: 24,
  requestsToday: 4,
  usedTodayTrendPercent: 12,
  activeModulesCount: 3,
  activeModules: ["Capacity Analytic", "Inspection", "NCR"],
  warningThresholdPercent: 20,
  quotaResetsInDays: 30,
  quotaResetsAt: daysFromNow(30),
  estimatedRequestsLeft: 6,
  estimatedDaysLeft: 3,
  balance: {
    remaining: 1_250,
    quota: 20_000,
    used: 18_750,
    remainingPercent: 6.25,
    periodStart: daysFromNow(-19),
    periodEnd: daysFromNow(0),
    projectedRunOutAt: daysFromNow(2),
    dailyAverage: 610,
    peakDayTokens: 888,
  },
  moduleUsage: [
    { module: "Capacity Analytic", tokens: 7_120, percent: 38 },
    { module: "Inspection", tokens: 4_875, percent: 26 },
    { module: "NCR", tokens: 3_375, percent: 18 },
    { module: "Daily Diaries", tokens: 2_250, percent: 12 },
    { module: "Labour Rostering", tokens: 1_130, percent: 6 },
  ],
  consumption: dailyConsumption,
};

// ---------------------------------------------------------------------------
// Usage history
// ---------------------------------------------------------------------------

const LOG_SEEDS: Omit<TokenUsageLogEntry, "id" | "requestId">[] = [
  {
    occurredAt: minutesAgo(38),
    module: "Capacity Analytic",
    feature: "Bottleneck analysis",
    tokens: 180,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(72),
    module: "Inspection",
    feature: "Defect summary",
    tokens: 240,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(235),
    module: "Capacity Analytic",
    feature: "Contingency suggestion",
    tokens: 120,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(1350),
    module: "Capacity Analytic",
    feature: "Bottleneck analysis",
    tokens: 310,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(1428),
    module: "Inspection",
    feature: "Defect summary",
    tokens: null,
    status: "rejected",
    statusCode: "402",
  },
  {
    occurredAt: minutesAgo(1759),
    module: "Capacity Analytic",
    feature: "Contingency suggestion",
    tokens: 95,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(2734),
    module: "NCR",
    feature: "Root cause draft",
    tokens: 240,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(2937),
    module: "Capacity Analytic",
    feature: "Bottleneck analysis",
    tokens: 180,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(3123),
    module: "Daily Diaries",
    feature: "Activity summary",
    tokens: 180,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(4181),
    module: "Inspection",
    feature: "Defect summary",
    tokens: 240,
    status: "completed",
  },
  {
    occurredAt: minutesAgo(4396),
    module: "NCR",
    feature: "Corrective action draft",
    tokens: null,
    status: "failed",
  },
  {
    occurredAt: minutesAgo(4649),
    module: "Labour Rostering",
    feature: "Shift optimisation",
    tokens: 130,
    status: "completed",
  },
];

export const usageHistory: TokenUsageHistory = {
  consumption: monthlyConsumption,
  entries: LOG_SEEDS.map((entry, index) => ({
    id: `log-${index + 1}`,
    requestId: `mock-request-${index + 1}`,
    ...entry,
  })),
};

// ---------------------------------------------------------------------------
// Monitoring (tenant admin)
// ---------------------------------------------------------------------------

const WARNING_THRESHOLD_PERCENT = 20;

const USER_SEEDS: {
  name: string;
  email: string;
  used: number;
  lastUsedAt: string;
}[] = [
    {
      name: "Maria Gunawan",
      email: "maria.g@senecode.io",
      used: 20_000,
      lastUsedAt: minutesAgo(17),
    },
    {
      name: "Alexander Verhoeven",
      email: "alex.v@senecode.io",
      used: 18_400,
      lastUsedAt: minutesAgo(17),
    },
    {
      name: "Rani Kusuma",
      email: "rani.k@senecode.io",
      used: 10_000,
      lastUsedAt: minutesAgo(16),
    },
    {
      name: "David Lim",
      email: "david.l@senecode.io",
      used: 8_400,
      lastUsedAt: minutesAgo(15),
    },
    {
      name: "Sophia Pranata",
      email: "sophia.p@senecode.io",
      used: 4_200,
      lastUsedAt: minutesAgo(14),
    },
    {
      name: "John Damaris",
      email: "john.d@senecode.io",
      used: 1_250,
      lastUsedAt: minutesAgo(13),
    },
    {
      name: "Bagas Setiawan",
      email: "bagas.s@senecode.io",
      used: 900,
      lastUsedAt: minutesAgo(12),
    },
    {
      name: "Nadia Rahman",
      email: "nadia.r@senecode.io",
      used: 5_000,
      lastUsedAt: minutesAgo(11),
    },
    {
      name: "Kevin Tanaka",
      email: "kevin.t@senecode.io",
      used: 17_400,
      lastUsedAt: minutesAgo(10),
    },
    {
      name: "Priya Sharma",
      email: "priya.s@senecode.io",
      used: 240,
      lastUsedAt: minutesAgo(98),
    },
    {
      name: "Arif Wibowo",
      email: "arif.w@senecode.io",
      used: 6_100,
      lastUsedAt: minutesAgo(175),
    },
    {
      name: "Elena Novak",
      email: "elena.n@senecode.io",
      used: 16_900,
      lastUsedAt: minutesAgo(1220),
    },
  ];

const TOTAL_USED = USER_SEEDS.reduce((sum, seed) => sum + seed.used, 0);

export const tenantUsers: TokenTenantUser[] = USER_SEEDS.map((seed, index) => ({
  id: `user-${index + 1}`,
  name: seed.name,
  email: seed.email,
  used_tokens: seed.used,
  filteredTokens: seed.used,
  reservedTokens: 0,
  percentageOfTenantUsage: TOTAL_USED
    ? Math.round((seed.used / TOTAL_USED) * 1000) / 10
    : 0,
  currentMember: true,
  lastUsedAt: seed.lastUsedAt,
}));

export const monitoring: TokenMonitoring = {
  tenantQuota: 240_000,
  activeUsers: 42,
  usedThisMonth: 181_400,
  usedPercent: 75.6,
  usersRunningLow: 3,
  usersBlocked: 2,
  warningThresholdPercent: WARNING_THRESHOLD_PERCENT,
  defaultUserQuota: 20_000,
  consumption: tenantConsumption,
  users: tenantUsers,
};
