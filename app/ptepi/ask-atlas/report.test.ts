import { describe, expect, it } from "vitest";
import { epiData } from "../data";
import { getPagePrompts } from "./page-prompts";
import { matchQuestion } from "./questions";
import { buildPortfolioReport, reportToHtml } from "./report";

const report = buildPortfolioReport(epiData);

describe("portfolio status report", () => {
  it("carries the governed figures of the portfolio", () => {
    const byLabel = Object.fromEntries(report.kpis.map((kpi) => [kpi.label, kpi.value]));
    expect(byLabel["Projects at risk"]).toBe("3 of 16");
    expect(byLabel["PNP126 deviation"]).toBe("-45 pts");
    expect(byLabel["Overdue inspections"]).toBe("22");
    expect(report.fileName).toBe("ATLAS-EPI-portfolio-status-2026-11-08.html");
    expect(report.dataTag).toBe("Synthetic data");
  });

  it("lists every exception and a late forecast for PNP126", () => {
    expect(report.exceptions).toHaveLength(12);
    expect(report.highlights.some((line) => line.includes("PNP126 is likely to finish 126 days after the planned end"))).toBe(true);
  });

  it("writes one HTML page with the data tag, the figures and the exceptions", () => {
    const html = reportToHtml(report);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Synthetic data");
    expect(html).toContain("3 of 16");
    expect(html.match(/<tr><td>/g)).toHaveLength(12);
  });

  it("escapes text and translates the interface words", () => {
    const html = reportToHtml({ ...report, highlights: ["A <b>& B"] }, (text) => (text === "Key figures" ? "Angka utama" : text));
    expect(html).toContain("A &lt;b&gt;&amp; B");
    expect(html).toContain("<h2>Angka utama</h2>");
  });
});

describe("report question and screen prompts", () => {
  it("routes generate and weekly-report wording to the right answer", () => {
    expect(matchQuestion("Generate the weekly portfolio report")).toBe("export");
    expect(matchQuestion("Buat laporan portofolio dan unduh")).toBe("export");
    expect(matchQuestion("Draft weekly report week 19")).toBe("report");
  });

  it("suggests questions that fit the screen", () => {
    expect(getPagePrompts("/ptepi/commercial")[0]).toBe("What is blocked from billing?");
    expect(getPagePrompts("/ptepi/project/PNP126/evidence")).toContain("Draft the BAST for PNP126");
    expect(getPagePrompts("/ptepi/somewhere-new")).toHaveLength(3);
  });
});
