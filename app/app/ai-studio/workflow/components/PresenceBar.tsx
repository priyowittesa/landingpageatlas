"use client";

import { colorForUser, type PresenceUser } from "../lib/collab";

interface PresenceBarProps {
  connected: boolean;
  users: PresenceUser[];
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

/**
 * Small floating indicator showing connection status and who's viewing.
 * Sits in the top-right corner of the canvas.
 */
export function PresenceBar({ connected, users }: PresenceBarProps) {
  const visible = users.slice(0, 5);
  const extra = users.length - visible.length;

  return (
    <div className="absolute right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur">
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-green-500" : "bg-gray-300"
        }`}
        title={connected ? "Connected" : "Disconnected"}
      />
      <span className="text-xs font-medium text-gray-600">
        {users.length} {users.length === 1 ? "viewer" : "viewers"}
      </span>

      {visible.length > 0 && (
        <div className="flex -space-x-2">
          {visible.map((u) => (
            <div
              key={u.id}
              title={u.name ?? "Guest"}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold uppercase text-white"
              style={{ backgroundColor: u.color ?? colorForUser(u.id) }}
            >
              {initials(u.name)}
            </div>
          ))}
          {extra > 0 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-[10px] font-semibold text-white">
              +{extra}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
