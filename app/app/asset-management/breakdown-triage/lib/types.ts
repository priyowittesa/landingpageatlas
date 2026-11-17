export type Priority = "P1" | "P2" | "P3";
export type Criticality = "A" | "B" | "C";
export type AttributeSource = "ai" | "manual" | "fabrix";
export type MachineStatus = "stopped" | "running";
export type HistorySignal = "repeat" | "above" | "normal";
export type ReportState =
  | "new"
  | "in_progress"
  | "scheduled"
  | "escalated"
  | "completed"
  | "cancelled";
export type CauseConfidence = "High" | "Medium" | "Low";

export interface TriageAsset {
  name: string;
  type: string;
  location: string;
  line: string;
  criticality: Criticality;
  bottleneck: boolean;
  statutory: boolean;
  source: AttributeSource;
  /** LLM confidence for AI-derived attributes; null for Fabrix master data. */
  confidence: number | null;
  /** What the LLM originally proposed, kept for comparison after manual edits. */
  llm?: { criticality: Criticality; bottleneck: boolean };
  reason: string;
  inputs?: string;
  audit?: { by: string; at: string; reason: string }[];
  assetClass: string;
}

export interface AssetHealth {
  breakdowns: number;
  typeMedian: number;
  mttrHours: number | null;
  mtbfHours: number | null;
  mtbfMethod: "operating_hours" | "interval";
  failureCodes: { code: string; label: string; count: number }[];
  repeat: boolean;
  lastBreakdown: string;
  months: number;
}

export interface SparePart {
  id: string;
  name: string;
  qty: number;
  min: number;
  leadDays: number;
  location: string;
}

export interface SimilarCase {
  workOrder: string;
  similarity: number;
  date: string;
  assetId: string;
  code: string;
  action: string;
  hours: number;
  technician: string;
}

export interface ReferenceDocument {
  id: string;
  type: "SOP" | "Manual";
  title: string;
  pages: string;
  snippet: string;
}

export interface PriorityOverride {
  from: Priority;
  to: Priority;
  reason: string;
  by: string;
  at: string;
}

export interface ActivityEntry {
  time: string;
  icon: string;
  text: string;
}

export interface BreakdownReport {
  id: string;
  workOrder: string;
  assetId: string;
  description: string;
  tags: string[];
  machineStatus: MachineStatus;
  safetyFlag: boolean;
  history: HistorySignal;
  historyText?: string;
  reporter: string;
  receivedAt: string;
  minutesAgo: number;
  state: ReportState;
  responseMinutes?: number;
  scheduledFor?: string;
  technician: string;
  /** Reports arriving later in the demo (e.g. via the simulated Fabrix sync). */
  hidden?: boolean;
  cause: string | null;
  causeConfidence: CauseConfidence | null;
  inferred: boolean;
  evidence: string | null;
  estimatedHours: number | null;
  latencyMs: number;
  fallback: "no_history" | "asset_type" | null;
  actions: string[];
  spares: SparePart[];
  similarCases: SimilarCase[];
  documents: ReferenceDocument[];
  override?: PriorityOverride;
  notes: { id: number; by: string; at: string; text: string }[];
  log: ActivityEntry[];
}

export interface WorkOrderHistory {
  workOrder: string;
  assetId: string;
  date: string;
  iso: string;
  code: string;
  description: string;
  action: string;
  hours: number;
  technician: string;
  parts: { id: string; qty: number }[];
}

export interface SynonymEntry {
  id: number;
  term: string;
  synonyms: string[];
  category: "Symptom" | "Component" | "Action";
  enabled: boolean;
  uses: number;
  updatedBy: string;
  updatedAt: string;
}

export type InsightType = "anomaly" | "prediction" | "recommendation";
export type InsightSeverity = "High" | "Medium" | "Low";
export type InsightStatus = "open" | "snoozed" | "accepted" | "dismissed";

export interface AiInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  assetId: string | null;
  codes: string[];
  reportId: string | null;
  partId: string | null;
  confidence: number;
  createdAt: string;
  title: string;
  description: string;
  basis: string;
  why: string[];
  suggestion: string;
  kind: "inspect" | "purchase" | "config" | "data";
  actionLabel: string;
  qty?: number;
  status: InsightStatus;
  snoozedUntil?: string;
  outcome?: string;
  log: { event: string; by: string; at: string }[];
  /** Fields below come from the AI insights API only. */
  code?: string;
  assetCode?: string;
  assetName?: string;
  modelName?: string;
  modelVersion?: string;
  evidence?: { sourceType: string; sourceCode: string; observedAt: string; snapshot: Record<string, unknown> }[];
}

export interface ScoringWeights {
  criticality: number;
  production: number;
  safety: number;
  history: number;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  p1Threshold: number;
  p2Threshold: number;
  safetyKeywords: string[];
  /** Response SLA per priority, in minutes. */
  slaMinutes: Record<Priority, number>;
  autoEscalate: boolean;
}

export interface ScoringVersion {
  version: number;
  author: string;
  approver: string;
  at: string;
  note: string;
  status: "active" | "archived" | "pending";
  config: ScoringConfig;
}

export interface OverrideRecord {
  reportId: string;
  asset: string;
  from: Priority;
  to: Priority;
  reason: string;
  by: string;
  at: string;
}
