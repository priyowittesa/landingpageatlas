/**
 * Playwright smoke test for the public /ptepi prototype, run logged out.
 *
 *   PTEPI_BASE_URL=http://localhost:3000 node app/ptepi/e2e/smoke.mjs
 *
 * Needs a running server (pnpm dev, or pnpm build then pnpm start) and the
 * Playwright Chromium browser. Exits with code 1 when any check fails.
 */
import { chromium } from "playwright";

const BASE = (process.env.PTEPI_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PROJECT_IDS = [
  "TPK125", "GS125", "PTP125", "PTP1025", "PTP1125", "PSL0326", "PNP126", "PTP1425",
  "PSL0126", "PSL0226", "PSL0426", "TPK0226", "IKT0126", "JICT0326", "GS0326", "NK0126"
];
const MAIN_ROUTES = [
  "/ptepi",
  "/ptepi/project/PNP126",
  "/ptepi/project/PNP126/evidence",
  "/ptepi/commercial",
  "/ptepi/commercial?project=PNP126",
  "/ptepi/cost",
  "/ptepi/cost?project=PNP126",
  "/ptepi/ask-atlas",
  "/ptepi/actions",
  "/ptepi/service-contracts",
  "/ptepi/workflows",
  "/ptepi/connections",
  "/ptepi/knowledge-base",
  "/ptepi/knowledge-source",
  "/ptepi/audit-log"
];
const ROUTES = [
  ...MAIN_ROUTES,
  ...PROJECT_IDS.filter((id) => id !== "PNP126").flatMap((id) => [
    `/ptepi/project/${id}`,
    `/ptepi/project/${id}/evidence`
  ])
];
const WIDTHS = [768, 1024, 1440];
const TAG = /Synthetic data|Actual data|Data sintetis|Data aktual/;

const failures = [];
const notes = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

/** Playwright's own Chromium first, then the Chrome or Edge already installed on the machine. */
async function launchBrowser() {
  const attempts = [undefined, "chrome", "msedge"];
  let lastError;
  for (const channel of attempts) {
    try {
      return await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// The demo opens in Bahasa Indonesia; first check that, then run the checks in English.
{
  const fresh = await browser.newPage();
  await fresh.goto(BASE + "/ptepi", { waitUntil: "networkidle" });
  if ((await fresh.getByText("Kesehatan portofolio").count()) === 0) fail("/ptepi", "default language should be Bahasa Indonesia");
  await fresh.close();
}
await context.addInitScript(() => {
  window.localStorage.setItem("ptepi-language", JSON.stringify({ state: { language: "en" }, version: 0 }));
});
const page = await context.newPage();

const consoleErrors = [];
const apiRequests = new Set();
page.on("pageerror", (error) => consoleErrors.push(`pageerror ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(`console ${message.text()}`);
});
page.on("request", (request) => {
  const url = new URL(request.url());
  if (url.origin === BASE && /^\/(api|v1)\//.test(url.pathname)) apiRequests.add(url.pathname);
});

const links = new Set();
const authFailureRoutes = new Set();
// The root layout (outside app/ptepi) asks next-auth for a session on every page.
// When the server has no auth config that call fails; it is reported once as a note, not per route.
let failedAuthCalls = 0;
page.on("response", (response) => {
  if (new URL(response.url()).pathname.startsWith("/api/auth/") && !response.ok()) failedAuthCalls += 1;
});
const isAuthNoise = (message) => /next-auth|\/api\/auth/.test(message);

async function visit(route) {
  consoleErrors.length = 0;
  failedAuthCalls = 0;
  const response = await page.goto(BASE + route, { waitUntil: "networkidle" });
  if (!response || response.status() !== 200) {
    fail(route, `status ${response?.status() ?? "none"}`);
    return false;
  }
  const url = new URL(page.url());
  if (!url.pathname.startsWith("/ptepi")) {
    fail(route, `redirected away to ${url.pathname}`);
    return false;
  }
  if ((await page.locator("h1").count()) !== 1) fail(route, "expected exactly one h1");
  let tolerated = failedAuthCalls;
  for (const message of consoleErrors) {
    if (isAuthNoise(message)) continue;
    if (tolerated > 0 && message.includes("Failed to load resource")) {
      tolerated -= 1;
      continue;
    }
    fail(route, message);
  }
  if (failedAuthCalls > 0) authFailureRoutes.add(route);
  for (const href of await page.locator('a[href^="/ptepi"]').evaluateAll((anchors) =>
    anchors.map((a) => a.getAttribute("href"))
  )) {
    links.add(href.split("#")[0]);
  }
  return true;
}

// 1. Every route loads logged out, with the shell, a tag and no console error.
for (const route of ROUTES) {
  if (!(await visit(route))) continue;
  if ((await page.locator("aside nav a").count()) !== 13) fail(route, "sidebar should have 13 links");
  if ((await page.locator("aside nav a[aria-current], aside nav a.bg-primary-700").count()) < 1) {
    fail(route, "no active sidebar item");
  }
  const body = await page.locator("main").innerText();
  if (route !== "/ptepi/ask-atlas" && !TAG.test(body)) fail(route, "no Synthetic data / Actual data tag");
  if (/NaN|undefined|\[object Object\]/.test(body)) fail(route, "broken value in text (NaN, undefined)");
}

// 2. Unknown project ids give a 404, not a crash.
const missing = await page.goto(`${BASE}/ptepi/project/NOPE`);
if (missing?.status() !== 404) fail("/ptepi/project/NOPE", `expected 404, got ${missing?.status()}`);

// 3. Every internal /ptepi link found on the pages answers 200.
for (const href of links) {
  const response = await context.request.get(BASE + href);
  if (response.status() !== 200) fail(`link ${href}`, `status ${response.status()}`);
}
notes.push(`${links.size} distinct /ptepi links checked`);

// 4. No horizontal page overflow on tablet and desktop.
for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of MAIN_ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    if (overflow > 1) fail(`${route} @${width}px`, `page overflows by ${overflow}px`);
  }
}
await page.setViewportSize({ width: 1440, height: 900 });

// 5. Keyboard: Tab reaches interactive elements and each shows a visible focus indicator.
async function focusAudit(route) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  const seen = new Set();
  for (let step = 0; step < 45; step += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      // The Next.js dev overlay is not part of the app.
      if (!el || el === document.body || el.tagName === "NEXTJS-PORTAL") return null;
      const style = getComputedStyle(el);
      const ringed =
        (parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== "none") ||
        (style.boxShadow && style.boxShadow !== "none");
      const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40);
      return { ringed: Boolean(ringed), label, tag: el.tagName };
    });
    if (!info) continue;
    const key = `${info.tag}:${info.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!info.ringed) fail(`${route} focus`, `no visible focus indicator on ${key}`);
  }
  if (seen.size < 10) fail(`${route} focus`, `only ${seen.size} focusable elements reached`);
}
for (const route of ["/ptepi", "/ptepi/actions", "/ptepi/ask-atlas"]) await focusAudit(route);

// 6. Text contrast (WCAG AA 4.5:1, 3:1 for large text) on the main routes.
const contrastScript = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  // Painting one pixel resolves every colour space (oklch, color-mix) to plain RGBA.
  const toRgb = (color) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };
  const lum = ({ r, g, b }) => {
    const c = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  // Every colour the text may sit on: a gradient counts as all of its colour stops.
  const stopPattern = /(?:rgba?|oklab|oklch|lab|lch|color|hsla?)([^)]*)/g;
  const backgrounds = (el) => {
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage.includes("gradient")) {
        const stops = (style.backgroundImage.match(stopPattern) ?? [])
          .map(toRgb)
          .filter((stop) => stop.a > 0.99);
        if (stops.length > 0) return stops;
      }
      const bg = toRgb(style.backgroundColor);
      if (bg && bg.a > 0.99) return [bg];
    }
    return [{ r: 255, g: 255, b: 255, a: 1 }];
  };
  const found = new Map();
  for (const el of document.querySelectorAll("main *, header *, aside *")) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own || el.closest("svg") || el.closest("[hidden]")) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.opacity === "0") continue;
    const fg = toRgb(style.color);
    const bgs = backgrounds(el);
    if (!fg) continue;
    const l1 = lum(fg);
    const ratio = Math.min(
      ...bgs.map((bg) => {
        const l2 = lum(bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      })
    );
    const bg = bgs[0];
    const size = parseFloat(style.fontSize);
    const bold = parseInt(style.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio < need) {
      const key = `${el.textContent.trim().slice(0, 36)} | ${style.color} on rgb(${bg.r},${bg.g},${bg.b})`;
      found.set(key, ratio.toFixed(2));
    }
  }
  return [...found.entries()].map(([key, ratio]) => `${key} = ${ratio}:1`);
};
for (const route of MAIN_ROUTES) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  for (const issue of await page.evaluate(contrastScript)) fail(`${route} contrast`, issue);
}

