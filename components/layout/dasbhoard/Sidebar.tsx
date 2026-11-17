"use client";

import * as React from "react";
import { ChevronsRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  buildNavigation,
  extractNavHrefs,
  findActiveNavHref
} from "@/components/layout/dasbhoard/navigation";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { Button } from "@/components/ui/button";
import { useAuthMe } from "@/hooks/useAuthMe";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import NavItem from "./NavItem";

export const SidebarActiveContext = React.createContext<{
  activeHref: string | null;
}>({
  activeHref: null
});

export function useSidebarActive() {
  return React.useContext(SidebarActiveContext);
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, sidebarOpen, setSidebarOpen } =
    useSidebar();
  const isMobile = useIsMobile();

  // RBAC-driven navigation from GET /v1/auth/me.
  const {
    data: profile,
    isLoading: isMeLoading,
    isError,
    isFetchedAfterMount
  } = useAuthMe(pathname);
  const me = isFetchedAfterMount && !isError ? profile : undefined;
  const modules = React.useMemo(
    () => me?.rbac?.modules ?? [],
    [me?.rbac?.modules]
  );
  const sections = React.useMemo(
    () =>
      buildNavigation({
        modules,
        roles: me?.roles ?? null,
        subscription: me?.subscription ?? null,
        subscriptionExpired: me?.subscription_expired ?? false,
        hasSubscription: me?.has_subscription ?? false,
        isAdmin: me?.is_admin ?? false,
        companyName: me?.company?.company_name
      }),
    [
      modules,
      me?.roles,
      me?.subscription,
      me?.subscription_expired,
      me?.has_subscription,
      me?.is_admin,
      me?.company?.company_name
    ]
  );

  const allHrefs = React.useMemo(() => extractNavHrefs(sections), [sections]);
  const activeHref = React.useMemo(
    () => findActiveNavHref(allHrefs, pathname),
    [allHrefs, pathname]
  );

  // Keep "Others" pinned to the bottom, separate from the main navigation.
  const topSections = sections.filter((section) => section.title !== "Others");
  const bottomSections = sections.filter(
    (section) => section.title === "Others"
  );
  // While /v1/auth/me is loading we only know about "Overview"; show a skeleton
  // placeholder for the gated module area until it resolves.
  const showModulesSkeleton = isMeLoading && modules.length === 0;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        data-quick-tip="navigation"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-primary-900 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "relative flex items-center gap-2.5 py-3",
            collapsed ? "justify-center" : "justify-start px-4"
          )}
        >
          <Image
            src="/atlas-logo.svg"
            alt="Atlas Logo"
            width={32}
            height={32}
          />

          {!collapsed && (
            <span className="text-xl font-semibold text-white text-nowrap">
              ATLAS
            </span>
          )}

          {/* Toggle Sidebar */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              "absolute right-0 translate-x-1/2 rounded-full bg-primary-700 flex items-center justify-center cursor-pointer",
              collapsed ? "h-5.5 w-5.5" : " h-7 w-7",
              isMobile && !sidebarOpen && "hidden"
            )}
          >
            <ChevronsRight
              size={16}
              color="white"
              className={
                collapsed
                  ? "rotate-0 transition-all duration-150"
                  : "-rotate-180"
              }
            />
          </button>
        </div>

        {/* Navigation List Item */}
        <SidebarActiveContext.Provider value={{ activeHref }}>
          <nav className="sidebar-scroll flex flex-col h-full overflow-y-auto px-2 py-4 justify-between">
            {/* Top Nav List */}
            <div className="space-y-4">
              {topSections.map((section, sectionIdx) => (
                <div key={section.title} className="space-y-1">
                  {!collapsed ? (
                    <h3 className="px-3 pb-1 text-xs font-medium tracking-wider text-gray-400">
                      {section.title}
                    </h3>
                  ) : (
                    sectionIdx > 0 && (
                      <div className="border-t border-gray-100 py-2" />
                    )
                  )}

                  {section.items.map((item) => (
                    <NavItem
                      key={item.title}
                      node={item}
                      activeHref={activeHref}
                    />
                  ))}
                </div>
              ))}

              {showModulesSkeleton && (
                <div className="space-y-2 px-3 py-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-8 animate-pulse rounded-md bg-primary-800",
                        collapsed && "mx-auto h-8 w-8"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Nav List */}
            <div>
              {bottomSections.map((section, sectionIdx) => (
                <div key={section.title} className="space-y-1">
                  {!collapsed ? (
                    <h3 className="px-3 pb-1 text-xs font-medium tracking-wider text-gray-400">
                      {section.title}
                    </h3>
                  ) : (
                    sectionIdx > 0 && (
                      <div className="border-t border-gray-100 py-2" />
                    )
                  )}

                  {section.items.map((item) => (
                    <NavItem
                      key={item.title}
                      node={item}
                      activeHref={activeHref}
                    />
                  ))}
                </div>
              ))}
            </div>
          </nav>
        </SidebarActiveContext.Provider>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 pb-5" data-quick-tip="subscription">
            <div
              className={cn(
                "bg-primary-800 rounded-lg border border-primary-700 text-white text-center p-3 space-y-2"
              )}
            >
              <div className="space-y-1">
                <span className="text-sm font-semibold">
                  Expand Your Platform
                </span>
                <p className="text-xs">
                  Discover and add new modules to unlock more capabilities.
                </p>
              </div>
              <Button asChild className="text-sm w-full">
                <Link href="/app/workspace-dashboard/explore-module">
                  Explore Modules
                </Link>
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
