import { Building2 } from "lucide-react";
import type { Project } from "@/app/app/master-data/projects/types";

export function ProjectBanner({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-4.5 rounded-xl bg-linear-to-r from-primary-700 to-primary-600 px-5 py-4 text-white">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
        <Building2 size={20} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-primary-100">{project.code}</p>
        <h2 className="text-xl font-bold leading-5">{project.title}</h2>
      </div>
    </div>
  );
}