// 7. Click paths of the demo: no dead buttons.
async function flows() {
  // S1: row click opens the project cockpit.
  await page.goto(`${BASE}/ptepi`, { waitUntil: "networkidle" });
  await page.getByRole("row", { name: /PNP126/ }).first().click();
  await page.waitForURL("**/ptepi/project/PNP126");
  for (const text of ["73,5%", "28,5%", "-45 pts"]) {
    if ((await page.getByText(text).count()) === 0) fail("S3 PNP126", `missing ${text}`);
  }

  // S3: the critical-item callout leads to the evidence gate.
  await page.getByRole("link", { name: /Open evidence gate/ }).click();
  await page.waitForURL("**/ptepi/project/PNP126/evidence");

  // S4: a blocked stage opens a dialog; the transformer PO issue is already tracked by EXC-03
  // (seeded when the tracker was visited above), so no duplicate is created.
  await page.getByRole("button", { name: /Stage 2 Confirmation Order/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await dialog.getByText(/Already tracked as EXC-03/).waitFor();
  await page.keyboard.press("Escape");

  // S2: blocked rows link to the evidence gate.
  await page.goto(`${BASE}/ptepi/commercial`, { waitUntil: "networkidle" });
  const evidenceLinks = await page.getByRole("link", { name: "View evidence" }).count();
  if (evidenceLinks < 1) fail("S2", "no View evidence link on blocked rows");

  // S5: the project filter changes the cost view (all projects by default).
  await page.goto(`${BASE}/ptepi/cost`, { waitUntil: "networkidle" });
  await page.getByText("Cost by project").waitFor();
  await page.getByRole("button", { name: "Filter by project" }).click();
  await page.getByRole("option", { name: /PSL0126/ }).click();
  await page.getByText("Cost lines: PSL0126").waitFor();

  // S6: the Inspections tab switches.
  await page.goto(`${BASE}/ptepi/service-contracts`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Inspections/ }).click();
  await page.getByText(/of 173 entries/).waitFor();

  // S7: a chip answers, and its action shows up in S8 (same page session, in-memory store).
  await page.goto(`${BASE}/ptepi/ask-atlas`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "What is blocked from billing?" }).first().click();
  await page.getByText(/payment stages worth/).first().waitFor();
  // Every billing issue is already tracked by a seeded exception: no duplicates.
  if ((await page.getByRole("button", { name: "Create action" }).count()) > 0) {
    fail("S7", "billing actions should dedupe to the seeded exceptions");
  }
  await page.getByText(/Already tracked as EXC-/).first().waitFor();
  await page.getByRole("link", { name: "Action Tracker", exact: true }).first().click();
  await page.waitForURL("**/ptepi/actions");
  if ((await page.getByText("EXC-01").count()) === 0) fail("S8", "seeded EXC-01 missing");

  // S8: role switcher disables Close for a Project Manager on a Finance action, Director can close.
  const closeButtons = page.getByRole("button", { name: "Close", exact: true });
  if ((await closeButtons.first().isEnabled()) !== false) {
    fail("S8", "Project Manager should not be able to close");
  }
  await page.getByRole("combobox", { name: "Demo role" }).click();
  await page.getByRole("option", { name: /Director/ }).click();
  if ((await closeButtons.first().isEnabled()) !== true) fail("S8", "Director should be able to close");
}
try {
  await flows();
} catch (error) {
  fail("flow", error instanceof Error ? error.message.split("\n").slice(0, 3).join(" | ") : String(error));
}

await browser.close();

if (apiRequests.size > 0) {
  notes.push(`requests to /api or /v1 seen (root layout, not app/ptepi): ${[...apiRequests].join(", ")}`);
}
if (authFailureRoutes.size > 0) {
  notes.push(`root layout /api/auth call failed on ${authFailureRoutes.size} routes (server has no auth config)`);
}
for (const note of notes) console.log(`note: ${note}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):`);
  for (const message of failures) console.error(` - ${message}`);
  process.exit(1);
}
console.log(`ptepi smoke test passed: ${ROUTES.length} routes, logged out.`);
