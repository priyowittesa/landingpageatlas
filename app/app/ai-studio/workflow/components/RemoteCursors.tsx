"use client";

import { ViewportPortal } from "@xyflow/react";
import { MousePointer2 } from "lucide-react";

interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
  name?: string;
  color: string;
}

/**
 * Renders other users' cursors on the canvas.
 *
 * We use React Flow's <ViewportPortal>, which positions its children in *flow*
 * coordinates and keeps them locked to the canvas as you pan/zoom. So we just
 * translate each cursor to the (x, y) we received over the socket.
 */
export function RemoteCursors({ cursors }: { cursors: RemoteCursor[] }) {
  return (
    <ViewportPortal>
      {cursors.map((c) => (
        <div
          key={c.userId}
          className="pointer-events-none absolute z-50"
          style={{
            transform: `translate(${c.x}px, ${c.y}px)`,
          }}
        >
          <MousePointer2
            className="h-4 w-4"
            style={{ color: c.color, fill: c.color }}
          />
          <span
            className="ml-3 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow"
            style={{ backgroundColor: c.color }}
          >
            {c.name ?? "Guest"}
          </span>
        </div>
      ))}
    </ViewportPortal>
  );
}
