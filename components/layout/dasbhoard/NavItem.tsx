import { usePathname } from "next/navigation";
import { isNodeActive, NavNode, nodeContainsActive } from "./navigation";
import { useSidebarActive } from "./Sidebar";
import { useSidebar } from "./ResponsiveSidebarProvider";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useTokenUsageOverview } from "@/app/app/token-usage/hooks/useTokenUsage";
import {
  formatPercent,
  formatShortDate,
  formatTokens
} from "@/app/app/token-usage/lib/format";

type LucideIconResolver = (name: string) => LucideIcon | undefined;

// API icon names are resolved from one lazily loaded icon module. lucide's
// DynamicIcon creates a separate async chunk per icon (~3,300), which made
// Turbopack dev use several GB of RAM compiling every /app route.
let loadedIconResolver: LucideIconResolver | null = null;
let iconResolverPromise: Promise<LucideIconResolver> | null = null;

function loadIconResolver(): Promise<LucideIconResolver> {
  iconResolverPromise ??= import("@/lib/lucide-icons").then((module) => {
    loadedIconResolver = module.getLucideIconByName;
    return loadedIconResolver;
  });
  return iconResolverPromise;
}

function useLucideIcon(name?: string): LucideIcon | undefined {
  const [resolve, setResolve] = React.useState(() => loadedIconResolver);

  React.useEffect(() => {
    if (!name || resolve) return;
    let active = true;
    loadIconResolver().then((resolver) => {
      if (active) setResolve(() => resolver);
    });
    return () => {
      active = false;
    };
  }, [name, resolve]);

  return name && resolve ? resolve(name) : undefined;
}

function NavIcon({ node, className }: { node: NavNode; className: string }) {
  const NamedIcon = useLucideIcon(node.iconName);
  // Icons come from a module-level map, so their identity is stable across renders.
  if (NamedIcon) return React.createElement(NamedIcon, { className });
  // Falls back to the module's key icon while loading or for unknown names.
  const Icon = node.icon;
  return Icon ? <Icon className={className} /> : null;
}

function NavLabel({ title, className }: { title: string; className?: string }) {
  const viewportRef = React.useRef<HTMLSpanElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    const text = textRef.current;
    if (!viewport || !text) return;
    const observer = new ResizeObserver(() => {
      setOverflowing(text.scrollWidth > viewport.clientWidth + 1);
    });
    observer.observe(viewport);
    observer.observe(text);
    return () => observer.disconnect();
  }, [title]);

  return (
    <span
      ref={viewportRef}
      className={cn(
        "relative min-w-0 flex-1 overflow-hidden text-left",
        className
      )}
      aria-hidden="true"
    >
      <span
        ref={textRef}
        className="pointer-events-none invisible absolute whitespace-nowrap"
      >
        {title}
      </span>
      {overflowing ? (
        <span className="flex w-max animate-marquee motion-reduce:animate-none group-hover/nav:[animation-play-state:paused] group-focus-visible/nav:[animation-play-state:paused]">
          <span className="shrink-0 whitespace-nowrap pr-8">{title}</span>
          <span className="shrink-0 whitespace-nowrap pr-8">{title}</span>
        </span>
      ) : (
        <span className="block truncate">{title}</span>
      )}
    </span>
  );
}

function TokenUsagePreview() {
  const { data, isLoading } = useTokenUsageOverview();

  if (isLoading || !data) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
        <div className="h-7 w-40 animate-pulse rounded bg-gray-100" />
        <div className="h-2 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-16 w-full animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  const { balance } = data;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-gray-950">Token Usage</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-base font-bold text-gray-950">
            {formatTokens(balance.remaining)}
          </span>
          <span className="text-sm text-gray-500">
            /{formatTokens(balance.quota)} tokens
          </span>
        </div>
        <Progress
          value={balance.remainingPercent}
          className="mt-2 h-2"
          indicatorClassName="bg-primary-600"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>{formatPercent(balance.remainingPercent)} left</span>
          <span>{formatTokens(balance.used)} tokens used</span>
        </div>
      </div>

      <p className="text-xs leading-4 text-gray-600">
        Team members share {formatTokens(balance.quota)} tokens this period.
        Next reset {formatShortDate(data.quotaResetsAt)}.
      </p>

      <Button
        asChild
        className="h-9 w-full bg-gray-950 text-sm hover:bg-gray-800"
      >
        <Link href="/app/token-usage/overview">Usage Details</Link>
      </Button>
    </div>
  );
}

