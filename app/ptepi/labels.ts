import {
  CRITICAL_ITEM_LAG_PTS,
  DEVIATION_ALERT_PTS,
  OVERDUE_ALERT_DAYS,
  RETENTION_ALERT_DAYS
} from "./thresholds";
import type {
  ExceptionSeverity,
  HealthRating,
  LifecycleStage,
  StatusGroup
} from "./types";

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  "PROSES PENAWARAN": "Offer",
  "PROSES PENGADAAN": "Procurement",
  "KONTRAK - MENUNGGU BAMK": "Contract, waiting for BAMK",
  BERJALAN: "In progress",
  "BERJALAN - KRITIS": "In progress, critical",
  "BERJALAN - ADENDUM WAKTU": "In progress, time addendum",
  "SELESAI - MENUNGGU BAST": "Waiting for BAST",
  "SELESAI - PROSES PENAGIHAN": "Billing",
  "SELESAI - MASA RETENSI": "Retensi period",
  "SELESAI - TUTUP": "Closed"
};

export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  pipeline: "Pipeline"
};

export const HEALTH_LABELS: Record<HealthRating, string> = {
  "on-track": "On track",
  watch: "Watch",
  "at-risk": "At risk"
};

export const SEVERITY_LABELS: Record<ExceptionSeverity, string> = {
  high: "Act now",
  medium: "Watch"
};

/** English wording of the 12 seeded exceptions (requirements, table 3.4.4). Thresholds come from thresholds.ts. */
export const EXCEPTION_LABELS: Record<number, string> = {
  1: `Plan vs actual deviation of more than ${DEVIATION_ALERT_PTS} points`,
  2: `Critical item (the heaviest component) more than ${CRITICAL_ITEM_LAG_PTS} points behind plan`,
  3: "Transformer Confirmation Order claimed while the PO is still a draft",
  4: "Termin 1 cannot be billed: its progress condition is not met",
  5: "Actual cost above RAP and margin negative",
  6: "Progress 100% but BAST I unsigned, completion Tagihan held",
  7: `Completion invoice more than ${OVERDUE_ALERT_DAYS} days overdue`,
  8: `Retensi held more than ${RETENTION_ALERT_DAYS} days after BAST I`,
  9: "Weekly MV and LV cable network (KHA) inspection not carried out",
  10: "September and October monthly Tagihan held, monthly report not approved",
  11: "Contract signed but BAMK still draft",
  12: "Project closed with no BAMK in the register; links on a personal OneDrive"
};

/**
 * Findings on the copies of documents kept as attachments (read from the PDF).
 * Keyed by BA id in the register.
 */
export const ATTACHMENT_NOTES: Record<string, { file: string; findings: string[] }> = {
  "BA-PNP126-10": {
    file: "Aproval Kontainer 40 Feet R1.pdf",
    findings: [
      "Contract number, drawing number, RKS clause and approval date are blank on the form.",
      "The customer decision boxes and the Engineering Manager signature area are empty on the copy on file.",
      "EPI Project Manager has signed and submitted the drawing set (23 sheets)."
    ]
  }
};
