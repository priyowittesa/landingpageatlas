import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

describe("authorization pathname forwarding", () => {
  it("uses the real URL instead of a caller-supplied allowed pathname", () => {
    const response = proxy(new NextRequest(
      "https://atlas.example.test/app/inspection/templates/new?tab=asset",
      { headers: { "x-atlas-pathname": "/app/workspace-dashboard" } }
    ));
    expect(response.headers.get("x-middleware-request-x-atlas-pathname"))
      .toBe("/app/inspection/templates/new");
  });

  it("runs for app routes, including nested requests", () => {
    expect(config.matcher).toEqual(["/app/:path*"]);
  });
});
