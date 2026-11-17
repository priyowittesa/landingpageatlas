"use client";

import { FolderPlus, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useCreateLabourGroup,
  type LabourGroup,
} from "../use-labour-groups";

type AddGroupDialogProps = {
  onCreated: (group: LabourGroup) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
};

export function AddGroupDialog({
  onCreated,
  onOpenChange,
  open,
  projectId,
}: AddGroupDialogProps) {
  const createGroup = useCreateLabourGroup();
  const [name, setName] = useState("");

  const reset = () => setName("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (createGroup.isPending) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const groupName = name.trim();
    if (!groupName || createGroup.isPending) return;

    try {
      const group = await createGroup.mutateAsync({
        capacity: 0,
        description: "",
        name: groupName,
        project_id: projectId,
        sort_order: 0,
      });
      onCreated(group);
      reset();
      onOpenChange(false);
    } catch {
      // The shared mutation handler displays the API error and the form stays open.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton={!createGroup.isPending}
      >
        <form onSubmit={submit}>
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <FolderPlus className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-sm">Add Group</DialogTitle>
                <DialogDescription className="text-xs">
                  Create a group for organizing employees.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-5 py-5">
            <label className="space-y-1.5 text-xs font-medium">
              Group Name <span className="text-red-500">*</span>
              <Input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Site Crew"
                className="h-9 w-full text-xs"
                maxLength={100}
                disabled={createGroup.isPending}
              />
            </label>
          </div>

          <DialogFooter className="border-t px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={createGroup.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || createGroup.isPending}
              className="bg-neutral-900 hover:bg-neutral-800"
            >
              {createGroup.isPending && (
                <LoaderCircle className="animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
