import type { HTMLAttributes } from "react";
import { AtlasOverview } from "./AtlasOverview";

type SectionProps = { markup: string };

// Sections kept in the DOM (atlas-landing.js still queries them) but hidden for now.
const HIDDEN_SECTION_IDS = new Set<string>([]);

function getSection(markup: string) {
  const match = markup.match(/^\s*<section\b([^>]*)>([\s\S]*)<\/section>\s*$/i);
  if (!match) return null;

  const attributes: HTMLAttributes<HTMLElement> = {};
  const source = match[1];
  const attributePattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let attribute: RegExpExecArray | null;

  while ((attribute = attributePattern.exec(source))) {
    const [, rawName, doubleQuoted, singleQuoted, unquoted] = attribute;
    const value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
    if (rawName === "class") attributes.className = value;
    else if (rawName === "id") attributes.id = value;
    else if (rawName === "aria-labelledby")
      attributes["aria-labelledby"] = value;
    else if (rawName.startsWith("data-")) {
      (attributes as unknown as Record<string, string>)[rawName] = value;
    }
  }

  return { attributes, content: match[2] };
}

export function LandingSection({ markup }: SectionProps) {
  const section = getSection(markup);
  if (!section) return null;

  const className = [section.attributes.className, "atlas-reveal"]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      {...section.attributes}
      className={className}
      data-atlas-reveal="true"
      style={
        HIDDEN_SECTION_IDS.has(section.attributes.id ?? "")
          ? { display: "none" }
          : undefined
      }
      dangerouslySetInnerHTML={{ __html: section.content }}
    />
  );
}

export function LandingHeroSection(props: SectionProps) {
  return (
    <>
      <LandingSection {...props} />
      <AtlasOverview />
    </>
  );
}

export function LandingProblemSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingHowItWorksSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingSolutionsSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingPlatformSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingIntegrationsSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingOntrixSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingNexaSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingPricingSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingTrustSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingFaqSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export function LandingWalkthroughSection(props: SectionProps) {
  return <LandingSection {...props} />;
}

export const LANDING_SECTION_COMPONENTS = [
  LandingHeroSection,
  LandingProblemSection,
  LandingHowItWorksSection,
  LandingSolutionsSection,
  LandingPlatformSection,
  LandingIntegrationsSection,
  LandingOntrixSection,
  LandingNexaSection,
  LandingPricingSection,
  LandingTrustSection,
  LandingFaqSection,
  LandingWalkthroughSection
] as const;
