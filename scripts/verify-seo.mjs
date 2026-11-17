import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ATLAS_OVERVIEW,
  getIndexNowKey,
  getIndexNowPayload,
  getLlmsText,
  getPublicMetadata,
  getRobots,
  getSeoConfig,
  getSiteVerification,
  getSitemap,
  getStructuredData,
  LEGACY_APP_SECTIONS,
  PUBLIC_ROBOTS,
  PRIVATE_ROUTE_PREFIXES,
  PUBLIC_PAGES,
  serializeJsonLd
} from "../lib/seo.ts";

// Reserved documentation domain: this is not Atlas's production URL.
const enabled = {
  SITE_URL: "https://atlas.example.com",
  SEO_INDEXABLE: "true",
  NODE_ENV: "production"
};

test("public metadata allows indexing while crawler endpoints require explicit configuration", () => {
  for (const environment of [
    {},
    { SITE_URL: enabled.SITE_URL },
    { SEO_INDEXABLE: "true" },
    { ...enabled, SEO_INDEXABLE: "false" },
    { ...enabled, SEO_INDEXABLE: "TRUE" },
    { ...enabled, NODE_ENV: "development" },
    { ...enabled, VERCEL_ENV: "preview" },
    { ...enabled, VERCEL_ENV: "development" }
  ]) {
    assert.equal(getSeoConfig(environment).indexable, false);
    assert.deepEqual(getRobots(environment), {
      rules: { userAgent: "*", disallow: "/" }
    });
    assert.deepEqual(getSitemap(environment), []);
    assert.equal(getLlmsText(environment), undefined);
    assert.deepEqual(getPublicMetadata("/", environment).robots, {
      index: true,
      follow: true
    });
  }
});

test("root robots metadata contains only index and follow directives", async () => {
  assert.deepEqual(PUBLIC_ROBOTS, { index: true, follow: true });
  const source = await readFile(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /robots:\s*PUBLIC_ROBOTS/);
});

test("only a clean public HTTPS origin is accepted", () => {
  for (const SITE_URL of [
    "",
    "not a URL",
    "/relative",
    "http://atlas.example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://10.0.0.1",
    "https://[::1]",
    "https://atlas.local",
    "https://atlas.internal",
    "https://atlas.example.com/app",
    "https://atlas.example.com/?query=1",
    "https://atlas.example.com/#fragment",
    "https://user:password@atlas.example.com",
    "https://atlas.example.com:8443",
    "https://.",
    "https://atlas..example.com",
    "https://-atlas.example.com"
  ]) {
    const config = getSeoConfig({ ...enabled, SITE_URL });
    assert.equal(config.siteUrl, undefined, SITE_URL);
    assert.equal(config.indexable, false, SITE_URL);
  }
  assert.equal(getSeoConfig(enabled).siteUrl.href, `${enabled.SITE_URL}/`);
  assert.equal(
    getSeoConfig({ ...enabled, VERCEL_ENV: "production" }).indexable,
    true
  );
});

test("authentication/backend origins are never used as canonical fallbacks", () => {
  const environment = {
    NEXTAUTH_URL: "https://login.example.com",
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.com"
  };
  assert.equal(getSeoConfig(environment).siteUrl, undefined);
  const metadata = getPublicMetadata("/", environment);
  assert.equal(metadata.alternates, undefined);
  assert.equal(metadata.openGraph.url, undefined);
  assert.equal(metadata.openGraph.images, undefined);
  assert.doesNotMatch(
    serializeJsonLd(getStructuredData(environment)),
    /example\.com|localhost/
  );
});

test("all public pages have distinct metadata, canonical and social URLs", () => {
  const titles = new Set();
  for (const path of Object.keys(PUBLIC_PAGES)) {
    const metadata = getPublicMetadata(path, enabled);
    titles.add(metadata.title);
    assert.equal(
      metadata.alternates.canonical,
      new URL(path, enabled.SITE_URL).href
    );
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.twitter.description, metadata.description);
    assert.deepEqual(metadata.robots, { index: true, follow: true });
  }
  assert.equal(titles.size, Object.keys(PUBLIC_PAGES).length);
});

