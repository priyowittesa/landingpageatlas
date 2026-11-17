import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { collectPageRoutes } from "./collect-page-routes";
import { createPageRouteMatcher, hasPageRoute } from "./page-routes";

const appDirectory = fileURLToPath(new URL("../app", import.meta.url));
const routes = collectPageRoutes(appDirectory);

describe("page route collection", () => {
  it("collects pages, not layouts or handlers, and respects URL-neutral folders", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "atlas-page-routes-"));
    const files = [
      "page.tsx",
      "app/master-data/layout.tsx",
      "app/master-data/products/page.tsx",
      "app/items/[id]/page.ts",
      "app/docs/[[...slug]]/page.jsx",
      "(public)/help/page.js",
      "(public)/help/@panel/page.tsx",
      "app/@modal/(.)photo/[id]/page.tsx",
      "app/@modal/(..)photo/[id]/page.tsx",
      "app/@modal/(...)photo/[id]/page.tsx",
      "app/_private/page.tsx",
      "app/components/page.test.tsx",
      "api/health/route.ts"
    ];

    try {
      for (const file of files) {
        const destination = path.join(directory, file);
        mkdirSync(path.dirname(destination), { recursive: true });
        writeFileSync(destination, "");
      }

      expect(collectPageRoutes(directory)).toEqual([
        "/",
        "/app/docs/[[...slug]]",
        "/app/items/[id]",
        "/app/master-data/products",
        "/help"
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("inlines the current page routes in the Next.js configuration", () => {
    expect(JSON.parse(nextConfig.env!.ATLAS_PAGE_ROUTES!)).toEqual(routes);
  });
});

describe("page route matching", () => {
  it.each([
    "/app/master-data",
    "/app/ai-studio",
    "/app/asset-management",
    "/app/daily-diaries",
    "/app/labour-rostering",
    "/app/operation-intelligence",
    "/app/master-data/employee/employee-1",
    "/app/inspection/templates/family-1"
  ])("does not treat the missing parent %s as a page", (href) => {
    expect(hasPageRoute(href)).toBe(false);
  });

  it.each([
    "/",
    "/app",
    "/app/master-data/employee",
    "/app/ai-studio/workflow",
    "/app/token-usage",
    "/app/inspection",
    "/app/product-development/requests/request-1",
    "/app/synergy-intelligence/scheduled/task-1"
  ])("recognizes the existing page %s", (href) => {
    expect(hasPageRoute(href)).toBe(true);
  });

  it.each(routes)("recognizes the concrete URL for page pattern %s", (route) => {
    const href = route
      .replace(/\[\[\.\.\.[^\]]+\]\]/g, "first/second")
      .replace(/\[\.\.\.[^\]]+\]/g, "first/second")
      .replace(/\[[^\]]+\]/g, "resource-1");
    expect(hasPageRoute(href)).toBe(true);
  });

  it("allows query strings, fragments, and trailing slashes on existing pages", () => {
    expect(hasPageRoute("/app/master-data/products/?tab=active#top")).toBe(true);
    expect(hasPageRoute("/app/master-data/?tab=active#top")).toBe(false);
  });

  it.each([
    undefined,
    "",
    "app/master-data/products",
    "https://example.test/app/master-data/products",
    "//example.test/app/master-data/products",
    "javascript:alert(1)"
  ])("does not link non-local or missing href %s", (href) => {
    expect(hasPageRoute(href)).toBe(false);
  });

  it("requires exactly one segment for dynamic parameters", () => {
    const matches = createPageRouteMatcher(["/app/items/[id]/edit"]);
    expect(matches("/app/items/item-1/edit")).toBe(true);
    expect(matches("/app/items/edit")).toBe(false);
    expect(matches("/app/items/item-1/extra/edit")).toBe(false);
    expect(matches("/app/items//edit")).toBe(false);
  });

  it("requires at least one segment for catch-all routes", () => {
    const matches = createPageRouteMatcher(["/app/files/[...path]"]);
    expect(matches("/app/files/first")).toBe(true);
    expect(matches("/app/files/first/second")).toBe(true);
    expect(matches("/app/files")).toBe(false);
  });

  it("allows no segments for optional catch-all routes", () => {
    const matches = createPageRouteMatcher(["/app/docs/[[...path]]"]);
    expect(matches("/app/docs")).toBe(true);
    expect(matches("/app/docs/")).toBe(true);
    expect(matches("/app/docs/first/second")).toBe(true);
    expect(matches("/app")).toBe(false);
  });

  it("matches static segments literally", () => {
    const matches = createPageRouteMatcher(["/app/reports.v2"]);
    expect(matches("/app/reports.v2")).toBe(true);
    expect(matches("/app/reports-v2")).toBe(false);
  });
});
