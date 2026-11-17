import { headers } from "next/headers";
import { ResponsiveSidebarProvider } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModuleAccessGuard } from "@/components/auth/ModuleAccessGuard";
import { requireRouteAccess } from "@/lib/require-auth";

export default async function AppRouteLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-atlas-pathname");
  if (!pathname) throw new Error("Unable to determine module route");
  await requireRouteAccess(pathname);

  return (
    <ResponsiveSidebarProvider>
      <AppLayout>
        <ModuleAccessGuard>{children}</ModuleAccessGuard>
      </AppLayout>
    </ResponsiveSidebarProvider>
  );
}
