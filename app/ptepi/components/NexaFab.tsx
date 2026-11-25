"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNexaChatStore } from "../store/nexa-chat-store";
import { useT } from "./Tr";

/** Floating button that opens the Nexa chat drawer on every screen except the Nexa page. */
export function NexaFab() {
  const pathname = usePathname();
  const t = useT();
  const setOpen = useNexaChatStore((state) => state.setOpen);
  if (pathname.startsWith("/ptepi/ask-atlas")) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("Ask Nexa")}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-800 text-white shadow-xl shadow-primary-700/35 outline-none transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-primary-300 lg:bottom-8 lg:right-8"
          >
            <Sparkles size={24} aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{t("Ask Nexa")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