export default function NavItem({
  node,
  depth = 0,
  activeHref: propActiveHref
}: {
  node: NavNode;
  depth?: number;
  activeHref?: string | null;
}) {
  const pathname = usePathname();
  const context = useSidebarActive();
  const activeHref =
    propActiveHref !== undefined ? propActiveHref : context.activeHref;
  const { collapsed, toggleCollapsed, setSidebarOpen } = useSidebar();
  const isActive = isNodeActive(node, activeHref, pathname);
  const containsActive = nodeContainsActive(node, activeHref, pathname);
  const [userToggled, setUserToggled] = React.useState<boolean | null>(null);
  const [prevPathname, setPrevPathname] = React.useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setUserToggled(null);
  }

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRef = React.useRef<HTMLAnchorElement | null>(null);

  const openPreview = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPreviewOpen(true);
  };
  const closePreview = () => {
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 120);
  };

  const isOpen =
    !collapsed &&
    (userToggled ?? ((node.defaultOpen ?? false) || containsActive));

  React.useEffect(() => {
    if (isActive && itemRef.current) {
      const el = itemRef.current;
      const nav = el.closest(".sidebar-scroll");
      if (nav) {
        const navRect = nav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        if (elRect.top < navRect.top || elRect.bottom > navRect.bottom) {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }
  }, [isActive]);

  React.useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  if (node.isSectionLabel) {
    return (
      <div
        className="truncate px-3 pb-1 pt-3 text-[11px] font-medium text-primary-300/60"
        style={depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined}
      >
        {node.title}
      </div>
    );
  }

  if (collapsed) {
    if (node.href) {
      return (
        <Link
          ref={itemRef}
          href={node.href}
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "flex items-center justify-center rounded-md p-2 transition-colors text-white",
            isActive ? "bg-primary-700" : "hover:bg-primary-800"
          )}
          title={node.title}
        >
          <NavIcon node={node} className="h-5 w-5" />
        </Link>
      );
    }

    if (node.children) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => {
              toggleCollapsed();
              setUserToggled(true);
            }}
            className={cn(
              "flex items-center justify-center rounded-md p-2 transition-colors text-white w-full cursor-pointer",
              containsActive ? "bg-primary-700" : "hover:bg-primary-800"
            )}
            title={node.title}
          >
            <NavIcon node={node} className="h-5 w-5" />
          </button>
        </div>
      );
    }

    return null;
  }

  if (node.href) {
    return (
      <Link
        ref={itemRef}
        href={node.href}
        onClick={() => setSidebarOpen(false)}
        aria-label={node.title}
        title={node.title}
        className={cn(
          "group/nav flex items-center gap-3 rounded-md px-3 py-2 transition-colors text-white",
          depth === 0 ? "text-sm" : "text-xs",
          isActive ? "bg-primary-700" : "hover:bg-primary-800"
        )}
        style={depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined}
      >
        <NavIcon node={node} className="h-5 w-5 shrink-0 text-white" />

        <NavLabel title={node.title} />
      </Link>
    );
  }

  if (node.children) {
    const trigger = (
      <button
        onClick={() => setUserToggled(!isOpen)}
        onMouseEnter={node.preview ? openPreview : undefined}
        onMouseLeave={node.preview ? closePreview : undefined}
        aria-label={node.title}
        title={node.title}
        className={cn(
          "group/nav flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors text-white",
          depth === 0 ? "text-sm" : "text-xs",
          containsActive ? "bg-primary-700" : "hover:bg-primary-800"
        )}
        style={depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : undefined}
      >
        <NavIcon node={node} className="h-5 w-5 shrink-0" />

        {!node.icon && !node.iconName ? (
          <NavLabel title={node.title} className="text-primary-200 text-xs" />
        ) : (
          <NavLabel title={node.title} />
        )}

        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 -rotate-90 text-gray-400 transition-transform",
            isOpen && "rotate-0"
          )}
        />
      </button>
    );

    return (
      <div className="space-y-1">
        {node.preview === "token-usage" ? (
          <Popover open={previewOpen} onOpenChange={setPreviewOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            {previewOpen && (
              <PopoverContent
                side="right"
                align="start"
                sideOffset={10}
                className="z-[60] w-72 rounded-lg border-gray-200 bg-white p-4 shadow-lg"
                onMouseEnter={openPreview}
                onMouseLeave={closePreview}
              >
                <TokenUsagePreview />
              </PopoverContent>
            )}
          </Popover>
        ) : (
          trigger
        )}

        {isOpen && (
          <div className="ml-5 space-y-1 border-l border-primary-800 pl-1">
            {node.children.map((child, index) => (
              <NavItem
                key={`${child.title}-${child.href ?? "item"}-${index}`}
                node={child}
                depth={depth + 1}
                activeHref={activeHref}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
