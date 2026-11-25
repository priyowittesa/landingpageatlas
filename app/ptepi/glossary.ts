import type { Language } from "./store/language-store";

export type GlossaryKey = "Tagihan" | "Taksasi" | "Retensi" | "Termin" | "Pelunasan" | "BAST";

/** Indonesian contract terms kept as is in the interface, explained for English-speaking readers. */
export const GLOSSARY: Record<GlossaryKey, Record<Language, string>> = {
  Tagihan: {
    en: "Invoice: a bill sent to the customer for a payment stage once its condition is met.",
    id: "Invoice yang dikirim ke pemberi kerja untuk satu tahap pembayaran setelah syaratnya terpenuhi."
  },
  Taksasi: {
    en: "Revenue estimate: planned revenue to 31 Dec that is not yet earned (accrued).",
    id: "Perkiraan pendapatan: pendapatan rencana sampai 31 Des yang belum diakui (akrual)."
  },
  Retensi: {
    en: "Retention: usually 5% of the contract, held back until BAST II at the end of the maintenance period.",
    id: "Biasanya 5% nilai kontrak, ditahan sampai BAST II di akhir masa pemeliharaan."
  },
  Termin: {
    en: "Progress payment stage: a share of the contract billed when a progress milestone is reached.",
    id: "Tahap pembayaran berdasarkan progres: bagian nilai kontrak yang ditagih saat progres tercapai."
  },
  Pelunasan: {
    en: "Settlement payment: the completion stage (often 95%) billed after BAST I.",
    id: "Tahap pembayaran penyelesaian (sering 95%) yang ditagih setelah BAST I."
  },
  BAST: {
    en: "Handover certificate (Berita Acara Serah Terima): BAST I at completion, BAST II after maintenance.",
    id: "Berita Acara Serah Terima: BAST I saat pekerjaan selesai, BAST II setelah masa pemeliharaan."
  }
};

export const GLOSSARY_KEYS = Object.keys(GLOSSARY) as GlossaryKey[];

/** The glossary term a label starts with: "Retensi 5%" -> "Retensi", "BAST I" -> "BAST". */
export function glossaryKeyOf(label: string | null | undefined): GlossaryKey | null {
  if (!label) return null;
  return GLOSSARY_KEYS.find((key) => new RegExp(`^${key}\\b`, "i").test(label.trim())) ?? null;
}
