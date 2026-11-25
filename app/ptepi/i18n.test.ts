import { describe, expect, it } from "vitest";
import { ID_DICTIONARY, translate } from "./i18n";
import { PTEPI_NAV, flattenNav } from "./navigation";

describe("interface language", () => {
  it("returns English unchanged", () => {
    expect(translate("Portfolio health", "en")).toBe("Portfolio health");
  });

  it("translates every sidebar label and section", () => {
    for (const section of PTEPI_NAV) {
      expect(translate(section.title, "id")).not.toBe(section.title);
      for (const item of flattenNav(section.items)) {
        if (item.title !== "Nexa Intelligence") expect(translate(item.title, "id"), item.title).not.toBe(item.title);
      }
    }
  });

  it("translates titles with a variable part and keeps unknown text", () => {
    expect(translate("Evidence gate: PNP126", "id")).toBe("Gerbang bukti: PNP126");
    expect(translate("Now: Offer", "id")).toBe("Saat ini: Penawaran");
    expect(translate("Some generated sentence", "id")).toBe("Some generated sentence");
  });

  it("has a non-empty Bahasa Indonesia text for every key", () => {
    for (const [english, bahasa] of Object.entries(ID_DICTIONARY)) {
      expect(bahasa.trim().length, english).toBeGreaterThan(0);
    }
  });
});

describe("generated text in Bahasa Indonesia", () => {
  it("translates chart takeaways clause by clause, keeping the numbers", () => {
    expect(
      translate("Week 18: -45 pts against plan; finishing on the planned date needs 8,9 points per week, the last 4 weeks gained 0 pts per week.", "id")
    ).toBe("Minggu 18: -45 poin terhadap rencana; selesai tepat waktu butuh 8,9 poin per minggu, 4 minggu terakhir naik 0 poin per minggu.");
  });

  it("translates reasons, labels and the S3 scenario label", () => {
    expect(translate("Schedule deviation -45 pts; 1 Tagihan held", "id")).toBe("Deviasi jadwal -45 poin; 1 Tagihan tertahan");
    expect(translate("BA laporan bulanan (Oct 2026)", "id")).toBe("BA laporan bulanan (Oct 2026)");
    expect(translate("Monthly report BA (Oct 2026) still draft, not signed", "id")).toBe("BA laporan bulanan (Okt 2026) masih draf, belum ditandatangani");
    expect(translate("Scenario if best pace repeats (ATLAS-estimated)", "id")).toBe("Skenario jika laju terbaik berulang (estimasi ATLAS)");
    expect(translate("Subcontract services", "id")).toBe("Jasa Subkon");
  });

  it("leaves unknown text and English untouched", () => {
    expect(translate("PNP126 Kontrak Induk.pdf", "id")).toBe("PNP126 Kontrak Induk.pdf");
    expect(translate("Schedule deviation -45 pts", "en")).toBe("Schedule deviation -45 pts");
  });
});
