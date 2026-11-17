import { ProjectStatus } from "@/app/app/master-data/projects/types";
// import type { DiaryStatus } from "../types";

export const DailyDiariesStatus = {
  DIARY_STATUS_UNSPECIFIED: "Not Started",
  DIARY_STATUS_NOT_STARTED: "Not Started",
  DIARY_STATUS_DRAFT: "Draft Saved",
  DIARY_STATUS_SUBMITTED: "Submitted",
  DIARY_STATUS_APPROVED: "Approved",
  DIARY_STATUS_REJECTED: "Rejected",
} as const;

export type DailyDiariesStatus =
  (typeof DailyDiariesStatus)[keyof typeof DailyDiariesStatus];

export const statusStyles: Record<
  ProjectStatus | DailyDiariesStatus,
  { badge: string; bar: string; value: string; dot: string; label: string }
> = {
  inactive: {
    badge: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
    value: "text-amber-600",
    dot: "bg-amber-400",
    label: "Draft Saved",
  },
  unspecified: {
    badge: "bg-gray-100 text-gray-500",
    bar: "bg-amber-500",
    value: "text-amber-600",
    dot: "bg-gray-500",
    label: "Not Started",
  },
  active: {
    badge: "bg-sky-50 text-sky-600",
    bar: "bg-primary-500",
    value: "text-primary-600",
    dot: "bg-sky-400",
    label: "Submitted",
  },
  completed: {
    badge: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    value: "text-emerald-600",
    dot: "bg-emerald-500",
    label: "Approved",
  },

  "Draft Saved": {
    badge: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
    value: "text-amber-600",
    dot: "bg-amber-400",
    label: "Draft Saved",
  },
  "Not Started": {
    badge: "bg-gray-100 text-gray-500",
    bar: "bg-amber-500",
    value: "text-amber-600",
    dot: "bg-gray-500",
    label: "Not Started",
  },
  Submitted: {
    badge: "bg-sky-50 text-sky-600",
    bar: "bg-primary-500",
    value: "text-primary-600",
    dot: "bg-sky-400",
    label: "Submitted",
  },
  Approved: {
    badge: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    value: "text-emerald-600",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  Rejected: {
    badge: "bg-rose-50 text-rose-600",
    bar: "bg-rose-500",
    value: "text-rose-600",
    dot: "bg-rose-500",
    label: "Rejected",
  },

  // "Draft Saved": {
  //   badge: "bg-amber-50 text-amber-600",
  //   bar: "bg-amber-500",
  //   value: "text-amber-600",
  //   dot: "bg-amber-400",
  // },
  // "Not Started": {
  //   badge: "bg-gray-100 text-gray-500",
  //   bar: "bg-amber-500",
  //   value: "text-amber-600",
  //   dot: "bg-gray-300",
  // },
  // Submitted: {
  //   badge: "bg-sky-50 text-sky-600",
  //   bar: "bg-primary-500",
  //   value: "text-primary-600",
  //   dot: "bg-sky-400",
  // },
  // Approved: {
  //   badge: "bg-emerald-50 text-emerald-600",
  //   bar: "bg-emerald-500",
  //   value: "text-emerald-600",
  //   dot: "bg-emerald-500",
  // },
  // Rejected: {
  //   badge: "bg-rose-50 text-rose-600",
  //   bar: "bg-rose-500",
  //   value: "text-rose-600",
  //   dot: "bg-rose-500",
  // },
};
