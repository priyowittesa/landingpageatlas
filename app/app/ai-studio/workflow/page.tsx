"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FolderTree } from "./components/FolderTree";
import {
  WorkflowFormDialog,
  type WorkflowFormValues
} from "./components/WorkflowFormDialog";
import {
  useCreateFolder,
  useCreateWorkflow,
  useDeleteFolder,
  useDeleteWorkflow,
  useGetFolders,
  useGetWorkflows,
  useUpdateFolder,
  useRenameWorkflow
} from "./hooks/useWorkflow";
import type { WorkflowFolder } from "./types";

type DialogState =
  | { type: "create-folder" }
  | { type: "edit-folder"; folder: WorkflowFolder }
  | { type: "create-project"; folderId: string }
  | null;

export default function WorkflowPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const foldersQuery = useGetFolders();
  const workflowsQuery = useGetWorkflows();

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const renameWorkflow = useRenameWorkflow();

  const folders = foldersQuery.data?.data ?? [];
  const workflows = workflowsQuery.data?.data ?? [];

  const selectedFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId) ?? null,
    [folders, selectedFolderId]
  );

  // Auto-expand the first folder that has projects once data has loaded.
  const autoOpenDone = useRef(false);
  useEffect(() => {
    if (autoOpenDone.current) return;
    if (foldersQuery.isLoading || workflowsQuery.isLoading) return;
    if (folders.length === 0 || workflows.length === 0) return;

    autoOpenDone.current = true;
    const folderWithProjects = folders.find((f) =>
      workflows.some((w) => w.folder_id === f.id)
    );
    if (folderWithProjects) {
      setSelectedFolderId(folderWithProjects.id);
    }
  }, [folders, workflows, foldersQuery.isLoading, workflowsQuery.isLoading]);

  const isSubmitting =
    createFolder.isPending ||
    updateFolder.isPending ||
    createWorkflow.isPending;

  const handleDialogSubmit = (values: WorkflowFormValues) => {
    if (!dialog) return;

    if (dialog.type === "create-folder") {
      createFolder.mutate(
        { name: values.name, description: values.description },
        { onSuccess: () => setDialog(null) }
      );
    } else if (dialog.type === "edit-folder") {
      updateFolder.mutate(
        {
          id: dialog.folder.id,
          payload: { name: values.name, description: values.description }
        },
        { onSuccess: () => setDialog(null) }
      );
    } else if (dialog.type === "create-project") {
      createWorkflow.mutate(
        {
          name: values.name,
          description: values.description,
          folder_id: dialog.folderId
        },
        {
          onSuccess: (res) => {
            setDialog(null);
            setSelectedFolderId(dialog.folderId);
            router.push(
              `/app/ai-studio/workflow/${dialog.folderId}/${res.data.id}`
            );
          }
        }
      );
    }
  };

  const handleNewProject = () => {
    const folderId = selectedFolderId ?? folders[0]?.id;
    if (!folderId) {
      setDialog({ type: "create-folder" });
      return;
    }
    setDialog({ type: "create-project", folderId });
  };

  const dialogTitle =
    dialog?.type === "create-folder"
      ? "Create New Folder"
      : dialog?.type === "edit-folder"
        ? "Edit Folder"
        : "New Project";

  const dialogSubmitLabel = dialog?.type === "edit-folder" ? "Save" : "Create";
  const dialogInitial =
    dialog?.type === "edit-folder"
      ? {
          name: dialog.folder.name,
          description: dialog.folder.description ?? ""
        }
      : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <ChevronLeft className="h-5 w-5 text-gray-500" />
        <h1 className="text-lg font-semibold text-gray-900">Workflow Studio</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FolderTree
          folders={folders}
          workflows={workflows}
          isLoading={foldersQuery.isLoading}
          collapsed={collapsed}
          selectedFolderId={selectedFolderId}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onSelectFolder={setSelectedFolderId}
          onSelectWorkflow={(workflow) =>
            router.push(
              `/app/ai-studio/workflow/${workflow.folder_id}/${workflow.id}`
            )
          }
          onCreateFolder={() => setDialog({ type: "create-folder" })}
          onCreateProject={(folderId) =>
            setDialog({ type: "create-project", folderId })
          }
          onEditFolder={(folder) => setDialog({ type: "edit-folder", folder })}
          onDeleteFolder={(folder) => {
            if (
              window.confirm(`Delete folder "${folder.name}" and its projects?`)
            ) {
              deleteFolder.mutate(folder.id, {
                onSuccess: () => {
                  if (selectedFolderId === folder.id) setSelectedFolderId(null);
                }
              });
            }
          }}
          onDeleteWorkflow={(workflow) => {
            if (window.confirm(`Delete project "${workflow.name}"?`)) {
              deleteWorkflow.mutate(workflow.id);
            }
          }}
          onRenameWorkflow={async (workflow, name) => {
            await renameWorkflow.mutateAsync({ id: workflow.id, name });
          }}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h2 className="text-base font-medium text-gray-900">
              {selectedFolder?.name ?? "Select a folder"}
            </h2>
            <Button onClick={handleNewProject}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Get Started
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Fully design a custom assistant
                <br />
                with our advanced workflow builder
              </p>
              <Button className="mt-5" onClick={handleNewProject}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <WorkflowFormDialog
        open={dialog !== null}
        title={dialogTitle}
        submitLabel={dialogSubmitLabel}
        initialValues={dialogInitial}
        isSubmitting={isSubmitting}
        onClose={() => setDialog(null)}
        onSubmit={handleDialogSubmit}
      />
    </div>
  );
}
