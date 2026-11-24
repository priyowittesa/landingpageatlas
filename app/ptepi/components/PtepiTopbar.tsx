"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { getScreenTitle } from "../navigation";
import { RoleSwitcher } from "./RoleSwitcher";

/**
 * Same look as the ATLAS app header: screen title on the left, the demo role
 * switcher on the right. The public demo has no login, so there is no user menu
 * and no notification bell.
 */
export function PtepiTopbar() {
  const { setSidebarOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-primary-100/60 bg-background/80 px-6 backdrop-blur-md lg:px-15">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <span className="hidden truncate text-sm font-medium text-gray-700 md:inline">{getScreenTitle(pathname)}</span>

      <div className="ml-auto flex items-center gap-2">
        <RoleSwitcher />
      </div>
    </header>
  );
}
