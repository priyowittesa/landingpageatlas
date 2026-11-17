import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Subscribe = (onChange: () => void) => () => void;
const mocks = vi.hoisted(() => ({
  clock: vi.fn<(
    subscribe: Subscribe,
    getSnapshot: () => number | null,
    getServerSnapshot: () => number | null
  ) => number | null>()
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useSyncExternalStore: mocks.clock
}));

import { PaymentCountdown } from "./payment-countdown";

const now = new Date("2026-11-02T00:00:00Z");
const expiryTime = "2026-11-02T01:02:03Z";
const render = (expiry = expiryTime) =>
  renderToStaticMarkup(<PaymentCountdown expiryTime={expiry} />);

function subscribe(onChange = vi.fn()) {
  return mocks.clock.mock.lastCall![0](onChange);
}

describe("payment countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mocks.clock.mockReset();
    mocks.clock.mockImplementation((_, getSnapshot) => getSnapshot());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("uses the provider expiry and updates every second", () => {
    expect(render()).toContain("01 : 02 : 03");
    const onChange = vi.fn();
    const unsubscribe = subscribe(onChange);

    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenCalledOnce();
    expect(render()).toContain("01 : 02 : 02");

    unsubscribe();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the same deadline when the payment screen is refreshed", () => {
    expect(render()).toContain("01 : 02 : 03");
    const unsubscribe = subscribe();
    vi.advanceTimersByTime(65000);
    unsubscribe();

    expect(render()).toContain("01 : 00 : 58");
    const unsubscribeAfterRefresh = subscribe();
    vi.advanceTimersByTime(1000);
    expect(render()).toContain("01 : 00 : 57");
    unsubscribeAfterRefresh();
  });

  it("catches up to wall-clock time after a suspended tab", () => {
    render();
    const unsubscribe = subscribe();
    vi.setSystemTime(new Date("2026-11-02T01:00:00Z"));
    vi.advanceTimersByTime(1000);

    expect(render()).toContain("00 : 02 : 02");
    unsubscribe();
  });

  it("stops at zero instead of counting below zero", () => {
    const expiry = "2026-11-02T00:00:01Z";
    expect(render(expiry)).toContain("00 : 00 : 01");
    subscribe();
    vi.advanceTimersByTime(1000);

    expect(render(expiry)).toContain("00 : 00 : 00");
    expect(render(expiry)).toContain("Payment expired");
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(render(expiry)).toContain("00 : 00 : 00");
  });

  it("does not start a timer for an already expired payment", () => {
    const markup = render("2026-11-01T23:59:59Z");
    expect(markup).toContain("00 : 00 : 00");
    expect(markup).toContain("Payment expired");
    subscribe()();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["", "not-a-date"])("handles an unavailable expiry (%s)", (expiry) => {
    const markup = render(expiry);
    expect(markup).toContain("-- : -- : --");
    expect(markup).not.toContain("NaN");
    expect(markup).not.toContain("Payment expired");
    subscribe()();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not wrap hours at 24 or round a partial second down to zero", () => {
    expect(render("2026-11-03T01:00:01Z")).toContain("25 : 00 : 01");
    expect(render("2026-11-02T00:00:00.500Z")).toContain("00 : 00 : 01");
  });

  it("uses a stable placeholder during server rendering and hydration", () => {
    mocks.clock.mockImplementation((_, __, getServerSnapshot) => getServerSnapshot());
    expect(render()).toContain("-- : -- : --");
  });
});
