import { Button } from "@/components/ui/button";
import { Sparkles, X, Zap } from "lucide-react";

export function GuidanceBanner({
  step,
  onAction,
  actionLoading = false
}: {
  step: "site" | "execution" | "issues";
  onAction?: () => void;
  actionLoading?: boolean;
}) {
  const content = {
    site: {
      title: "Weather impacts are tracked automatically",
      body: "Temperature above 37.5°C triggers mandatory heat restriction logging. Sandstorm or rain conditions auto-flag potential delay for supervisor review.",
      action: "Apply Today's Weather"
    },
    execution: {
      title: "Record Labour, Equipment, and Progress in one place",
      body: "Switch between Labour, Equipment, and Work Progress tables without losing data — all sections autosave together. Employees missing WBS codes or with <4h logged will be flagged at review.",
      action: "Load Full Roster & Equipment"
    },
    issues: {
      title: "Issue alerts project schedule & cost",
      body: "Every delay hour recorded here feeds into the monthly variance report. Assign a responsible party so corrective actions are tracked.",
      action: "Log Weather Delay"
    }
  }[step];

  const actionable = Boolean(onAction);

  return (
    <div
      className={`rounded-lg border border-primary-700 bg-primary-50 px-5 py-3 space-y-3 ${actionable ? "opacity-100" : "opacity-50"}`}
    >
      <div className="flex items-start">
        <Sparkles size={12} className="mt-0.5 text-primary-500 mr-2" />
        <div className="flex-1 space-y-3">
          <p className="text-xs font-bold text-primary-800">{content.title}</p>
          <p className="text-xs text-gray-700">{content.body}</p>
        </div>
        <X className="h-3.5 w-3.5 text-primary-500" />
      </div>

      <Button
        disabled={!actionable || actionLoading}
        onClick={onAction}
        className="rounded-md px-3 text-[11px] font-bold h-7"
      >
        <Zap className="h-2.75! w-2.75!" />
        {actionLoading ? "Applying…" : content.action}
      </Button>
    </div>
  );
}
