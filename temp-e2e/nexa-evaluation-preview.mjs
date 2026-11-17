import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const vitestRequire = createRequire(require.resolve("vitest/package.json"));
const { createServer } = await import(pathToFileURL(vitestRequire.resolve("vite")).href);
const root = process.cwd().replaceAll("\\", "/");
const server = await createServer({
  root,
  configFile: false,
  server: { host: "127.0.0.1", port: 4179, strictPort: true },
  resolve: { alias: { "@": root } },
  esbuild: { jsx: "automatic" },
  plugins: [{
    name: "nexa-ui-preview",
    enforce: "pre",
    resolveId(id) {
      if (id === "next/image") return "\0fixture:next/image";
    },
    load(id) {
      if (id === "\0fixture:next/image") {
        return 'import React from "react"; export default function Image(props) { return React.createElement("img", props); }';
      }
    }
  }]
});
await server.listen();
console.log("NEXA UI preview ready at http://127.0.0.1:4179/temp-e2e/nexa-evaluation-preview.html");
