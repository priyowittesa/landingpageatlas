"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { DataAccessHistory, DataAccessModule } from "../types";
import { formatUpdated } from "./shared";

export function ChangeHistory({
  module,
  entries,
  onClose
}: {
  module: DataAccessModule;
  entries: DataAccessHistory[];
  onClose: () => void;
}) {
  const history = entries
    .filter((entry) => entry.moduleId === module.id)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change History</DialogTitle>
          <DialogDescription>
            Data access configuration changes for {module.name}.
          </DialogDescription>
        </DialogHeader>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No changes recorded for this module.
          </p>
        ) : (
          <ol className="space-y-3">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="min-w-0 space-y-2 rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-medium">
                      {entry.summary}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {entry.subModuleName}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                    {entry.kind}
                  </span>
                </div>
                {entry.details.length > 0 && (
                  <ul className="list-inside list-disc space-y-1 break-words text-xs text-gray-600">
                    {entry.details.map((detail, index) => (
                      <li key={`${entry.id}-${index}`}>{detail}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-500">
                  <time dateTime={entry.at}>{formatUpdated(entry.at)}</time>
                  {" by "}
                  {entry.actor}
                </p>
              </li>
            ))}
          </ol>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
