"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { CauseConfidence, Criticality, MachineStatus, Priority, ReportState, SparePart } from "../../lib/types";

const axios = axiosConfig(env.apiBaseUrl);
const URL = "/v1/predictive-breakdown/breakdown-reports";
const KEY = ["asset-management", "breakdown-reports"] as const;

export type PriorityFilter = "all" | Priority | "safety";

export interface ScoreComponents {
  criticality: number;
  production: number;
  safety: number;
  history: number;
}

export interface QueueAsset {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string;
  line: string;
  /** From the asset profile, or derived from the criticality score (A 1.0 · B 0.6 · C 0.3). */
  criticality: Criticality | null;
  bottleneck: boolean;
  statutory: boolean;
}

export interface PriorityOverrideEntry {
  id: string;
  from: Priority;
  to: Priority;
  reason: string;
  by: string;
  at: string;
  revertedAt: string;
}

export interface SimilarCaseEntry {
  id: string;
  workOrder: string;
  similarity: number;
  date: string;
  assetCode: string;
  assetName: string;
  code: string;
  action: string;
  hours: number | null;
  technician: string;
  feedback: { verdict: "relevant" | "not_relevant" | null; reason: string | null };
}

export interface TriageDocument {
  id: string;
  code: string;
  type: "SOP" | "Manual";
  title: string;
  pages: string;
  snippet: string;
}

export interface ReportNote {
  id: string;
  text: string;
  by: string;
  byId: string;
  at: string;
  edited: boolean;
}

export interface ReportEvent {
  id: string;
  type: string;
  text: string;
  by: string;
  at: string;
}

export interface Escalation {
  to: string;
  reason: string;
  note: string;
  by: string;
  at: string;
}

export interface Triage {
  status: string;
  errorMessage: string;
  cause: string | null;
  causeConfidence: CauseConfidence | null;
  inferred: boolean;
  evidence: string;
  estimatedHours: number | null;
  latencyMs: number | null;
  fallback: "asset_type" | "no_history" | null;
  history: "repeat" | "above_median" | "normal" | null;
  historyText: string;
  keywordHits: string[];
  reasons: string[];
  steps: { instruction: string; isSafety: boolean }[];
  similarCases: SimilarCaseEntry[];
  spares: SparePart[];
  stockDataAvailable: boolean;
  documents: TriageDocument[];
  configurationId: string;
  profileComputedAt: string;
  profileStale: boolean;
  completedAt: string;
}

/** A breakdown report as the queue shows it; detail-only fields are empty on list rows. */
export interface QueueReport {
  id: string;
  code: string;
  workOrder: string;
  source: string;
  asset: QueueAsset;
  description: string;
  tags: string[];
  machineStatus: MachineStatus;
  safetyFlag: boolean;
  reporter: string;
  reportedAt: string;
  state: ReportState;
  technician: { id: string; name: string };
  scheduledFor: string;
  startedAt: string;
  completedAt: string;
  /** Response deadline from the API; empty when the queue derives it from the active config. */
  responseDueAt: string;
  /** Priority after any supervisor override. */
  priority: Priority;
  systemPriority: Priority;
  score: number | null;
  components: ScoreComponents | null;
  safety: boolean;
  /** P1 forced by a safety signal although the score is below the P1 threshold. */
  safetyOverride: boolean;
  configVersion: number | null;
  override: PriorityOverrideEntry | null;
  cancellation: { reason: string; note: string; duplicateOf: string; by: string; at: string } | null;
  lastEvent: { text: string; at: string } | null;
  triage: Triage | null;
  overrides: PriorityOverrideEntry[];
  escalations: Escalation[];
  notes: ReportNote[];
  events: ReportEvent[];
}

export type QueueFilters = {
  search?: string;
  priority?: Exclude<PriorityFilter, "all">;
  state?: ReportState;
  reported_from?: string;
  page_size: number;
  page_token?: string;
};

export interface QueueSummary {
  counts: Record<Priority | "safety", number>;
  scheduledP3: number | null;
  unscheduledP3: number | null;
  nextP1: QueueReport | null;
  nextP2: QueueReport | null;
  topSafety: QueueReport | null;
}

