import { FileCheck2, FileSearch, Files } from "lucide-react";

import type { ProjectDashboardSummary } from "../use-projects";

export function ProjectStats({
  loading = false,
  summary,
}: {
  loading?: boolean;
  summary?: ProjectDashboardSummary;
}) {
  const value = (...keys: string[]) => {
    if (loading) return "…";
    for (const key of keys) {
      if (summary?.[key] != null) return summary[key];
    }
    return 0;
  };

  const stats = [
    {
      label: "Total Projects",
      value: value("total_projects", "total_project", "total"),
      note: "All project records",
      icon: Files,
    },
    {
      label: "Active Projects",
      value: value("active_projects", "active_project", "active"),
      note: "Currently active",
      icon: FileCheck2,
    },
    {
      label: "Total Project Types",
      value: value(
        "total_project_types",
        "total_project_type",
        "project_types",
        "project_type",
      ),
      note: "Project types in system",
      icon: FileSearch,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map(({ label, value: statValue, note, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm"
        >
          <span className="rounded-xl bg-primary-50 p-3 text-primary-700">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-700">{label}</p>
            <strong className="text-2xl text-slate-900">{statValue}</strong>
            <p className="text-[11px] text-slate-400">{note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
