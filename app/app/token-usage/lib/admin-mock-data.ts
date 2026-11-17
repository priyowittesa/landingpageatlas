/**
 * Mock dataset for the Token Usage admin pages (Clients, Client Detail,
 * Audit Trail). The backend does not expose these endpoints yet, so the
 * hooks read from this file. Swapping to the real API only requires
 * replacing the fetchers in `hooks/useAdminTokenPolicy.ts`.
 */

import type {
  TokenAuditEntry,
  TokenAuditTrail,
  TokenClient,
  TokenClientDetail,
  TokenClientsList,
  TokenPolicyValues,
} from "../types/admin";

const MOCK_NOW = new Date();

/** An ISO timestamp `minutes` in the past. */
function minutesAgo(minutes: number): string {
  return new Date(MOCK_NOW.getTime() - minutes * 60_000).toISOString();
}

/** An ISO timestamp `days` in the past. */
function daysAgo(days: number): string {
  return new Date(MOCK_NOW.getTime() - days * 86_400_000).toISOString();
}

/** An ISO date `days` from now (negative = past). */
function daysFromNow(days: number): string {
  return new Date(MOCK_NOW.getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Default policy (shared baseline)
// ---------------------------------------------------------------------------

export const defaultPolicy: TokenPolicyValues = {
  allowance: 20_000,
  resetPeriod: "monthly",
};

// ---------------------------------------------------------------------------
// Clients list
// ---------------------------------------------------------------------------

const CLIENT_SEEDS: {
  name: string;
  email: string;
  policySource: "default" | "override";
  hasScheduledChange: boolean;
  scheduledEffectiveAt?: string;
  quota: number;
  used: number;
  resetPeriodLabel: string;
  nextResetLabel: string;
  plan: string;
  userCount: number;
  lastUsedAt: string;
}[] = [
    {
      name: "Altimeda Manufacturing",
      email: "contact@altimeda.com",
      policySource: "override",
      hasScheduledChange: false,
      quota: 180_000,
      used: 64_200,
      resetPeriodLabel: "Quarterly - day 1",
      nextResetLabel: "Quarterly - day 1",
      plan: "Enterprise",
      userCount: 28,
      lastUsedAt: minutesAgo(17),
    },
    {
      name: "Cendana Group",
      email: "contact@cendanagroup.id",
      policySource: "default",
      hasScheduledChange: false,
      quota: 50_000,
      used: 1_750,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Starter",
      userCount: 9,
      lastUsedAt: minutesAgo(42),
    },
    {
      name: "Meridian Foods",
      email: "admin@meridianfoods.com",
      policySource: "override",
      hasScheduledChange: true,
      scheduledEffectiveAt: daysFromNow(5),
      quota: 50_000,
      used: 9_400,
      resetPeriodLabel: "Weekly - day 1",
      nextResetLabel: "Weekly - day 1",
      plan: "Starter",
      userCount: 7,
      lastUsedAt: minutesAgo(95),
    },
    {
      name: "Nusantara Logistics",
      email: "ops@nusantaralogistics.co.id",
      policySource: "default",
      hasScheduledChange: false,
      quota: 50_000,
      used: 22_600,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Pro",
      userCount: 19,
      lastUsedAt: minutesAgo(180),
    },
    {
      name: "Quantum Rotor Industries",
      email: "procurement@quantumrotor.com",
      policySource: "override",
      hasScheduledChange: false,
      quota: 75_000,
      used: 18_300,
      resetPeriodLabel: "Weekly - day 1",
      nextResetLabel: "Weekly - day 1",
      plan: "Pro",
      userCount: 12,
      lastUsedAt: minutesAgo(12),
    },
    {
      name: "Senecode Corp.",
      email: "ops@senecode.io",
      policySource: "override",
      hasScheduledChange: false,
      quota: 240_000,
      used: 181_400,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Enterprise",
      userCount: 42,
      lastUsedAt: minutesAgo(320),
    },
    {
      name: "Titan Motors",
      email: "admin@titanmotors.com",
      policySource: "override",
      hasScheduledChange: true,
      scheduledEffectiveAt: daysFromNow(22),
      quota: 50_000,
      used: 41_800,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Pro",
      userCount: 16,
      lastUsedAt: minutesAgo(55),
    },
    {
      name: "Vertex Aerospace",
      email: "info@vertexaerospace.co.id",
      policySource: "default",
      hasScheduledChange: false,
      quota: 50_000,
      used: 12_100,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Starter",
      userCount: 5,
      lastUsedAt: minutesAgo(210),
    },
    {
      name: "Meridian Foods",
      email: "ops@meridianfoods2.com",
      policySource: "override",
      hasScheduledChange: false,
      quota: 50_000,
      used: 1_750,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Enterprise",
      userCount: 28,
      lastUsedAt: minutesAgo(480),
    },
    {
      name: "Cendana Group",
      email: "it@cendanagroup2.id",
      policySource: "override",
      hasScheduledChange: false,
      quota: 50_000,
      used: 0,
      resetPeriodLabel: "Monthly - day 1",
      nextResetLabel: "Monthly - day 1",
      plan: "Enterprise",
      userCount: 28,
      lastUsedAt: minutesAgo(8),
    },
  ];

export const mockClients: TokenClient[] = CLIENT_SEEDS.map((seed, index) => {
  const remaining = Math.max(0, seed.quota - seed.used);
  const remainingPercent = seed.quota ? (remaining / seed.quota) * 100 : 0;
  const status: TokenClient["status"] = seed.hasScheduledChange
    ? "Schedule"
    : seed.policySource === "override"
      ? "Custom"
      : "Default";
  return {
    id: `client-${index + 1}`,
    name: seed.name,
    email: seed.email,
    policySource: seed.policySource,
    status,
    hasScheduledChange: seed.hasScheduledChange,
    scheduledEffectiveAt: seed.scheduledEffectiveAt,
    quota: seed.quota,
    used: seed.used,
    remaining,
    remainingPercent,
    resetPeriodLabel: seed.resetPeriodLabel,
    nextResetLabel: seed.nextResetLabel,
    plan: seed.plan,
    userCount: seed.userCount,
    lastUsedAt: seed.lastUsedAt,
  };
});

export const mockClientsList: TokenClientsList = {
  clients: mockClients,
  total: mockClients.length,
  defaultCount: mockClients.filter((c) => c.policySource === "default").length,
  customCount: mockClients.filter((c) => c.policySource === "override").length,
  scheduledCount: mockClients.filter((c) => c.hasScheduledChange).length,
};

// ---------------------------------------------------------------------------
// Client detail
// ---------------------------------------------------------------------------

const overridePolicy: TokenPolicyValues = {
  allowance: 35_000,
  resetPeriod: "weekly",
};

const scheduledPolicyValues: TokenPolicyValues = {
  allowance: 40_000,
  resetPeriod: "monthly",
};

export const mockClientDetails: Record<string, TokenClientDetail> = {
  "client-1": {
    id: "client-1",
    name: "Altimeda Manufacturing",
    email: "contact@altimeda.com",
    policySource: "default",
    defaultPolicy,
    inForcePolicy: defaultPolicy,
    quota: 20_000,
    used: 18_750,
    remaining: 1_250,
    remainingPercent: 6.25,
    periodStart: daysAgo(19),
    periodEnd: daysFromNow(11),
    lastUsedAt: minutesAgo(17),
  },
  "client-2": {
    id: "client-2",
    name: "Senecode Industries",
    email: "ops@senecode.io",
    policySource: "override",
    defaultPolicy,
    inForcePolicy: overridePolicy,
    quota: 35_000,
    used: 12_400,
    remaining: 22_600,
    remainingPercent: 64.6,
    periodStart: daysAgo(3),
    periodEnd: daysFromNow(4),
    lastUsedAt: minutesAgo(42),
  },
  "client-3": {
    id: "client-3",
    name: "Vertex Logistics",
    email: "admin@vertexlog.com",
    policySource: "override",
    defaultPolicy,
    inForcePolicy: overridePolicy,
    scheduledPolicy: {
      values: scheduledPolicyValues,
      effectiveAt: daysFromNow(5),
      status: "pending",
    },
    quota: 15_000,
    used: 9_800,
    remaining: 5_200,
    remainingPercent: 34.7,
    periodStart: daysAgo(10),
    periodEnd: daysFromNow(20),
    lastUsedAt: minutesAgo(95),
  },
  "client-5": {
    id: "client-5",
    name: "Nusantara Steel",
    email: "procurement@nusantarasteel.co.id",
    policySource: "override",
    defaultPolicy,
    inForcePolicy: {
      allowance: 50_000,
      resetPeriod: "monthly",
    },
    quota: 50_000,
    used: 47_300,
    remaining: 2_700,
    remainingPercent: 5.4,
    periodStart: daysAgo(20),
    periodEnd: daysFromNow(10),
    lastUsedAt: minutesAgo(12),
  },
};

/** Build a detail for any client id not explicitly seeded above. */
export function getMockClientDetail(clientId: string): TokenClientDetail {
  if (mockClientDetails[clientId]) return mockClientDetails[clientId];
  const client = mockClients.find((c) => c.id === clientId);
  if (!client) return mockClientDetails["client-1"];

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    policySource: client.policySource,
    defaultPolicy,
    inForcePolicy:
      client.policySource === "override"
        ? {
          allowance: client.quota,
          resetPeriod: "monthly",
        }
        : defaultPolicy,
    scheduledPolicy: client.hasScheduledChange
      ? {
        values: scheduledPolicyValues,
        effectiveAt: client.scheduledEffectiveAt ?? daysFromNow(7),
        status: "pending",
      }
      : undefined,
    quota: client.quota,
    used: client.used,
    remaining: client.remaining,
    remainingPercent: client.remainingPercent,
    periodStart: daysAgo(15),
    periodEnd: daysFromNow(15),
    lastUsedAt: client.lastUsedAt,
  };
}

// ---------------------------------------------------------------------------
// Admin overview — scheduled changes + latest policy changes
// ---------------------------------------------------------------------------

export interface ScheduledChangeEntry {
  id: string;
  countdown: number;
  countdownUnit: string;
  clientName: string;
  effectiveAt: string;
  scheduledBy: string;
  quotaOld: string;
  quotaNew: string;
  resetOld: string;
  resetNew: string;
}

export const mockScheduledChanges: ScheduledChangeEntry[] = [
  {
    id: "sch-1",
    countdown: 22,
    countdownUnit: "Days",
    clientName: "Titan Motors",
    effectiveAt: new Date(Date.now() + 22 * 86_400_000).toISOString(),
    scheduledBy: "Nadia P.",
    quotaOld: "50,000",
    quotaNew: "50,000",
    resetOld: "Montly - day 1",
    resetNew: "Monthly day 15",
  },
  {
    id: "sch-2",
    countdown: 6,
    countdownUnit: "Days",
    clientName: "Meridian Foods",
    effectiveAt: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    scheduledBy: "Toto Hytamd",
    quotaOld: "50,000",
    quotaNew: "50,000",
    resetOld: "Montly - day 1",
    resetNew: "Monthly day 15",
  },
  {
    id: "sch-3",
    countdown: 4,
    countdownUnit: "Days",
    clientName: "Meridian Foods",
    effectiveAt: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    scheduledBy: "Toto Hytamd",
    quotaOld: "50,000",
    quotaNew: "50,000",
    resetOld: "Montly - day 1",
    resetNew: "Monthly day 15",
  },
  {
    id: "sch-4",
    countdown: 3,
    countdownUnit: "Days",
    clientName: "Meridian Foods",
    effectiveAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    scheduledBy: "Toto Hytamd",
    quotaOld: "50,000",
    quotaNew: "50,000",
    resetOld: "Montly - day 1",
    resetNew: "Monthly day 15",
  },
];

/** An entry in the "Resently applied" list on the Upcoming changes page. */
export interface RecentlyAppliedEntry {
  id: string;
  clientName: string;
  appliedAt: string;
  /** Field-level changes that took effect. */
  changes: {
    field: string;
    old: string;
    new: string;
  }[];
}

export const mockRecentlyApplied: RecentlyAppliedEntry[] = [
  {
    id: "ra-1",
    clientName: "Quantum Rotor Industries",
    appliedAt: daysAgo(0),
    changes: [
      { field: "Quota", old: "50,000", new: "50,000" },
      { field: "Reset", old: "Monthly", new: "Weekly" },
    ],
  },
  {
    id: "ra-2",
    clientName: "Altimeda Manufacturing",
    appliedAt: daysAgo(0),
    changes: [
      { field: "Reset", old: "Monthly", new: "Quarterly" },
      { field: "carry over", old: "", new: "enabled" },
    ],
  },
  {
    id: "ra-3",
    clientName: "Quantum Rotor Industries",
    appliedAt: daysAgo(0),
    changes: [
      { field: "Quota", old: "50,000", new: "50,000" },
    ],
  },
];

export interface LatestPolicyChangeEntry {
  id: string;
  clientName: string;
  action: "Schedule" | "Update" | "Apply" | "Revert" | "Create";
  occurredAt: string;
  fieldName: string;
  old: string;
  new: string;
}

export const mockLatestPolicyChanges: LatestPolicyChangeEntry[] = [
  {
    id: "lpc-1",
    clientName: "Titan Motors",
    action: "Schedule",
    occurredAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    fieldName: "quota_amount",
    old: "50,000",
    new: "50,000",
  },
  {
    id: "lpc-2",
    clientName: "Senecode Corp.",
    action: "Update",
    occurredAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    fieldName: "quota_amount",
    old: "50,000",
    new: "50,000",
  },
  {
    id: "lpc-3",
    clientName: "Meridian Foods",
    action: "Apply",
    occurredAt: new Date(Date.now() - 120 * 60_000).toISOString(),
    fieldName: "quota_amount",
    old: "50,000",
    new: "50,000",
  },
];

// ---------------------------------------------------------------------------
// Audit Trail
// ---------------------------------------------------------------------------

/** Admins that appear in the "All admins" filter. */
export const mockAuditAdmins = ["Nadia Putri", "Toto Hytamd"];

const AUDIT_SEEDS: Omit<TokenAuditEntry, "id">[] = [
  {
    occurredAt: minutesAgo(8),
    adminName: "Nadia Putri",
    adminEmail: "nadia.putri@altimeda.com",
    clientId: "client-3",
    tenantName: "Titan Motors",
    action: "schedule",
    summary: "Scheduled a quota increase",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_period", old: "monthly", new: "weekly" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: true,
  },
  {
    occurredAt: minutesAgo(45),
    adminName: "Toto Hytamd",
    adminEmail: "toto.hytamd@altimeda.com",
    clientId: "client-2",
    tenantName: "Senecode Corp.",
    action: "update",
    summary: "Updated the override policy",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_day", old: "1", new: "15" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: true,
  },
  {
    occurredAt: minutesAgo(120),
    adminName: "Nadia Putri",
    adminEmail: "nadia.putri@altimeda.com",
    clientId: "client-5",
    tenantName: "Quantum Rotor Industries",
    action: "apply",
    summary: "Applied a bulk quota change",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_period", old: "monthly", new: "monthly" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: minutesAgo(240),
    adminName: "Toto Hytamd",
    adminEmail: "toto.hytamd@altimeda.com",
    clientId: "client-9",
    tenantName: "Vertex Aerospace",
    action: "revert",
    summary: "Reverted the client to the default policy",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_period", old: "weekly", new: "monthly" },
      { field: "policy_source", old: "custom", new: "default" },
    ],
    undoAvailable: true,
  },
  {
    occurredAt: minutesAgo(360),
    adminName: "Nadia Putri",
    adminEmail: "nadia.putri@altimeda.com",
    tenantName: "Default policy",
    action: "update",
    summary: "Updated the tenant-wide default policy",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_day", old: "0", new: "1" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: true,
  },
  {
    occurredAt: minutesAgo(720),
    adminName: "Toto Hytamd",
    adminEmail: "toto.hytamd@altimeda.com",
    clientId: "client-11",
    tenantName: "Cendana Group",
    action: "create",
    summary: "Created a new policy override",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_period", old: "monthly", new: "weekly" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: daysAgo(1),
    adminName: "Nadia Putri",
    adminEmail: "nadia.putri@altimeda.com",
    clientId: "client-3",
    tenantName: "Titan Motors",
    action: "schedule",
    summary: "Scheduled a quota change for next cycle",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_day", old: "1", new: "10" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: daysAgo(2),
    adminName: "Toto Hytamd",
    adminEmail: "toto.hytamd@altimeda.com",
    clientId: "client-2",
    tenantName: "Senecode Corp.",
    action: "update",
    summary: "Updated the override allowance",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_period", old: "weekly", new: "monthly" },
      { field: "carry_over", old: "enabled", new: "disabled" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: daysAgo(3),
    adminName: "Nadia Putri",
    adminEmail: "nadia.putri@altimeda.com",
    clientId: "client-5",
    tenantName: "Quantum Rotor Industries",
    action: "apply",
    summary: "Applied the pending scheduled change",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_day", old: "15", new: "1" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: daysAgo(5),
    adminName: "Toto Hytamd",
    adminEmail: "toto.hytamd@altimeda.com",
    clientId: "client-9",
    tenantName: "Vertex Aerospace",
    action: "revert",
    summary: "Reverted to the default policy",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_period", old: "weekly", new: "monthly" },
      { field: "policy_source", old: "custom", new: "default" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: daysAgo(7),
    adminName: "Nadia Putri",
    adminEmail: "nadia.putri@altimeda.com",
    clientId: "client-12",
    tenantName: "Triputra Group",
    action: "create",
    summary: "Created an override for the new tenant",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_day", old: "0", new: "1" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: false,
  },
  {
    occurredAt: daysAgo(10),
    adminName: "Toto Hytamd",
    adminEmail: "toto.hytamd@altimeda.com",
    tenantName: "Default policy",
    action: "update",
    summary: "Updated the default reset day",
    diff: [
      { field: "quota_amount", old: "50.000", new: "90.000" },
      { field: "reset_day", old: "0", new: "1" },
      { field: "carry_over", old: "disabled", new: "enabled" },
    ],
    undoAvailable: false,
  },
];

export const mockAuditTrail: TokenAuditTrail = {
  entries: AUDIT_SEEDS.map((entry, index) => ({
    id: `audit-${index + 1}`,
    ...entry,
  })),
  total: AUDIT_SEEDS.length,
};
