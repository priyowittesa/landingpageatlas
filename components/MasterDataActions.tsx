"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type MasterDataActionsProps = {
  name: string;
  editHref?: string;
  onEdit?: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

const editClassName =
  "h-8 w-8 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700";
const deleteClassName =
  "h-8 w-8 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600";

export default function MasterDataActions({
  name,
  editHref,
  onEdit,
  onDelete,
  disabled = false,
}: MasterDataActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {editHref ? (
        <Button asChild variant="outline" size="icon" className={editClassName}>
          <Link href={editHref} aria-label={`Edit ${name}`} title={`Edit ${name}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Edit ${name}`}
          title={`Edit ${name}`}
          onClick={onEdit}
          disabled={disabled}
          className={editClassName}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Delete ${name}`}
        title={`Delete ${name}`}
        onClick={onDelete}
        disabled={disabled}
        className={deleteClassName}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
