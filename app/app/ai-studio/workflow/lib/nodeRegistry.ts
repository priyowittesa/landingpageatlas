import type { NodeCategoryDefinition, NodeDefinition } from "../types";

export const nodeRegistry: NodeCategoryDefinition[] = [
  {
    id: "data_source",
    label: "Data Source",
    icon: "Database",
    items: [
      { type: "text_input", label: "Text Input", category: "data_source", borderColor: "blue", icon: "Type", description: "Plain text input" },
      { type: "files", label: "Files", category: "data_source", borderColor: "blue", icon: "File", description: "File upload input" },
      { type: "data", label: "Data", category: "data_source", borderColor: "blue", icon: "Braces", description: "Raw data input" },
      { type: "custom_api", label: "Custom API", category: "data_source", borderColor: "blue", icon: "Globe", description: "Custom API endpoint" },
      { type: "buildsmart_api", label: "Buildsmart API", category: "data_source", borderColor: "blue", icon: "Cloud", description: "Buildsmart API endpoint" },
      { type: "audio_to_text", label: "Audio to Text", category: "data_source", borderColor: "blue", icon: "AudioLines", description: "Transcribe audio" },
      { type: "image", label: "Image", category: "data_source", borderColor: "blue", icon: "Image", description: "Image input" },
      { type: "google_drive", label: "Google Drive", category: "data_source", borderColor: "blue", icon: "HardDrive", description: "Google Drive connector" },
      { type: "sharepoint", label: "SharePoint", category: "data_source", borderColor: "blue", icon: "HardDrive", description: "SharePoint connector" },
      { type: "sharepoint", label: "SharePoint", category: "data_source", borderColor: "blue", icon: "HardDrive", description: "SharePoint connector" },
      { type: "postgresql", label: "PostgreSQL", category: "data_source", borderColor: "green", icon: "Database", description: "PostgreSQL database" },
      { type: "sql_server", label: "SQL Server", category: "data_source", borderColor: "green", icon: "Database", description: "SQL Server database" },
      { type: "mysql", label: "MySQL", category: "data_source", borderColor: "green", icon: "Database", description: "MySQL database" },
    ],
  },
  {
    id: "data_transform",
    label: "Data Transform",
    icon: "Wrench",
    items: [
      { type: "join_table", label: "Join Table", category: "data_transform", borderColor: "green", icon: "Combine", description: "Join two tables" },
      { type: "sql_query", label: "SQL Query", category: "data_transform", borderColor: "green", icon: "Terminal", description: "Execute SQL query" },
      { type: "transform", label: "Transform", category: "data_transform", borderColor: "green", icon: "Wrench", description: "Transform data" },
      { type: "table", label: "Table", category: "data_transform", borderColor: "green", icon: "Table", description: "Table output" },
    ],
  },
  {
    id: "ai",
    label: "Artificial Intelligence",
    icon: "BrainCircuit",
    items: [
      { type: "ai_agent", label: "AI Agent", category: "ai", borderColor: "purple", icon: "Bot", description: "Autonomous AI agent" },
      { type: "llm", label: "LLM", category: "ai", borderColor: "purple", icon: "BrainCircuit", description: "Large language model" },
    ],
  },
  {
    id: "logic",
    label: "Logic",
    icon: "GitBranch",
    items: [
      { type: "if_else", label: "If / Else", category: "logic", borderColor: "orange", icon: "GitBranch", description: "Conditional branching" },
    ],
  },
  {
    id: "utils",
    label: "Utils",
    icon: "StickyNote",
    items: [
      { type: "sticky_notes", label: "Sticky Notes", category: "utils", borderColor: "gray", icon: "StickyNote", description: "Add notes to canvas" },
    ],
  },
];

export const allNodeDefinitions: NodeDefinition[] = nodeRegistry.flatMap(
  (cat) => cat.items
);

export function findNodeDefinition(type: string): NodeDefinition | undefined {
  return allNodeDefinitions.find((n) => n.type === type);
}

export const borderColorMap: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  gray: "#6b7280",
};
