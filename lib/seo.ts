import type { Metadata, MetadataRoute } from "next";

type Environment = Record<string, string | undefined>;

export const LEGACY_APP_SECTIONS = [
  "ai-studio", "asset-management", "campaign-brief", "capacity-analytic",
  "daily-diaries", "dashboard", "inspection", "labour-rostering", "master-data",
  "product-development", "profile", "role-access-management", "setting",
  "settings", "strategy-planner", "synergy-intelligence", "token-usage",
  "workspace-dashboard",
] as const;

export const PRIVATE_ROUTE_PREFIXES = [
  "app", "api", "auth", "onboarding", "error", "unauthorized",
  ...LEGACY_APP_SECTIONS,
] as const;

export const PUBLIC_ROBOTS = {
  index: true,
  follow: true,
} satisfies Metadata["robots"];

export const ATLAS_OVERVIEW = [
  {
    language: "en",
    question: "What is ATLAS?",
    answer: "ATLAS by Altimeda is an enterprise AI platform for manufacturing and construction, targeting clients in Indonesia and international markets.",
  },
  {
    language: "id",
    question: "Apa itu ATLAS?",
    answer: "ATLAS dari Altimeda adalah platform AI perusahaan untuk industri manufaktur dan konstruksi, yang ditujukan bagi klien di Indonesia dan pasar internasional.",
  },
] as const;

// Only reviewed, public routes belong here. Never derive this list from app routes.
export const PUBLIC_PAGES = {
  "/": {
    title: "ATLAS | Enterprise AI for Manufacturing & Construction",
    description: "Enterprise AI for manufacturing and construction in Indonesia and international markets. Platform AI untuk industri manufaktur dan konstruksi.",
    label: "ATLAS overview / Tentang ATLAS",
  },
  "/privacy-policy": {
    title: "Privacy Policy | ATLAS by Altimeda",
    description: "Read the ATLAS by Altimeda privacy policy, including information about personal data, its use, and your privacy rights.",
    label: "Privacy Policy",
  },
  "/terms-of-service": {
    title: "Terms of Service | ATLAS by Altimeda",
    description: "Read the terms of service for ATLAS by Altimeda, including the terms governing access to and use of the platform.",
    label: "Terms of Service",
  },
} as const;

export type PublicPath = keyof typeof PUBLIC_PAGES;

export function getSeoConfig(environment: Environment = process.env) {
  let siteUrl: URL | undefined;
  try {
    const candidate = new URL(environment.SITE_URL?.trim() ?? "");
    const hostname = candidate.hostname;
    const labels = hostname.split(".");
    const isPublicHostname = hostname.length <= 253 && labels.length > 1 &&
      labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
    if (
      candidate.protocol === "https:" &&
      isPublicHostname &&
      !/^\d+(?:\.\d+){3}$/.test(hostname) &&
      !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(hostname) &&
      !candidate.username && !candidate.password && !candidate.port &&
      candidate.pathname === "/" && !candidate.search && !candidate.hash
    ) {
      siteUrl = candidate;
    }
  } catch {
    // Missing or invalid configuration must not produce guessed canonical URLs.
  }

  const indexable = Boolean(
    siteUrl &&
    environment.SEO_INDEXABLE === "true" &&
    environment.NODE_ENV !== "development" &&
    (!environment.VERCEL_ENV || environment.VERCEL_ENV === "production"),
  );
  return { siteUrl, indexable };
}

export function getPublicMetadata(
  path: PublicPath,
  environment: Environment = process.env,
): Metadata {
  const { siteUrl } = getSeoConfig(environment);
  const page = PUBLIC_PAGES[path];
  const url = siteUrl ? new URL(path, siteUrl).href : undefined;
  const image = siteUrl ? new URL("/atlas-logo.webp", siteUrl).href : undefined;

  return {
    title: page.title,
    description: page.description,
    robots: PUBLIC_ROBOTS,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      type: "website",
      siteName: "ATLAS by Altimeda",
      title: page.title,
      description: page.description,
      ...(url ? { url } : {}),
      ...(image ? { images: [{ url: image, alt: "ATLAS by Altimeda" }] } : {}),
    },
    twitter: {
      card: "summary",
      title: page.title,
      description: page.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function getSiteVerification(environment: Environment = process.env): Metadata["verification"] {
  return {
    ...(environment.GOOGLE_SITE_VERIFICATION
      ? { google: environment.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(environment.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": environment.BING_SITE_VERIFICATION } }
      : {}),
  };
}

export function getRobots(environment: Environment = process.env): MetadataRoute.Robots {
  const { siteUrl, indexable } = getSeoConfig(environment);
  if (!indexable || !siteUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // One wildcard policy also covers search/AI bots without relaxing private rules.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_ROUTE_PREFIXES.map((prefix) => `/${prefix}`),
    },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}

export function getSitemap(environment: Environment = process.env): MetadataRoute.Sitemap {
  const { siteUrl, indexable } = getSeoConfig(environment);
  if (!indexable || !siteUrl) return [];
  return Object.keys(PUBLIC_PAGES).map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}

export function getStructuredData(environment: Environment = process.env) {
  const { siteUrl } = getSeoConfig(environment);
  const home = siteUrl?.href;
  const organizationId = home ? `${home}#organization` : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Altimeda",
        ...(organizationId ? { "@id": organizationId } : {}),
      },
      {
        "@type": "SoftwareApplication",
        name: "ATLAS",
        applicationCategory: "BusinessApplication",
        description: ATLAS_OVERVIEW[0].answer,
        ...(home ? { "@id": `${home}#software`, url: home } : {}),
        provider: organizationId
          ? { "@id": organizationId }
          : { "@type": "Organization", name: "Altimeda" },
      },
      {
        "@type": "FAQPage",
        inLanguage: ["en", "id"],
        ...(home ? { "@id": `${home}#overview`, url: `${home}#overview` } : {}),
        mainEntity: ATLAS_OVERVIEW.map(({ language, question, answer }) => ({
          "@type": "Question",
          name: question,
          inLanguage: language,
          acceptedAnswer: {
            "@type": "Answer",
            text: answer,
            inLanguage: language,
          },
        })),
      },
    ],
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function getLlmsText(environment: Environment = process.env): string | undefined {
  const { siteUrl, indexable } = getSeoConfig(environment);
  if (!indexable || !siteUrl) return undefined;
  const links = Object.entries(PUBLIC_PAGES).map(
    ([path, page]) => `- [${page.label}](${new URL(path, siteUrl).href})`,
  );
  return [
    "# ATLAS by Altimeda",
    "",
    `> ${ATLAS_OVERVIEW[0].answer}`,
    "",
    ATLAS_OVERVIEW[1].answer,
    "",
    "## Public pages",
    "",
    ...links,
    "",
    "## Access",
    "",
    "Application, account, onboarding and API routes are not public reference material.",
    "Authentication and authorization requirements apply to all clients, including crawlers.",
    "",
  ].join("\n");
}

export function getIndexNowKey(environment: Environment = process.env): string | undefined {
  const key = environment.INDEXNOW_KEY;
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : undefined;
}

export function getIndexNowPayload(environment: Environment = process.env) {
  const { siteUrl, indexable } = getSeoConfig(environment);
  const key = getIndexNowKey(environment);
  if (!siteUrl || !indexable || !key) return undefined;
  return {
    host: siteUrl.hostname,
    key,
    keyLocation: new URL("/indexnow-key.txt", siteUrl).href,
    urlList: getSitemap(environment).map(({ url }) => url),
  };
}
