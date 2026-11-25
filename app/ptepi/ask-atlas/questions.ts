import type { QuestionId } from "./types";

type KeywordGroup = { words: string[]; weight: number };

type Question = {
  id: QuestionId;
  /** Chip text, also the canonical wording of the question */
  label: string;
  groups: KeywordGroup[];
};

/** Needed to accept a question; a single weak word never matches. */
export const MIN_MATCH_SCORE = 2;

/** Demo questions from the requirements. Keywords cover English and Bahasa Indonesia. */
export const QUESTIONS: Question[] = [
  {
    id: "behind",
    label: "Why is Kapasitor Bank (PNP126) behind plan?",
    groups: [
      {
        words: ["behind", "late", "delay", "delayed", "stalled", "flat", "slip", "slipping", "stuck", "deviation", "terlambat", "tertinggal", "deviasi", "tidak naik"],
        weight: 2
      },
      { words: ["progress", "progres", "plan", "kurva"], weight: 1 },
      { words: ["pnp126", "kapasitor", "capacitor", "svgm"], weight: 1 }
    ]
  },
  {
    id: "billing",
    label: "What is blocked from billing?",
    groups: [
      { words: ["billing", "billable", "bill", "invoice", "tagihan", "termin", "penagihan", "ditagih"], weight: 3 },
      { words: ["blocked", "held", "tertahan"], weight: 1 }
    ]
  },
  {
    id: "next",
    label: "What should we do next on PNP126?",
    groups: [
      {
        words: ["next", "recommend", "should we do", "what to do", "langkah", "tindakan", "selanjutnya", "rekomendasi"],
        weight: 3
      },
      { words: ["action", "actions"], weight: 1 }
    ]
  },
  {
    id: "attention",
    label: "Which projects need attention?",
    groups: [
      { words: ["attention", "at risk", "risk", "berisiko", "perhatian", "portfolio", "health"], weight: 3 },
      { words: ["projects", "proyek"], weight: 1 }
    ]
  },
  {
    id: "bast",
    label: "Draft the BAST for PNP126",
    groups: [
      { words: ["bast", "handover", "serah terima", "kr-06", "kr 06"], weight: 4 },
      { words: ["draft", "buat", "create"], weight: 1 }
    ]
  },
  {
    id: "inspections",
    label: "Which service inspections are overdue?",
    groups: [
      {
        words: ["inspection", "inspections", "inspeksi", "kha", "managed service", "manage service", "service contract"],
        weight: 3
      },
      { words: ["overdue", "missing", "not done", "belum"], weight: 1 }
    ]
  },
  {
    id: "report",
    label: "Draft weekly report week 19",
    groups: [
      { words: ["weekly report", "report", "laporan", "laporan mingguan", "t1"], weight: 4 },
      { words: ["week 19", "minggu 19", "draft", "buat"], weight: 1 }
    ]
  },
  {
    id: "export",
    label: "Generate the weekly portfolio report",
    groups: [
      { words: ["generate", "export", "download", "unduh", "hasilkan"], weight: 5 },
      { words: ["report", "laporan", "portfolio", "portofolio", "status"], weight: 1 }
    ]
  },
  {
    id: "mos",
    label: "When is the MOS BA for PNP126 signed?",
    groups: [
      { words: ["mos", "material on site", "material di lokasi"], weight: 4 },
      { words: ["signed", "ditandatangani", "when", "kapan", "date", "tanggal"], weight: 1 }
    ]
  },
  {
    id: "rap",
    label: "Which projects are over RAP?",
    groups: [
      { words: ["rap", "over budget", "overrun", "margin", "cost", "biaya", "anggaran", "budget"], weight: 3 },
      { words: ["over", "exceed", "melebihi", "negative"], weight: 1 }
    ]
  }
];

/** Extra suggested question in Bahasa Indonesia (requirement AS-01). It maps to an existing answer. */
export const BAHASA_CHIP = {
  id: "behind" as QuestionId,
  label: "Why has Kapasitor Bank progress not moved since week 14?"
};

function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9-]+/g, " ").trim()} `;
}

function scoreOf(question: Question, padded: string): number {
  return question.groups.reduce(
    (total, group) =>
      group.words.some((word) => padded.includes(` ${word} `)) ? total + group.weight : total,
    0
  );
}

/** Keyword match: the question with the highest score, or null when nothing scores enough. */
export function matchQuestion(text: string): QuestionId | null {
  const padded = normalise(text);
  let best: { id: QuestionId; score: number } | null = null;
  for (const question of QUESTIONS) {
    const score = scoreOf(question, padded);
    if (score >= MIN_MATCH_SCORE && (best === null || score > best.score)) {
      best = { id: question.id, score };
    }
  }
  return best?.id ?? null;
}
