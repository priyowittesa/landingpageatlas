import { getIndexNowPayload } from "../lib/seo.ts";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--submit") || args.length > 1) {
  throw new Error("Usage: pnpm seo:indexnow [--submit]");
}

const payload = getIndexNowPayload();
if (!payload) {
  throw new Error("Set a valid HTTPS SITE_URL, SEO_INDEXABLE=true and an 8-128 character INDEXNOW_KEY. Preview/development environments cannot submit.");
}

console.info("Eligible public URLs:", payload.urlList);
if (!args.includes("--submit")) {
  console.info("Dry run only. After deploying and verifying the key file, explicitly pass --submit to notify IndexNow.");
} else {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected the notification (HTTP ${response.status}).`);
  }
  console.info(`IndexNow accepted the notification (HTTP ${response.status}); indexing is not guaranteed.`);
}
