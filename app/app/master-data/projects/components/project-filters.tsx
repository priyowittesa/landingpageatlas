import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectFiltersProps {
  search: string;
  status: string;
  projectType: string;
  projectTypes: { id: string; name: string }[];
  statuses: { label: string; value: string }[];
  projectTypesLoading?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  statusDisabled?: boolean;
}

export function ProjectFilters({
  search,
  status,
  projectType,
  projectTypes,
  statuses,
  projectTypesLoading = false,
  onSearchChange,
  onStatusChange,
  onProjectTypeChange,
  statusDisabled = false,
}: ProjectFiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_160px_220px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-11 w-full rounded-md pl-11 shadow-none"
          placeholder="Search project..."
        />
      </div>

      <Select
        value={status}
        onValueChange={onStatusChange}
        disabled={statusDisabled}
      >
        <SelectTrigger className="h-11 w-full rounded-md font-medium shadow-none">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {statuses.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={projectType}
        onValueChange={onProjectTypeChange}
        disabled={projectTypesLoading}
      >
        <SelectTrigger className="h-11 w-full rounded-md font-medium shadow-none">
          <SelectValue
            placeholder={
              projectTypesLoading ? "Loading project types..." : "All Project Type"
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Project Type</SelectItem>
          {projectTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
