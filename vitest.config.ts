import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import { collectPageRoutes } from "./lib/collect-page-routes";

export default defineConfig({
  define: {
    "process.env.ATLAS_PAGE_ROUTES": JSON.stringify(
      JSON.stringify(collectPageRoutes(fileURLToPath(new URL("./app", import.meta.url))))
    ),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    exclude: [
      ...configDefaults.exclude,
      "lib/rbac-access.test.mjs",
      "components/layout/dasbhoard/navigation.test.mjs",
    ],
  },
});
