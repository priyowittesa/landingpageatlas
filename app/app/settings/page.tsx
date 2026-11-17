import { SettingsPage } from "@/components/settings/SettingsPage";
import type { SettingsTab } from "@/components/settings/SettingsNavigation";

const SETTINGS_TABS: SettingsTab[] = [
  "module-order",
  "package",
  "subscription",
  "payment-method",
  "payment-history",
  "notifications",
  "manage-tenants",
  "modules",
  "theme-appearance",
  "skills"
];

function isSettingsTab(value: string | undefined): value is SettingsTab {
  return SETTINGS_TABS.some((tab) => tab === value);
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SettingsPage initialTab={isSettingsTab(tab) ? tab : undefined} />;
}
