"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { NodeChange, EdgeChange } from "@xyflow/react";

import { env } from "@/lib/env";
import type { WorkflowNode, WorkflowEdge } from "../types";
import { useWorkflowStore } from "./useWorkflowStore";
import { getSocketRateLimitDelay } from "../lib/socketRetry";
import {
  colorForUser,
  normalizePresenceUser,
  type CanvasEvent,
  type ClientToServerEvents,
  type CursorData,
  type PresenceUser,
  type RoomUserPayload,
  type ServerToClientEvents,
} from "../lib/collab";

/** A remote user's cursor, kept in React state so we can render it. */
interface RemoteCursor extends CursorData {
  userId: string;
  name?: string;
  color: string;
  /** Timestamp of the last update; used to prune stale cursors. */
  updatedAt: number;
}

interface UseWorkflowSocketArgs {
  /** The room to join. We use the workflow id so each workflow is isolated. */
  room: string;
  /** The current user. Used as `user_id` and to ignore our own echoes. */
  user: { id: string; name?: string | null } | null;
  /** Optional JWT for the handshake, if the backend requires auth. */
  token?: string | null;
  /** Disable the connection (e.g. while data is still loading). */
  enabled?: boolean;
}

interface UseWorkflowSocketResult {
  connected: boolean;
  /** Everyone currently in the room (including ourselves if the server lists us). */
  users: PresenceUser[];
  /** Live cursors of other users, keyed by their id. */
  remoteCursors: RemoteCursor[];
  /** Broadcast our cursor position (flow coordinates). Throttled internally. */
  emitCursor: (data: CursorData) => void;
  /** Broadcast local node changes from React Flow. */
  emitNodeChanges: (changes: NodeChange<WorkflowNode>[]) => void;
  /** Broadcast local edge changes from React Flow. */
  emitEdgeChanges: (changes: EdgeChange<WorkflowEdge>[]) => void;
}

const CURSOR_THROTTLE_MS = 100; // ~10 updates/sec — smooth enough, gentler on the server.
const POLLING_CURSOR_THROTTLE_MS = 1000;
const CURSOR_STALE_MS = 8000; // Drop a cursor if we hear nothing for 8s.
const MAX_RATE_LIMIT_RETRIES = 5;

// Flip to false to silence the logs once everything works.
const DEBUG = false;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log("%c[socket]", "color:#8b5cf6;font-weight:bold", ...args);
};

