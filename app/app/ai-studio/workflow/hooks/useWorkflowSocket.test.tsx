import type { EffectCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkflowSocket } from "./useWorkflowSocket";

const mocks = vi.hoisted(() => ({
  io: vi.fn(),
  effects: [] as EffectCallback[],
  onNodesChange: vi.fn(),
  onEdgesChange: vi.fn()
}));

vi.mock("socket.io-client", () => ({ io: mocks.io }));
vi.mock("@/lib/env", () => ({
  env: { socketUrl: "https://api.example.test/api" }
}));
vi.mock("./useWorkflowStore", () => ({
  useWorkflowStore: {
    getState: () => ({
      onNodesChange: mocks.onNodesChange,
      onEdgesChange: mocks.onEdgesChange
    })
  }
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: EffectCallback) => { mocks.effects.push(effect); }
}));

function createSocket() {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  return {
    connected: false,
    io: {
      reconnection: vi.fn(),
      engine: { transport: { name: "websocket" } }
    },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler);
    }),
    off: vi.fn(() => handlers.clear()),
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    volatile: { emit: vi.fn() },
    receive: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args)
  };
}

const cleanups: Array<() => void> = [];

function mount(args: Partial<Parameters<typeof useWorkflowSocket>[0]> = {}) {
  const socket = createSocket();
  mocks.io.mockReturnValue(socket);
  let result!: ReturnType<typeof useWorkflowSocket>;
  function Harness() {
    result = useWorkflowSocket({
      room: "workflow-1",
      user: { id: "user-1" },
      token: "token-1",
      ...args
    });
    return null;
  }
  renderToStaticMarkup(<Harness />);
  const effects = mocks.effects.splice(0);
  const cleanup = () => unmounts.forEach((unmount) => unmount?.());
  const unmounts = effects.map((effect) => effect());
  cleanups.push(cleanup);
  return { socket, result, cleanup, connectionEffect: effects[0] };
}

describe("workflow socket request traffic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
    mocks.effects = [];
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("prefers WebSocket with a polling fallback and joins after connecting", () => {
    const { socket } = mount();
    expect(mocks.io).toHaveBeenCalledWith("https://api.example.test", expect.objectContaining({
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      autoConnect: false,
      auth: { token: "token-1" }
    }));
    expect(socket.connect).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(socket.connect).toHaveBeenCalledOnce();
    socket.receive("connect");
    expect(socket.emit).toHaveBeenCalledWith("join", { room: "workflow-1" });
  });

  it.each([
    { enabled: false },
    { room: "" },
    { user: null }
  ])("does not connect before prerequisites are ready (%s)", (args) => {
    mount(args);
    vi.advanceTimersByTime(0);
    expect(mocks.io).not.toHaveBeenCalled();
  });

  it("cancels the Strict Mode probe's handshake before starting the real one", () => {
    const { socket, cleanup, connectionEffect } = mount();
    cleanup();
    const realSocket = createSocket();
    mocks.io.mockReturnValue(realSocket);
    const realCleanup = connectionEffect();
    if (realCleanup) cleanups.push(realCleanup);
    vi.advanceTimersByTime(0);
    expect(socket.connect).not.toHaveBeenCalled();
    expect(realSocket.connect).toHaveBeenCalledOnce();
  });

  it.each(["connect_error", "disconnect"])(
    "pauses automatic retries on a 429 from %s",
    (event) => {
      const { socket } = mount();
      vi.advanceTimersByTime(0);
      const error = Object.assign(new Error("xhr post error"), { description: 429 });
      socket.receive(event, ...(event === "disconnect" ? ["transport error", error] : [error]));
      expect(socket.io.reconnection).toHaveBeenLastCalledWith(false);
      expect(socket.disconnect).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(59_999);
      expect(socket.connect).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(1);
      expect(socket.io.reconnection).toHaveBeenLastCalledWith(true);
      expect(socket.connect).toHaveBeenCalledTimes(2);
    }
  );

  it("cancels a pending cooldown when the page unmounts", () => {
    const { socket, cleanup } = mount();
    vi.advanceTimersByTime(0);
    socket.receive("connect_error", { description: 429 });
    cleanup();
    vi.advanceTimersByTime(120_000);
    expect(socket.connect).toHaveBeenCalledOnce();
  });

  it("caps rate-limit retries even when short-lived connections succeed", () => {
    const { socket } = mount();
    vi.advanceTimersByTime(0);
    for (let i = 0; i < 6; i += 1) {
      socket.receive("connect");
      socket.receive("disconnect", "transport error", { description: 429 });
      vi.advanceTimersByTime(60_000);
    }
    expect(socket.connect).toHaveBeenCalledTimes(6);
    expect(socket.io.reconnection).toHaveBeenLastCalledWith(false);
  });

  it("leaves ordinary transport failures to the bounded manager retries", () => {
    const { socket } = mount();
    vi.advanceTimersByTime(0);
    socket.receive("connect_error", new Error("network unavailable"));
    socket.receive("disconnect", "transport error", { description: 503 });
    expect(socket.io.reconnection).not.toHaveBeenCalled();
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it.each([["websocket", 100], ["polling", 1000]] as const)(
    "throttles disposable cursor updates on %s without discarding edits",
    (transport, throttle) => {
      const { socket, result } = mount();
      socket.connected = true;
      socket.io.engine.transport.name = transport;
      result.emitCursor({ x: 1, y: 2 });
      vi.advanceTimersByTime(throttle - 1);
      result.emitCursor({ x: 2, y: 3 });
      expect(socket.volatile.emit).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(1);
      result.emitCursor({ x: 3, y: 4 });
      expect(socket.volatile.emit).toHaveBeenCalledTimes(2);
      expect(socket.emit).not.toHaveBeenCalled();

      result.emitNodeChanges([{ type: "remove", id: "node-1" }]);
      result.emitEdgeChanges([{ type: "remove", id: "edge-1" }]);
      expect(socket.emit).toHaveBeenCalledTimes(2);
    }
  );

  it("does not queue updates while disconnected", () => {
    const { socket, result } = mount();
    result.emitCursor({ x: 1, y: 2 });
    result.emitNodeChanges([{ type: "remove", id: "node-1" }]);
    result.emitEdgeChanges([{ type: "remove", id: "edge-1" }]);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(socket.volatile.emit).not.toHaveBeenCalled();
  });
});
