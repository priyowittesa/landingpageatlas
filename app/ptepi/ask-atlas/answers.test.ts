import { describe, expect, it } from "vitest";
import { epiData } from "../data";
import { buildAllAnswers, buildAnswer } from "./answers";
import { BAHASA_CHIP, QUESTIONS, matchQuestion } from "./questions";

describe("keyword matching", () => {
  it("maps every suggested question to its own answer", () => {
    for (const question of QUESTIONS) {
      expect(matchQuestion(question.label), question.label).toBe(question.id);
    }
  });

  it("understands the Bahasa Indonesia demo question", () => {
    expect(matchQuestion(BAHASA_CHIP.label)).toBe("behind");
    expect(matchQuestion("tagihan mana yang tertahan?")).toBe("billing");
    expect(matchQuestion("proyek mana yang berisiko")).toBe("attention");
  });

  it("is case and punctuation insensitive", () => {
    expect(matchQuestion("WHY IS PNP126 BEHIND???")).toBe("behind");
    expect(matchQuestion("what's blocked from BILLING")).toBe("billing");
  });

  it("returns null for questions it cannot answer", () => {
    expect(matchQuestion("")).toBeNull();
    expect(matchQuestion("what is the weather today")).toBeNull();
    expect(matchQuestion("plan")).toBeNull();
  });
});

describe("scripted answers", () => {
  const answers = buildAllAnswers(epiData);

  it("explains why PNP126 is behind with live numbers", () => {
    const answer = answers.behind;
    expect(answer.conclusion).toContain("44,989 pts behind plan in week 18");
    expect(answer.conclusion).toContain("actual 28,498% against a plan of 73,487%");
    expect(answer.figures.map((f) => f.value)).toEqual(["73,487%", "28,498%", "-44,989 pts"]);
    expect(answer.points.some((p) => p.includes("weeks 14 to 18"))).toBe(true);
    expect(answer.points.some((p) => p.includes("Panel SVGm") && p.includes("64,115%") && p.includes("32,058 pts"))).toBe(true);
    expect(answer.points.some((p) => p.includes("8,9 points per week for 8 weeks"))).toBe(true);
    expect(answer.points.some((p) => p.includes("Power Transformer: PO Vendor (Confirmation Order) still draft"))).toBe(true);
    expect(answer.actions).toHaveLength(1);
    expect(answer.actions[0]).toMatchObject({
      projectId: "PNP126",
      dueDate: "2026-11-15",
      autonomy: "L1",
      source: "S7 Nexa Intelligence: PNP126 behind plan"
    });
    expect(answer.actions[0]?.title).toContain("Panel SVGm");
  });

  it("lists what is blocked from billing", () => {
    const answer = answers.billing;
    expect(answer.conclusion).toBe(
      "4 payment stages worth Rp 752,5 m are blocked from billing; 2 worth Rp 37,9 m can be billed now."
    );
    expect(answer.points.some((p) => p.includes("PTP1125") && p.includes("BAST I still draft, not signed"))).toBe(true);
    expect(answer.points.some((p) => p.includes("PNP126") && p.includes("Progress 28,498% below the 50% condition"))).toBe(true);
    expect(answer.points.some((p) => p.includes("is billable, but BAST II not in the register"))).toBe(true);
    expect(answer.actions.map((a) => a.projectId).sort()).toEqual(["IKT0126", "PNP126", "PTP1125"]);
    expect(answer.actions.every((a) => a.ownerRole === "SM Operasi dan Teknik")).toBe(true);
  });

  it("recommends next actions on PNP126, most urgent first", () => {
    const answer = answers.next;
    expect(answer.conclusion).toBe("ATLAS recommends 2 actions on PNP126, the most urgent first.");
    expect(answer.actions.map((a) => a.source)).toEqual([
      "S4 Evidence gate: PNP126 stage 2",
      "S7 Nexa Intelligence: PNP126 behind plan"
    ]);
    expect(answer.points.some((p) => p.includes("Rp 17.802.002"))).toBe(true);
    expect(answer.points.some((p) => p.includes("Billing stays blocked"))).toBe(true);
  });

  it("names the projects that need attention", () => {
    const answer = answers.attention;
    expect(answer.conclusion).toBe("3 of 16 projects are at risk and 7 are on watch.");
    expect(answer.actions.map((a) => a.projectId).sort()).toEqual(["PNP126", "PSL0126", "PTP1125"]);
    expect(answer.points.some((p) => p.startsWith("On watch:"))).toBe(true);
  });

  it("blocks the BAST draft on KR-06", () => {
    const answer = answers.bast;
    expect(answer.conclusion).toBe("The BAST for PNP126 cannot be drafted yet: 4 of 4 checks fail.");
    expect(answer.points).toContain("KR-06: BA Pemeriksaan Fisik signed: missing.");
    expect(answer.sources.some((s) => s.kind === "rule" && s.label.startsWith("KR-06"))).toBe(true);
    expect(answer.actions[0]?.dueDate).toBe("2026-11-22");
  });

  it("reports overdue service inspections", () => {
    const answer = answers.inspections;
    expect(answer.conclusion).toBe(
      "22 required inspections in 10 scope items are overdue; overall coverage is 88,17%."
    );
    expect(answer.points.some((p) => p.includes("IKT0126") && p.includes("(KHA)") && p.includes("carried out 0 times"))).toBe(true);
    expect(answer.actions).toHaveLength(1);
    expect(answer.actions[0]?.projectId).toBe("IKT0126");
  });

  it("reports projects over RAP", () => {
    const answer = answers.rap;
    expect(answer.conclusion).toBe("3 projects are over their RAP budget; the largest overrun is PSL0126 at Rp 47,0 m.");
    expect(answer.points.some((p) => p.includes("PSL0126") && p.includes("Rp 47.000.000") && p.includes("margin -12,53%"))).toBe(true);
    expect(answer.points.some((p) => p.includes("Portfolio margin is 24,89%"))).toBe(true);
    expect(answer.actions.map((a) => a.projectId)).toEqual(["PSL0126"]);
  });

  it("cites its sources and the data refresh time in every answer", () => {
    for (const answer of Object.values(answers)) {
      expect(answer.refreshedAt).toBe("2026-11-08");
      expect(answer.sources.length).toBeGreaterThanOrEqual(3);
      expect(answer.sources.some((s) => s.kind === "table")).toBe(true);
      expect(answer.points.length).toBeGreaterThan(0);
      for (const action of answer.actions) {
        expect(action.dueDate).toMatch(/^2026-11-\d{2}$/);
        expect(action.autonomy).toBe("L1");
        expect(action.source.startsWith("S4") || action.source.startsWith("S7")).toBe(true);
      }
    }
  });

  it("builds the same answer for one question as for all", () => {
    expect(buildAnswer("billing", epiData)).toEqual(answers.billing);
  });
});

