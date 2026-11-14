import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
const isProduction = process.env.NODE_ENV === "production";

if (url === "") {
  if (isProduction) {
    console.error(
      "migrate: DATABASE_URL is required in production. " +
        "Create a Render PostgreSQL database and set DATABASE_URL on the web service (see docs/render.md).",
    );
    process.exit(1);
  }
  console.log("migrate: no DATABASE_URL — skipping (local PGlite auto-migrates on first query)");
  process.exit(0);
}

const files = (await readdir("migrations").catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();
if (files.length === 0) {
  console.log("migrate: no migration files");
  process.exit(0);
}

const connectionString =
  process.env.DATABASE_URL_UNPOOLED?.trim() || url;

const client = new pg.Client({
  connectionString,
  ssl: sslOption(connectionString),
});
await client.connect();
try {
  await client.query("set lock_timeout = '60s'");
  await client.query("select pg_advisory_lock(7272741)");
  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set(
    (await client.query("select name from schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );
  for (const file of files.filter((f) => !done.has(f))) {
    await client.query("begin");
    try {
      await client.query(await readFile(`migrations/${file}`, "utf8"));
      await client.query("insert into schema_migrations (name) values ($1)", [
        file,
      ]);
      await client.query("commit");
      console.log(`migrate: applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
  console.log("migrate: up to date");
} finally {
  await client.end();
}

function sslOption(connectionUrl) {
  if (/localhost|127\.0\.0\.1/i.test(connectionUrl)) return undefined;
  if (/sslmode=disable/i.test(connectionUrl)) return undefined;
  return { rejectUnauthorized: false };
}
