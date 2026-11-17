import {
  AppWindowMac,
  Bell,
  BookOpenText,
  ChevronLeft,
  CirclePlay,
  Clock2,
  Ellipsis,
  Eye,
  File,
  Globe,
  Info,
  Mail,
  Pause,
  Pencil,
  Play,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquarePen,
  X,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, taskTypeInfo, type TaskStatus } from "./scheduled-data";

const TASK_ICONS = {
  back: ChevronLeft,
  search: Search,
  sparkles: Sparkles,
  clock: Clock2,
  eye: Eye,
  file: File,
  zap: Zap,
  skill: SquarePen,
  more: Ellipsis,
  close: X,
  globe: Globe,
  "in-app": AppWindowMac,
  push: Smartphone,
  mail: Mail,
  shield: ShieldCheck,
  run: CirclePlay,
  pause: Pause,
  play: Play,
  edit: Pencil,
  instructions: Info,
  schedule: Clock2,
  context: BookOpenText,
  delivery: Bell
} as const;

export type TaskIconName = keyof typeof TASK_ICONS;

export function TaskIcon({
  name,
  size = 16,
  className
}: {
  name: TaskIconName;
  size?: number;
  className?: string;
}) {
  const Icon = TASK_ICONS[name];
  return (
    <Icon
      size={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function TaskTypeBadge({ type }: { type: string }) {
  const info = taskTypeInfo(type);
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-1 text-xs font-medium",
        info.badge
      )}
    >
      {info.label}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus | string }) {
  const labels: Record<string, string> = TASK_STATUSES;
  const label = labels[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-green-50 text-green-600": label === "Active",
          "bg-blue-50 text-blue-600": label === "Draft",
          "bg-gray-50 text-gray-500": ["Paused", "Completed"].includes(label)
        }
      )}
    >
      {label}
    </span>
  );
}
