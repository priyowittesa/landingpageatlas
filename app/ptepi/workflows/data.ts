/**
 * Synthetic demo set of the Workflow and Connections module, after ATLAS AI Studio
 * (Workflow Studio and Master Connections). Static, no API: the canvas and the run
 * are simulated in the browser. Every screen shows SyntheticDataBadge.
 */

export type ConnectorType =
  | "sharepoint"
  | "google_drive"
  | "sql_server"
  | "postgresql"
  | "custom_api"
  | "files"
  | "email"
  | "llm";

export type ConnectionEnvironment = "development" | "staging" | "production";

export type MasterConnection = {
  id: string;
  name: string;
  /** The system behind the connection, as the client knows it */
  system: string;
  type: ConnectorType;
  environment: ConnectionEnvironment;
  active: boolean;
  createdAt: string;
  lastSync: string;
};

export type FlowRole = "source" | "transform" | "ai" | "logic" | "destination";

export type FlowIcon =
  | "sharepoint"
  | "drive"
  | "database"
  | "api"
  | "file"
  | "mail"
  | "transform"
  | "join"
  | "query"
  | "table"
  | "agent"
  | "llm"
  | "branch";

export type FlowStep = {
  id: string;
  label: string;
  /** What the step does, one line */
  detail: string;
  role: FlowRole;
  icon: FlowIcon;
  connectionId?: string;
  /** Typical duration of the step, shown on the node */
  runtime: string;
  /** Line written to the run log when the step succeeds */
  output: string;
  x: number;
  y: number;
};

export type FlowLink = { from: string; to: string; label?: string };

export type WorkflowFolder = { id: string; name: string };

export type Workflow = {
  id: string;
  folderId: string;
  name: string;
  description: string;
  schedule: string;
  owner: string;
  lastRun: string;
  lastRunStatus: "success" | "warning" | "failed";
  runsThisMonth: number;
  failedRunsThisMonth: number;
  steps: FlowStep[];
  links: FlowLink[];
};

export const CONNECTIONS: MasterConnection[] = [
  { id: "conn-sharepoint", name: "SharePoint PMO site", system: "Microsoft 365", type: "sharepoint", environment: "production", active: true, createdAt: "2026-07-14", lastSync: "2026-11-08" },
  { id: "conn-drive", name: "Document archive", system: "Google Drive", type: "google_drive", environment: "production", active: true, createdAt: "2026-07-14", lastSync: "2026-11-08" },
  { id: "conn-sap-fi", name: "SAP FI billing", system: "SAP S/4HANA", type: "sql_server", environment: "production", active: true, createdAt: "2026-07-21", lastSync: "2026-11-08" },
  { id: "conn-sap-mm", name: "SAP MM procurement", system: "SAP S/4HANA", type: "sql_server", environment: "production", active: true, createdAt: "2026-07-21", lastSync: "2026-11-07" },
  { id: "conn-atlas-db", name: "ATLAS project store", system: "PostgreSQL", type: "postgresql", environment: "production", active: true, createdAt: "2026-07-07", lastSync: "2026-11-08" },
  { id: "conn-nexa", name: "Nexa model endpoint", system: "ATLAS AI", type: "llm", environment: "production", active: true, createdAt: "2026-08-04", lastSync: "2026-11-08" },
  { id: "conn-mail", name: "PMO mail relay", system: "SMTP", type: "email", environment: "production", active: true, createdAt: "2026-08-11", lastSync: "2026-11-06" },
  { id: "conn-vendor-inbox", name: "Vendor invoice inbox", system: "Shared folder", type: "files", environment: "development", active: true, createdAt: "2026-09-15", lastSync: "2026-11-05" },
  { id: "conn-einvoice", name: "e-Invoice gateway", system: "Pelindo e-Invoice (sandbox)", type: "custom_api", environment: "staging", active: false, createdAt: "2026-10-02", lastSync: "2026-10-28" }
];

export const FOLDERS: WorkflowFolder[] = [
  { id: "delivery", name: "Delivery" },
  { id: "commercial", name: "Commercial" },
  { id: "procurement", name: "Procurement" }
];

