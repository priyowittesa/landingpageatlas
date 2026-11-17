import "../../public/atlas-legal-common.css";
import "../../public/atlas-privacy-policy.css";
import { LegalPage } from "@/components/legal/LegalPage";
import { getLegalPageContent } from "@/components/legal/legal-content";
import { getPublicMetadata } from "@/lib/seo";

export const metadata = getPublicMetadata("/privacy-policy");

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      document="privacy-policy"
      content={getLegalPageContent("privacy-policy")}
    />
  );
}
