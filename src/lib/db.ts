import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && databaseUrl === "") {
  throw new Error(
    "DATABASE_URL is required in production. " +
      "Create a Render PostgreSQL database and set DATABASE_URL on the web service " +
      "(see docs/render.md). PGlite is for local development only and will OOM on Render's 512MB free tier.",
  );
}

let pool: pg.Pool | undefined;

type LocalDb = {
  query: <T>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[] }>;
};

/** Lazy local PGlite handle — never loaded when DATABASE_URL is set or in production. */
let local: Promise<LocalDb> | undefined;

const localDataDir = path.join(process.cwd(), ".data", "pglite");

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({
      connectionString: databaseUrl,
      max: 5,
      ssl: sslOption(databaseUrl),
    });
    return (await pool.query(text, params)).rows as T[];
  }

  // Dev / local only: dynamic-import PGlite so production never loads it.
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query(text, params)).rows as T[];
}

function sslOption(url: string): boolean | { rejectUnauthorized: boolean } | undefined {
  // Render (and most hosted Postgres) require TLS. Local Postgres usually does not.
  if (/localhost|127\.0\.0\.1/i.test(url)) return undefined;
  if (/sslmode=disable/i.test(url)) return undefined;
  return { rejectUnauthorized: false };
}

async function startLocal() {
  if (isProduction) {
    throw new Error(
      "Refusing to start PGlite in production. Set DATABASE_URL to a real Postgres instance.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  await mkdir(localDataDir, { recursive: true });
  const db = new PGlite(localDataDir);
  const files = (await readdir("migrations").catch(() => []))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await db.exec(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
  const done = new Set(
    (
      await db.query<{ name: string }>("select name from schema_migrations")
    ).rows.map((r) => r.name),
  );
  for (const file of files.filter((f) => !done.has(f))) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
    await db.query("insert into schema_migrations (name) values ($1)", [file]);
  }
  return db;
}

export function usernameKey(username: string): string {
  return username.trim().toLowerCase();
}
