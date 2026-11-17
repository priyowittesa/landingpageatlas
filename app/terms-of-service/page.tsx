import "../../public/atlas-legal-common.css";
import "../../public/atlas-terms-of-service.css";
import { LegalPage } from "@/components/legal/LegalPage";
import { getLegalPageContent } from "@/components/legal/legal-content";
import { getPublicMetadata } from "@/lib/seo";

export const metadata = getPublicMetadata("/terms-of-service");

export default function TermsOfServicePage() {
  return (
    <LegalPage
      document="terms-of-service"
      content={getLegalPageContent("terms-of-service")}
    />
  );
}
