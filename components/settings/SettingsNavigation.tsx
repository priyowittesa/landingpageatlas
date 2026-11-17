import { cn } from "@/lib/utils";

export type SettingsTab =
  | "module-order"
  | "subscription"
  | "payment-method"
  | "payment-history"
  | "notifications"
  | "manage-tenants"
  | "package"
  | "modules"
  | "theme-appearance"
  | "skills";

export const SETTINGS_ITEMS: { id: SettingsTab; label: string }[] = [
  { id: "module-order", label: "Module Order" },
  { id: "subscription", label: "Subscription" },
  { id: "payment-method", label: "Payment Method" },
  { id: "payment-history", label: "Payment History" },
  { id: "notifications", label: "Notifications" },
  { id: "manage-tenants", label: "Manage Tenants" },
  { id: "package", label: "Packages Setting" },
  { id: "modules", label: "Modules Setting" },
  { id: "theme-appearance", label: "Theme & Appearance" },
  { id: "skills", label: "Skills" }
];

export const ADMIN_SETTINGS_TABS: SettingsTab[] = SETTINGS_ITEMS.map(
  (item) => item.id
);

export const SUPER_ADMIN_SETTINGS_TABS: SettingsTab[] = [
  "module-order",
  "subscription",
  "payment-method",
  "payment-history",
  "notifications",
  "theme-appearance"
];

type SettingsNavigationProps = {
  activeTab: SettingsTab;
  allowedTabs: SettingsTab[];
  onChange: (tab: SettingsTab) => void;
};

export function SettingsNavigation({
  activeTab,
  allowedTabs,
  onChange
}: SettingsNavigationProps) {
  const items = SETTINGS_ITEMS.filter((item) => allowedTabs.includes(item.id));

  return (
    <nav
      aria-label="Settings sections"
      className="h-fit rounded-lg border border-gray-200 bg-white p-1 md:sticky md:top-20 md:z-10 md:shadow-sm"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "block w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs font-normal transition-colors",
            activeTab === item.id
              ? "bg-gray-100 font-medium text-gray-950"
              : "text-gray-700 hover:bg-gray-50"
          )}
          aria-current={activeTab === item.id ? "page" : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
