"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  GripVertical,
  Headphones,
  LayoutGrid,
  Pencil,
  Settings,
  Shield,
  Users,
  X,
  Flame,
  type LucideIcon
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type ModuleItem = {
  id: string;
  name: string;
  description?: string;
  icon: LucideIcon;
  iconClassName: string;
  visible?: boolean;
};

type ModuleSection = {
  id: string;
  title: string;
  editable?: boolean;
  modules: ModuleItem[];
};

const initialSections: ModuleSection[] = [
  {
    id: "overview",
    title: "Overview",
    modules: [
      {
        id: "workspace-dashboard",
        name: "Workspace Dashboard",
        icon: LayoutGrid,
        iconClassName: "bg-gray-100 text-gray-800"
      }
    ]
  },
  {
    id: "modules",
    title: "Your Modules",
    editable: true,
    modules: [
      {
        id: "aimos",
        name: "AIMOS",
        description: "AI Marketing Operating System",
        icon: BarChart3,
        iconClassName: "bg-primary-50 text-primary-600",
        visible: true
      },
      {
        id: "safera",
        name: "SAFERA",
        description: "Safety Event, Field Evidence & Risk Analytics",
        icon: Shield,
        iconClassName: "bg-emerald-50 text-emerald-600",
        visible: true
      },
      {
        id: "petros",
        name: "PETROS",
        description: "Petroleum Technical Reliability & Operations System",
        icon: Flame,
        iconClassName: "bg-amber-50 text-amber-600",
        visible: true
      },
      {
        id: "servora",
        name: "SERVORA",
        description: "Service Operations & Response Assistant",
        icon: Headphones,
        iconClassName: "bg-pink-50 text-pink-600",
        visible: true
      }
    ]
  },
  {
    id: "other",
    title: "Other",
    editable: true,
    modules: [
      {
        id: "role-management",
        name: "Role Access Management",
        icon: Users,
        iconClassName: "bg-gray-100 text-gray-800"
      },
      {
        id: "settings",
        name: "Settings",
        icon: Settings,
        iconClassName: "bg-gray-100 text-gray-800"
      }
    ]
  }
];

function VisibilitySwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={`${checked ? "Hide" : "Show"} ${label}`}
        className="data-[state=checked]:bg-gray-900"
      />
      <span className="w-8 text-[10px] text-gray-700">
        {checked ? "Show" : "Hide"}
      </span>
    </div>
  );
}

function ModuleRow({
  item,
  index,
  movable,
  onMove,
  onToggle
}: {
  item: ModuleItem;
  index: number;
  movable: boolean;
  onMove: (from: number, to: number) => void;
  onToggle: () => void;
}) {
  const Icon = item.icon;

  return (
    <div
      draggable={movable}
      onDragStart={(event) =>
        event.dataTransfer.setData("text/plain", String(index))
      }
      onDragOver={(event) => movable && event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onMove(Number(event.dataTransfer.getData("text/plain")), index);
      }}
      className="flex min-h-14 items-center gap-2 border-b border-gray-200 px-3 py-2 last:border-b-0"
    >
      <GripVertical
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-gray-500",
          movable ? "cursor-grab" : "opacity-0"
        )}
        aria-hidden="true"
      />
      <span className="w-5 shrink-0 text-center text-[9px] text-gray-500">
        #{index + 1}
      </span>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          item.iconClassName
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold leading-4 text-gray-950">
          {item.name}
        </p>
        {item.description && (
          <p className="truncate text-[9px] leading-3 text-gray-500">
            {item.description}
          </p>
        )}
      </div>
      {typeof item.visible === "boolean" && (
        <VisibilitySwitch
          checked={item.visible}
          onChange={onToggle}
          label={item.name}
        />
      )}
    </div>
  );
}

export function ModuleOrderSettings() {
  const [sections, setSections] = useState(initialSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    setSections((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function moveModule(sectionId: string, from: number, to: number) {
    if (!Number.isInteger(from) || from === to) return;
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;
        const modules = [...section.modules];
        const [item] = modules.splice(from, 1);
        if (!item) return section;
        modules.splice(to, 0, item);
        return { ...section, modules };
      })
    );
  }

  function toggleModule(sectionId: string, moduleId: string) {
    setSections((current) =>
      current.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              modules: section.modules.map((item) =>
                item.id === moduleId
                  ? { ...item, visible: !item.visible }
                  : item
              )
            }
      )
    );
  }

  function startEditing(section: ModuleSection) {
    setEditingId(section.id);
    setDraftTitle(section.title);
  }

  function saveTitle() {
    const value = draftTitle.trim();
    if (!editingId || !value) return;
    setSections((current) =>
      current.map((section) =>
        section.id === editingId ? { ...section, title: value } : section
      )
    );
    setEditingId(null);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-gray-950">Module Order</h2>

      <div className="mt-5 space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            <div className="mb-2 flex min-h-7 items-center gap-1">
              {editingId === section.id ? (
                <>
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveTitle();
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="h-7 w-full max-w-64 rounded-md border border-gray-300 px-2 text-xs outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="cursor-pointer p-1 text-red-500 hover:text-red-700"
                    aria-label="Cancel editing section name"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={saveTitle}
                    className="cursor-pointer p-1 text-emerald-500 hover:text-emerald-700"
                    aria-label="Save section name"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-gray-600">
                    {section.title}
                  </span>
                  {section.editable && (
                    <button
                      type="button"
                      onClick={() => startEditing(section)}
                      className="cursor-pointer p-1 text-primary-600 hover:text-primary-800"
                      aria-label={`Rename ${section.title}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}

              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveSection(sectionIndex, 1)}
                  disabled={sectionIndex === sections.length - 1}
                  className="cursor-pointer p-1 text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label={`Move ${section.title} down`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sectionIndex, -1)}
                  disabled={sectionIndex === 0}
                  className="cursor-pointer p-1 text-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label={`Move ${section.title} up`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {section.modules.map((item, index) => (
                <ModuleRow
                  key={item.id}
                  item={item}
                  index={index}
                  movable={section.modules.length > 1}
                  onMove={(from, to) => moveModule(section.id, from, to)}
                  onToggle={() => toggleModule(section.id, item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => toast.success("Module order saved")}
          className="h-9 cursor-pointer rounded-md bg-primary-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-800"
        >
          Save Changes
        </button>
      </div>
    </section>
  );
}
