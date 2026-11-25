import {
  Bot,
  BrainCircuit,
  Braces,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleSlash,
  Combine,
  Database,
  FileText,
  GitBranch,
  Globe,
  HardDrive,
  LoaderCircle,
  Mail,
  Share2,
  Table,
  Terminal,
  Wrench,
  type LucideIcon
} from "lucide-react";
import type { ConnectorType, FlowIcon, FlowRole } from "../data";

export const FLOW_ICONS: Record<FlowIcon, LucideIcon> = {
  sharepoint: Share2,
  drive: HardDrive,
  database: Database,
  api: Globe,
  file: FileText,
  mail: Mail,
  transform: Wrench,
  join: Combine,
  query: Terminal,
  table: Table,
  agent: Bot,
  llm: BrainCircuit,
  branch: GitBranch
};

/** Role of a step, after the node categories of AI Studio. Label carries the meaning, color adds to it. */
export const ROLE_STYLE: Record<FlowRole, { label: string; tile: string; bar: string }> = {
  source: { label: "Data source", tile: "bg-blue-50 text-blue-700", bar: "bg-blue-500" },
  transform: { label: "Data transform", tile: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  ai: { label: "Artificial intelligence", tile: "bg-primary-50 text-primary-700", bar: "bg-primary-500" },
  logic: { label: "Logic", tile: "bg-amber-50 text-amber-800", bar: "bg-amber-500" },
  destination: { label: "Store", tile: "bg-gray-100 text-gray-700", bar: "bg-gray-500" }
};

export const CONNECTOR_STYLE: Record<ConnectorType, { label: string; Icon: LucideIcon }> = {
  sharepoint: { label: "SharePoint", Icon: Share2 },
  google_drive: { label: "Google Drive", Icon: HardDrive },
  sql_server: { label: "SQL Server", Icon: Database },
  postgresql: { label: "PostgreSQL", Icon: Database },
  custom_api: { label: "Custom API", Icon: Globe },
  files: { label: "Files", Icon: FileText },
  email: { label: "Email", Icon: Mail },
  llm: { label: "LLM", Icon: Braces }
};

export type StepState = "idle" | "running" | "success" | "failed" | "skipped";

export const STEP_STATE: Record<StepState, { label: string; Icon: LucideIcon; pill: string }> = {
  idle: { label: "Ready", Icon: CircleDashed, pill: "bg-gray-100 text-gray-700" },
  running: { label: "Running", Icon: LoaderCircle, pill: "bg-primary-50 text-primary-800" },
  success: { label: "Done", Icon: CircleCheck, pill: "bg-green-50 text-green-800" },
  failed: { label: "Failed", Icon: CircleAlert, pill: "bg-red-50 text-red-700" },
  skipped: { label: "Skipped", Icon: CircleSlash, pill: "bg-amber-50 text-amber-900" }
};
