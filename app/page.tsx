import "../public/atlas-landing.css";
import { LandingPage } from "@/components/landingpage/LandingPage";
import {
  getPublicMetadata,
  getStructuredData,
  serializeJsonLd
} from "@/lib/seo";

export const metadata = getPublicMetadata("/");

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(getStructuredData())
        }}
      />
      <LandingPage />
    </>
  );
}
