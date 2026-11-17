import * as React from "react";
import { cn } from "./ui/utils";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { Info, PlusIcon } from "lucide-react";

type FormFieldLayoutProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  tooltip?: string;
};

export default function FormFieldLayout({
  label,
  htmlFor,
  required = false,
  error,
  className,
  children,
  desc,
  tooltip,
}: FormFieldLayoutProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-2", className)}>
        <label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium text-gray-700",
            tooltip && "flex gap-1 items-center",
          )}
        >
          {label}
          {required && !tooltip && <span className="text-red-500"> *</span>}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={12} />
              </TooltipTrigger>
              <TooltipContent className="TooltipContent" sideOffset={5}>
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </label>

        <div className="flex flex-col gap-2">
          {children}

          {!error && desc && (
            <span className="text-muted-foreground text-xs">{desc}</span>
          )}
          {error && <span className="text-red-600 text-xs">{error}</span>}
        </div>
      </div>
    </TooltipProvider>
  );
}
