import { getIndexNowKey, getSeoConfig } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const key = getSeoConfig().indexable ? getIndexNowKey() : undefined;
  return new Response(key ?? "Not available", {
    status: key ? 200 : 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
