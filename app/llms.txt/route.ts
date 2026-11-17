import { getLlmsText } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const content = getLlmsText();
  return new Response(content ?? "Not available", {
    status: content ? 200 : 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