function object(value: unknown) { return (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>; }
function unwrap(value: unknown) { let current = value; for (let i = 0; i < 3; i += 1) { const row = object(current); if (!("data" in row)) break; current = row.data; } return object(current); }
function text(value: unknown, fallback = "") { if (value && typeof value === "object") { const row = object(value); return String(row.name ?? row.full_name ?? row.code ?? fallback); } return value == null || value === "" ? fallback : String(value); }
function list(value: unknown) { return Array.isArray(value) ? value : []; }
function numberOrNull(value: unknown) { if (value == null || value === "") return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function number(value: unknown, fallback = 0) { return numberOrNull(value) ?? fallback; }
function first(...values: unknown[]) { return values.find((value) => value != null && value !== ""); }

const PRIORITY_VALUES = ["P1", "P2", "P3"] as const;
function priority(value: unknown, fallback: Priority = "P3"): Priority {
  const upper = text(value).toUpperCase();
  return (PRIORITY_VALUES as readonly string[]).includes(upper) ? (upper as Priority) : fallback;
}
const STATES: ReportState[] = ["new", "in_progress", "scheduled", "escalated", "completed", "cancelled"];
const confidence = (value: unknown): CauseConfidence | null => {
  const lower = text(value).toLowerCase();
  return lower === "high" ? "High" : lower === "medium" ? "Medium" : lower === "low" ? "Low" : null;
};
/** Criticality factor back to its class when the API only sends the score. */
const criticalityFromScore = (score: number | null): Criticality | null =>
  score == null ? null : score >= 0.95 ? "A" : score >= 0.5 ? "B" : "C";

export const EVENT_LABELS: Record<string, string> = {
  created: "Report received",
  ingested: "Report received",
  received: "Report received",
  triaged: "Triage completed",
  triage_completed: "Triage completed",
  triage_failed: "Triage failed",
  assigned: "Assigned",
  reassigned: "Reassigned",
  started: "Work started",
  scheduled: "Scheduled",
  schedule_cancelled: "Schedule cancelled",
  priority_overridden: "Priority changed",
  priority_override_reverted: "System priority restored",
  override_reverted: "System priority restored",
  escalated: "Escalated",
  escalation_responded: "Escalation answered",
  note_added: "Note added",
  note_updated: "Note edited",
  note_deleted: "Note deleted",
  cancelled: "Cancelled",
  restored: "Restored",
  completed: "Completed",
  updated: "Report updated",
};
const eventLabel = (type: string) => EVENT_LABELS[type] ?? (type ? type[0].toUpperCase() + type.slice(1).replaceAll("_", " ") : "Activity");

function normalizeOverride(raw: unknown, index = 0): PriorityOverrideEntry {
  const row = object(raw);
  return {
    id: text(row.id, String(index)),
    from: priority(first(row.from_priority, row.previous_priority, row.from)),
    to: priority(first(row.to_priority, row.priority, row.to)),
    reason: text(row.reason),
    by: text(first(row.actor_name, row.created_by_name, row.overridden_by_name, row.actor, row.created_by)),
    at: text(first(row.created_at, row.overridden_at, row.at)),
    revertedAt: text(row.reverted_at),
  };
}

function normalizeEvent(raw: unknown, index = 0): ReportEvent {
  const row = object(raw);
  const type = text(first(row.event_type, row.type, row.event)).toLowerCase();
  const detail = text(first(row.description, row.details, row.detail, row.message, row.note));
  return {
    id: text(row.id, String(index)),
    type,
    text: detail ? `${eventLabel(type)} · ${detail}` : eventLabel(type),
    by: text(first(row.actor_name, row.created_by_name, row.actor, row.by)),
    at: text(first(row.occurred_at, row.created_at, row.at)),
  };
}

function normalizeTriage(raw: unknown): Triage | null {
  const row = object(raw);
  if (!Object.keys(row).length) return null;
  const fallback = text(row.fallback_mode).toLowerCase();
  const history = text(row.history_flag).toLowerCase();
  return {
    status: text(row.status).toLowerCase(),
    errorMessage: text(row.error_message),
    cause: text(row.probable_cause) || null,
    causeConfidence: confidence(row.cause_confidence),
    inferred: Boolean(row.cause_inferred),
    evidence: text(row.cause_evidence),
    estimatedHours: numberOrNull(row.estimated_repair_hours),
    latencyMs: numberOrNull(row.latency_ms),
    fallback: fallback === "asset_type" || fallback === "no_history" ? fallback : null,
    history: history === "repeat" || history === "above_median" || history === "normal" ? history : null,
    historyText: text(row.history_text),
    keywordHits: list(row.matched_safety_keywords).map((keyword) => text(keyword)).filter(Boolean),
    reasons: list(row.reasons).map((reason) => text(reason)).filter(Boolean),
    steps: list(row.steps).map((step) => {
      const value = object(step);
      return { instruction: text(first(value.instruction, value.text, typeof step === "string" ? step : "")), isSafety: Boolean(value.is_safety) };
    }).filter((step) => step.instruction),
    similarCases: list(row.similar_cases).map((item, index) => {
      const value = object(item), feedback = object(first(value.feedback, value.my_feedback));
      const verdict = text(first(feedback.verdict, value.feedback_verdict, value.verdict)).toLowerCase();
      const similarity = number(value.similarity);
      return {
        id: text(value.id, String(index)),
        workOrder: text(value.work_order_code),
        similarity: similarity > 1 ? similarity / 100 : similarity,
        date: text(value.occurred_on),
        assetCode: text(value.asset_code),
        assetName: text(value.asset_name),
        code: text(value.failure_code),
        action: text(value.action_taken),
        hours: numberOrNull(value.repair_hours),
        technician: text(value.technician_name),
        feedback: {
          verdict: verdict === "relevant" || verdict === "not_relevant" ? verdict : null,
          reason: text(first(feedback.reason, value.feedback_reason)) || null,
        },
      };
    }),
    spares: list(row.spare_parts).map((item) => {
      const value = object(item);
      return {
        id: text(value.part_code),
        name: text(value.part_name),
        qty: number(value.quantity_on_hand),
        min: number(value.minimum_quantity),
        leadDays: number(value.lead_time_days),
        location: text(value.location),
      };
    }),
    stockDataAvailable: row.stock_data_available == null ? true : Boolean(row.stock_data_available),
    documents: list(row.documents).map((item, index) => {
      const value = object(item);
      return {
        id: text(value.id, String(index)),
        code: text(value.document_code),
        type: text(value.document_type).toLowerCase() === "manual" ? ("Manual" as const) : ("SOP" as const),
        title: text(first(value.title, value.display_name, value.original_name)),
        pages: text(value.page_reference),
        snippet: text(value.snippet),
      };
    }),
    configurationId: text(row.scoring_configuration_id),
    profileComputedAt: text(row.asset_profile_computed_at),
    profileStale: Boolean(row.asset_profile_stale),
    completedAt: text(first(row.completed_at, row.finished_at, row.started_at)),
  };
}

function normalizeReport(raw: unknown, index = 0): QueueReport {
  const row = object(raw);
  const triageRaw = first(row.latest_triage, row.triage, row.last_triage);
  const triage = normalizeTriage(triageRaw);
  const source = object(triageRaw);
  const asset = object(row.asset);
  const technician = object(first(row.assigned_technician, row.technician));
  const pick = (key: string) => first(row[key], source[key]);
  const components: ScoreComponents | null =
    pick("criticality_score") == null && pick("safety_score") == null
      ? null
      : {
          criticality: number(pick("criticality_score")),
          production: number(pick("production_score")),
          safety: number(pick("safety_score")),
          history: number(pick("history_score")),
        };
  const systemPriority = priority(first(row.system_priority, source.priority, row.priority));
  const overrideRaw = first(row.priority_override, row.active_override, row.override);
  const overrides = list(row.priority_overrides).map(normalizeOverride);
  const activeOverride = overrideRaw
    ? normalizeOverride(overrideRaw)
    : row.is_overridden || row.overridden
      ? overrides.find((entry) => !entry.revertedAt) ?? null
      : null;
  const current = priority(first(row.effective_priority, row.current_priority, row.priority), activeOverride?.to ?? systemPriority);
  const safety = Boolean(first(row.is_safety, row.safety_risk, row.safety)) || (components?.safety ?? 0) >= 1 || Boolean(row.safety_flagged);
  const score = numberOrNull(first(row.score, row.priority_score, row.total_score, source.score, source.total_score));
  const state = text(first(row.state, row.status), "new").toLowerCase() as ReportState;
  const cancellation = object(row.cancellation);
  const cancelReason = text(first(cancellation.reason, row.cancel_reason, row.cancellation_reason));
  const lastEvent = object(first(row.last_event, row.latest_event));
  const events = list(row.events).map(normalizeEvent);
  const latest = Object.keys(lastEvent).length ? normalizeEvent(lastEvent) : events.at(-1);
  const criticalityScore = components ? components.criticality : null;
  const criticality = text(first(asset.criticality, row.asset_criticality)).toUpperCase();
  return {
    id: text(row.id, String(index)),
    code: text(first(row.code, row.report_code), text(row.id)),
    workOrder: text(first(row.work_order_code, row.work_order)),
    source: text(row.source, "manual").toLowerCase(),
    asset: {
      id: text(first(row.asset_id, asset.id)),
      code: text(first(row.asset_code, asset.code)),
      name: text(first(row.asset_name, asset.name)),
      type: text(first(asset.type, asset.asset_type, row.asset_type)),
      location: text(first(asset.location, row.asset_location)),
      line: text(first(asset.line, asset.production_line, row.line, row.production_line)),
      criticality: ["A", "B", "C"].includes(criticality) ? (criticality as Criticality) : criticalityFromScore(criticalityScore),
      bottleneck: Boolean(first(asset.is_bottleneck, asset.bottleneck, row.is_bottleneck)),
      statutory: Boolean(first(asset.is_statutory, asset.statutory, row.is_statutory)),
    },
    description: text(row.description),
    tags: list(row.symptom_tags).map((tag) => text(tag)).filter(Boolean),
    machineStatus: text(row.machine_status).toLowerCase() === "running" ? "running" : "stopped",
    safetyFlag: Boolean(row.safety_flagged),
    reporter: text(first(row.reporter_name, row.reporter)),
    reportedAt: text(first(row.reported_at, row.created_at)),
    state: STATES.includes(state) ? state : "new",
    technician: {
      id: text(first(row.assigned_technician_id, technician.id)),
      name: text(first(row.assigned_technician_name, technician.name), "Unassigned"),
    },
    scheduledFor: text(row.scheduled_for),
    startedAt: text(first(row.started_at, row.responded_at)),
    completedAt: text(row.completed_at),
    responseDueAt: text(first(row.response_due_at, row.response_target_at, row.sla_due_at)),
    priority: current,
    systemPriority,
    score,
    components,
    safety,
    safetyOverride: Boolean(first(row.safety_override, source.safety_override)),
    configVersion: numberOrNull(first(row.scoring_configuration_version, source.scoring_configuration_version, object(source.scoring_configuration).version)),
    override: activeOverride,
    cancellation:
      state === "cancelled" || cancelReason
        ? {
            reason: cancelReason,
            note: text(first(cancellation.note, row.cancel_note, row.cancellation_note)),
            duplicateOf: text(first(cancellation.duplicate_of_report_code, cancellation.duplicate_of_report_id, row.duplicate_of_report_code, row.duplicate_of_report_id)),
            by: text(first(cancellation.actor_name, row.cancelled_by_name, row.cancelled_by)),
            at: text(first(cancellation.created_at, row.cancelled_at)),
          }
        : null,
    lastEvent: latest ? { text: latest.text, at: latest.at } : null,
    triage,
    overrides,
    escalations: list(row.escalations).map((item) => {
      const value = object(item);
      return {
        to: text(value.escalated_to),
        reason: text(value.reason),
        note: text(value.note),
        by: text(first(value.actor_name, value.created_by_name, value.escalated_by_name)),
        at: text(first(value.created_at, value.escalated_at)),
      };
    }),
    notes: list(row.notes).map((item, noteIndex) => {
      const value = object(item);
      return {
        id: text(value.id, String(noteIndex)),
        text: text(first(value.body, value.text)),
        by: text(first(value.author_name, value.created_by_name, value.author)),
        byId: text(first(value.author_id, value.created_by)),
        at: text(value.created_at),
        edited: Boolean(value.updated_at && value.updated_at !== value.created_at),
      };
    }),
    events,
  };
}

/** Normalize count facets returned either as a map or as [{ priority, count }]. */
export function normalizePriorityCounts(value: unknown): Record<PriorityFilter, number> {
  const rows = list(value);
  const row = object(value);
  const facet = (key: string) =>
    rows.find((item) => {
      const entry = object(item);
      return text(first(entry.priority, entry.key, entry.name, entry.label)).toUpperCase() === key.toUpperCase();
    });
  const read = (key: string): number | null => {
    const lower = key.toLowerCase();
    const upper = key.toUpperCase();
    const direct = first(row[key], row[lower], row[upper]);
    const nested = object(direct);
    const item = object(facet(key));
    return numberOrNull(first(
      typeof direct === "object" ? undefined : direct,
      row[`${lower}_count`],
      row[`${upper}_count`],
      nested.count,
      nested.total,
      nested.value,
      item.count,
      item.total,
      item.value
    ));
  };
  const P1 = read("P1") ?? 0;
  const P2 = read("P2") ?? 0;
  const P3 = read("P3") ?? 0;
  return {
    all: read("all") ?? P1 + P2 + P3,
    P1,
    P2,
    P3,
    safety: read("safety") ?? 0,
  };
}

export function normalizeQueueSummary(value: unknown): QueueSummary {
  const data = unwrap(value);
  const p1 = object(first(data.P1, data.p1));
  const p2 = object(first(data.P2, data.p2));
  const p3 = object(first(data.P3, data.p3));
  const safety = object(first(data.safety, data.SAFETY));
  const flatCounts = {
    P1: data.p1_open_count,
    P2: data.p2_open_count,
    P3: data.p3_open_count,
    safety: data.safety_open_count,
  };
  const hasFlatCounts = Object.values(flatCounts).some((value) => value != null);
  const normalizedCounts = normalizePriorityCounts(
    first(data.open_counts, data.counts, data.priority_counts, hasFlatCounts ? flatCounts : data)
  );
  const report = (reportValue: unknown) =>
    Object.keys(object(reportValue)).length ? normalizeReport(reportValue) : null;

  return {
    counts: {
      P1: normalizedCounts.P1,
      P2: normalizedCounts.P2,
      P3: normalizedCounts.P3,
      safety: normalizedCounts.safety,
    },
    scheduledP3: numberOrNull(first(
      data.p3_scheduled_count,
      data.scheduled_p3_count,
      data.scheduled_p3,
      p3.scheduled_count,
      p3.scheduled
    )),
    unscheduledP3: numberOrNull(first(
      data.p3_unscheduled_count,
      data.unscheduled_p3_count,
      data.unscheduled_p3,
      p3.unscheduled_count,
      p3.unscheduled
    )),
    nextP1: report(first(data.next_p1, data.next_p1_report, p1.next_report, p1.next)),
    nextP2: report(first(data.next_p2, data.next_p2_report, p2.next_report, p2.next)),
    topSafety: report(first(
      data.top_safety,
      data.top_safety_report,
      data.next_safety,
      safety.top_report,
      safety.next_report,
      safety.next
    )),
  };
}

export function useBreakdownReports(filters: QueueFilters) {
  return useQuery<
    { items: QueueReport[]; priorityCounts: Record<PriorityFilter, number>; nextPageToken: string; totalCount: number },
    AxiosError<ApiResponseError>
  >({
    queryKey: [...KEY, "list", filters],
    queryFn: async () => {
      const payload: unknown = (await axios.get(URL, { params: filters })).data;
      const envelope = object(payload);
      const data = unwrap(payload);
      const meta = object(first(data.meta, envelope.meta));
      const rawItems = first(
        data.items,
        data.reports,
        data.results,
        Array.isArray(envelope.data) ? envelope.data : undefined
      );
      return {
        items: list(rawItems).map(normalizeReport),
        priorityCounts: normalizePriorityCounts(first(data.priority_counts, envelope.priority_counts, meta.priority_counts)),
        nextPageToken: text(first(data.next_page_token, data.nextPageToken, envelope.next_page_token, meta.next_page_token)),
        totalCount: number(first(data.total_count, data.totalCount, envelope.total_count, meta.total_count)),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load breakdown reports" },
  });
}

export function useQueueSummary() {
  return useQuery<QueueSummary, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, "summary"],
    queryFn: async () => {
      return normalizeQueueSummary((await axios.get(`${URL}/queue-summary`)).data);
    },
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load the queue summary" },
  });
}

/** Full report with its triage, notes and events; the list row is shown while it loads. */
export function useBreakdownReport(id: string | undefined, placeholder?: QueueReport) {
  return useQuery<QueueReport, AxiosError<ApiResponseError>>({
    queryKey: [...KEY, "detail", id],
    enabled: Boolean(id),
    queryFn: async () => normalizeReport(unwrap((await axios.get(`${URL}/${id}`)).data)),
    placeholderData: placeholder,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load the breakdown report" },
  });
}

function useReportMutation<T>(mutationFn: (variables: T) => Promise<unknown>, errorMessage: string, successMessage?: string) {
  const client = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, T>({
    mutationFn,
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
    meta: { errorMessage, successMessage },
  });
}

export function useOverridePriority() {
  return useReportMutation<{ id: string; priority: Priority; reason: string }>(
    ({ id, ...body }) => axios.post(`${URL}/${id}/priority-override`, body),
    "Failed to change priority"
  );
}
export function useRevertOverride() {
  return useReportMutation<string>((id) => axios.post(`${URL}/${id}/priority-override/revert`), "Failed to restore system priority");
}
export function useAssignReport() {
  return useReportMutation<{ id: string; technicianId: string; technicianName: string }>(
    ({ id, technicianId, technicianName }) => axios.post(`${URL}/${id}/assign`, { technician_id: technicianId, technician_name: technicianName }),
    "Failed to assign the report"
  );
}
export function useStartReport() {
  return useReportMutation<string>((id) => axios.post(`${URL}/${id}/start`), "Failed to start work");
}
export function useScheduleReport() {
  return useReportMutation<{ id: string; scheduledFor: Date }>(
    ({ id, scheduledFor }) => axios.post(`${URL}/${id}/schedule`, { scheduled_for: scheduledFor.toISOString() }),
    "Failed to schedule the report"
  );
}
export function useCancelSchedule() {
  return useReportMutation<string>((id) => axios.delete(`${URL}/${id}/schedule`), "Failed to cancel the schedule");
}
export type CancelReason = "duplicate" | "false_alarm" | "wrong_asset" | "other";
export function useCancelReport() {
  return useReportMutation<{ id: string; reason: CancelReason; duplicateOf?: string; note?: string }>(
    ({ id, reason, duplicateOf, note }) =>
      axios.post(`${URL}/${id}/cancel`, { reason, duplicate_of_report_id: duplicateOf || undefined, note: note || undefined }),
    "Failed to cancel the report"
  );
}
export function useRestoreReport() {
  return useReportMutation<string>((id) => axios.post(`${URL}/${id}/restore`), "Failed to restore the report");
}
/** A supervisor escalates to the maintenance manager. */
export function useEscalateReport() {
  return useReportMutation<{ id: string; note?: string }>(
    ({ id, note }) => axios.post(`${URL}/${id}/escalate`, { escalated_to: "maintenance_manager", note: note || undefined }),
    "Failed to escalate the report"
  );
}
export type EscalationAction = "reassign" | "continue" | "resolved";
export function useRespondEscalation() {
  return useReportMutation<{ id: string; action: EscalationAction; note?: string; technicianId?: string; technicianName?: string }>(
    ({ id, action, note, technicianId, technicianName }) =>
      axios.post(`${URL}/${id}/escalation/respond`, {
        action,
        note: note || undefined,
        technician_id: technicianId || undefined,
        technician_name: technicianName || undefined,
      }),
    "Failed to respond to the escalation"
  );
}
export function useAddNote() {
  return useReportMutation<{ id: string; body: string }>(({ id, body }) => axios.post(`${URL}/${id}/notes`, { body }), "Failed to add the note");
}
export function useUpdateNote() {
  return useReportMutation<{ noteId: string; body: string }>(({ noteId, body }) => axios.put(`${URL}/notes/${noteId}`, { body }), "Failed to update the note");
}
export function useDeleteNote() {
  return useReportMutation<string>((noteId) => axios.delete(`${URL}/notes/${noteId}`), "Failed to delete the note");
}
export type CaseFeedbackReason = "different_asset" | "different_symptoms" | "action_not_helpful";
export function useCaseFeedback() {
  return useReportMutation<{ caseId: string; verdict: "relevant" | "not_relevant" | ""; reason?: CaseFeedbackReason }>(
    ({ caseId, verdict, reason }) => axios.put(`${URL}/similar-cases/${caseId}/feedback`, { verdict, reason: reason || undefined }),
    "Failed to save feedback"
  );
}
/** Opens a triage document through its presigned download link. */
export function useDownloadDocument() {
  return useMutation<string, AxiosError<ApiResponseError>, string>({
    mutationFn: async (documentId) => {
      const data = unwrap((await axios.get(`${URL}/documents/${documentId}/download`)).data);
      const link = text(first(data.download_url, data.url));
      if (!link) throw new Error("The document has no download link");
      return link;
    },
    meta: { errorMessage: "Failed to open the document" },
  });
}
