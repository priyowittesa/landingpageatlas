"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpenText,
  Lightbulb,
  LoaderCircle,
  Menu,
  TriangleAlert
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { Sidebar } from "@/components/layout/dasbhoard/Sidebar";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAutoSignOut } from "@/hooks/useAutoSignOut";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTemplateGenerateStore } from "@/stores/template-generate-store";
import {
  useAuthMe,
  type AuthMeSubscription,
  type AuthMeAddon
} from "@/hooks/useAuthMe";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useGetPackages } from "@/app/app/workspace-dashboard/explore-module/use-packages";
import { AiAssistant } from "@/components/ai-assistant/AiAssistant";

const SUBSCRIPTION_EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000;

const DEV_EXPIRING_FLAG = "dev:forceExpiringSubscriptions";

/**
 * Dev-only override. In the browser console run:
 *   localStorage.setItem("dev:forceExpiringSubscriptions", "1")  → force banner + modal
 *   localStorage.removeItem("dev:forceExpiringSubscriptions")    → back to normal
 */
function isDevForceExpiring() {
  if (process.env.NODE_ENV !== "development") return false;
  try {
    return localStorage.getItem(DEV_EXPIRING_FLAG) === "1";
  } catch {
    return false;
  }
}

function getExpiringSubscriptions(subscriptions: AuthMeSubscription[] = []) {
  if (isDevForceExpiring()) {
    return subscriptions.length > 0
      ? subscriptions.map((subscription) => ({
          ...subscription,
          expires_at: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString()
        }))
      : [
          {
            id: "dev-dummy-1",
            tenant_id: "dev",
            package_id: "294d29e6-4411-417d-8430-cb84357c0973",
            promo_code_id: "",
            status: "active",
            billing_cycle: "monthly",
            discount_amount: 0,
            final_price: 8908000,
            started_at: new Date(
              Date.now() - 25 * 24 * 60 * 60 * 1000
            ).toISOString(),
            expires_at: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "dev-dummy-2",
            tenant_id: "dev",
            package_id: "80244266-739b-40d2-a2a1-06b86fc8e79f",
            promo_code_id: "",
            status: "active",
            billing_cycle: "monthly",
            discount_amount: 0,
            final_price: 35800,
            started_at: new Date(
              Date.now() - 10 * 24 * 60 * 60 * 1000
            ).toISOString(),
            expires_at: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
  }

  const now = Date.now();
  const warningCutoff = now + SUBSCRIPTION_EXPIRY_WARNING_MS;

  return subscriptions.filter((subscription) => {
    const expiresAt = Date.parse(subscription.expires_at);
    return (
      Number.isFinite(expiresAt) &&
      expiresAt > now &&
      expiresAt <= warningCutoff
    );
  });
}

function daysUntil(value: string) {
  return Math.max(
    1,
    Math.ceil((Date.parse(value) - Date.now()) / (24 * 60 * 60 * 1000))
  );
}

function formatExpiryDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function SubscriptionExpiryBanner({
  onManageRenewal
}: {
  onManageRenewal: () => void;
}) {
  return (
    <div className="mx-4 mt-4 flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 text-amber-600">
          <TriangleAlert className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-600">
            Some packages are expiring soon
          </p>
          <p className="text-xs text-gray-500">
            Review and renew the packages you want to continue using.
          </p>
        </div>
      </div>
      <Button
        onClick={onManageRenewal}
        className="h-8 shrink-0 bg-amber-600 px-4 text-xs hover:bg-amber-700 sm:ml-auto"
      >
        Manage Renewal
      </Button>
    </div>
  );
}

function RenewalSubscriptionDialog({
  open,
  onOpenChange,
  subscriptions,
  addons
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: AuthMeSubscription[];
  addons: AuthMeAddon[];
}) {
  const router = useRouter();
  const packagesQuery = useGetPackages({ enabled: open });
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = React.useState<
    string[]
  >([]);
  const rows = React.useMemo(
    () =>
      subscriptions.map((subscription) => ({
        subscription,
        package: packagesQuery.data?.items.find(
          (item) => item.id === subscription.package_id
        )
      })),
    [packagesQuery.data, subscriptions]
  );
  const selectableRows = rows.filter((row) => row.package);
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) =>
      selectedSubscriptionIds.includes(row.subscription.id)
    );
  const someSelected = selectedSubscriptionIds.length > 0;

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) setSelectedSubscriptionIds([]);
    onOpenChange(nextOpen);
  }

  function toggleSubscription(id: string, checked: boolean) {
    setSelectedSubscriptionIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    );
  }

  function toggleAll(checked: boolean) {
    setSelectedSubscriptionIds(
      checked ? selectableRows.map((row) => row.subscription.id) : []
    );
  }

  function renewSelected() {
    const packageIds = Array.from(
      new Set(
        rows
          .filter((row) =>
            selectedSubscriptionIds.includes(row.subscription.id)
          )
          .flatMap((row) => (row.package ? [row.package.id] : []))
      )
    );
    if (packageIds.length === 0) return;

    const params = new URLSearchParams({ renewal: "1" });
    params.set(
      packageIds.length === 1 ? "package" : "packages",
      packageIds.join(",")
    );
    if (addons.length > 0) {
      const addonModuleIds = Array.from(
        new Set(addons.map((addon) => addon.module_id).filter(Boolean))
      );
      if (addonModuleIds.length > 0) {
        params.set("addons", addonModuleIds.join(","));
      }
    }
    changeOpen(false);
    router.push(`/app/workspace-dashboard/review-order?${params.toString()}`);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="text-sm">Renewal Subscription</DialogTitle>
          <DialogDescription className="sr-only">
            Select packages to renew.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 text-amber-600">
              <TriangleAlert className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-amber-600">
                Some subscriptions are expiring soon
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Select the subscriptions you want, then renew multiple
                subscriptions at once.
              </p>
            </div>
          </div>

          {packagesQuery.isLoading ? (
            <div className="flex h-28 items-center justify-center rounded-lg border">
              <LoaderCircle className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : packagesQuery.isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center text-xs text-red-600">
              Unable to load packages. Please try again.
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border px-4 py-8 text-center text-xs text-gray-500">
              No expiring subscriptions were found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-9 w-10 p-3">
                      <Checkbox
                        aria-label="Select all subscriptions"
                        checked={
                          allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) =>
                          toggleAll(checked === true)
                        }
                      />
                    </TableHead>
                    <TableHead className="h-9 p-3 text-xs font-medium text-gray-500">
                      Package
                    </TableHead>
                    <TableHead className="h-9 p-3 text-xs font-medium text-gray-500">
                      Expiry Date
                    </TableHead>
                    <TableHead className="h-9 p-3 text-xs font-medium text-gray-500">
                      Days Left
                    </TableHead>
                    <TableHead className="h-9 p-3 text-xs font-medium text-gray-500">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ subscription, package: packageItem }) => {
                    const selected = selectedSubscriptionIds.includes(
                      subscription.id
                    );
                    return (
                      <TableRow
                        key={subscription.id}
                        data-state={selected ? "selected" : undefined}
                      >
                        <TableCell className="w-10 p-3">
                          <Checkbox
                            aria-label={`Select ${packageItem?.name ?? "subscription"}`}
                            checked={selected}
                            disabled={!packageItem}
                            onCheckedChange={(checked) =>
                              toggleSubscription(
                                subscription.id,
                                checked === true
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="p-3 text-xs font-medium">
                          {packageItem?.name ?? "Package unavailable"}
                        </TableCell>
                        <TableCell className="p-3 text-xs text-gray-600">
                          {formatExpiryDate(subscription.expires_at)}
                        </TableCell>
                        <TableCell className="p-3 text-xs text-gray-600">
                          {daysUntil(subscription.expires_at)}
                        </TableCell>
                        <TableCell className="p-3">
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-600">
                            Expiring Soon
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button variant="outline" onClick={() => changeOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={renewSelected}
            disabled={!someSelected || packagesQuery.isLoading}
          >
            Renew
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppHeader() {
  const { setSidebarOpen } = useSidebar();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-sidebar px-15">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 lg:hidden">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div> */}

      {(pathname.startsWith("/atlas-knowledge-base") ||
        pathname.startsWith("/app/ai-studio")) && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
          <BookOpenText className="h-4.5 w-4.5" />
        </span>
      )}
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-2">
        {pathname === "/app/workspace-dashboard" && (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("atlas:start-quick-tips"))
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary-500 px-2.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quick Tips</span>
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer">
              <Bell size={22} color="black" />
              <span className="absolute right-1 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>No new notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu />
      </div>
    </header>
  );
}

function GenerateToastWatcher() {
  const { status, category, error, reset } = useTemplateGenerateStore();
  const router = useRouter();
  const toastId = "template-generate";
  const prevStatus = React.useRef(status);

  React.useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;

    if (status === "generating") {
      toast.loading(
        `Generating ${category ?? ""} template — analyzing documents...`,
        {
          id: toastId,
          description: "This runs in the background. You can keep working.",
          duration: Infinity
        }
      );
    } else if (status === "success") {
      toast.success("Template generated successfully", {
        id: toastId,
        description: "Your new inspection template is ready.",
        duration: 6000,
        action: {
          label: "View templates",
          onClick: () => {
            reset();
            router.push(`/app/inspection/templates?tab=${category ?? "asset"}`);
          }
        }
      });
      // Auto-reset after the toast is dismissed
      const timer = setTimeout(reset, 6000);
      return () => clearTimeout(timer);
    } else if (status === "error") {
      toast.error("Failed to generate template", {
        id: toastId,
        description: error || "Please try again.",
        duration: 8000,
        action: {
          label: "Dismiss",
          onClick: reset
        }
      });
      const timer = setTimeout(reset, 8000);
      return () => clearTimeout(timer);
    }
  }, [status, category, error, reset, router, toastId]);

  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const previousPathname = React.useRef(pathname);
  const { data: me, refetch: refetchAuthMe } = useAuthMe();
  const [renewalDialogOpen, setRenewalDialogOpen] = React.useState(false);
  const expiringSubscriptions = React.useMemo(
    () => getExpiringSubscriptions(me?.subscription),
    [me?.subscription]
  );
  const hasActiveSubscription =
    (me?.subscription?.length ?? 0) > 0 && me?.subscription_expired === false;
  const isWorkflow =
    pathname.startsWith("/workflow") ||
    pathname.startsWith("/app/ai-studio/workflow");
  const isKnowledgeBase =
    pathname.startsWith("/atlas-knowledge-base") ||
    pathname.startsWith("/app/ai-studio/atlas-knowledge-base");
  const isSynergyIntelligence = pathname.startsWith("/app/synergy-intelligence");
  const isWorkspace = isWorkflow || isKnowledgeBase || isSynergyIntelligence;
  useAutoSignOut();

  React.useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    void refetchAuthMe();
  }, [pathname, refetchAuthMe]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Sidebar />

      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          isWorkspace ? "h-screen overflow-hidden" : "min-h-screen",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <AppHeader />
        {expiringSubscriptions.length > 0 && (
          <SubscriptionExpiryBanner
            onManageRenewal={() => setRenewalDialogOpen(true)}
          />
        )}
        <GenerateToastWatcher />

        <main
          className={cn(
            "mx-auto w-full flex-1",
            isWorkspace ? "flex flex-col overflow-hidden" : "max-w-7xl p-6"
          )}
        >
          {children}
        </main>
      </div>

      <AiAssistant enabled={hasActiveSubscription} />

      <RenewalSubscriptionDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        subscriptions={expiringSubscriptions}
        addons={me?.addons ?? []}
      />
    </div>
  );
}
