import {
  formatDate,
  formatDecimal,
  formatPercent,
  formatPoints,
  formatRupiahMillions
} from "../format";
import {
  getAsAtLabel,
  getAttentionGroups,
  getBillingRows,
  getBillingSummary,
  getPortfolioHeadline,
  getPortfolioTotals,
  getProjectForecast,
  getRevenueTrio,
  getServiceSummary,
  getWeekCard
} from "../selectors";
import type { EpiDemoData } from "../types";

/** One figure of the report, as shown in the chat and in the file. */
export type ReportKpi = { label: string; value: string };

/** The weekly portfolio status report: governed numbers only, nothing typed by hand. */
export type PortfolioReport = {
  title: string;
  fileName: string;
  asAt: string;
  asAtLabel: string;
  kpis: ReportKpi[];
  highlights: string[];
  exceptions: { projectId: string; label: string; severity: "high" | "medium" }[];
  /** Every export carries the data tag (NF-06) */
  dataTag: string;
};

const HERO = "PNP126";

/**
 * The report Nexa hands over: headline KPIs of the portfolio, what needs attention, and the
 * PNP126 position. Built from the same selectors as the screens, so the numbers match them.
 */
export function buildPortfolioReport(data: EpiDemoData): PortfolioReport {
  const headline = getPortfolioHeadline(data);
  const totals = getPortfolioTotals(data);
  const revenue = getRevenueTrio(data);
  const billing = getBillingSummary(getBillingRows(data));
  const service = getServiceSummary(data);
  const week = getWeekCard(data, HERO);
  const forecast = getProjectForecast(data, HERO);

  const exceptions = getAttentionGroups(data).flatMap((group) =>
    group.items.map((item) => ({ projectId: item.projectId, label: item.label, severity: group.severity }))
  );

  return {
    title: "Weekly portfolio status report",
    fileName: `ATLAS-EPI-portfolio-status-${data.asAt}.html`,
    asAt: data.asAt,
    asAtLabel: getAsAtLabel(data),
    kpis: [
      { label: "Projects at risk", value: `${headline.atRisk} of ${headline.total}` },
      { label: "Value at risk", value: formatRupiahMillions(headline.atRiskValue) },
      { label: "Recognised revenue", value: formatRupiahMillions(revenue.recognisedRevenue) },
      { label: "Billed share", value: formatPercent(totals.billedShare, 1) },
      { label: "Retensi held", value: formatRupiahMillions(totals.retentionHeld) },
      { label: "Blocked from billing", value: formatRupiahMillions(billing.blocked.amount) },
      { label: "Overdue inspections", value: String(service.overdueInspections) },
      ...(week && week.deviationPts !== null ? [{ label: `${HERO} deviation`, value: formatPoints(week.deviationPts) }] : [])
    ],
    highlights: [
      `${headline.watch} more projects are on watch. ${formatRupiahMillions(headline.atRiskValue)} of the portfolio value sits in at-risk projects.`,
      `${billing.blocked.count} payment stages worth ${formatRupiahMillions(billing.blocked.amount)} are blocked from billing.`,
      ...(forecast && forecast.floatDays !== null && forecast.finishDate && forecast.floatDays < 0
        ? [
            `${HERO} is likely to finish ${-forecast.floatDays} days after the planned end: at the best 4-week pace of ${formatDecimal(forecast.pacePerWeek, 1)} points per week it reaches 100% on ${formatDate(forecast.finishDate)}.`
          ]
        : [])
    ],
    exceptions,
    dataTag: "Synthetic data"
  };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The report as one self-contained HTML page: opens in any browser and prints to PDF.
 * `t` translates the interface text into the reader's language; the numbers stay as they are.
 */
export function reportToHtml(report: PortfolioReport, t: (text: string) => string = (text) => text): string {
  const kpis = report.kpis
    .map((kpi) => `<div class="kpi"><div class="kl">${escapeHtml(t(kpi.label))}</div><div class="kv">${escapeHtml(t(kpi.value))}</div></div>`)
    .join("");
  const highlights = report.highlights.map((line) => `<li>${escapeHtml(t(line))}</li>`).join("");
  const exceptions = report.exceptions
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.projectId)}</td><td>${escapeHtml(t(item.label))}</td><td>${escapeHtml(t(item.severity === "high" ? "Act now" : "Watch"))}</td></tr>`
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(t(report.title))}</title>
<style>
  body { font-family: system-ui, "Segoe UI", sans-serif; color: #1f1b2e; max-width: 56rem; margin: 2rem auto; padding: 0 1.25rem; line-height: 1.5; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.05rem; margin: 2rem 0 .75rem; color: #5b21b6; }
  .meta { color: #52525b; font-size: .9rem; }
  .tag { display: inline-block; background: #fef3c7; color: #78350f; border-radius: 999px; padding: .1rem .7rem; font-weight: 600; font-size: .8rem; margin-right: .5rem; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: .75rem; }
  .kpi { border: 1px solid #ddd6fe; border-radius: .6rem; padding: .7rem .9rem; background: #faf5ff; }
  .kl { font-size: .8rem; color: #52525b; } .kv { font-size: 1.25rem; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: .92rem; }
  th, td { text-align: left; padding: .45rem .5rem; border-bottom: 1px solid #e4e4e7; }
  th { color: #52525b; font-weight: 600; }
  footer { margin-top: 2.5rem; font-size: .8rem; color: #71717a; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>${escapeHtml(t(report.title))}</h1>
<p class="meta"><span class="tag">${escapeHtml(t(report.dataTag))}</span>${escapeHtml(t("Demo snapshot as at"))} ${escapeHtml(report.asAtLabel)}</p>
<h2>${escapeHtml(t("Key figures"))}</h2>
<div class="kpis">${kpis}</div>
<h2>${escapeHtml(t("Highlights"))}</h2>
<ul>${highlights}</ul>
<h2>${escapeHtml(t("Needs attention"))}</h2>
<table><thead><tr><th>${escapeHtml(t("Project"))}</th><th>${escapeHtml(t("Exception"))}</th><th>${escapeHtml(t("Severity"))}</th></tr></thead><tbody>${exceptions}</tbody></table>
<footer>${escapeHtml(t("Generated by ATLAS from the governed demo data. A person approves before it is shared."))}</footer>
</body>
</html>
`;
}

/** Saves the report as a file in the browser; nothing is sent anywhere. */
export function downloadReport(report: PortfolioReport, t?: (text: string) => string): void {
  const blob = new Blob([reportToHtml(report, t)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
