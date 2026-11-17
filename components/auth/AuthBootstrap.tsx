"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useSyncUser } from "@/hooks/useSyncUser";

export function AuthBootstrap() {
  const { data: session, status } = useSession();
  const { syncCurrentUser } = useSyncUser();
  const pathname = usePathname();
  const router = useRouter();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || syncedRef.current) return;
    if (!session?.accessToken) return;

    syncedRef.current = true;
    void syncCurrentUser().then((user) => {
      if (user && !user.tenant_id?.trim() && pathname !== "/onboarding") {
        router.replace("/onboarding");
      }
    });
  }, [status, session?.accessToken, syncCurrentUser, pathname, router]);

  return null;
}