test("confirmed Atlas origin produces correct references without publishing crawler endpoints implicitly", () => {
  const SITE_URL = "https://atlas.altimeda.com";
  const configured = { SITE_URL, NODE_ENV: "production" };
  assert.equal(getSeoConfig(configured).siteUrl.href, `${SITE_URL}/`);
  assert.equal(getSeoConfig(configured).indexable, false);
  assert.deepEqual(getSitemap(configured), []);
  assert.deepEqual(getPublicMetadata("/", configured).robots, PUBLIC_ROBOTS);
  for (const path of Object.keys(PUBLIC_PAGES)) {
    const metadata = getPublicMetadata(path, configured);
    assert.equal(metadata.alternates.canonical, new URL(path, SITE_URL).href);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  }
  const published = { ...configured, SEO_INDEXABLE: "true" };
  assert.deepEqual(
    getSitemap(published).map(({ url }) => url),
    Object.keys(PUBLIC_PAGES).map((path) => new URL(path, SITE_URL).href)
  );
  assert.equal(getRobots(published).sitemap, `${SITE_URL}/sitemap.xml`);
  assert.ok(getLlmsText(published).includes(`](${SITE_URL}/)`));
});

test("search/AI bots share one public policy with every private prefix excluded", () => {
  const robots = getRobots(enabled);
  assert.equal(robots.rules.userAgent, "*");
  assert.equal(robots.rules.allow, "/");
  assert.equal(robots.sitemap, `${enabled.SITE_URL}/sitemap.xml`);
  for (const prefix of PRIVATE_ROUTE_PREFIXES) {
    assert.ok(robots.rules.disallow.includes(`/${prefix}`));
  }
  for (const section of LEGACY_APP_SECTIONS) {
    assert.ok(PRIVATE_ROUTE_PREFIXES.includes(section));
  }
  assert.ok(PRIVATE_ROUTE_PREFIXES.includes("api"));
  assert.ok(PRIVATE_ROUTE_PREFIXES.includes("auth"));
});

test("sitemap lists only existing reviewed public pages, without fabricated dates", () => {
  const sitemap = getSitemap(enabled);
  assert.deepEqual(
    sitemap.map(({ url }) => new URL(url).pathname),
    Object.keys(PUBLIC_PAGES)
  );
  assert.ok(sitemap.every((entry) => !("lastModified" in entry)));
  for (const { url } of sitemap) {
    assert.ok(
      !PRIVATE_ROUTE_PREFIXES.some((prefix) =>
        new URL(url).pathname.startsWith(`/${prefix}`)
      )
    );
  }
});

test("structured data uses the same bilingual answers as visible content", () => {
  const graph = getStructuredData(enabled)["@graph"];
  assert.deepEqual(
    graph.map((entry) => entry["@type"]),
    ["Organization", "SoftwareApplication", "FAQPage"]
  );
  assert.equal(graph[0].name, "Altimeda");
  assert.deepEqual(graph[1].provider, { "@id": graph[0]["@id"] });
  assert.equal(graph[1].description, ATLAS_OVERVIEW[0].answer);
  assert.deepEqual(
    graph[2].mainEntity.map((entry) => ({
      language: entry.inLanguage,
      question: entry.name,
      answer: entry.acceptedAnswer.text
    })),
    ATLAS_OVERVIEW
  );
  assert.doesNotMatch(
    serializeJsonLd(graph),
    /offers|aggregateRating|sameAs|Article|DUMMY COPY/
  );
});

test("JSON-LD escapes script-closing content", () => {
  const value = { text: "</script><script>alert(1)</script>" };
  const serialized = serializeJsonLd(value);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), value);
});

test("search engine ownership tokens are optional and use the correct meta names", () => {
  assert.deepEqual(getSiteVerification({}), {});
  assert.deepEqual(
    getSiteVerification({
      GOOGLE_SITE_VERIFICATION: "google-fixture",
      BING_SITE_VERIFICATION: "bing-fixture"
    }),
    { google: "google-fixture", other: { "msvalidate.01": "bing-fixture" } }
  );
});

test("llms.txt contains only public references and the confirmed bilingual description", () => {
  const text = getLlmsText(enabled);
  for (const entry of ATLAS_OVERVIEW) assert.ok(text.includes(entry.answer));
  for (const { url } of getSitemap(enabled))
    assert.ok(text.includes(`](${url})`));
  assert.equal(
    (text.match(/\]\(https:/g) ?? []).length,
    Object.keys(PUBLIC_PAGES).length
  );
});

test("IndexNow validates its public ownership key and uses only sitemap URLs", () => {
  for (const key of [
    "",
    "short",
    "a".repeat(129),
    "has spaces",
    "../key-file",
    "<script>"
  ]) {
    assert.equal(getIndexNowKey({ INDEXNOW_KEY: key }), undefined);
  }
  const environment = { ...enabled, INDEXNOW_KEY: "fixture-key-1234" };
  const payload = getIndexNowPayload(environment);
  assert.equal(payload.host, "atlas.example.com");
  assert.equal(payload.keyLocation, `${enabled.SITE_URL}/indexnow-key.txt`);
  assert.deepEqual(
    payload.urlList,
    getSitemap(enabled).map(({ url }) => url)
  );
  assert.equal(getIndexNowPayload(enabled), undefined);
  assert.equal(
    getIndexNowPayload({ ...environment, SEO_INDEXABLE: "false" }),
    undefined
  );
});

