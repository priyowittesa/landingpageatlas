import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SetupProgress } from "./setup-progress";

const mocks = vi.hoisted(() => ({
  setStep: vi.fn(),
  cleanup: undefined as (() => void) | undefined
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: number) => [initial, mocks.setStep],
  useEffect: (effect: () => (() => void)) => { mocks.cleanup = effect(); }
}));
vi.mock("./design-icon", () => ({ DesignIcon: () => null }));

describe("setup progress timing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    mocks.cleanup = undefined;
  });
  afterEach(() => {
    mocks.cleanup?.();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads reading for five seconds, choosing for five seconds, then stays on preparing", () => {
    SetupProgress();
    vi.advanceTimersByTime(4999);
    expect(mocks.setStep).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(mocks.setStep).toHaveBeenLastCalledWith(1);
    vi.advanceTimersByTime(4999);
    expect(mocks.setStep).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(mocks.setStep).toHaveBeenLastCalledWith(2);
    vi.advanceTimersByTime(15 * 60 * 1000);
    expect(mocks.setStep).toHaveBeenCalledTimes(2);
  });

  it("clears pending transitions when the API finishes or the page unmounts", () => {
    SetupProgress();
    vi.advanceTimersByTime(2000);
    mocks.cleanup?.();
    vi.advanceTimersByTime(15000);
    expect(mocks.setStep).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
