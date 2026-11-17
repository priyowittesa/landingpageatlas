import type { NextConfig } from "next";
import path from "node:path";
import { collectPageRoutes } from "./lib/collect-page-routes";
import { LEGACY_APP_SECTIONS, PRIVATE_ROUTE_PREFIXES } from "./lib/seo";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  env: {
    ATLAS_PAGE_ROUTES: JSON.stringify(
      collectPageRoutes(path.join(__dirname, "app"))
    ),
  },
  async headers() {
    return PRIVATE_ROUTE_PREFIXES.map((prefix) => ({
      source: `/${prefix}/:path*`,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
    }));
  },
  async redirects() {
    return [
      {
        source: "/app/signals",
        destination: "/app/operation-intelligence/predictive-actions",
        permanent: false,
      },
      {
        source: "/master-data/capacity-analytic/:path*",
        destination: "/app/capacity-analytic/:path*",
        permanent: true,
      },
      ...LEGACY_APP_SECTIONS.map((section) => ({
        source: `/${section}/:path*`,
        destination: `/app/${section}/:path*`,
        permanent: true,
      })),
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Turbopack dev has no memory cap by default and can grow past 7 GB.
    turbopackMemoryLimit: 2 * 1024 * 1024 * 1024,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
