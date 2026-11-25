import { buildAllAnswers } from "../ask-atlas/answers";
import { addDays } from "../selectors";
import type { EpiAction } from "../store/actions-store";
import type { EpiDemoData } from "../types";

export type AuditCategory = "AI answer" | "Alert" | "Approval" | "Change";
export type AuditActorKind = "AI" | "Agent" | "Person" | "System";

/** One line of the audit log (NF-03): who did what, and when. */
export type AuditEvent = {
  id: string;
  /** ISO date; null for something done in this browser session */
  when: string | null;
  who: string;
  actorKind: AuditActorKind;
  category: AuditCategory;
  what: string;
  projectId: string | null;
  detail: string | null;
  href: string | null;
};

/** Signatures older than this, before the as-at date, are left out of the seeded log. */
export const APPROVAL_WINDOW_DAYS = 30;

/**
 * The audit log seeded from the demo data: progress intake, alerts raised by the
 * agents, Nexa answers and refusals, and BA signatures of the last 30 days. Newest first.
 */
export function getAuditEvents(data: EpiDemoData, seeds: EpiAction[]): AuditEvent[] {
  const events: AuditEvent[] = [];

  const latestWeek = new Map<string, { weekNo: number; weekEnd: string }>();
  for (const row of data.progressWeekly) {
    if (row.component !== "TOTAL" || row.actualCumulative === null || row.weekEnd > data.asAt) continue;
    const current = latestWeek.get(row.projectId);
    if (!current || row.weekNo > current.weekNo) latestWeek.set(row.projectId, { weekNo: row.weekNo, weekEnd: row.weekEnd });
  }
  for (const [projectId, week] of latestWeek) {
    if (week.weekEnd < addDays(data.asAt, -7)) continue;
    events.push({
      id: `intake-${projectId}`,
      when: data.asAt,
      who: "Data intake (E0)",
      actorKind: "System",
      category: "Change",
      what: `Weekly progress to week ${week.weekNo} imported`,
      projectId,
      detail: data.source,
      href: `/ptepi/project/${projectId}`
    });
  }

  for (const action of seeds) {
    events.push({
      id: `alert-${action.id}`,
      when: data.asAt,
      who: "Orchestration agent",
      actorKind: "Agent",
      category: "Alert",
      what: `Raised ${action.id}: ${action.title}`,
      projectId: action.projectId,
      detail: `Owner ${action.ownerRole}, due ${action.dueDate}, autonomy ${action.autonomy}`,
      href: "/ptepi/actions"
    });
  }

  for (const answer of Object.values(buildAllAnswers(data))) {
    events.push({
      id: `nexa-${answer.questionId}`,
      when: answer.refreshedAt,
      who: "Nexa (AI)",
      actorKind: "AI",
      category: "AI answer",
      what: answer.refused ? `Declined, evidence missing: ${answer.question}` : `Answered: ${answer.question}`,
      projectId: null,
      detail: answer.refused
        ? answer.conclusion
        : `${answer.sources.length} sources cited${answer.report ? `; draft ${answer.report.status.toLowerCase()}` : ""}`,
      href: "/ptepi/ask-atlas"
    });
  }

  const from = addDays(data.asAt, -APPROVAL_WINDOW_DAYS);
  for (const ba of data.baRegister) {
    if (ba.status !== "Signed" || !ba.documentDate || ba.documentDate < from || ba.documentDate > data.asAt) continue;
    events.push({
      id: `approval-${ba.baId}`,
      when: ba.documentDate,
      who: ba.signatoryName ?? ba.customerSignatoryRole ?? "Customer",
      actorKind: "Person",
      category: "Approval",
      what: `Signed ${ba.documentType}${ba.component ? ` (${ba.component})` : ""}`,
      projectId: ba.projectId,
      detail: ba.documentNo,
      href: `/ptepi/project/${ba.projectId}/evidence`
    });
  }

  return events.sort((a, b) => (b.when ?? "").localeCompare(a.when ?? "") || a.id.localeCompare(b.id));
}

/**
 * What changed in this browser session, against the seeded actions: actions created
 * here and status or owner changes. These carry no date, they read "This session".
 */
export function getSessionEvents(seeds: EpiAction[], actions: EpiAction[], actor: string): AuditEvent[] {
  const seeded = new Map(seeds.map((action) => [action.id, action]));
  const events: AuditEvent[] = [];
  for (const action of actions) {
    const seed = seeded.get(action.id);
    if (!seed) {
      events.push({
        id: `session-created-${action.id}`,
        when: null,
        who: actor,
        actorKind: "Person",
        category: "Change",
        what: `Created ${action.id}: ${action.title}`,
        projectId: action.projectId,
        detail: action.source,
        href: "/ptepi/actions"
      });
    }
    if (seed && seed.status !== action.status) {
      events.push({
        id: `session-status-${action.id}`,
        when: null,
        who: actor,
        actorKind: "Person",
        category: action.status === "done" ? "Approval" : "Change",
        what: `Set ${action.id} to ${action.status === "in-progress" ? "in progress" : action.status}`,
        projectId: action.projectId,
        detail: action.title,
        href: "/ptepi/actions"
      });
    }
    if (seed && seed.ownerRole !== action.ownerRole) {
      events.push({
        id: `session-owner-${action.id}`,
        when: null,
        who: actor,
        actorKind: "Person",
        category: "Change",
        what: `Reassigned ${action.id} to ${action.ownerRole}`,
        projectId: action.projectId,
        detail: action.title,
        href: "/ptepi/actions"
      });
    }
  }
  return events;
}
