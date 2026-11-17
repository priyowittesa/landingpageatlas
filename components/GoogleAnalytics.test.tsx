import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleAnalytics } from "./GoogleAnalytics";

const mocks = vi.hoisted(() => ({
  analytics: vi.fn<(props: { gaId: string }) => null>()
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: mocks.analytics
}));

describe("Google Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.analytics.mockReturnValue(null);
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-TEST123456");
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([undefined, "", "false", "TRUE", "True", "1", " true "])(
    "loads no scripts when the enabled flag is %s",
    (enabled) => {
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ENABLED", enabled);

      expect(renderToStaticMarkup(<GoogleAnalytics />)).toBe("");
      expect(mocks.analytics).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, "", " \t "])(
    "loads no scripts when the measurement ID is %s",
    (measurementId) => {
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", measurementId);

      expect(renderToStaticMarkup(<GoogleAnalytics />)).toBe("");
      expect(mocks.analytics).not.toHaveBeenCalled();
    }
  );

  it("renders the official helper with the trimmed ID when explicitly enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", " G-TEST123456 ");

    renderToStaticMarkup(<GoogleAnalytics />);

    expect(mocks.analytics).toHaveBeenCalledOnce();
    expect(mocks.analytics.mock.lastCall?.[0]).toEqual({
      gaId: "G-TEST123456"
    });
  });

  it.each([
    "not-a-measurement-id",
    "UA-123456-1",
    'G-TEST</script><script>alert("test")</script>',
    "G-TEST';alert('test');//"
  ])("rejects invalid or unsafe measurement IDs: %s", (measurementId) => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", measurementId);

    expect(renderToStaticMarkup(<GoogleAnalytics />)).toBe("");
    expect(mocks.analytics).not.toHaveBeenCalled();
  });
});
