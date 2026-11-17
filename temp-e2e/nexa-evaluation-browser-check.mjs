import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
const apiRequests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (/\/(?:api|v1)\//.test(request.url())) apiRequests.push(request.url());
});
await page.goto("http://127.0.0.1:4179/temp-e2e/nexa-evaluation-preview.html");
await page.getByRole("heading", { name: "NEXA Evaluation", exact: true }).waitFor();
assert.equal(await page.getByRole("group", { name: /^Review:/ }).count(), 5);
await page.screenshot({ path: "temp-e2e/nexa-evaluation-desktop.png", fullPage: true });

for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  assert.equal(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}px`);
  assert.deepEqual(await page.locator("img").evaluateAll((images) =>
    images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)
  ), [], `missing image at ${width}px`);
  assert.deepEqual(await page.locator("img").evaluateAll((images) => images.filter((image) => {
    const bounds = image.getBoundingClientRect();
    return Math.abs(bounds.width - Number(image.getAttribute("width"))) > 0.1
      || Math.abs(bounds.height - Number(image.getAttribute("height"))) > 0.1;
  }).map((image) => image.src)), [], `asset geometry at ${width}px`);
  if (width === 390) await page.screenshot({ path: "temp-e2e/nexa-evaluation-mobile.png", fullPage: true });
}

const history = page.getByLabel("Evaluation check history");
await history.getByRole("button", { name: /^1 Oct 2026/ }).click();
await page.getByText("All answers reviewed", { exact: true }).waitFor();
await history.getByRole("button", { name: /^29 Oct 2026/ }).click();
const workflowReview = page.getByRole("group", { name: "Review: Save the workflow changes.", exact: true });
await workflowReview.getByRole("button", { name: "NEXA is Right", exact: true }).click();
assert.match(await history.innerText(), /2 of 5 answers to review/);
await workflowReview.getByRole("button", { name: "NEXA is Wrong", exact: true }).click();
assert.match(await history.innerText(), /2 of 5 answers to review/);
assert.equal(await workflowReview.getByRole("button", { name: "NEXA is Wrong" }).getAttribute("aria-pressed"), "true");
await history.getByRole("button", { name: /^1 Oct 2026/ }).click();
await history.getByRole("button", { name: /^29 Oct 2026/ }).click();
assert.equal(await page.getByRole("group", { name: "Review: Save the workflow changes.", exact: true })
  .getByRole("button", { name: "NEXA is Wrong" }).getAttribute("aria-pressed"), "true");

await page.getByRole("button", { name: "Open chat: Which vendor shipped the most this month?" }).click();
await page.getByRole("dialog").getByRole("heading", { name: "Chat Preview" }).waitFor();
assert.match(await page.getByRole("dialog").innerText(), /Top vendor: PT Baja Utama/);
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "Export to Excel", exact: true }).click();
assert.match(await page.getByRole("dialog").innerText(), /Export is not connected yet/);
await page.keyboard.press("Escape");

await page.getByRole("button", { name: "Check Now", exact: true }).click();
let dialog = page.getByRole("dialog");
await dialog.getByRole("tab", { name: "Last 30 days", exact: true }).click();
assert.match(await dialog.innerText(), /The 30 days before today/);
await dialog.getByRole("tab", { name: "Custom", exact: true }).click();
assert.equal(await dialog.getByRole("button", { name: "Start", exact: true }).isDisabled(), true);
await dialog.getByRole("group", { name: "Start Date", exact: true }).getByRole("button").click();
await page.locator("button[data-day]:enabled").first().click();
assert.equal(await dialog.getByRole("button", { name: "Start", exact: true }).isDisabled(), true);
await dialog.getByRole("group", { name: "End Date", exact: true }).getByRole("button").click();
await page.locator("button[data-day]:enabled").last().click();
assert.equal(await dialog.getByRole("button", { name: "Start", exact: true }).isDisabled(), false);
await dialog.getByRole("button", { name: "Advanced Settings", exact: true }).click();
await dialog.getByRole("combobox", { name: "Flag answers below" }).click();
await page.getByRole("option", { name: "75% supported", exact: true }).click();
await page.waitForTimeout(250);
await page.screenshot({ path: "temp-e2e/nexa-evaluation-dialog.png", fullPage: true });
await dialog.getByRole("tab", { name: "Since last check", exact: true }).click();
await dialog.getByRole("combobox", { name: "Tenant", exact: true }).click();
await page.getByRole("option", { name: "PT Maju Sejahtera", exact: true }).click();
assert.match(await dialog.innerText(), /32/);
await dialog.getByRole("button", { name: "Start", exact: true }).click();
await page.getByRole("button", { name: "Stop Check", exact: true }).waitFor();
await page.getByRole("button", { name: "Stop Check", exact: true }).click();
await page.getByText("Preview check stopped", { exact: true }).waitFor();
await page.waitForTimeout(2200);
assert.equal(await history.getByRole("button").count(), 4);

await page.getByRole("button", { name: "Check Now", exact: true }).click();
dialog = page.getByRole("dialog");
await dialog.getByRole("button", { name: "Start", exact: true }).click();
await page.getByText(/Sample check complete/).waitFor({ timeout: 15000 });
assert.equal(await history.getByRole("button").count(), 5);
assert.equal(await page.getByRole("group", { name: /^Review:/ }).count(), 3);
await history.getByRole("button", { name: /^15 Oct 2026/ }).click();
await page.getByRole("heading", { name: "This check was interrupted" }).waitFor();
await page.getByRole("button", { name: "Resume Check", exact: true }).click();
await page.getByRole("button", { name: "Stop Check", exact: true }).waitFor();
await page.getByText(/Sample check complete/).waitFor({ timeout: 15000 });
assert.equal(await history.getByRole("button").count(), 5);
assert.doesNotMatch(await history.innerText(), /Resume available/);

await page.setViewportSize({ width: 320, height: 720 });
await page.getByRole("button", { name: "Check Now", exact: true }).click();
dialog = page.getByRole("dialog");
assert.equal(await dialog.evaluate((element) => element.scrollHeight > element.clientHeight), true);
assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
assert.deepEqual(errors, []);
assert.deepEqual(apiRequests, [], "UI should not call any APIs");
await browser.close();
console.log("PASS: responsive layouts, local asset geometry, history, isolated reviews, chat/export previews, settings, validation, start/stop/complete/resume, and zero API requests or browser errors.");
