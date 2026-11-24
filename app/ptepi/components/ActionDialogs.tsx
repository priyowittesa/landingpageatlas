"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { AUTONOMY_LABELS } from "../store/action-helpers";
import { useActionsStore, type EpiAction } from "../store/actions-store";
import { OWNER_ROLES } from "../store/roles";
import type { ActionAutonomy } from "../types";

const AUTONOMY_OPTIONS = Object.keys(AUTONOMY_LABELS) as ActionAutonomy[];
const ROLE_OPTIONS = [...OWNER_ROLES];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function OwnerSelect({
  id,
  value,
  onChange
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select an owner role" />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type CreateActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectOptions: string[];
  defaultOwnerRole: string;
  defaultDueDate: string;
};

export function CreateActionDialog(props: CreateActionDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <CreateActionForm {...props} />}
    </Dialog>
  );
}

function CreateActionForm({
  onOpenChange,
  projectOptions,
  defaultOwnerRole,
  defaultDueDate
}: CreateActionDialogProps) {
  const addAction = useActionsStore((state) => state.addAction);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projectOptions[0] ?? "");
  const [ownerRole, setOwnerRole] = useState(
    ROLE_OPTIONS.includes(defaultOwnerRole as (typeof OWNER_ROLES)[number])
      ? defaultOwnerRole
      : ROLE_OPTIONS[0] ?? ""
  );
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [autonomy, setAutonomy] = useState<ActionAutonomy>("L1");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (title.trim() === "") return setError("Enter a title for the action.");
    if (projectId === "") return setError("Select a project.");
    if (!DATE_PATTERN.test(dueDate)) return setError("Enter a due date.");
    const number = useActionsStore.getState().nextNumber;
    const created = addAction({
      title: title.trim(),
      projectId,
      ownerRole,
      dueDate,
      autonomy,
      source: `S8 Action tracker: manual ${number}`
    });
    toast.success(`${created.id} created`, { description: `${created.projectId}: ${created.title}` });
    onOpenChange(false);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>New action</DialogTitle>
        <DialogDescription>
          A person raises it, a named owner works it and closes it.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Title" htmlFor="action-title">
          <Input
            id="action-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What has to happen"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Project" htmlFor="action-project">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="action-project" className="w-full">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Due date" htmlFor="action-due">
            <Input
              id="action-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Owner role" htmlFor="action-owner">
          <OwnerSelect id="action-owner" value={ownerRole} onChange={setOwnerRole} />
        </Field>
        <Field label="Autonomy" htmlFor="action-autonomy">
          <Select value={autonomy} onValueChange={(value) => setAutonomy(value as ActionAutonomy)}>
            <SelectTrigger id="action-autonomy" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTONOMY_OPTIONS.map((level) => (
                <SelectItem key={level} value={level}>
                  {AUTONOMY_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" className="bg-primary-700 text-white hover:bg-primary-800" onClick={submit}>
          Create action
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

type AssignActionDialogProps = {
  action: EpiAction | null;
  onClose: () => void;
};

export function AssignActionDialog({ action, onClose }: AssignActionDialogProps) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      {action && <AssignForm key={action.id} action={action} onClose={onClose} />}
    </Dialog>
  );
}

function AssignForm({ action, onClose }: { action: EpiAction; onClose: () => void }) {
  const assignAction = useActionsStore((state) => state.assignAction);
  const [ownerRole, setOwnerRole] = useState(action.ownerRole);
  const unchanged = ownerRole === action.ownerRole;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Assign {action.id}</DialogTitle>
        <DialogDescription>{action.title}</DialogDescription>
      </DialogHeader>
      <Field label="Owner role" htmlFor="assign-owner">
        <OwnerSelect id="assign-owner" value={ownerRole} onChange={setOwnerRole} />
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={unchanged}
          className="bg-primary-700 text-white hover:bg-primary-800"
          onClick={() => {
            assignAction(action.id, ownerRole);
            toast.success(`${action.id} assigned`, { description: `Owner: ${ownerRole}` });
            onClose();
          }}
        >
          Assign
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
