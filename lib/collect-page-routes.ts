import { readdirSync } from "node:fs";
import path from "node:path";

export function collectPageRoutes(appDirectory: string): string[] {
  const routes = new Set<string>();

  function walk(directory: string, segments: string[]) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile() && /^page\.(tsx?|jsx?)$/.test(entry.name)) {
        routes.add(`/${segments.join("/")}`);
      }

      if (!entry.isDirectory()) continue;
      // Private folders and intercepted routes are not standalone destinations.
      if (entry.name.startsWith("_") || /^\(\.{1,3}\)/.test(entry.name)) continue;

      const isUrlNeutral =
        entry.name.startsWith("@") || /^\(.*\)$/.test(entry.name);
      walk(
        path.join(directory, entry.name),
        isUrlNeutral ? segments : [...segments, entry.name]
      );
    }
  }

  walk(appDirectory, []);
  return [...routes].sort();
}
