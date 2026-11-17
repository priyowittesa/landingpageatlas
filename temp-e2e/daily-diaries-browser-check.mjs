import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = "http://127.0.0.1:4178";
const url = `${base}/temp-e2e/daily-diaries-preview.html`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.goto(url);
await page.locator("article").nth(2).waitFor();
assert.equal(await page.locator("article").count(), 3);
assert.deepEqual(await page.getByRole("progressbar").evaluateAll(nodes =>
  nodes.map(node => node.getAttribute("aria-valuenow"))), ["0", "34", "100"]);
await page.screenshot({ path: "temp-e2e/daily-diaries-desktop.png", fullPage: true });

for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}px`);
  assert.deepEqual(await page.locator("img").evaluateAll(images =>
    images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)), []);
  assert.deepEqual(await page.locator("img").evaluateAll(images => images
    .filter(img => Math.abs(img.getBoundingClientRect().width - Number(img.getAttribute("width"))) > 0.1
      || Math.abs(img.getBoundingClientRect().height - Number(img.getAttribute("height"))) > 0.1)
    .map(img => img.src)), [], `asset geometry at ${width}px`);
  if (width === 390) {
    await page.screenshot({ path: "temp-e2e/daily-diaries-mobile.png", fullPage: true });
  }
}

await page.getByRole("button", { name: "grid view", exact: true }).click();
assert.equal(await page.getByRole("button", { name: "grid view", exact: true }).getAttribute("aria-pressed"), "true");
await page.screenshot({ path: "temp-e2e/daily-diaries-grid.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 900 });
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
await page.getByRole("button", { name: "list view", exact: true }).click();
await page.getByRole("textbox", { name: "Search projects" }).fill("AP0835");
await page.waitForFunction(() => document.querySelectorAll("article").length === 1);
assert.match(await page.locator("article").innerText(), /120 Approved/);
await page.getByRole("textbox", { name: "Search projects" }).fill("missing");
await page.getByText("No projects found", { exact: true }).waitFor();
await page.getByRole("textbox", { name: "Search projects" }).fill("error");
await page.getByRole("alert").waitFor();
assert.match(await page.getByRole("alert").innerText(), /Unable to load projects/);
await page.getByRole("textbox", { name: "Search projects" }).fill("");
await page.locator("article").nth(2).waitFor();

const controls = await (await fetch(`${base}/fixture/control?fail=true`)).json();
assert.ok(controls.diaryRequests >= 7, "loads all summary pages");
await page.reload();
await page.getByRole("alert").waitFor();
assert.match(await page.getByRole("alert").innerText(), /Unable to load diary summaries/);
assert.equal(await page.locator("article").count(), 0);
await fetch(`${base}/fixture/control?fail=false`);
await page.getByRole("button", { name: "Try again", exact: true }).click();
await page.locator("article").nth(2).waitFor();
assert.equal(await page.locator("article").count(), 3);
assert.equal(await page.getByRole("link", { name: "Open Projects" }).first().getAttribute("href"),
  "/app/daily-diaries/daily-activities/project-0");
assert.deepEqual(errors, []);
await browser.close();
console.log("PASS: desktop and 320/390/768/1024px layouts, exact icon geometry, grid/list toggle, debounced search, empty/error/retry states, complete diary pagination, project links, and no browser exceptions.");
