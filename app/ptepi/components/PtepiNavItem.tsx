"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNodeActive, nodeContainsActive, type NavNode } from "@/components/layout/dasbhoard/navigation";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { HIGHLIGHTED_HREFS } from "../navigation";
import { useModuleAlert, useModuleAlertTotal } from "./module-alerts";
import { useT } from "./Tr";

/** Number of new items in a module, in the style of a notification dot: a count, never colour alone. */
function NewBadge({ count }: { count: number }) {
  const t = useT();
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} ${t("new")}`}
      title={`${count} ${t("new")}`}
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[0.6875rem] font-bold leading-none tabular-nums text-white"
    >
      {count}
    </span>
  );
}

/** "AI" next to the screen the assistant feeds. */
function AiBadge() {
  return (
    <span className="ml-auto shrink-0 rounded bg-white px-1.5 py-px text-[0.6875rem] font-bold uppercase tracking-wide text-primary-800">
      AI
    </span>
  );
}

/** Original hrefs of a node and everything under it. */
function collectHrefs(node: NavNode & { tierHref?: string }): string[] {
  return [...(node.tierHref ? [node.tierHref] : []), ...(node.children ?? []).flatMap((child) => collectHrefs(child as NavNode & { tierHref?: string }))];
}

type PtepiNavItemProps = {
  /** Already localized node; hrefTier is looked up on the original href */
  node: NavNode & { tierHref?: string };
  activeHref: string | null;
  depth?: number;
};

/**
 * Sidebar item of the prototype, in the look of the ATLAS NavItem, with a count of new items
 * per screen. Groups open by default (defaultOpen) or when they hold the active screen.
 */
export function PtepiNavItem({ node, activeHref, depth = 0 }: PtepiNavItemProps) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, setSidebarOpen } = useSidebar();
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const isActive = isNodeActive(node, activeHref, pathname);
  const containsActive = nodeContainsActive(node, activeHref, pathname);
  const isOpen = !collapsed && (userToggled ?? ((node.defaultOpen ?? false) || containsActive));
  const Icon = node.icon;
  const highlighted = node.tierHref !== undefined && HIGHLIGHTED_HREFS.includes(node.tierHref);
  const alerts = useModuleAlert(node.tierHref);
  const groupAlerts = useModuleAlertTotal(collectHrefs(node));

  if (collapsed) {
    const className = cn(
      "flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-white transition-colors",
      isActive || (node.children && containsActive) ? "bg-primary-700" : "hover:bg-primary-800"
    );
    const count = node.children ? groupAlerts : alerts;
    const label = count > 0 ? `${node.title} (${count})` : node.title;
    if (node.href) {
      return (
        <Link href={node.href} onClick={() => setSidebarOpen(false)} className={className} title={label} aria-label={node.title}>
          {Icon && <Icon className="h-5 w-5" />}
        </Link>
      );
    }
    return (
      <button type="button" onClick={() => { toggleCollapsed(); setUserToggled(true); }} className={className} title={label} aria-label={node.title}>
        {Icon && <Icon className="h-5 w-5" />}
      </button>
    );
  }

  const indent = depth > 0 ? { paddingLeft: `${12 + depth * 4}px` } : undefined;

  if (node.href) {
    return (
      <Link
        href={node.href}
        onClick={() => setSidebarOpen(false)}
        aria-label={node.title}
        title={node.title}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-white transition-colors",
          "text-sm",
          highlighted
            ? cn(
                "bg-sky-400/25 shadow-[0_0_0_1px_inset] shadow-sky-300/70 backdrop-blur-sm hover:bg-sky-400/35",
                isActive && "bg-sky-400/45 shadow-sky-200"
              )
            : isActive
              ? "bg-primary-700"
              : "hover:bg-primary-800"
        )}
        style={indent}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0 text-white" />}
        <span className="min-w-0 flex-1 leading-tight">{node.title}</span>
        {highlighted && <AiBadge />}
        <NewBadge count={alerts} />
      </Link>
    );
  }

  if (!node.children) return null;
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setUserToggled(!isOpen)}
        aria-expanded={isOpen}
        aria-label={node.title}
        title={node.title}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-white transition-colors",
          "text-sm",
          containsActive ? "bg-primary-700" : "hover:bg-primary-800"
        )}
        style={indent}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span className="min-w-0 flex-1 text-left leading-tight">{node.title}</span>
        {!isOpen && <NewBadge count={groupAlerts} />}
        <ChevronDown className={cn("h-4 w-4 shrink-0 -rotate-90 text-gray-400 transition-transform", isOpen ? "ml-auto rotate-0" : !isOpen && groupAlerts > 0 ? "ml-1" : "ml-auto")} />
      </button>
      {isOpen && (
        <div className="ml-4 space-y-1 border-l border-primary-700/60 pl-1">
          {node.children.map((child) => (
            <PtepiNavItem key={`${child.title}-${child.href ?? "group"}`} node={child} activeHref={activeHref} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
