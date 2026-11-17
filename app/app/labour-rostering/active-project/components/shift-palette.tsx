"use client";

import { Box, GripVertical, Search } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";

import { Input } from "@/components/ui/input";
import { formatDisplayValue } from "@/lib/format-display-value";
import { cn } from "@/lib/utils";
import type { Shift } from "../../shifts/types";

export const SHIFT_COLORS = [
  {
    palette: "border-blue-200 bg-blue-50 text-blue-700",
    handle: "bg-blue-500",
    card: "border-blue-300 bg-blue-50 text-blue-700"
  },
  {
    palette: "border-slate-200 bg-slate-50 text-slate-700",
    handle: "bg-slate-600",
    card: "border-slate-300 bg-slate-50 text-slate-700"
  },
  {
    palette: "border-primary-200 bg-primary-50 text-primary-700",
    handle: "bg-primary-500",
    card: "border-primary-300 bg-primary-50 text-primary-700"
  },
  {
    palette: "border-amber-200 bg-amber-50 text-amber-700",
    handle: "bg-amber-500",
    card: "border-amber-300 bg-amber-50 text-amber-700"
  },
  {
    palette: "border-emerald-200 bg-emerald-50 text-emerald-700",
    handle: "bg-emerald-600",
    card: "border-emerald-300 bg-emerald-50 text-emerald-700"
  }
] as const;

export function ShiftPalette({ shifts }: { shifts: Shift[] }) {
  const [search, setSearch] = useState("");

  const filteredShifts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shifts
      .map((shift, index) => ({ shift, index }))
      .filter(
        ({ shift }) =>
          !query ||
          formatDisplayValue(shift.name, "").toLowerCase().includes(query) ||
          shift.code.toLowerCase().includes(query)
      );
  }, [search, shifts]);

  const startDragging = (
    event: DragEvent<HTMLButtonElement>,
    shiftId: string
  ) => {
    event.dataTransfer.setData("application/x-shift-id", shiftId);
    event.dataTransfer.setData("text/plain", shiftId);
    event.dataTransfer.effectAllowed = "copy";

    // Use a dedicated drag image so the browser does not add its rectangular
    // white button background around the rounded shift card.
    const dragImage = event.currentTarget.cloneNode(true) as HTMLButtonElement;
    const { width, height } = event.currentTarget.getBoundingClientRect();
    Object.assign(dragImage.style, {
      borderRadius: "0.375rem",
      boxShadow: "none",
      height: `${height}px`,
      left: "-9999px",
      margin: "0",
      overflow: "hidden",
      position: "fixed",
      top: "-9999px",
      width: `${width}px`
    });
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 14, height / 2);
    window.requestAnimationFrame(() => dragImage.remove());
  };

  return (
    <section className="rounded-lg border bg-white p-2 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <Box className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">
              Employee Status Palette
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Drag to allocate status
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shift"
            className="h-8 w-full bg-white pl-9 text-xs"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {filteredShifts.map(({ shift, index }) => {
          const colors = SHIFT_COLORS[index % SHIFT_COLORS.length];

          return (
            <button
              key={shift.id}
              type="button"
              draggable
              onDragStart={(event) => startDragging(event, shift.id)}
              className={cn(
                "flex h-8 min-w-max cursor-grab items-stretch overflow-hidden rounded-md border text-[11px] shadow-sm active:cursor-grabbing",
                colors.palette
              )}
              title={`${shift.start_time} - ${shift.end_time}`}
            >
              <span
                className={cn(
                  "flex w-7 items-center justify-center text-white",
                  colors.handle
                )}
              >
                <GripVertical className="h-4 w-4" />
              </span>
              <span className="flex items-center px-3 font-medium">
                {formatDisplayValue(shift.name)}
              </span>
            </button>
          );
        })}

        {!filteredShifts.length && (
          <p className="py-1.5 text-xs text-muted-foreground">
            No shifts found.
          </p>
        )}
      </div>
    </section>
  );
}
