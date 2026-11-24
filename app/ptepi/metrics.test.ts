import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { epiData } from "./data";
import { formatPercent, formatPoints } from "./format";
import { METRICS, getMetric } from "./metrics";
import * as actionHelpers from "./store/action-helpers";
import * as selectors from "./selectors";
import {
  CRITICAL_ITEM_LAG_PTS,
  DEVIATION_ALERT_PTS,
  DEVIATION_CRITICAL_PTS,
  OVERDUE_ALERT_DAYS,
  RETENTION_ALERT_DAYS
} from "./thresholds";

describe("metric dictionary", () => {
  it("has unique ids and a one-line formula for every metric", () => {
    const ids = METRICS.map((metric) => metric.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const metric of METRICS) {
      expect(metric.label.length, metric.id).toBeGreaterThan(2);
      expect(metric.formula, metric.id).not.toContain("\n");
      expect(metric.formula.length, metric.id).toBeGreaterThan(20);
      expect(metric.formula.length, metric.id).toBeLessThanOrEqual(160);
      expect(metric.screens.length, metric.id).toBeGreaterThan(0);
    }
  });

  it("points every metric at a selector that exists", () => {
    const modules: Record<string, Record<string, unknown>> = {
      selectors: selectors as Record<string, unknown>,
      "action-helpers": actionHelpers as Record<string, unknown>
    };
    for (const metric of METRICS) {
      const [moduleName, functionName] = metric.owner.split(".");
      const owner = modules[moduleName ?? ""]?.[functionName ?? ""];
      expect(typeof owner, `${metric.id} -> ${metric.owner}`).toBe("function");
    }
  });

  it("states thresholds from the single threshold file", () => {
    expect(getMetric("deviation").threshold).toContain(String(DEVIATION_ALERT_PTS));
    expect(getMetric("deviation").threshold).toContain(String(DEVIATION_CRITICAL_PTS));
    expect(getMetric("criticalItemLag").threshold).toContain(String(CRITICAL_ITEM_LAG_PTS));
    expect(getMetric("invoiceOverdue").threshold).toContain(String(OVERDUE_ALERT_DAYS));
    expect(getMetric("retentionHeld").threshold).toContain(String(RETENTION_ALERT_DAYS));
  });

  it("has the thresholds of the requirements", () => {
    expect([DEVIATION_ALERT_PTS, CRITICAL_ITEM_LAG_PTS, OVERDUE_ALERT_DAYS, RETENTION_ALERT_DAYS]).toEqual([
      10, 20, 30, 180
    ]);
  });
});

describe("PNP126 week 18 through the owners of the metrics", () => {
  const progress = selectors.getProjectProgress(epiData, "PNP126");

  it("plan 73,487%, actual 28,498%, deviation -44,989", () => {
    expect(formatPercent(progress.plan ?? 0)).toBe("73,487%");
    expect(formatPercent(progress.actual ?? 0)).toBe("28,498%");
    expect(formatPoints(progress.deviationPts ?? 0)).toBe("-44,989 pts");
  });

  it("deviation is (actual - plan) x 100 as the dictionary says", () => {
    expect(getMetric("deviation").formula).toContain("(Actual - plan) x 100");
    expect(((progress.actual ?? 0) - (progress.plan ?? 0)) * 100).toBeCloseTo(progress.deviationPts ?? 0, 3);
  });

  it("cost Rp 239.270.000 and margin 22,26% follow the margin formula", () => {
    const money = selectors.getCostMargin(epiData, "PNP126");
    expect(money.cost).toBe(239_270_000);
    expect((money.recognisedRevenue - money.cost) / money.recognisedRevenue).toBeCloseTo(money.margin ?? 0, 10);
    expect(formatPercent(money.margin ?? 0, 2)).toBe("22,26%");
  });

  it("required pace is the points left over the weeks left", () => {
    const recovery = selectors.getRecoveryRate(epiData, "PNP126");
    expect(recovery?.requiredPerWeek).toBeCloseTo((recovery?.remainingPts ?? 0) / (recovery?.weeksRemaining ?? 1), 3);
  });
});

describe("no screen types a number or a date the data already knows", () => {
  const root = path.join(__dirname);
  const files: string[] = [];
  const walk = (directory: string) => {
    for (const name of readdirSync(directory)) {
      const full = path.join(directory, name);
      if (statSync(full).isDirectory()) {
        if (name !== "e2e" && name !== "data") walk(full);
      } else if (/\.tsx$/.test(name)) {
        files.push(full);
      }
    }
  };
  walk(root);

  it("finds the screens", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it("does not hardcode the as-at date, the PNP126 contract value or the project count", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const banned of ["8 Nov 2026", "1.080,0", "All 16", "73,487", "28,498", "44,989"]) {
        if (text.includes(banned)) offenders.push(`${path.relative(root, file)}: ${banned}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
