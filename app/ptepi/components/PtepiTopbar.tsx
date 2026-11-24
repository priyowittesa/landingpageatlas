"use client";

import { useRouter, usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { getScreenTitle } from "../navigation";
import { RoleSwitcher } from "./RoleSwitcher";

const DEMO_USER = { name: "Demo user", initials: "DU" };

/**
 * Same look as the ATLAS app header: screen title on the left, bell and user
 * chip on the right. The user chip is static because the prototype has no login.
 */
export function PtepiTopbar() {
  const { setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              className="relative cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <Bell size={22} color="black" />
              <span className="absolute right-1 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/ptepi/actions")}>
              Open the action tracker
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="group flex cursor-pointer items-center gap-2">
              <Avatar>
                <AvatarFallback>{DEMO_USER.initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-semibold sm:inline">{DEMO_USER.name}</span>
              <ChevronDown
                size={22}
                className="transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Public demo, no login</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/")}>ATLAS website</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
