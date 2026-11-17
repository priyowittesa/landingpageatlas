"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { hasPageRoute } from "@/lib/page-routes";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";

export function Breadcrumbs({ maxItems = 5 }: { maxItems?: number }) {
  const pathname = usePathname();
  const params = useParams();
  const customItems = useBreadcrumbStore((state) => state.items);
  const segments = pathname.split("/").filter(Boolean);
  const dynamicSegments = new Set(
    Object.values(params).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    )
  );
  const generatedItems = segments
    .map((segment, index) => ({
      segment,
      title:
        segment === "workflow"
          ? "Workflow Studio"
          : segment.replaceAll("-", " "),
      href: `/${segments.slice(0, index + 1).join("/")}`
    }))
    .filter(
      ({ segment }) => segment !== "app" && !dynamicSegments.has(segment)
    )
    .slice(-maxItems);
  const items = customItems.length > 0 ? customItems : generatedItems;

  if (items.length === 0) {
    return <span className="text-sm font-medium text-gray-700">Dashboard</span>;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.title}-${index}`}>
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            {!isLast && item.href && hasPageRoute(item.href) ? (
              <Link
                href={item.href}
                className="capitalize text-gray-500 hover:text-gray-900"
              >
                {item.title}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={cn(
                  "capitalize text-gray-500",
                  isLast && "font-medium text-gray-700"
                )}
              >
                {item.title}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
