import { Bell, Camera, Crosshair, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowStep } from "@/types/type-daily-diaries";

const steps = [
  { id: "site" as const, label: "Site Info", icon: Bell },
  { id: "execution" as const, label: "Execution", icon: Crosshair },
  { id: "issues" as const, label: "Issues", icon: TriangleAlert },
  { id: "attachments" as const, label: "Attachments", icon: Camera },
];

export function WorkflowStepper({ activeStep }: { activeStep: WorkflowStep }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <div className="flex items-center">
      {steps.map(({ id, label, icon: Icon }, index) => (
        <div
          key={id}
          className={cn(
            "flex items-center",
            index < steps.length - 1 && "flex-1",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              index <= activeIndex ? "text-primary-700" : "text-gray-400",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full bg-gray-100",
                index <= activeIndex && "bg-primary-50 shadow-sm",
              )}
            >
              <Icon size={16} />
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>

          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px flex-1 bg-gray-200",
                index < activeIndex && "bg-primary-400",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
