/**
 * Synthetic demo set of Knowledge Source (uploaded files) and Knowledge Base (notes
 * built from them), after ATLAS AI Studio. Static: no upload, no API. Nexa answers
 * from this knowledge; every screen shows SyntheticDataBadge.
 */

export type SourceStatus = "ready" | "chunking" | "uploaded" | "failed";

export type SourceFolder = { id: string; title: string };

export type KnowledgeSource = {
  id: string;
  folderId: string;
  name: string;
  /** File type as shown to the user */
  type: "PDF" | "XLSX" | "DOCX";
  /** Size in bytes */
  size: number;
  status: SourceStatus;
  uploadedAt: string;
  /** Text is extracted into notes and entities */
  extractKnowledge: boolean;
  /** Tables are extracted as rows */
  extractTables: boolean;
};

export type NoteFolder = { id: string; title: string };

export type KnowledgeNote = {
  id: string;
  folderId: string;
  title: string;
  summary: string;
  points: string[];
  /** Notes this note links to */
  links: string[];
  /** Knowledge sources the note was built from */
  sources: string[];
};

export const SOURCE_FOLDERS: SourceFolder[] = [
  { id: "contracts", title: "Contracts and addenda" },
  { id: "evidence", title: "BA and BAST" },
  { id: "progress", title: "Weekly progress reports" },
  { id: "procurement", title: "Procurement" },
  { id: "policies", title: "SOP and policies" }
];

const MB = 1024 * 1024;

export const SOURCES: KnowledgeSource[] = [
  { id: "src-01", folderId: "contracts", name: "PNP126 Kontrak Induk.pdf", type: "PDF", size: 4.8 * MB, status: "ready", uploadedAt: "2026-07-15", extractKnowledge: true, extractTables: true },
  { id: "src-02", folderId: "contracts", name: "PNP126 Lampiran Jadwal Termin.pdf", type: "PDF", size: 1.2 * MB, status: "ready", uploadedAt: "2026-09-03", extractKnowledge: true, extractTables: true },
  { id: "src-03", folderId: "contracts", name: "IKT0126 Kontrak Manage Service Utilitas ME.pdf", type: "PDF", size: 3.1 * MB, status: "ready", uploadedAt: "2026-07-22", extractKnowledge: true, extractTables: false },
  { id: "src-04", folderId: "contracts", name: "JICT0326 Kontrak Penggantian Panel LVMDP.pdf", type: "PDF", size: 2.6 * MB, status: "ready", uploadedAt: "2026-08-12", extractKnowledge: true, extractTables: true },
  { id: "src-05", folderId: "evidence", name: "PNP126 BA Kemajuan Pekerjaan Termin 2.pdf", type: "PDF", size: 0.9 * MB, status: "ready", uploadedAt: "2026-10-30", extractKnowledge: true, extractTables: false },
  { id: "src-06", folderId: "evidence", name: "TPK0226 BAST Pemeliharaan Oktober.pdf", type: "PDF", size: 1.4 * MB, status: "ready", uploadedAt: "2026-11-04", extractKnowledge: true, extractTables: false },
  { id: "src-07", folderId: "evidence", name: "PSL0226 BAMK Material Trafo.pdf", type: "PDF", size: 2.2 * MB, status: "chunking", uploadedAt: "2026-11-08", extractKnowledge: true, extractTables: true },
  { id: "src-08", folderId: "progress", name: "Laporan Mingguan W45 Portofolio.xlsx", type: "XLSX", size: 0.6 * MB, status: "ready", uploadedAt: "2026-11-03", extractKnowledge: false, extractTables: true },
  { id: "src-09", folderId: "progress", name: "Laporan Mingguan W44 Portofolio.xlsx", type: "XLSX", size: 0.6 * MB, status: "ready", uploadedAt: "2026-10-27", extractKnowledge: false, extractTables: true },
  { id: "src-10", folderId: "progress", name: "Kapasitor Bank S-curve Aktual.xlsx", type: "XLSX", size: 0.3 * MB, status: "ready", uploadedAt: "2026-11-03", extractKnowledge: false, extractTables: true },
  { id: "src-11", folderId: "procurement", name: "RAP PNP126 Rev 2.xlsx", type: "XLSX", size: 0.8 * MB, status: "ready", uploadedAt: "2026-08-20", extractKnowledge: true, extractTables: true },
  { id: "src-12", folderId: "procurement", name: "Daftar PO dan SES Oktober.xlsx", type: "XLSX", size: 1.1 * MB, status: "ready", uploadedAt: "2026-11-01", extractKnowledge: false, extractTables: true },
  { id: "src-13", folderId: "procurement", name: "Invoice Vendor PT Kabel Nusantara scan.pdf", type: "PDF", size: 5.4 * MB, status: "failed", uploadedAt: "2026-11-07", extractKnowledge: true, extractTables: true },
  { id: "src-14", folderId: "policies", name: "SOP Penagihan dan Retensi.docx", type: "DOCX", size: 0.4 * MB, status: "ready", uploadedAt: "2026-07-10", extractKnowledge: true, extractTables: false },
  { id: "src-15", folderId: "policies", name: "Pedoman Evidence Gate PMO.docx", type: "DOCX", size: 0.5 * MB, status: "ready", uploadedAt: "2026-07-10", extractKnowledge: true, extractTables: false },
  { id: "src-16", folderId: "policies", name: "Ambang Batas Deviasi Proyek.docx", type: "DOCX", size: 0.2 * MB, status: "uploaded", uploadedAt: "2026-11-08", extractKnowledge: true, extractTables: false }
];

