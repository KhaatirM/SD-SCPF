/**
 * Copy public + .next/static into the standalone output so `node .next/standalone/server.js` works on Render.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.log("prepare-standalone: no .next/standalone — skipping");
  process.exit(0);
}

const publicDir = path.join(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(standalone, "public"), { recursive: true });
}

const staticDir = path.join(root, ".next", "static");
if (existsSync(staticDir)) {
  const dest = path.join(standalone, ".next", "static");
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(staticDir, dest, { recursive: true });
}

console.log("prepare-standalone: copied public + .next/static into standalone");
