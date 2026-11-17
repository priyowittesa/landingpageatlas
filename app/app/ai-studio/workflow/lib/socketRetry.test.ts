import { afterEach, describe, expect, it, vi } from "vitest";
import { getSocketRateLimitDelay } from "./socketRetry";

describe("Socket.IO rate-limit cooldown", () => {
  afterEach(() => vi.useRealTimers());

  it.each([undefined, null, new Error("timeout"), { description: 503 }])(
    "keeps normal retry handling for %s",
    (error) => {
      expect(getSocketRateLimitDelay(error)).toBeNull();
    }
  );

  it.each([{ description: 429 }, { context: { status: 429 } }])(
    "waits at least a minute for HTTP 429 (%s)",
    (error) => {
      expect(getSocketRateLimitDelay(error)).toBe(60_000);
    }
  );

  it("honors a longer Retry-After in seconds", () => {
    const getResponseHeader = vi.fn(() => "120");
    expect(getSocketRateLimitDelay({
      description: 429,
      context: { getResponseHeader }
    })).toBe(120_000);
    expect(getResponseHeader).toHaveBeenCalledWith("Retry-After");
  });

  it("honors an HTTP-date Retry-After", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T12:00:00Z"));
    expect(getSocketRateLimitDelay({
      description: 429,
      context: {
        getResponseHeader: () => "Mon, 09 Nov 2026 12:02:00 GMT"
      }
    })).toBe(120_000);
  });

  it.each([null, "", "invalid", "-1", "0", "5"])(
    "uses a safe cooldown for a missing, invalid or short Retry-After (%s)",
    (value) => {
      expect(getSocketRateLimitDelay({
        description: 429,
        context: { getResponseHeader: () => value }
      })).toBe(60_000);
    }
  );

  it("falls back safely if response headers are inaccessible", () => {
    expect(getSocketRateLimitDelay({
      description: 429,
      context: { getResponseHeader: () => { throw new Error("CORS"); } }
    })).toBe(60_000);
  });
});
