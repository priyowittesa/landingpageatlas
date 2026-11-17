import type { NodeChange, EdgeChange } from "@xyflow/react";
import type { WorkflowNode, WorkflowEdge } from "../types";

/* -------------------------------------------------------------------------- */
/*                       Realtime collaboration contract                      */
/* -------------------------------------------------------------------------- */
/*
 * This file is the single source of truth for the Socket.IO "contract" between
 * this frontend and the backend. Keeping the event names and payload shapes in
 * one typed place means the compiler catches mistakes when we emit/listen.
 *
 * Event summary (see also the docs handed to the backend team):
 *
 *   Client -> Server (we emit):
 *     "join"          { room }
 *     "canvas:event"  { room, type, user_id, data }
 *
 *   Server -> Client (we listen):
 *     "canvas:event"  { room, type, user_id, data }   (relayed from others)
 *     "room:user"     { room, count, users[] }         (presence updates)
 */

/** The name of the room we collaborate in. We use the workflow id. */
export type Room = string;

/** A user currently present in the room. */
export interface PresenceUser {
  id: string;
  name?: string;
  /** A stable color we assign on the client for cursors/avatars. */
  color?: string;
}

/** Payload for the "join" event we emit right after connecting. */
export interface JoinPayload {
  room: Room;
}

/** The three kinds of canvas activity we broadcast. */
export type CanvasEventType = "node" | "edge" | "cursor";

/** Cursor position in React Flow (canvas) coordinates. */
export interface CursorData {
  x: number;
  y: number;
}

/**
 * A single "canvas:event" message. `data` is discriminated by `type`:
 *   - "cursor" -> CursorData
 *   - "node"   -> NodeChange[]
 *   - "edge"   -> EdgeChange[]
 */
export type CanvasEvent =
  | {
    room: Room;
    type: "cursor";
    user_id: string;
    data: CursorData;
  }
  | {
    room: Room;
    type: "node";
    user_id: string;
    data: NodeChange<WorkflowNode>[];
  }
  | {
    room: Room;
    type: "edge";
    user_id: string;
    data: EdgeChange<WorkflowEdge>[];
  };

/** Payload the server sends on "room:user" whenever presence changes. */
export interface RoomUserPayload {
  room: Room;
  /** Total number of users in the room. */
  count?: number;
  /** Optional full list of users. Preferred so we can show names/avatars. */
  users?: PresenceUser[];
}

/* -------------------------------------------------------------------------- */
/*                          Typed Socket.IO interfaces                        */
/* -------------------------------------------------------------------------- */
/*
 * socket.io-client lets us pass two generics: events the server SENDS to us,
 * and events WE send to the server. This gives us autocompletion + type safety
 * on socket.on(...) and socket.emit(...).
 */

/** Events the server emits to us. */
export interface ServerToClientEvents {
  "canvas:event": (payload: CanvasEvent) => void;
  "room:user": (payload: RoomUserPayload) => void;
}

/** Events we emit to the server. */
export interface ClientToServerEvents {
  join: (payload: JoinPayload) => void;
  "canvas:event": (payload: CanvasEvent) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const CURSOR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

/** Deterministically pick a color from a user id so it stays stable. */
export function colorForUser(userId: string | undefined | null): string {
  const key = userId ?? "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

/**
 * The backend may send users in different shapes (a plain id string, or an
 * object using id / user_id / _id / socket id, etc). This normalizes any of
 * those into our PresenceUser so the UI never crashes on a missing field.
 */
export function normalizePresenceUser(raw: unknown): PresenceUser {
  if (typeof raw === "string") return { id: raw };
  const o = (raw ?? {}) as Record<string, unknown>;
  const id =
    o.id ?? o.user_id ?? o.userId ?? o._id ?? o.socketId ?? o.sid ?? "unknown";
  const name = o.name ?? o.full_name ?? o.username ?? o.email;
  return {
    id: String(id),
    name: name != null ? String(name) : undefined,
  };
}

const CLIENT_ID_KEY = "workflow:clientId";

/**
 * Returns a stable identity for this browser tab when there is no logged-in
 * user yet (auth isn't wired up). We store it in sessionStorage so:
 *   - reloading the same tab keeps the same id, and
 *   - each tab / browser gets its OWN id (great for testing collaboration).
 *
 * Once real auth exists, pass the real user id instead and this is unused.
 */
export function getOrCreateAnonIdentity(): PresenceUser {
  // Guard for server-side rendering where sessionStorage doesn't exist.
  if (typeof window === "undefined") {
    return { id: "ssr-placeholder", name: "Guest" };
  }
  let id = window.sessionStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(CLIENT_ID_KEY, id);
  }
  return { id, name: `Guest ${id.slice(-4)}` };
}