describe("answers read live from the data", () => {
  it("changes the numbers when the underlying data changes", () => {
    const changed = structuredClone(epiData);
    const week = changed.progressWeekly.find((r) => r.projectId === "PNP126" && r.component === "TOTAL" && r.weekNo === 18);
    if (week) week.actualCumulative = 0.3;
    const answer = buildAnswer("behind", changed);
    expect(answer.figures.map((f) => f.value)).toEqual(["73,487%", "30%", "-43,487 pts"]);
    expect(answer.conclusion).not.toContain("44,989");
  });

  it("unblocks a payment stage in the billing answer when its BA is signed", () => {
    const changed = structuredClone(epiData);
    const ba = changed.baRegister.find((b) => b.projectId === "PTP1125" && b.documentType === "BAST I");
    if (ba) ba.status = "Signed";
    const stage = changed.paymentStages.find((s) => s.projectId === "PTP1125" && s.stageType === "Pelunasan 95%");
    if (stage) stage.status = "SIAP DITAGIH";
    const answer = buildAnswer("billing", changed);
    expect(answer.conclusion).toContain("3 payment stages");
    expect(answer.actions.map((a) => a.projectId)).not.toContain("PTP1125");
  });

  it("refuses instead of guessing when the evidence is missing", () => {
    const changed = structuredClone(epiData);
    changed.progressWeekly = changed.progressWeekly.filter((r) => r.projectId !== "PNP126");
    const answer = buildAnswer("behind", changed);
    expect(answer.conclusion).toBe("ATLAS cannot answer this: there is no weekly progress for PNP126.");
    expect(answer.actions).toEqual([]);
  });
});
