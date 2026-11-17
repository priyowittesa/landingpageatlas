import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DesignIcon } from "./design-icon";

const directory = fileURLToPath(new URL("../../../../public/images/operations-intelligence/", import.meta.url));
const originalFiles = readdirSync(directory).filter((name) => /\.(png|svg)$/.test(name));
const webpFiles = readdirSync(directory).filter((name) => name.endsWith(".webp"));

describe("Operations Intelligence WebP exports", () => {
  it("provides a WebP counterpart for every original Figma asset", () => {
    expect(originalFiles.length).toBeGreaterThan(0);
    expect(webpFiles.sort()).toEqual(originalFiles.map((name) => name.replace(/\.(png|svg)$/, ".webp")).sort());
  });

  it.each(webpFiles)("contains a non-empty WebP image for %s", (name) => {
    const bytes = readFileSync(new URL(name, new URL("../../../../public/images/operations-intelligence/", import.meta.url)));
    expect(bytes.length).toBeGreaterThan(32);
    expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
  });

  it.each(originalFiles.filter((name) => name.endsWith(".svg")))(
    "uses the WebP icon without changing the displayed size of %s",
    (file) => {
      const name = file.replace(/\.svg$/, "");
      const icon = DesignIcon({ name, size: 24 });
      expect(icon.props.src).toBe(`/images/operations-intelligence/${name}.webp`);
      expect(icon.props.width).toBe(24);
      expect(icon.props.height).toBe(24);
      expect(icon.props.style).toEqual({ width: 24, height: 24 });
    }
  );
});
