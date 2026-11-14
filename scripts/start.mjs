/**
 * Production start for Render (512MB-friendly).
 * Logs DATABASE_URL presence (boolean only) then runs Next standalone or next start.
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

console.log(
  `[sd-scpf] start: DATABASE_URL=${hasDatabaseUrl ? "set" : "missing"} NODE_ENV=${process.env.NODE_ENV ?? ""}`,
);

if (process.env.NODE_ENV === "production" && !hasDatabaseUrl) {
  console.error(
    "[sd-scpf] DATABASE_URL is required in production (see docs/render.md).",
  );
  process.exit(1);
}

const standalone = path.join(root, ".next", "standalone", "server.js");
const useStandalone = existsSync(standalone);

const env = {
  ...process.env,
  // Render sets PORT; standalone must listen on all interfaces.
  HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
};

const child = useStandalone
  ? spawn(process.execPath, ["server.js"], {
      cwd: path.join(root, ".next", "standalone"),
      stdio: "inherit",
      env,
    })
  : spawn(
      process.execPath,
      [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start"],
      { cwd: root, stdio: "inherit", env },
    );

console.log(
  `[sd-scpf] start: mode=${useStandalone ? "standalone" : "next-start"}`,
);

child.on("exit", (code, signal) => {
  if (signal) {
    try {
      process.kill(process.pid, signal);
    } catch {
      /* ignore */
    }
  }
  process.exit(code ?? 1);
});
