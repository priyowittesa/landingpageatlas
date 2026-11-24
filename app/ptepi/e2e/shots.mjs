/**
 * Full-page screenshots of every /ptepi screen at 1440 and 768 px, logged out.
 *
 *   PTEPI_BASE_URL=http://localhost:3000 node app/ptepi/e2e/shots.mjs
 *
 * Writes PNG files to docs/ptepi/shots/ (git-ignored) and prints any horizontal scroll.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = (process.env.PTEPI_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = path.join("docs", "ptepi", "shots");
const SCREENS = [
  ["s1-portfolio", "/ptepi"],
  ["s2-commercial", "/ptepi/commercial"],
  ["s3-project", "/ptepi/project/PNP126"],
  ["s3-project-pipeline", "/ptepi/project/NK0126"],
  ["s4-evidence", "/ptepi/project/PNP126/evidence"],
  ["s5-cost", "/ptepi/cost"],
  ["s6-service", "/ptepi/service-contracts"],
  ["s7-ask", "/ptepi/ask-atlas"],
  ["s8-actions", "/ptepi/actions"]
];
const WIDTHS = [1440, 768];

async function launchBrowser() {
  let lastError;
  for (const channel of [undefined, "chrome", "msedge"]) {
    try {
      return await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

mkdirSync(OUT, { recursive: true });
const browser = await launchBrowser();
const page = await browser.newPage();
let overflowing = 0;
let clippedTables = 0;

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  for (const [name, route] of SCREENS) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    // Let chart animations and the action tracker seed finish.
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) {
      overflowing += 1;
      console.log(`overflow ${overflow}px: ${name} @${width}`);
    }
    // A table that scrolls sideways inside its card hides its last columns.
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll(".overflow-x-auto")]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => `${el.scrollWidth - el.clientWidth}px: ${el.closest("section")?.querySelector("h2")?.textContent ?? "table"}`)
    );
    for (const message of clipped) {
      clippedTables += 1;
      console.log(`table clipped by ${message} (${name} @${width})`);
    }
    await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: true });
  }
}

await browser.close();
console.log(`${SCREENS.length * WIDTHS.length} screenshots in ${OUT}; ${overflowing} with horizontal scroll, ${clippedTables} clipped tables`);