export const WORKFLOWS: Workflow[] = [
  {
    id: "wf-weekly-progress",
    folderId: "delivery",
    name: "Weekly progress to Project Cockpit",
    description: "Reads the weekly progress reports, rebuilds the S-curve and drafts an action when a project falls behind.",
    schedule: "Every Monday, 07:00",
    owner: "PMO analyst",
    lastRun: "2026-11-02",
    lastRunStatus: "success",
    runsThisMonth: 2,
    failedRunsThisMonth: 0,
    steps: [
      { id: "s1", label: "Weekly progress reports", detail: "Laporan Mingguan workbooks from each project folder", role: "source", icon: "sharepoint", connectionId: "conn-sharepoint", runtime: "12 s", output: "Read 13 workbooks, 1 per project.", x: 0, y: 120 },
      { id: "s2", label: "Build S-curve", detail: "Plan and actual points per week, deviation and required pace", role: "transform", icon: "transform", runtime: "4 s", output: "Built 13 S-curves up to week 45.", x: 300, y: 120 },
      { id: "s3", label: "Behind plan?", detail: "Deviation below the watch threshold", role: "logic", icon: "branch", runtime: "1 s", output: "3 projects behind plan, 10 on track.", x: 600, y: 120 },
      { id: "s4", label: "Draft recovery action", detail: "Nexa drafts owner, due date and closing step for review", role: "ai", icon: "agent", connectionId: "conn-nexa", runtime: "9 s", output: "Drafted 3 actions, waiting for a person to approve.", x: 900, y: 0 },
      { id: "s5", label: "Project store", detail: "Writes the progress snapshot read by Portfolio Health", role: "destination", icon: "database", connectionId: "conn-atlas-db", runtime: "3 s", output: "Saved snapshot as at the latest week.", x: 900, y: 240 }
    ],
    links: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3" },
      { from: "s3", to: "s4", label: "Yes" },
      { from: "s3", to: "s5", label: "No" },
      { from: "s4", to: "s5" }
    ]
  },
  {
    id: "wf-evidence-check",
    folderId: "delivery",
    name: "BA and BAST evidence check",
    description: "Reads signed BA and BAST scans, matches them to the termin schedule and flags what is missing.",
    schedule: "Daily, 18:00",
    owner: "Project control",
    lastRun: "2026-11-07",
    lastRunStatus: "success",
    runsThisMonth: 7,
    failedRunsThisMonth: 0,
    steps: [
      { id: "s1", label: "Signed BA and BAST scans", detail: "PDF scans from the document archive", role: "source", icon: "drive", connectionId: "conn-drive", runtime: "8 s", output: "Found 24 new scans since the last run.", x: 0, y: 0 },
      { id: "s2", label: "Termin schedule", detail: "Billing plan per contract from SAP FI", role: "source", icon: "database", connectionId: "conn-sap-fi", runtime: "5 s", output: "Loaded 41 termin lines.", x: 0, y: 240 },
      { id: "s3", label: "Read dates and signatures", detail: "Nexa reads the document date, signatories and stamp", role: "ai", icon: "llm", connectionId: "conn-nexa", runtime: "21 s", output: "Read 24 scans, 2 without a client signature.", x: 300, y: 0 },
      { id: "s4", label: "Match to termin", detail: "Joins each document to its termin line", role: "transform", icon: "join", runtime: "2 s", output: "Matched 22 documents to a termin line.", x: 600, y: 120 },
      { id: "s5", label: "Evidence complete?", detail: "Every gate document present and signed", role: "logic", icon: "branch", runtime: "1 s", output: "2 termin lines still miss evidence.", x: 900, y: 120 },
      { id: "s6", label: "Evidence register", detail: "Updates the Evidence Gate of each project", role: "destination", icon: "database", connectionId: "conn-atlas-db", runtime: "2 s", output: "Updated the evidence register.", x: 1200, y: 0 },
      { id: "s7", label: "Notify project manager", detail: "Mail with the missing document and the termin it blocks", role: "destination", icon: "mail", connectionId: "conn-mail", runtime: "2 s", output: "Sent 2 reminders.", x: 1200, y: 240 }
    ],
    links: [
      { from: "s1", to: "s3" },
      { from: "s3", to: "s4" },
      { from: "s2", to: "s4" },
      { from: "s4", to: "s5" },
      { from: "s5", to: "s6", label: "Yes" },
      { from: "s5", to: "s7", label: "No" }
    ]
  },
  {
    id: "wf-billing-readiness",
    folderId: "commercial",
    name: "Termin to Tagihan readiness",
    description: "Joins the evidence register with SAP billing to list what can be invoiced, and sends ready Tagihan to e-Invoice.",
    schedule: "Daily, 06:30",
    owner: "Commercial team",
    lastRun: "2026-11-08",
    lastRunStatus: "warning",
    runsThisMonth: 8,
    failedRunsThisMonth: 1,
    steps: [
      { id: "s1", label: "Evidence register", detail: "Gate status per termin from ATLAS", role: "source", icon: "database", connectionId: "conn-atlas-db", runtime: "2 s", output: "Loaded gate status for 41 termin lines.", x: 0, y: 0 },
      { id: "s2", label: "SAP billing documents", detail: "Invoiced, open and retained amounts from SAP FI", role: "source", icon: "database", connectionId: "conn-sap-fi", runtime: "6 s", output: "Loaded 37 billing documents.", x: 0, y: 240 },
      { id: "s3", label: "Join on termin", detail: "One row per termin with its evidence and billing state", role: "transform", icon: "join", runtime: "2 s", output: "Joined 41 rows.", x: 300, y: 120 },
      { id: "s4", label: "Readiness and Retensi", detail: "Billable, awaiting BAST, blocked, invoiced; Retensi held", role: "transform", icon: "query", runtime: "3 s", output: "Classified every termin by billing readiness.", x: 600, y: 120 },
      { id: "s5", label: "Billing readiness table", detail: "Feeds Commercial and Billing", role: "destination", icon: "table", connectionId: "conn-atlas-db", runtime: "1 s", output: "Published the billing readiness table.", x: 900, y: 0 },
      { id: "s6", label: "Send ready Tagihan", detail: "Posts billable termin to the e-Invoice gateway", role: "destination", icon: "api", connectionId: "conn-einvoice", runtime: "4 s", output: "Posted billable Tagihan to e-Invoice.", x: 900, y: 240 }
    ],
    links: [
      { from: "s1", to: "s3" },
      { from: "s2", to: "s3" },
      { from: "s3", to: "s4" },
      { from: "s4", to: "s5" },
      { from: "s4", to: "s6" }
    ]
  },
  {
    id: "wf-ses-reconciliation",
    folderId: "procurement",
    name: "Vendor SES reconciliation",
    description: "Matches vendor invoices to PO and SES in SAP MM and explains advances paid without an SES.",
    schedule: "Every Friday, 16:00",
    owner: "Procurement",
    lastRun: "2026-11-06",
    lastRunStatus: "success",
    runsThisMonth: 1,
    failedRunsThisMonth: 0,
    steps: [
      { id: "s1", label: "PO and SES lines", detail: "Purchase orders and service entry sheets from SAP MM", role: "source", icon: "database", connectionId: "conn-sap-mm", runtime: "7 s", output: "Loaded 118 PO lines and 64 SES.", x: 0, y: 0 },
      { id: "s2", label: "Vendor invoices", detail: "Invoices dropped by vendors in the shared inbox", role: "source", icon: "file", connectionId: "conn-vendor-inbox", runtime: "4 s", output: "Read 19 vendor invoices.", x: 0, y: 240 },
      { id: "s3", label: "Match invoice to PO", detail: "Three-way match on PO, SES and invoice", role: "transform", icon: "join", runtime: "3 s", output: "Matched 16 invoices, 3 without SES.", x: 300, y: 120 },
      { id: "s4", label: "Advance without SES?", detail: "Paid or invoiced before the work was accepted", role: "logic", icon: "branch", runtime: "1 s", output: "3 advances without an SES.", x: 600, y: 120 },
      { id: "s5", label: "Explain variance", detail: "Nexa writes the reason and the next step per vendor", role: "ai", icon: "agent", connectionId: "conn-nexa", runtime: "8 s", output: "Explained 3 variances for review.", x: 900, y: 0 },
      { id: "s6", label: "Cost lines", detail: "Feeds Procurement and Cost", role: "destination", icon: "database", connectionId: "conn-atlas-db", runtime: "2 s", output: "Updated cost lines and vendor advances.", x: 1200, y: 120 }
    ],
    links: [
      { from: "s1", to: "s3" },
      { from: "s2", to: "s3" },
      { from: "s3", to: "s4" },
      { from: "s4", to: "s5", label: "Yes" },
      { from: "s4", to: "s6", label: "No" },
      { from: "s5", to: "s6" }
    ]
  }
];
