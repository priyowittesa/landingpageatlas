"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Database,
  Wrench,
  BrainCircuit,
  GitBranch,
  StickyNote,
  ChevronDown,
  Search,
  Type,
  File,
  Braces,
  Globe,
  Cloud,
  AudioLines,
  Image as ImageIcon,
  HardDrive,
  Combine,
  Terminal,
  Table,
  Bot,
  Loader2
} from "lucide-react";

import { cn } from "@/lib/utils";
import { borderColorMap } from "../lib/nodeRegistry";
import { registerConnectorTypes } from "../lib/nodeConfig";
import { useGetNodeTypes } from "../hooks/useNodeTypes";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import type {
  NodeCategoryDefinition,
  NodeDefinition,
  NodeType
} from "../types";

const categoryIconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Database,
  Wrench,
  BrainCircuit,
  GitBranch,
  StickyNote,
  Cloud
};

const nodeIconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Type,
  File,
  Braces,
  Globe,
  Cloud,
  AudioLines,
  Image: ImageIcon,
  HardDrive,
  Database,
  Combine,
  Terminal,
  Wrench,
  Table,
  Bot,
  BrainCircuit,
  GitBranch,
  StickyNote
};

const connectorTypeConfig: Record<
  string,
  {
    label: string;
    icon: string;
    borderColor: NodeDefinition["borderColor"];
    nodeIcon: string;
    category: NodeDefinition["category"];
  }
> = {
  http: {
    label: "Data Source",
    icon: "Cloud",
    borderColor: "blue",
    nodeIcon: "Cloud",
    category: "data_source"
  },
  db: {
    label: "Destination",
    icon: "Database",
    borderColor: "green",
    nodeIcon: "Database",
    category: "data_source"
  },
  transform: {
    label: "Data Transform",
    icon: "Wrench",
    borderColor: "green",
    nodeIcon: "Wrench",
    category: "data_transform"
  },
  ai: {
    label: "Artificial Intelligence",
    icon: "BrainCircuit",
    borderColor: "purple",
    nodeIcon: "BrainCircuit",
    category: "ai"
  }
};

function formatLabel(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapNodeTypesToCategories(items: NodeType[]): NodeCategoryDefinition[] {
  const grouped = items.reduce<Record<string, NodeType[]>>((acc, item) => {
    (acc[item.connector_type.toLowerCase()] ??= []).push(item);
    return acc;
  }, {});

  return Object.entries(grouped).map(([connectorType, nodes]) => {
    const config = connectorTypeConfig[connectorType] ?? {
      label: formatLabel(connectorType),
      icon: "Database",
      borderColor: "gray" as const,
      nodeIcon: "Database",
      category: "data_source" as const
    };

    return {
      id: connectorType,
      label: config.label,
      icon: config.icon,
      items: nodes.map((node) => ({
        type: node.name,
        label: formatLabel(node.name),
        category: config.category,
        borderColor: config.borderColor,
        icon: config.nodeIcon,
        description: node.description
      }))
    };
  });
}

export function WorkflowSidebar({
  onDragStart
}: {
  onDragStart: (e: React.DragEvent, nodeType: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { data, isLoading, isError } = useGetNodeTypes();
  const setNodeDefinitions = useWorkflowStore((s) => s.setNodeDefinitions);

  const categories = useMemo(
    () => (data ? mapNodeTypesToCategories(data.items) : []),
    [data]
  );

  useEffect(() => {
    const map: Record<string, NodeDefinition> = {};
    for (const cat of categories) {
      for (const item of cat.items) {
        map[item.type] = item;
      }
    }
    setNodeDefinitions(map);
  }, [categories, setNodeDefinitions]);

  // Register connector types so nodeConfig can resolve roles / config forms
  // dynamically for any connector the backend exposes.
  useEffect(() => {
    if (data?.items) {
      registerConnectorTypes(data.items);
    }
  }, [data]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q)
        )
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search, data]);

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading nodes...
          </div>
        )}
        {isError && (
          <div className="p-4 text-center text-sm text-red-400">
            Failed to load nodes
          </div>
        )}
        {!isLoading && !isError && filteredCategories.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-400">
            No nodes found
          </div>
        )}
        {filteredCategories.map((category) => {
          const CatIcon = categoryIconMap[category.icon] ?? Database;
          const isCollapsed = collapsed[category.id];

          return (
            <div key={category.id} className="border-b border-gray-100">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <CatIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {category.label}
                </span>
                <ChevronDown
                  className={cn(
                    "ml-auto h-4 w-4 text-gray-400 transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-1 px-2 pb-2">
                  {category.items.map((item) => (
                    <NodePaletteItem
                      key={item.type}
                      item={item}
                      onDragStart={onDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NodePaletteItem({
  item,
  onDragStart
}: {
  item: NodeDefinition;
  onDragStart: (e: React.DragEvent, nodeType: string) => void;
}) {
  const Icon = nodeIconMap[item.icon] ?? Database;
  const color = borderColorMap[item.borderColor] ?? "#6b7280";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.type)}
      className="flex cursor-grab items-center gap-2 rounded-md border border-gray-100 px-2.5 py-2 transition-colors hover:border-gray-300 hover:bg-gray-50 active:cursor-grabbing"
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <span className="text-xs font-medium text-gray-700">{item.label}</span>
    </div>
  );
}
