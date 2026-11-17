"use client";

import { SkillBrowser } from "@/components/ai-assistant/AiAssistantSkills";

/**
 * This view exposes only system-provided workflow skills and preserves that
 * source when an administrator creates a skill.
 */
export function SkillsSettings() {
  return (
    <section className="flex min-h-[560px] overflow-hidden rounded-lg border border-gray-200 bg-white">
      <SkillBrowser systemOnly createSource="system" />
    </section>
  );
}
