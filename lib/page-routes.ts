export function createPageRouteMatcher(routes: readonly string[]) {
  const patterns = routes.map((route) => {
    const pattern = route
      .split("/")
      .filter(Boolean)
      .map((segment) => {
        if (/^\[\[\.\.\..+\]\]$/.test(segment)) return "(?:/[^/]+)*";
        if (/^\[\.\.\..+\]$/.test(segment)) return "(?:/[^/]+)+";
        if (/^\[.+\]$/.test(segment)) return "/[^/]+";
        return `/${segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
      })
      .join("");

    return new RegExp(`^${pattern || "/"}/?$`);
  });

  return (href?: string): boolean => {
    if (!href?.startsWith("/") || href.startsWith("//")) return false;
    const pathname = href.split(/[?#]/, 1)[0];
    return patterns.some((pattern) => pattern.test(pathname));
  };
}

// Next.js inlines the route list collected by next.config.ts into the bundle.
export const hasPageRoute = createPageRouteMatcher(
  JSON.parse(process.env.ATLAS_PAGE_ROUTES ?? "[]") as string[]
);
