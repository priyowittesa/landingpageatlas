"use client";

import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

type NotificationPreference = {
  id: string;
  label: string;
  email: boolean;
  inApp: boolean;
};

const initialPreferences: NotificationPreference[] = [
  { id: "system-updates", label: "System updates", email: true, inApp: true },
  {
    id: "maintenance-announcements",
    label: "Maintenance announcements",
    email: true,
    inApp: true,
  },
  { id: "security-alerts", label: "Security alerts", email: true, inApp: true },
  { id: "login-activity", label: "Login activity", email: true, inApp: true },
  {
    id: "subscription-updates",
    label: "Subscription updates",
    email: true,
    inApp: true,
  },
  {
    id: "payment-confirmations",
    label: "Payment confirmations",
    email: true,
    inApp: true,
  },
  { id: "billing-reminders", label: "Billing reminders", email: true, inApp: true },
  { id: "feature-releases", label: "Feature releases", email: true, inApp: true },
];

function NotificationChannel({
  type,
  title,
  description,
  enabled,
  onChange,
}: {
  type: "email" | "in-app";
  title: string;
  description: string;
  enabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const Icon = type === "email" ? Mail : Bell;

  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-gray-200 px-3 py-2 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-4 text-gray-950">{title}</p>
        <p className="truncate text-[9px] leading-3 text-gray-500">{description}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={onChange}
          aria-label={`${enabled ? "Disable" : "Enable"} ${title}`}
          className="data-[state=checked]:bg-primary-600"
        />
        <span className="w-11 text-[10px] text-gray-700">
          {enabled ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}

function PreferenceCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
      className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-primary-700 focus:ring-2 focus:ring-primary-300"
    />
  );
}

export function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [preferences, setPreferences] = useState(initialPreferences);

  function updatePreference(
    id: string,
    channel: "email" | "inApp",
    checked: boolean,
  ) {
    setPreferences((current) =>
      current.map((preference) =>
        preference.id === id
          ? { ...preference, [channel]: checked }
          : preference,
      ),
    );
  }

  function saveChanges() {
    toast.success("Notification preferences saved");
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-gray-950">
        Notifications &amp; Preferences
      </h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        <NotificationChannel
          type="email"
          title="Email Notifications"
          description="Receive notifications via email."
          enabled={emailEnabled}
          onChange={setEmailEnabled}
        />
        <NotificationChannel
          type="in-app"
          title="In-App Notifications"
          description="Receive notifications inside the ATLAS  platform."
          enabled={inAppEnabled}
          onChange={setInAppEnabled}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[440px] border-collapse text-left">
          <thead>
            <tr className="h-9 border-b border-gray-200 bg-gray-50/60">
              <th className="px-3 text-[10px] font-normal text-gray-500">
                Notification Type
              </th>
              <th className="w-20 px-3 text-center text-[10px] font-normal text-gray-500">
                Email
              </th>
              <th className="w-20 px-3 text-center text-[10px] font-normal text-gray-500">
                In-App
              </th>
            </tr>
          </thead>
          <tbody>
            {preferences.map((preference) => (
              <tr
                key={preference.id}
                className="h-10 border-b border-gray-200 last:border-b-0"
              >
                <td className="px-3 text-[10px] text-gray-800">
                  {preference.label}
                </td>
                <td className="px-3 text-center">
                  <PreferenceCheckbox
                    checked={preference.email}
                    onChange={(checked) =>
                      updatePreference(preference.id, "email", checked)
                    }
                    label={`Email notifications for ${preference.label}`}
                  />
                </td>
                <td className="px-3 text-center">
                  <PreferenceCheckbox
                    checked={preference.inApp}
                    onChange={(checked) =>
                      updatePreference(preference.id, "inApp", checked)
                    }
                    label={`In-app notifications for ${preference.label}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={saveChanges}
          className="h-9 cursor-pointer rounded-md bg-primary-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
