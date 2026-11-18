"use client";

import { AppModal } from "./chrome/AppModal";
import { DemoModal } from "./chrome/DemoModal";
import { MobileCta } from "./chrome/MobileCta";
import { Navbar } from "./chrome/Navbar";
import { SkipLink } from "./chrome/SkipLink";
import { useAnchorScroll } from "./hooks/useAnchorScroll";
import { useLandingFonts } from "./hooks/useLandingFonts";
import { useLegacyLandingScript } from "./hooks/useLegacyLandingScript";
import { useLoginRedirect } from "./hooks/useLoginRedirect";
import { useSectionReveal } from "./hooks/useSectionReveal";
import { useSmoothWheel } from "./hooks/useSmoothWheel";
import { Faq } from "./sections/Faq";
import { GetStarted } from "./sections/GetStarted";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { InAction } from "./sections/InAction";
import { Integrations } from "./sections/Integrations";
import { Nexa } from "./sections/Nexa";
import { Ontrix } from "./sections/Ontrix";
import { Overview } from "./sections/Overview";
import { Platform } from "./sections/Platform";
import { Pricing } from "./sections/Pricing";
import { Problem } from "./sections/Problem";
import { Solutions } from "./sections/Solutions";
import { Trust } from "./sections/Trust";
import { Walkthrough } from "./sections/Walkthrough";

export function LandingPage() {
  useLandingFonts();
  useLoginRedirect();
  useAnchorScroll();
  useSmoothWheel();
  useLegacyLandingScript();
  useSectionReveal();

  return (
    <div className="atlas-landing">
      <div>
        <SkipLink />
      </div>
      <Navbar />
      <main id="main">
        <div>
          <span id="top" />
        </div>
        <Hero />
        <Overview />
        <Problem />
        <HowItWorks />
        <Solutions />
        <InAction />
        <Platform />
        <Integrations />
        <Ontrix />
        <Nexa />
        <GetStarted />
        <Pricing />
        <Trust />
        <Faq />
        <Walkthrough />
      </main>
      <div className="atlas-landing-tail">
        <MobileCta />
        <AppModal />
        <DemoModal />
      </div>
    </div>
  );
}
