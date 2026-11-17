"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Pencil,
  Check,
  X,
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { Workflow, WorkflowFolder } from "../types";

export function FolderTree({
  folders,
  workflows,
  isLoading,
  collapsed,
  selectedFolderId,
  onToggleCollapse,
  onSelectFolder,
  onSelectWorkflow,
  onCreateFolder,
  onCreateProject,
  onEditFolder,
  onDeleteFolder,
  onRenameWorkflow,
  onDeleteWorkflow
}: {
  folders: WorkflowFolder[];
  workflows: Workflow[];
  isLoading?: boolean;
  collapsed: boolean;
  selectedFolderId: string | null;
  onToggleCollapse: () => void;
  onSelectFolder: (id: string) => void;
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateFolder: () => void;
  onCreateProject: (folderId: string) => void;
  onEditFolder: (folder: WorkflowFolder) => void;
  onDeleteFolder: (folder: WorkflowFolder) => void;
  onRenameWorkflow: (workflow: Workflow, name: string) => Promise<void>;
  onDeleteWorkflow: (workflow: Workflow) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null
  );
  const [workflowNameDraft, setWorkflowNameDraft] = useState("");
  const [isSavingWorkflowName, setIsSavingWorkflowName] = useState(false);

  const saveWorkflowName = async (workflow: Workflow) => {
    const name = workflowNameDraft.trim();
    if (!name) {
      toast.error("Workflow name cannot be empty");
      return;
    }
    if (name === workflow.name) {
      setEditingWorkflowId(null);
      return;
    }

    setIsSavingWorkflowName(true);
    try {
      await onRenameWorkflow(workflow, name);
      setEditingWorkflowId(null);
    } catch {
      // Keep the input open so the user can retry.
    } finally {
      setIsSavingWorkflowName(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    onSelectFolder(id);
  };

  // Auto-expand when selectedFolderId is set from outside (e.g. auto-open).
  useEffect(() => {
    if (selectedFolderId) {
      setExpanded((prev) =>
        prev[selectedFolderId] ? prev : { ...prev, [selectedFolderId]: true }
      );
    }
  }, [selectedFolderId]);

  const query = search.trim().toLowerCase();
  const visibleFolders = query
    ? folders.filter((f) => f.name.toLowerCase().includes(query))
    : folders;

  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-gray-200 bg-white py-3">
        <button
          onClick={onToggleCollapse}
          className="rounded-md bg-primary-600 p-1.5 text-white hover:bg-primary-700"
          title="Expand"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 p-3">
        <button
          onClick={onCreateFolder}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Create New Folder
        </button>
        <button
          onClick={onToggleCollapse}
          className="rounded-md bg-primary-600 p-2 text-white hover:bg-primary-700"
          title="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type here"
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button className="rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!isLoading && visibleFolders.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            No folders yet
          </div>
        )}

        {!isLoading &&
          visibleFolders.map((folder) => {
            const isExpanded = expanded[folder.id];
            const isSelected = selectedFolderId === folder.id;
            const folderWorkflows = workflows.filter(
              (w) => w.folder_id === folder.id
            );

            return (
              <div key={folder.id} className="mb-0.5">
                <div
                  className={cn(
                    "group flex items-center gap-1.5 rounded-md px-2 py-2 text-sm",
                    isSelected
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <button
                    onClick={() => toggleExpand(folder.id)}
                    className="flex flex-1 items-center gap-1.5 text-left"
                  >
                    <LayoutGrid
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-primary-600" : "text-gray-400"
                      )}
                    />
                    <span className="flex-1 truncate font-medium">
                      {folder.name}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  <div className="hidden items-center gap-0.5 group-hover:flex">
                    <button
                      onClick={() => onEditFolder(folder)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      title="Edit folder"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFolder(folder)}
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Delete folder"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                    {folderWorkflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        {editingWorkflowId === workflow.id ? (
                          <>
                            <input
                              autoFocus
                              aria-label={`Rename ${workflow.name}`}
                              value={workflowNameDraft}
                              onChange={(event) =>
                                setWorkflowNameDraft(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void saveWorkflowName(workflow);
                                }
                                if (event.key === "Escape") {
                                  setEditingWorkflowId(null);
                                }
                              }}
                              disabled={isSavingWorkflowName}
                              className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-1.5 py-1 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                            <button
                              type="button"
                              onClick={() => void saveWorkflowName(workflow)}
                              disabled={isSavingWorkflowName}
                              aria-label="Save workflow name"
                              title="Save name"
                              className="rounded p-1 text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {isSavingWorkflowName ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingWorkflowId(null)}
                              disabled={isSavingWorkflowName}
                              aria-label="Cancel workflow rename"
                              title="Cancel"
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onSelectWorkflow(workflow)}
                              className="flex-1 truncate text-left"
                            >
                              {workflow.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWorkflowNameDraft(workflow.name);
                                setEditingWorkflowId(workflow.id);
                              }}
                              aria-label={`Rename ${workflow.name}`}
                              title="Rename project"
                              className="hidden rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 group-hover:block"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteWorkflow(workflow)}
                              className="hidden rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 group-hover:block"
                              title="Delete project"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => onCreateProject(folder.id)}
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Project
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
