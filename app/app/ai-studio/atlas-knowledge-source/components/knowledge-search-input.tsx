"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface KnowledgeSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}

export function KnowledgeSearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
  inputClassName,
  ariaLabel = "Search",
}: KnowledgeSearchInputProps) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn("h-10 w-full bg-background pl-9", inputClassName)}
      />
    </div>
  );
}