export const NOTE_FOLDERS: NoteFolder[] = [
  { id: "delivery", title: "Delivery" },
  { id: "commercial", title: "Commercial" },
  { id: "procurement", title: "Procurement" }
];

export const NOTES: KnowledgeNote[] = [
  {
    id: "n-pnp126",
    folderId: "delivery",
    title: "PNP126 contract summary",
    summary: "Capacitor bank procurement for PT Prima Nur Panurjwan at Dermaga DSN, Tanjung Priok, paid in termin against signed BA and BAST.",
    points: [
      "Contract runs 7 Jul 2026 to 2 Jan 2027, with no addendum.",
      "Progress is reported weekly as an S-curve.",
      "Every termin needs its evidence before Tagihan."
    ],
    links: ["n-termin", "n-evidence", "n-scurve", "n-rap"],
    sources: ["src-01", "src-02"]
  },
  {
    id: "n-scurve",
    folderId: "delivery",
    title: "S-curve and deviation",
    summary: "How weekly plan and actual points turn into deviation and the pace needed to finish on time.",
    points: [
      "Deviation = actual minus plan, in points.",
      "Required pace = remaining points over remaining weeks.",
      "Watch and risk thresholds come from the deviation guideline."
    ],
    links: ["n-thresholds", "n-pnp126"],
    sources: ["src-08", "src-09", "src-10"]
  },
  {
    id: "n-thresholds",
    folderId: "delivery",
    title: "Deviation thresholds",
    summary: "When a project counts as on track, watch or at risk.",
    points: ["Thresholds are set per portfolio by the PMO.", "A project at risk gets an action with an owner and a due date."],
    links: ["n-scurve"],
    sources: ["src-16"]
  },
  {
    id: "n-evidence",
    folderId: "delivery",
    title: "Evidence gate checklist",
    summary: "The documents a termin needs before it can be billed: BA, BAST, BAMK and photos.",
    points: [
      "Each document must be signed by both parties and dated.",
      "A missing client signature blocks the gate.",
      "The gate status feeds billing readiness."
    ],
    links: ["n-termin", "n-billing"],
    sources: ["src-05", "src-06", "src-07", "src-15"]
  },
  {
    id: "n-termin",
    folderId: "commercial",
    title: "Termin and Retensi rules",
    summary: "How contract value is split into termin, and how much Retensi is held until handover.",
    points: [
      "Termin are paid on progress milestones set in the contract.",
      "Retensi is held from each termin and released after BAST.",
      "Addenda can move the milestone of a termin."
    ],
    links: ["n-billing", "n-evidence"],
    sources: ["src-01", "src-02", "src-14"]
  },
  {
    id: "n-billing",
    folderId: "commercial",
    title: "Billing readiness",
    summary: "The states of a termin on the way to cash: billable, awaiting BAST, blocked, invoiced, not due.",
    points: [
      "Billable = gate complete and not yet invoiced.",
      "Blocked = a gate document is missing.",
      "Invoiced amounts come from SAP FI."
    ],
    links: ["n-termin", "n-evidence"],
    sources: ["src-14"]
  },
  {
    id: "n-rap",
    folderId: "procurement",
    title: "RAP and margin",
    summary: "The cost budget (RAP) per project and how actual cost against it sets the margin.",
    points: ["Cost lines are grouped by RAP category.", "Margin = contract value minus cost, over contract value."],
    links: ["n-ses", "n-pnp126"],
    sources: ["src-11"]
  },
  {
    id: "n-ses",
    folderId: "procurement",
    title: "Vendor advances and SES",
    summary: "Vendor payments made before the work is accepted with a service entry sheet (SES).",
    points: [
      "An advance without an SES is a cost risk until accepted.",
      "Three-way match: PO, SES and vendor invoice."
    ],
    links: ["n-rap"],
    sources: ["src-12", "src-13"]
  }
];
