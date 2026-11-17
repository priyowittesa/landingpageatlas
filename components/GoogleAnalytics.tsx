import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();

  if (
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED !== "true" ||
    !measurementId ||
    !/^G-[A-Z0-9]+$/.test(measurementId)
  ) {
    return null;
  }

  return <NextGoogleAnalytics gaId={measurementId} />;
}
