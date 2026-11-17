import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const guard = fileURLToPath(new URL("./require-pnpm.mjs", import.meta.url));

function runGuard({ userAgent, lifecycle = "dev", ci } = {}) {
  const env = { ...process.env, npm_lifecycle_event: lifecycle };
  delete env.npm_config_user_agent;
  delete env.CI;
  if (userAgent !== undefined) env.npm_config_user_agent = userAgent;
  if (ci !== undefined) env.CI = ci;
  return spawnSync(process.execPath, [guard], { env, encoding: "utf8" });
}

test("local development accepts pnpm", () => {
  const result = runGuard({ userAgent: "pnpm/10.29.2 node/v22.22.3" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
});

test("local development rejects other or missing package managers", () => {
  for (const userAgent of ["npm/10.9.4", "yarn/1.22.22", "bun/1.3.0", "", undefined]) {
    const result = runGuard({ userAgent });
    assert.ifError(result.error);
    assert.equal(result.status, 1, userAgent ?? "missing user agent");
    assert.match(result.stderr, /Local development requires pnpm/);
    assert.match(result.stderr, /pnpm dev/);
  }
});

test("the guard does not block CI or non-development scripts", () => {
  for (const options of [
    { userAgent: "npm/10.9.4", ci: "true" },
    { userAgent: "npm/10.9.4", lifecycle: "build" },
    { userAgent: "npm/10.9.4", lifecycle: "test" }
  ]) {
    const result = runGuard(options);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
  }

  for (const ci of ["false", "0"]) {
    assert.equal(runGuard({ userAgent: "npm/10.9.4", ci }).status, 1);
  }
});

test("package scripts invoke the guard without requiring it during installation", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  );

  assert.match(manifest.packageManager, /^pnpm@10\.29\.2(?:\+|$)/);
  for (const name of ["preinstall", "install", "postinstall", "prepare"]) {
    assert.ok(
      !manifest.scripts[name]?.includes("scripts/require-pnpm.mjs"),
      `${name} must not require a script unavailable during Docker installation`
    );
  }
  for (const [name, command] of Object.entries(manifest.scripts)) {
    if (name === "dev") continue; // dev is intentionally runnable with npm too
    assert.ok(
      command === "node scripts/require-pnpm.mjs" ||
        command.startsWith("node scripts/require-pnpm.mjs && "),
      `${name} must invoke the guard`
    );
    assert.doesNotMatch(command, /\b(?:npm|npx|yarn|bun)\s/);
  }
});
