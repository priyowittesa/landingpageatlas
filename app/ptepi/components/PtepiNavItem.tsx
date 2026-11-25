"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNodeActive, nodeContainsActive, type NavNode } from "@/components/layout/dasbhoard/navigation";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { moduleTierOf, type ModuleTier } from "../navigation";
import { useT } from "./Tr";

/** "Base" or "Add-on" next to a module: text, not colour alone. */
function TierBadge({ tier }: { tier: ModuleTier }) {
  const t = useT();
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
        tier === "Add-on" ? "bg-amber-300 text-amber-950" : "bg-white/15 text-primary-50"
      )}
    >
      {t(tier)}
    </span>
  );
}

type PtepiNavItemProps = {
  /** Already localized node; hrefTier is looked up on the original href */
  node: NavNode & { tierHref?: string };
  activeHref: string | null;
  depth?: number;
};

/**
 * Sidebar item of the prototype, in the look of the ATLAS NavItem, with a Base or Add-on
 * badge per module. Groups open by default (defaultOpen) or when they hold the active screen.
 */
export function PtepiNavItem({ node, activeHref, depth = 0 }: PtepiNavItemProps) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, setSidebarOpen } = useSidebar();
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const isActive = isNodeActive(node, activeHref, pathname);
  const containsActive = nodeContainsActive(node, activeHref, pathname);
  const isOpen = !collapsed && (userToggled ?? ((node.defaultOpen ?? false) || containsActive));
  const Icon = node.icon;
  const tier = node.tierHref ? moduleTierOf(node.tierHref) : null;

  if (collapsed) {
    const className = cn(
      "flex w-full cursor-pointer items-center justify-center rounded-md p-2 text-white transition-colors",
      isActive || (node.children && containsActive) ? "bg-primary-700" : "hover:bg-primary-800"
    );
    const label = tier ? `${node.title} (${tier})` : node.title;
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

  const indent = depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined;

  if (node.href) {
    return (
      <Link
        href={node.href}
        onClick={() => setSidebarOpen(false)}
        aria-label={node.title}
        title={tier ? `${node.title} (${tier})` : node.title}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-white transition-colors",
          depth === 0 ? "text-sm" : "text-xs",
          isActive ? "bg-primary-700" : "hover:bg-primary-800"
        )}
        style={indent}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0 text-white" />}
        <span className="min-w-0 flex-1 leading-tight">{node.title}</span>
        {tier && <TierBadge tier={tier} />}
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
          depth === 0 ? "text-sm" : "text-xs",
          containsActive ? "bg-primary-700" : "hover:bg-primary-800"
        )}
        style={indent}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span className="min-w-0 truncate">{node.title}</span>
        <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 -rotate-90 text-gray-400 transition-transform", isOpen && "rotate-0")} />
      </button>
      {isOpen && (
        <div className="ml-5 space-y-1 border-l border-primary-800 pl-1">
          {node.children.map((child) => (
            <PtepiNavItem key={`${child.title}-${child.href ?? "group"}`} node={child} activeHref={activeHref} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
