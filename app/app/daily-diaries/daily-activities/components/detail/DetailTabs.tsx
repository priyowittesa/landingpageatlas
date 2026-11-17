import { cn } from "@/lib/utils";
import { Calendar, Shield } from "lucide-react";

export type DetailTab = "actions" | "approval" | "history";

const allTabs = [
  { id: "actions" as const, label: "Diary Actions", icon: Calendar },
  { id: "approval" as const, label: "Approval Queue", icon: Shield }
  // { id: "history" as const, label: "Diary History", icon: ClipboardCheck },
];

export function DetailTabs({
  activeTab,
  onChange,
  showApprovalTab = false
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
  showApprovalTab?: boolean;
}) {
  const tabs = allTabs.filter(
    (tab) => tab.id !== "approval" || showApprovalTab
  );
  return (
    <div
      className={cn(
        "grid rounded-lg border border-gray-200 bg-white p-1",
        tabs.length > 1 ? "grid-cols-2" : "grid-cols-1"
      )}
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex h-8 items-center justify-center gap-2 rounded-md text-gray-500 transition-colors",
            activeTab === id && "bg-primary-50 font-medium text-primary-700"
          )}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
