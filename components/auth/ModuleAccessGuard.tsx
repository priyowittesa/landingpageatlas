"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthMe } from "@/hooks/useAuthMe";
import { hasRouteAccess } from "@/lib/rbac-access";

export function ModuleAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isError, isFetchedAfterMount, refetch } = useAuthMe(pathname);
  const allowed = !!data && hasRouteAccess(data.rbac?.modules, pathname, data.is_admin);

  useEffect(() => {
    if (isFetchedAfterMount && !isError && !allowed) {
      router.replace("/unauthorized");
    }
  }, [allowed, isError, isFetchedAfterMount, router]);

  if (isError) {
    return (
      <div role="alert" className="py-12 text-center text-sm text-gray-500">
        <p>Unable to verify your access.</p>
        <button
          type="button"
          className="mt-3 underline"
          onClick={() => void refetch()}
        >
          Try Again
        </button>
      </div>
    );
  }
  // Layouts persist during navigation. Verify each URL before mounting its page.
  if (!isFetchedAfterMount || !allowed) {
    return (
      <div role="status" className="py-12 text-center text-sm text-gray-500">
        Checking access...
      </div>
    );
  }
  return children;
}