test("IndexNow command defaults to a local dry run", () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./indexnow.mjs", import.meta.url))],
    {
      env: {
        ...process.env,
        ...enabled,
        VERCEL_ENV: "production",
        INDEXNOW_KEY: "fixture-key-1234"
      },
      encoding: "utf8",
      timeout: 10_000
    }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Dry run only/);
  assert.doesNotMatch(result.stdout, /accepted the notification/);
});

test("public rendering never depends on the former loading screen", async () => {
  for (const file of [
    "../components/landingpage/LandingPage.tsx",
    "../components/legal/LegalPage.tsx"
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /LandingLoadingScreen|aria-hidden=\{!isReady\}|visibility: isReady/
    );
  }
  for (const document of ["privacy-policy", "terms-of-service"]) {
    const source = await readFile(
      new URL(`../app/${document}/page.tsx`, import.meta.url),
      "utf8"
    );
    assert.ok(source.includes(`public/atlas-${document}.css`));
    assert.ok(source.includes("public/atlas-legal-common.css"));
  }
});

// Opt-in HTTP checks are restricted to loopback; they never crawl production.
const origin = process.env.SEO_TEST_ORIGIN;
if (origin) {
  const target = new URL(origin);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
  assert.ok(["http:", "https:"].includes(target.protocol));

  test("public HTTP pages contain readable HTML and route-specific metadata without JavaScript", async () => {
    for (const [path, page] of Object.entries(PUBLIC_PAGES)) {
      const response = await fetch(new URL(path, target), {
        redirect: "manual"
      });
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(
        html.includes(`<title>${page.title.replaceAll("&", "&amp;")}</title>`),
        path
      );
      assert.match(html, /<h1\b/);
      assert.doesNotMatch(html, /visibility:hidden|LOADING ATLAS/);
      if (path === "/") {
        const json =
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
            html
          );
        assert.ok(json);
        assert.equal(JSON.parse(json[1])["@graph"].length, 3);
        for (const entry of ATLAS_OVERVIEW)
          assert.ok(html.includes(entry.answer));
      }
    }
  });

  test("private application retains noindex and legacy redirects stay within protected routes", async () => {
    for (const path of [
      "/app/workspace-dashboard",
      "/app/workspace-dashboard/explore-module",
      "/workspace-dashboard",
      "/dashboard"
    ]) {
      const response = await fetch(new URL(path, target), {
        redirect: "manual"
      });
      assert.ok([307, 308].includes(response.status), path);
      if (path.startsWith("/app/")) {
        assert.match(response.headers.get("x-robots-tag"), /noindex/);
      }
      const destination = new URL(response.headers.get("location"), target);
      if (path.startsWith("/app/")) {
        assert.equal(destination.pathname, "/auth/login");
      } else {
        assert.equal(destination.pathname, `/app${path}`);
        const protectedResponse = await fetch(destination, {
          redirect: "manual"
        });
        assert.ok([307, 308].includes(protectedResponse.status), path);
        assert.equal(
          new URL(protectedResponse.headers.get("location"), target).pathname,
          "/auth/login"
        );
      }
    }
    const response = await fetch(new URL("/api/auth/session", target), {
      redirect: "manual"
    });
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
  });

  test("crawler HTTP endpoints match the expected indexing mode", async () => {
    const indexable = process.env.SEO_TEST_INDEXABLE === "true";
    const robots = await fetch(new URL("/robots.txt", target));
    assert.equal(robots.status, 200);
    const rules = await robots.text();
    assert.match(
      rules,
      indexable ? /Allow: \// : /User-Agent: \*\s+Disallow: \/\s*$/
    );
    const sitemap = await fetch(new URL("/sitemap.xml", target));
    assert.equal(sitemap.status, 200);
    const locations = (await sitemap.text()).match(/<loc>/g) ?? [];
    assert.equal(
      locations.length,
      indexable ? Object.keys(PUBLIC_PAGES).length : 0
    );
    const llms = await fetch(new URL("/llms.txt", target));
    assert.equal(llms.status, indexable ? 200 : 404);
    const key = await fetch(new URL("/indexnow-key.txt", target));
    assert.ok(indexable ? [200, 404].includes(key.status) : key.status === 404);
  });
}
