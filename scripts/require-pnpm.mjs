const userAgent = process.env.npm_config_user_agent ?? "";
const ci = (process.env.CI ?? "").toLowerCase();
const isCi = ci !== "" && ci !== "false" && ci !== "0";

if (process.env.npm_lifecycle_event === "dev" && !isCi && !userAgent.startsWith("pnpm/")) {
  console.error(
    "Local development requires pnpm. Use `pnpm install` and `pnpm dev`."
  );
  process.exit(1);
}
