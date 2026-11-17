"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  ADMIN_SETTINGS_TABS,
  SettingsNavigation,
  SUPER_ADMIN_SETTINGS_TABS,
  type SettingsTab
} from "@/components/settings/SettingsNavigation";
import { ModuleOrderSettings } from "@/components/settings/ModuleOrderSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { PaymentMethodSettings } from "@/components/settings/PaymentMethodSettings";
import { PaymentHistorySettings } from "@/components/settings/PaymentHistorySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PackageSettings } from "@/components/settings/PackageSettings";
import { ModulesSettings } from "@/components/settings/ModulesSettings";
import { ThemeAppearanceSettings } from "@/components/settings/ThemeAppearanceSettings";
import { ManageTenantsSettings } from "@/components/settings/ManageTenantsSettings";
import { SkillsSettings } from "@/components/settings/SkillsSettings";
import { useAuthMe } from "@/hooks/useAuthMe";

type SettingsPageProps = {
  initialTab?: SettingsTab;
};

export function SettingsPage({
  initialTab = "module-order"
}: SettingsPageProps) {
  const router = useRouter();
  const { data: me, isLoading } = useAuthMe();
  const activeTab = initialTab;
  const allowedTabs = me?.is_admin === true
    ? ADMIN_SETTINGS_TABS
    : SUPER_ADMIN_SETTINGS_TABS;
  const effectiveTab = allowedTabs.includes(activeTab)
    ? activeTab
    : "module-order";

  useEffect(() => {
    if (isLoading || allowedTabs.includes(activeTab)) return;
    router.replace("/app/settings?tab=module-order", { scroll: false });
  }, [activeTab, allowedTabs, isLoading, router]);

  const changeTab = (tab: SettingsTab) => {
    if (!allowedTabs.includes(tab)) return;
    router.replace(`/app/settings?tab=${tab}`, { scroll: false });
  };

  return (
    <div>
      <h1 className="mb-3 text-xl font-semibold text-gray-950">Settings</h1>
      <div className="grid items-start gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
        <SettingsNavigation
          activeTab={effectiveTab}
          allowedTabs={allowedTabs}
          onChange={changeTab}
        />
        {effectiveTab === "module-order" && <ModuleOrderSettings />}
        {effectiveTab === "package" && <PackageSettings />}
        {effectiveTab === "subscription" && <SubscriptionSettings />}
        {effectiveTab === "payment-method" && <PaymentMethodSettings />}
        {effectiveTab === "payment-history" && <PaymentHistorySettings />}
        {effectiveTab === "notifications" && <NotificationSettings />}
        {effectiveTab === "manage-tenants" && <ManageTenantsSettings />}
        {effectiveTab === "modules" && <ModulesSettings />}
        {effectiveTab === "theme-appearance" && <ThemeAppearanceSettings />}
        {effectiveTab === "skills" && <SkillsSettings />}
      </div>
    </div>
  );
}