export function useWorkflowSocket({
  room,
  user,
  token,
  enabled = true,
}: UseWorkflowSocketArgs): UseWorkflowSocketResult {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  // The socket instance lives in a ref so it survives re-renders without
  // being recreated. We only create/destroy it inside the effect below.
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  // Keep the latest user id in a ref so our event handlers (registered once)
  // always read the current value without needing to re-subscribe.
  const userIdRef = useRef<string | null>(user?.id ?? null);

  /* ----------------------------- connection ----------------------------- */
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
    log("effect check ->", {
      enabled,
      room,
      userId: user?.id ?? null,
    });
    if (!enabled || !room || !user?.id) {
      log("not connecting yet (waiting on the above)");
      return;
    }

    // socket.io is confused by URLs that contain a path, so connect to the
    // bare origin and let the default "/socket.io" handshake path apply.
    let origin = env.socketUrl ?? "";
    try {
      origin = new URL(origin).origin;
    } catch {
      // Leave as-is if it's already an origin or invalid; io() will surface it.
    }

    log("connecting to", origin, "| room:", room, "| user:", user.id);

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      origin,
      {
        path: "/socket.io",
        // Prefer one persistent connection; fall back if the proxy blocks WS.
        transports: ["websocket", "polling"],
        tryAllTransports: true,
        autoConnect: false,
        // Cap reconnection attempts so a rate-limited server doesn't send us
        // into an infinite reconnect loop. Back off gradually so we don't
        // hammer the server while it recovers.
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        // NOTE: withCredentials is intentionally left OFF. The backend returns
        // a wildcard "Access-Control-Allow-Origin: *", and browsers forbid
        // sending credentials to a wildcard origin. We don't use cookies yet,
        // so this is fine. If cookie auth is added later, the backend must echo
        // the specific origin + "Access-Control-Allow-Credentials: true", and
        // then we can set withCredentials: true here.
        // Only sent if the backend reads it; harmless otherwise.
        auth: token ? { token } : undefined,
      }
    );
    socketRef.current = socket;
    let rateLimitRetries = 0;
    let connectionTimer: ReturnType<typeof setTimeout> | undefined;

    const pauseForRateLimit = (error: unknown) => {
      const delay = getSocketRateLimitDelay(error);
      if (delay === null || connectionTimer !== undefined) return;

      // Stop the manager's normal retries, including after an established
      // polling connection fails (not just during the initial handshake).
      socket.io.reconnection(false);
      socket.disconnect();
      if (rateLimitRetries >= MAX_RATE_LIMIT_RETRIES) return;
      rateLimitRetries += 1;
      connectionTimer = setTimeout(() => {
        connectionTimer = undefined;
        socket.io.reconnection(true);
        socket.connect();
      }, delay);
    };

    // Fired when the connection is established (and on every reconnect).
    socket.on("connect", () => {
      setConnected(true);
      log("connected, socket id =", socket.id, "-> emitting join", { room });
      // Always (re)join the room after connecting/reconnecting.
      socket.emit("join", { room });
    });

    // Fired when the connection FAILS (CORS, wrong url, server down, auth).
    socket.on("connect_error", (err) => {
      log("connect_error:", err.message);
      pauseForRateLimit(err);
    });

    socket.on("disconnect", (reason, description) => {
      setConnected(false);
      setUsers([]);
      setRemoteCursors([]);
      log("disconnected:", reason);
      pauseForRateLimit(description);
    });

    // Presence updates: the server tells us who is in the room.
    socket.on("room:user", (payload: RoomUserPayload) => {
      log("<- room:user", payload, "raw users:", payload.users);
      if (payload.room && payload.room !== room) return;

      if (payload.users) {
        setUsers(
          payload.users.map((u) => {
            const nu = normalizePresenceUser(u);
            return { ...nu, color: colorForUser(nu.id) };
          })
        );
      } else if (typeof payload.count === "number") {
        // Server only sent a count: synthesize placeholder entries so the UI
        // can still show "N viewers" even without names.
        setUsers((prev) => {
          const known = prev.slice(0, payload.count);
          while (known.length < (payload.count ?? 0)) {
            const idx = known.length;
            known.push({ id: `anon-${idx}`, name: "Guest" });
          }
          return known;
        });
      }
    });

    // Relayed activity from other users.
    socket.on("canvas:event", (payload: CanvasEvent) => {
      log("<- canvas:event", payload.type, "from", payload.user_id);
      // Ignore our own echo if the server broadcasts to everyone.
      if (payload.user_id === userIdRef.current) return;
      if (payload.room && payload.room !== room) return;

      switch (payload.type) {
        case "cursor": {
          const data = payload.data;
          setRemoteCursors((prev) => {
            const next = prev.filter((c) => c.userId !== payload.user_id);
            next.push({
              userId: payload.user_id,
              x: data.x,
              y: data.y,
              color: colorForUser(payload.user_id),
              updatedAt: Date.now(),
            });
            return next;
          });
          break;
        }
        case "node": {
          // Apply the remote NodeChange[] directly to the store. We call the
          // store action (not the React Flow handler) so this does NOT get
          // re-broadcast — that would create an infinite echo loop.
          useWorkflowStore.getState().onNodesChange(payload.data);
          break;
        }
        case "edge": {
          useWorkflowStore.getState().onEdgesChange(payload.data);
          break;
        }
      }
    });

    // Page close / refresh: React's useEffect cleanup may not fire in time,
    // so we listen to beforeunload and disconnect explicitly. Without this the
    // server won't know we left until the polling request times out (~20-30s).
    const handleBeforeUnload = () => {
      clearTimeout(connectionTimer);
      socket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Strict Mode's setup/cleanup probe must not start a second handshake.
    connectionTimer = setTimeout(() => {
      connectionTimer = undefined;
      socket.connect();
    }, 0);

    // Cleanup: always disconnect when room/user/token changes or on unmount.
    return () => {
      clearTimeout(connectionTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setUsers([]);
      setRemoteCursors([]);
    };
  }, [enabled, room, user?.id, token]);

  /* --------------------- prune stale remote cursors --------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteCursors((prev) => {
        const cutoff = Date.now() - CURSOR_STALE_MS;
        const next = prev.filter((c) => c.updatedAt >= cutoff);
        return next.length === prev.length ? prev : next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ------------------------------ emitters ------------------------------ */
  // Throttle cursor emits so we don't flood the socket while the mouse moves.
  const lastCursorEmit = useRef(0);
  const emitCursor = useCallback(
    (data: CursorData) => {
      const socket = socketRef.current;
      const id = userIdRef.current;
      if (!socket || !id || !socket.connected) return;

      const now = Date.now();
      const throttle = socket.io.engine.transport.name === "polling"
        ? POLLING_CURSOR_THROTTLE_MS
        : CURSOR_THROTTLE_MS;
      if (now - lastCursorEmit.current < throttle) return;
      lastCursorEmit.current = now;

      // A stale cursor is disposable; never queue it behind pending edits.
      socket.volatile.emit("canvas:event", {
        room,
        type: "cursor",
        user_id: id,
        data,
      });
    },
    [room]
  );

  const emitNodeChanges = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      const socket = socketRef.current;
      const id = userIdRef.current;
      if (!socket || !id || !socket.connected || changes.length === 0) return;
      log("-> canvas:event node", changes.length, "change(s)");
      socket.emit("canvas:event", {
        room,
        type: "node",
        user_id: id,
        data: changes,
      });
    },
    [room]
  );

  const emitEdgeChanges = useCallback(
    (changes: EdgeChange<WorkflowEdge>[]) => {
      const socket = socketRef.current;
      const id = userIdRef.current;
      if (!socket || !id || !socket.connected || changes.length === 0) return;
      log("-> canvas:event edge", changes.length, "change(s)");
      socket.emit("canvas:event", {
        room,
        type: "edge",
        user_id: id,
        data: changes,
      });
    },
    [room]
  );

  return {
    connected,
    users,
    remoteCursors,
    emitCursor,
    emitNodeChanges,
    emitEdgeChanges,
  };
}
