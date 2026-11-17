"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

type AiAssistantLauncherProps = {
  hidden?: boolean;
  onClick: () => void;
};

/**
 * Round floating trigger pinned to the bottom-right of every page. It fades
 * out while the panel is open so it never overlaps the conversation.
 */
export function AiAssistantLauncher({
  hidden,
  onClick
}: AiAssistantLauncherProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label="Ask AI Assistant"
            tabIndex={hidden ? -1 : 0}
            className={cn(
              "group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full",
              "bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-lg shadow-primary-500/30",
              "transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:shadow-primary-500/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
              hidden && "pointer-events-none translate-y-4 scale-90 opacity-0"
            )}
          >
            <span className="absolute inset-0 rounded-full bg-primary-400/40 opacity-0 transition-opacity duration-300 group-hover:animate-ping group-hover:opacity-100" />
            <Sparkles className="relative h-6 w-6" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={10} className="bg-gray-900 px-3 py-2 text-sm">
          Ask AI Assistant
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
