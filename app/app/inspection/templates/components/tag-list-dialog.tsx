"use client";

import { Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DEFAULT_TAG_COLOR,
  useControlPoints,
  useCreateControlPoint,
  useDeleteControlPoints,
  useUpdateControlPoint
} from "../use-control-points";
import type { ControlPointTag } from "../types";

type Mode =
  | { view: "list" }
  | { view: "manage" }
  | { view: "create" }
  | { view: "edit"; tag: ControlPointTag };

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function TagForm({
  title,
  initialLabel,
  initialColor,
  existingLabels,
  pending,
  onCancel,
  onSave
}: {
  title: string;
  initialLabel: string;
  initialColor: string;
  existingLabels: string[];
  pending: boolean;
  onCancel: () => void;
  onSave: (label: string, color: string) => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [color, setColor] = useState(initialColor);
  const validColor = HEX_PATTERN.test(color);
  const trimmedLabel = label.trim();
  const duplicateName = trimmedLabel
    ? existingLabels.some(
        (existing) => existing.toLowerCase() === trimmedLabel.toLowerCase()
      )
    : false;
  const canSave =
    Boolean(trimmedLabel) && validColor && !duplicateName && !pending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Set the tag name and color.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="tag-name"
            className="text-xs font-semibold text-gray-700"
          >
            Tag Name
          </label>
          <Input
            id="tag-name"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Type tag name"
            className={`mt-2 ${
              duplicateName ? "border-red-300 focus-visible:ring-red-200" : ""
            }`}
            autoFocus
          />
          {duplicateName && (
            <p className="mt-1 text-xs text-red-600">
              A tag with this name already exists. Use a different name.
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="tag-color"
            className="text-xs font-semibold text-gray-700"
          >
            Tag Color
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="tag-color"
              type="color"
              value={validColor ? color : DEFAULT_TAG_COLOR}
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
              aria-label="Pick tag color"
            />
            <Input
              value={color}
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              placeholder={DEFAULT_TAG_COLOR}
              className={validColor ? "" : "border-red-300"}
            />
          </div>
          {!validColor && (
            <p className="mt-1 text-xs text-red-600">
              Use a 6-digit hex color, e.g. {DEFAULT_TAG_COLOR}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => onSave(label.trim(), color.toUpperCase())}
        >
          {pending ? <Spinner className="h-4 w-4" /> : "Save"}
        </Button>
      </div>
    </>
  );
}

export function TagListDialog({
  open,
  onOpenChange,
  selectedIds,
  onToggleTag,
  onTagsDeleted,
  currentUser
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onToggleTag: (tag: ControlPointTag) => void;
  onTagsDeleted: (tagIds: string[]) => void;
  currentUser: string;
}) {
  const [mode, setMode] = useState<Mode>({ view: "list" });
  const [search, setSearch] = useState("");
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const { data: tags, isLoading } = useControlPoints();
  const createTag = useCreateControlPoint();
  const updateTag = useUpdateControlPoint();
  const deleteTags = useDeleteControlPoints();

  useEffect(() => {
    if (!open) {
      setMode({ view: "list" });
      setSearch("");
      setPendingDeleteIds([]);
    }
  }, [open]);

  const visibleTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (tags ?? []).filter(
      (tag) =>
        !pendingDeleteIds.includes(tag.id) &&
        (!query || tag.label.toLowerCase().includes(query))
    );
  }, [tags, search, pendingDeleteIds]);

  const existingTagLabels = useMemo(
    () => (tags ?? []).map((tag) => tag.label),
    [tags]
  );

  const isManaging = mode.view === "manage";

  function confirmDeletions() {
    if (pendingDeleteIds.length === 0) {
      setMode({ view: "list" });
      return;
    }
    deleteTags.mutate(pendingDeleteIds, {
      onSuccess: () => {
        onTagsDeleted(pendingDeleteIds);
        setPendingDeleteIds([]);
        setMode({ view: "list" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {mode.view === "create" && (
          <TagForm
            title="Create New Tag"
            initialLabel=""
            initialColor={DEFAULT_TAG_COLOR}
            existingLabels={existingTagLabels}
            pending={createTag.isPending}
            onCancel={() => setMode({ view: "list" })}
            onSave={(label, color) =>
              createTag.mutate(
                { label, color, created_by: currentUser },
                { onSuccess: () => setMode({ view: "list" }) }
              )
            }
          />
        )}

        {mode.view === "edit" && (
          <TagForm
            key={mode.tag.id}
            title="Edit Tag"
            initialLabel={mode.tag.label}
            initialColor={mode.tag.color}
            existingLabels={existingTagLabels.filter(
              (label) => label.toLowerCase() !== mode.tag.label.toLowerCase()
            )}
            pending={updateTag.isPending}
            onCancel={() => setMode({ view: "manage" })}
            onSave={(label, color) =>
              updateTag.mutate(
                { id: mode.tag.id, label, color, updated_by: currentUser },
                { onSuccess: () => setMode({ view: "manage" }) }
              )
            }
          />
        )}

        {(mode.view === "list" || isManaging) && (
          <>
            <DialogHeader>
              <DialogTitle>Tag List</DialogTitle>
              <DialogDescription className="sr-only">
                Select, create, edit, or delete inspection tags.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="pl-9"
              />
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {isLoading && (
                <div className="flex justify-center py-6">
                  <Spinner className="h-5 w-5" />
                </div>
              )}
              {!isLoading && visibleTags.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">
                  No tags found
                </p>
              )}
              {visibleTags.map((tag) => {
                const selected = selectedIds.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between gap-2 rounded-md px-1 hover:bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        isManaging
                          ? setMode({ view: "edit", tag })
                          : onToggleTag(tag)
                      }
                      className="flex flex-1 items-center gap-2.5 py-2 text-left text-sm"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span
                        className={
                          selected && !isManaging
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }
                      >
                        {tag.label}
                      </span>
                    </button>
                    {isManaging && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-600"
                        onClick={() =>
                          setPendingDeleteIds((current) => [...current, tag.id])
                        }
                        aria-label={`Delete ${tag.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {isManaging ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPendingDeleteIds([]);
                      setMode({ view: "list" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={deleteTags.isPending}
                    onClick={confirmDeletions}
                  >
                    {deleteTags.isPending ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode({ view: "manage" })}
                  >
                    Edit Tag
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setMode({ view: "create" })}
                  >
                    Add New
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
