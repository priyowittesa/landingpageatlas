"use client";

import { LoaderCircle, Pencil } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

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
import { useUpdateLabourGroup } from "../use-labour-groups";

type EditableGroup = {
  id: string;
  name: string;
};

type EditGroupDialogProps = {
  group: EditableGroup | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (group: EditableGroup) => void;
  open: boolean;
  projectId: string;
};

export function EditGroupDialog({
  group,
  onOpenChange,
  onUpdated,
  open,
  projectId,
}: EditGroupDialogProps) {
  const updateGroup = useUpdateLabourGroup();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open && group) setName(group.name);
  }, [group, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (updateGroup.isPending) return;
    onOpenChange(nextOpen);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const groupName = name.trim();
    if (!group || !groupName || updateGroup.isPending) return;

    try {
      await updateGroup.mutateAsync({
        id: group.id,
        payload: {
          name: groupName,
          project_id: projectId,
        },
      });
      onUpdated({ id: group.id, name: groupName });
      onOpenChange(false);
    } catch {
      // The shared mutation handler displays the API error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton={!updateGroup.isPending}
      >
        <form onSubmit={submit}>
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <Pencil className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-sm">Edit Group</DialogTitle>
                <DialogDescription className="text-xs">
                  Update the group name.
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
                placeholder="Group name"
                className="h-9 w-full text-xs"
                maxLength={100}
                disabled={updateGroup.isPending}
              />
            </label>
          </div>

          <DialogFooter className="border-t px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateGroup.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || updateGroup.isPending}
            >
              {updateGroup.isPending && (
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
