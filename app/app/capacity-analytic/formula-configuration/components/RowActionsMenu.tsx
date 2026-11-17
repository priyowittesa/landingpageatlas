"use client";

import { History, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 160;
const MENU_HEIGHT = 132;

export function RowActionsMenu({ onHistory }: { onHistory: () => void }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const openUp = window.innerHeight - rect.bottom < MENU_HEIGHT + 8;
      setCoords({
        top: openUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-50"
      >
        <MoreHorizontal size={16} />
      </button>

      {open &&
        coords &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-50 w-40 rounded-lg border border-border bg-background py-1 shadow-lg"
              style={{ top: coords.top, left: coords.left }}
            >
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50">
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onHistory();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"
              >
                <History size={14} /> History
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
