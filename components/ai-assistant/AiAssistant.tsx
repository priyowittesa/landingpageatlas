"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { useAiAssistantStore } from "@/stores/ai-assistant-store";
import { AiAssistantLauncher } from "./AiAssistantLauncher";
import { AiAssistantPanel } from "./AiAssistantPanel";

/**
 * Routes that own the full viewport and already ship their own chat surface,
 * so the global assistant would collide with them.
 */
const HIDDEN_PATH_PREFIXES = [
  "/workflow",
  "/app/ai-studio/workflow",
  "/app/synergy-intelligence"
];

/**
 * Mounts the floating assistant on every app page. Rendered once from
 * AppLayout — do not add it per page.
 */
export function AiAssistant({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const isOpen = useAiAssistantStore((state) => state.isOpen);
  const open = useAiAssistantStore((state) => state.open);
  const close = useAiAssistantStore((state) => state.close);

  const hidden =
    !enabled ||
    HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  React.useEffect(() => {
    if (hidden && isOpen) close();
  }, [close, hidden, isOpen]);

  if (hidden) return null;

  return (
    <>
      <AiAssistantLauncher hidden={isOpen} onClick={open} />
      <AiAssistantPanel open={isOpen} onClose={close} />
    </>
  );
}
