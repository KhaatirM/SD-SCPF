import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const spreadsheetsDir = path.join(root, "data", "spreadsheets");
const migrationsDir = path.join(root, "migrations");
const localDataDir = path.join(root, ".data", "pglite");

const PRIMARY =
  "_OC__Security_Department_Database__2026-2027__ec0d.xlsx";
const OUTDATED =
  "_OC__Security_Division_Central_Database__OUTDATED__1e77.xlsx";
const OLD_DB = "_SCPF__Security_Department_Records__OLD_DB__4b5d.xlsx";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

/** @type {{ query: Function, exec?: Function, end?: Function }} */
let db;

async function main() {
  db = await openDb();
  const force = process.argv.includes("--force");
  const existing = await q(
    "select count(*)::int as c from import_runs where finished_at is not null",
  );
  if (!force && (existing[0]?.c ?? 0) > 0) {
    const members = await q("select count(*)::int as c from members");
    console.log(
      `import: already seeded (${members[0].c} members, ${existing[0].c} import runs). Use --force to reimport.`,
    );
    await closeDb();
    return;
  }

  if (force) {
    await exec(`
      truncate award_grants, awards, hall_of_fame_entries, past_chiefs,
               admin_logs, members, import_runs, avatar_cache restart identity cascade
    `);
  }

  const counts = {
    members: 0,
    active: 0,
    discharged: 0,
    admin_logs: 0,
    awards: 0,
    award_grants: 0,
    hall_of_fame: 0,
    past_chiefs: 0,
    scu_derived: 0,
    historical_logs: 0,
  };

  const primaryPath = path.join(spreadsheetsDir, PRIMARY);
  const wb = XLSX.readFile(primaryPath, { cellDates: true });

  await runImport(PRIMARY, "DEPARTMENT RECORDS", async () => {
    await importDepartmentRecords(wb.Sheets["DEPARTMENT RECORDS"], counts);
  });

  await runImport(PRIMARY, "OFFICE OF THE CHIEF", async () => {
    await importCorpsSheet(
      wb.Sheets["OFFICE OF THE CHIEF"],
      "Office of the Chief",
      { usernameCol: 1, rankCol: 2, positionCol: 3, timezoneCol: 5, strikesCol: 6, levelCol: 7, loaCol: 4 },
      counts,
    );
  });

  await runImport(PRIMARY, "GENERAL CORPS", async () => {
    await importCorpsSheet(
      wb.Sheets["GENERAL CORPS"],
      "General Corps",
      { usernameCol: 1, rankCol: 2, positionCol: 3, strikesCol: 5, levelCol: 11, loaCol: 4 },
      counts,
    );
  });

  await runImport(PRIMARY, "COMBAT MEDICS", async () => {
    await importCorpsSheet(
      wb.Sheets["COMBAT MEDICS"],
      "Combat Medic Corps",
      { usernameCol: 5, rankCol: 6, positionCol: 7, timezoneCol: 8, strikesCol: 9, levelCol: 13, loaCol: 11 },
      counts,
    );
  });

  await runImport(PRIMARY, "ADMINISTRATIVE LOGS", async () => {
    await importAdminLogs(
      wb.Sheets["ADMINISTRATIVE LOGS"],
      PRIMARY,
      counts,
      "admin_logs",
    );
  });

  await runImport(PRIMARY, "AWARDS DATABASE", async () => {
    await importAwards(wb.Sheets["AWARDS DATABASE"], counts);
  });

  await deriveScuAndDischarge(counts);
  await seedHallOfFame(counts);
  await seedPastChiefs(wb, counts);

  // Historical enrichment
  try {
    const outdated = XLSX.readFile(path.join(spreadsheetsDir, OUTDATED), {
      cellDates: true,
    });
    if (outdated.Sheets["Discharge Log"]) {
      await runImport(OUTDATED, "Discharge Log", async () => {
        await importOutdatedDischarge(outdated.Sheets["Discharge Log"], counts);
      });
    }
    if (outdated.Sheets["Rank Change Log"]) {
      await runImport(OUTDATED, "Rank Change Log", async () => {
        await importGenericHistoricalLog(
          outdated.Sheets["Rank Change Log"],
          OUTDATED,
          counts,
        );
      });
    }
  } catch (e) {
    console.warn("import: outdated workbook skipped", e.message);
  }

  try {
    const old = XLSX.readFile(path.join(spreadsheetsDir, OLD_DB), {
      cellDates: true,
    });
    if (old.Sheets["RANK CHANGES"]) {
      await runImport(OLD_DB, "RANK CHANGES", async () => {
        await importGenericHistoricalLog(
          old.Sheets["RANK CHANGES"],
          OLD_DB,
          counts,
        );
      });
    }
  } catch (e) {
    console.warn("import: old db skipped", e.message);
  }

  const finalMembers = await q(`
    select
      count(*)::int as total,
      count(*) filter (where status = 'active')::int as active,
      count(*) filter (where status = 'discharged')::int as discharged,
      count(*) filter (where subdivision = 'Specialized Control Unit')::int as scu
    from members
  `);
  counts.members = finalMembers[0].total;
  counts.active = finalMembers[0].active;
  counts.discharged = finalMembers[0].discharged;
  counts.scu_derived = finalMembers[0].scu;

  await q(
    `insert into import_runs (workbook, sheet, finished_at, row_counts, notes)
     values ($1, $2, now(), $3::jsonb, $4)`,
    [
      PRIMARY,
      "ALL",
      JSON.stringify(counts),
      "Primary seed complete. SCU derived from admin logs + leadership. Past chiefs need confirmation.",
    ],
  );

  console.log("import: complete");
  console.log(JSON.stringify(counts, null, 2));
  await closeDb();
}

async function openDb() {
  if (databaseUrl !== "") {
    const client = new pg.Client({
      connectionString:
        process.env.DATABASE_URL_UNPOOLED?.trim() || databaseUrl,
    });
    await client.connect();
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    await client.query(`
      create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const done = new Set(
      (await client.query("select name from schema_migrations")).rows.map(
        (r) => r.name,
      ),
    );
    for (const file of files.filter((f) => !done.has(f))) {
      await client.query(await readFile(path.join(migrationsDir, file), "utf8"));
      await client.query("insert into schema_migrations (name) values ($1)", [
        file,
      ]);
    }
    return {
      query: (text, params) => client.query(text, params),
      end: () => client.end(),
    };
  }

  await mkdir(localDataDir, { recursive: true });
  const pglite = new PGlite(localDataDir);
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  await pglite.exec(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
  const done = new Set(
    (await pglite.query("select name from schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );
  for (const file of files.filter((f) => !done.has(f))) {
    await pglite.exec(await readFile(path.join(migrationsDir, file), "utf8"));
    await pglite.query("insert into schema_migrations (name) values ($1)", [
      file,
    ]);
  }
  return {
    query: (text, params) => pglite.query(text, params),
    exec: (text) => pglite.exec(text),
    end: async () => {
      await pglite.close();
    },
  };
}

async function closeDb() {
  if (db?.end) await db.end();
}

async function q(text, params = []) {
  const res = await db.query(text, params);
  return res.rows ?? res;
}

async function exec(text) {
  if (db.exec) return db.exec(text);
  return db.query(text);
}

async function runImport(workbook, sheet, fn) {
  const started = await q(
    `insert into import_runs (workbook, sheet) values ($1, $2) returning id`,
    [workbook, sheet],
  );
  const id = started[0].id;
  try {
    await fn();
    await q(`update import_runs set finished_at = now() where id = $1`, [id]);
    console.log(`import: ${workbook} / ${sheet}`);
  } catch (e) {
    await q(
      `update import_runs set finished_at = now(), notes = $2 where id = $1`,
      [id, String(e?.message || e)],
    );
    throw e;
  }
}

function key(username) {
  return String(username).trim().toLowerCase();
}

function clean(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "—" || s === "-" || s === "None" || s.toUpperCase() === "VACANT")
    return null;
  return s;
}

function isSectionHeader(username) {
  if (!username) return true;
  const u = username.toUpperCase();
  return (
    u === "USERNAME" ||
    u.includes("ADMINISTRATION") ||
    u.includes("LEADERSHIP") ||
    u.includes("CORPS") ||
    u.includes("OFFICE OF THE CHIEF") ||
    u.includes("SECURITY DEPARTMENT") ||
    u.includes("COMBAT MEDIC")
  );
}

function parseDate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (!s) return null;
  // M/D/YYYY or MM/DD/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    const iso = `${year.padStart(4, "0")}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return iso;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseLoa(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "yes" || s === "1") return true;
  if (s === "false" || s === "no" || s === "0") return false;
  return null;
}

function rowsOf(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
}

async function upsertMember(fields) {
  const username = clean(fields.roblox_username);
  if (!username || isSectionHeader(username)) return false;
  const username_key = key(username);
  await q(
    `
    insert into members (
      roblox_username, username_key, status, rank, position, subdivision,
      level, timezone, hire_date, discharge_type, discharge_provisional,
      strikes_note, loa, source_sheet, updated_at
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now()
    )
    on conflict (username_key) do update set
      roblox_username = excluded.roblox_username,
      status = case
        when excluded.source_sheet = 'DEPARTMENT RECORDS' then excluded.status
        else members.status
      end,
      rank = coalesce(excluded.rank, members.rank),
      position = coalesce(excluded.position, members.position),
      subdivision = case
        when excluded.subdivision is not null
          and (
            members.subdivision is null
            or members.source_sheet like '%derived%'
            or excluded.source_sheet in ('OFFICE OF THE CHIEF', 'Office of the Chief', 'General Corps', 'Combat Medic Corps', 'Specialized Control Unit', 'SECURITY DEPARTMENT LEADERSHIP', 'SCU derived (admin logs)')
          )
        then excluded.subdivision
        else coalesce(members.subdivision, excluded.subdivision)
      end,
      level = coalesce(excluded.level, members.level),
      timezone = coalesce(excluded.timezone, members.timezone),
      hire_date = coalesce(excluded.hire_date, members.hire_date),
      discharge_type = case
        when excluded.source_sheet = 'DEPARTMENT RECORDS' and excluded.status = 'active' then null
        when excluded.discharge_type is not null and excluded.discharge_type <> 'unknown'
          then excluded.discharge_type
        else coalesce(members.discharge_type, excluded.discharge_type)
      end,
      discharge_provisional = case
        when excluded.source_sheet = 'DEPARTMENT RECORDS' and excluded.status = 'active' then false
        when excluded.discharge_type is not null and excluded.discharge_type <> 'unknown'
          then excluded.discharge_provisional
        else members.discharge_provisional
      end,
      strikes_note = coalesce(excluded.strikes_note, members.strikes_note),
      loa = coalesce(excluded.loa, members.loa),
      source_sheet = case
        when members.source_sheet is null then excluded.source_sheet
        when excluded.source_sheet is null then members.source_sheet
        when members.source_sheet like '%' || excluded.source_sheet || '%' then members.source_sheet
        else members.source_sheet || ',' || excluded.source_sheet
      end,
      updated_at = now()
    `,
    [
      username,
      username_key,
      fields.status || "active",
      clean(fields.rank),
      clean(fields.position),
      clean(fields.subdivision),
      clean(fields.level),
      clean(fields.timezone),
      fields.hire_date || null,
      fields.discharge_type || null,
      fields.discharge_provisional ?? false,
      clean(fields.strikes_note),
      fields.loa ?? null,
      fields.source_sheet || null,
    ],
  );
  return true;
}

async function importDepartmentRecords(sheet, counts) {
  const rows = rowsOf(sheet);
  for (const r of rows) {
    const hire = parseDate(r[5]);
    const username = clean(r[6]);
    const statusRaw = clean(r[7]);
    if (!username || !statusRaw || isSectionHeader(username)) continue;
    const status = /discharg/i.test(statusRaw) ? "discharged" : "active";
    const ok = await upsertMember({
      roblox_username: username,
      status,
      rank: clean(r[8]),
      timezone: clean(r[9]),
      strikes_note: clean(r[10]),
      level: clean(r[11]),
      hire_date: hire,
      discharge_type: status === "discharged" ? "unknown" : null,
      source_sheet: "DEPARTMENT RECORDS",
    });
    if (ok) {
      counts.members++;
      if (status === "active") counts.active++;
      else counts.discharged++;
    }
  }
}

async function importCorpsSheet(sheet, subdivision, cols, counts) {
  const rows = rowsOf(sheet);
  for (const r of rows) {
    const username = clean(r[cols.usernameCol]);
    if (!username || isSectionHeader(username)) continue;
    // Skip rows that only have position placeholders with no username (already handled)
    await upsertMember({
      roblox_username: username,
      status: "active",
      rank: cols.rankCol != null ? clean(r[cols.rankCol]) : null,
      position: cols.positionCol != null ? clean(r[cols.positionCol]) : null,
      subdivision,
      timezone: cols.timezoneCol != null ? clean(r[cols.timezoneCol]) : null,
      strikes_note: cols.strikesCol != null ? clean(r[cols.strikesCol]) : null,
      level: cols.levelCol != null ? clean(r[cols.levelCol]) : null,
      loa: cols.loaCol != null ? parseLoa(r[cols.loaCol]) : null,
      source_sheet: subdivision,
    });
  }
}

async function importAdminLogs(sheet, workbook, counts, counterKey) {
  const rows = rowsOf(sheet);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const username = clean(r[1]);
    const action = clean(r[3]);
    if (!username || !action || username.toUpperCase() === "USERNAME") continue;
    const subdivision = clean(r[2]);
    const description = clean(r[4]);
    const officer = clean(r[5]);
    const effective = parseDate(r[6]);
    try {
      await q(
        `
        insert into admin_logs (
          username, username_key, subdivision, action, description,
          officer_name, effective_date, source_workbook, source_row
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        on conflict do nothing
        `,
        [
          username,
          key(username),
          subdivision,
          action,
          description,
          officer,
          effective,
          workbook,
          i,
        ],
      );
      counts[counterKey]++;
    } catch {
      // ignore dupes
    }
  }
}

async function importAwards(sheet, counts) {
  const rows = rowsOf(sheet);
  // Row 5: category headers, row 6: award names
  const categories = rows[5] || [];
  const names = rows[6] || [];
  /** @type {{name: string, category: string, col: number}[]} */
  const awards = [];
  let currentCategory = null;
  for (let col = 0; col < Math.max(categories.length, names.length); col++) {
    const catCell = clean(categories[col]);
    if (catCell) {
      if (/high honor/i.test(catCell)) currentCategory = "high_honor";
      else if (/medal/i.test(catCell)) currentCategory = "medal";
      else if (/ribbon/i.test(catCell)) currentCategory = "ribbon";
    }
    const name = clean(names[col]);
    if (!name || !currentCategory) continue;
    awards.push({ name, category: currentCategory, col });
  }

  for (let i = 0; i < awards.length; i++) {
    const a = awards[i];
    await q(
      `insert into awards (name, category, sort_order) values ($1,$2,$3)
       on conflict (name) do update set category = excluded.category, sort_order = excluded.sort_order`,
      [a.name, a.category, i],
    );
    counts.awards++;
  }

  const awardRows = await q(`select id, name from awards`);
  const byName = Object.fromEntries(awardRows.map((r) => [r.name, r.id]));

  for (let rowIdx = 10; rowIdx < rows.length; rowIdx++) {
    const r = rows[rowIdx];
    if (!r) continue;
    for (const a of awards) {
      const cell = clean(r[a.col]);
      if (!cell) continue;
      // Support "Name x2" style
      const m = cell.match(/^(.*?)(?:\s*[x×]\s*(\d+))?$/i);
      const username = clean(m?.[1]);
      if (!username || isSectionHeader(username)) continue;
      const grantCount = m?.[2] ? parseInt(m[2], 10) : 1;
      const awardId = byName[a.name];
      if (!awardId) continue;
      await q(
        `
        insert into award_grants (award_id, username, username_key, grant_count)
        values ($1,$2,$3,$4)
        on conflict (award_id, username_key) do update set
          grant_count = greatest(award_grants.grant_count, excluded.grant_count),
          username = excluded.username
        `,
        [awardId, username, key(username), grantCount],
      );
      counts.award_grants++;
      // Ensure member stub exists for awardees not in roster
      await upsertMember({
        roblox_username: username,
        status: "discharged",
        source_sheet: "AWARDS DATABASE",
      });
      // Don't overwrite active status — fix if already active
      await q(
        `update members set status = 'active'
         where username_key = $1 and source_sheet like '%DEPARTMENT RECORDS%'
           and status = 'discharged' and roblox_username in (
             select roblox_username from members where username_key = $1 and status = 'active'
           )`,
        [key(username)],
      );
    }
  }

  // Restore active status for anyone in department records as active
  // (award stub may have inserted discharged for unknown users — only keep discharged if no prior)
  // Re-assert active from any source_sheet that includes corps sheets or DR active
}

async function deriveScuAndDischarge(counts) {
  // Map Fire/Discharge from admin logs onto members
  const actions = await q(`
    select username_key, username, action, effective_date, subdivision, description
    from admin_logs
    where lower(action) in ('fire', 'discharge')
    order by effective_date desc nulls last, id desc
  `);
  /** @type {Map<string, {type: string, provisional: boolean}>} */
  const dischargeMap = new Map();
  for (const row of actions) {
    if (dischargeMap.has(row.username_key)) continue;
    const type =
      String(row.action).toLowerCase() === "fire"
        ? "dishonorable"
        : "honorable";
    dischargeMap.set(row.username_key, { type, provisional: true });
  }

  for (const [username_key, info] of dischargeMap) {
    await q(
      `
      update members set
        status = 'discharged',
        discharge_type = $2,
        discharge_provisional = $3,
        updated_at = now()
      where username_key = $1 and status = 'discharged'
      `,
      [username_key, info.type, info.provisional],
    );
    // If still active in DR but has discharge/fire log, keep DR status (current roster wins)
  }

  // Also set discharge_type for discharged members who have matching logs
  for (const [username_key, info] of dischargeMap) {
    await q(
      `
      update members set
        discharge_type = $2,
        discharge_provisional = true,
        updated_at = now()
      where username_key = $1 and status = 'discharged'
        and (discharge_type is null or discharge_type = 'unknown')
      `,
      [username_key, info.type],
    );
  }

  await q(`
    update members
    set discharge_type = 'unknown', updated_at = now()
    where status = 'discharged' and discharge_type is null
  `);

  // Derive SCU members from admin logs + ensure leadership entry
  const scuLogs = await q(`
    select distinct on (username_key) username, username_key, subdivision, description, action
    from admin_logs
    where subdivision ilike '%specialized%'
       or subdivision ilike '%scu%'
       or description ilike '%scu%'
    order by username_key, effective_date desc nulls last, id desc
  `);

  for (const row of scuLogs) {
    const existing = await q(
      `select status, subdivision from members where username_key = $1`,
      [row.username_key],
    );
    if (existing[0]?.status === "discharged") {
      // still tag subdivision history but don't force active
      if (!existing[0].subdivision) {
        await q(
          `update members set subdivision = 'Specialized Control Unit', updated_at = now() where username_key = $1`,
          [row.username_key],
        );
      }
      continue;
    }
    await upsertMember({
      roblox_username: row.username,
      status: existing[0]?.status || "active",
      subdivision: "Specialized Control Unit",
      source_sheet: "SCU derived (admin logs)",
    });
    counts.scu_derived++;
  }

  // Leadership: 6jeroo is listed as SCU Major
  await upsertMember({
    roblox_username: "6jeroo",
    status: "active",
    rank: "Major",
    position: "Specialized Control Unit Leader",
    subdivision: "Specialized Control Unit",
    level: "Level - 4",
    source_sheet: "SECURITY DEPARTMENT LEADERSHIP",
  });
}

async function seedHallOfFame(counts) {
  const honors = await q(`
    select ag.username, ag.username_key, a.name, ag.grant_count
    from award_grants ag
    join awards a on a.id = ag.award_id
    where a.category = 'high_honor'
    order by a.sort_order, ag.username
  `);
  /** @type {Map<string, {username: string, titles: string[]}>} */
  const byUser = new Map();
  for (const h of honors) {
    const entry = byUser.get(h.username_key) || {
      username: h.username,
      titles: [],
    };
    entry.titles.push(h.name);
    byUser.set(h.username_key, entry);
  }
  let order = 0;
  for (const entry of byUser.values()) {
    await q(
      `
      insert into hall_of_fame_entries (username, username_key, title, blurb, sort_order)
      values ($1,$2,$3,$4,$5)
      `,
      [
        entry.username,
        key(entry.username),
        "High Honors",
        entry.titles.join(" · "),
        order++,
      ],
    );
    counts.hall_of_fame++;
  }
}

async function seedPastChiefs(wb, counts) {
  // Current chief from Office of the Chief
  const chiefs = [
    {
      username: "notoriuspersona",
      started_on: null,
      ended_on: null,
      notes:
        "Current Chief of Security (from OFFICE OF THE CHIEF). Confirm start date.",
      sort_order: 0,
      needs_confirmation: true,
    },
  ];

  // Try to find historical chiefs from outdated discharge/rank sheets via description text
  // Also scan admin logs for "Chief of Security" promotions
  const chiefLogs = await q(`
    select username, description, action, effective_date
    from admin_logs
    where description ilike '%chief of security%'
       or description ilike '%chief%'
    order by effective_date asc nulls last
  `);
  const seen = new Set([key("notoriuspersona")]);
  for (const row of chiefLogs) {
    if (!/chief of security/i.test(row.description || "")) continue;
    if (seen.has(key(row.username))) continue;
    seen.add(key(row.username));
    chiefs.push({
      username: row.username,
      started_on: row.effective_date,
      ended_on: null,
      notes: `Inferred from admin log: ${row.action} — ${row.description}. Needs confirmation.`,
      sort_order: chiefs.length,
      needs_confirmation: true,
    });
  }

  // From outdated discharge log headers peek for chief mentions — best effort empty
  void wb;

  for (const c of chiefs) {
    await q(
      `
      insert into past_chiefs (
        username, username_key, started_on, ended_on, notes, sort_order, needs_confirmation
      ) values ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        c.username,
        key(c.username),
        c.started_on,
        c.ended_on,
        c.notes,
        c.sort_order,
        c.needs_confirmation,
      ],
    );
    counts.past_chiefs++;
  }
}

async function importOutdatedDischarge(sheet, counts) {
  const rows = rowsOf(sheet);
  // Discover header row
  let headerIdx = -1;
  let cols = {};
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i].map((c) => (c == null ? "" : String(c).toLowerCase()));
    if (r.some((c) => c.includes("user")) && r.some((c) => c.includes("discharge") || c.includes("reason") || c.includes("type") || c.includes("date"))) {
      headerIdx = i;
      r.forEach((c, idx) => {
        if (c.includes("user")) cols.user = idx;
        else if (c.includes("date")) cols.date = idx;
        else if (c.includes("reason") || c.includes("desc")) cols.desc = idx;
        else if (c.includes("officer") || c.includes("author")) cols.officer = idx;
        else if (c.includes("type") || c.includes("status")) cols.type = idx;
      });
      break;
    }
  }
  if (headerIdx < 0) {
    // fallback: try common layout
    cols = { user: 1, type: 2, desc: 3, officer: 4, date: 5 };
    headerIdx = 0;
  }
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const username = clean(r[cols.user]);
    if (!username || isSectionHeader(username)) continue;
    const description = cols.desc != null ? clean(r[cols.desc]) : null;
    const officer = cols.officer != null ? clean(r[cols.officer]) : null;
    const effective = cols.date != null ? parseDate(r[cols.date]) : null;
    const typeRaw = cols.type != null ? clean(r[cols.type]) : "Discharge";
    const action = /fire/i.test(typeRaw || "") ? "Fire" : "Discharge";
    await q(
      `
      insert into admin_logs (
        username, username_key, subdivision, action, description,
        officer_name, effective_date, source_workbook, source_row
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      on conflict do nothing
      `,
      [
        username,
        key(username),
        null,
        action,
        description || typeRaw || "Historical discharge",
        officer,
        effective,
        OUTDATED,
        i,
      ],
    );
    counts.historical_logs++;
    // Enrich discharge type if member exists as discharged
    const dtype = action === "Fire" ? "dishonorable" : "honorable";
    await q(
      `
      update members set
        discharge_type = case
          when discharge_type is null or discharge_type = 'unknown' then $2
          else discharge_type
        end,
        discharge_provisional = true,
        updated_at = now()
      where username_key = $1 and status = 'discharged'
      `,
      [key(username), dtype],
    );
  }
}

async function importGenericHistoricalLog(sheet, workbook, counts) {
  const rows = rowsOf(sheet);
  let headerIdx = -1;
  let cols = { user: 1, action: 2, desc: 3, officer: 4, date: 5 };
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const r = rows[i].map((c) => (c == null ? "" : String(c).toLowerCase()));
    if (r.some((c) => c.includes("user") || c.includes("name"))) {
      headerIdx = i;
      r.forEach((c, idx) => {
        if (c.includes("user") || c === "name" || c.includes("personnel"))
          cols.user = idx;
        else if (c.includes("action") || c.includes("change") || c.includes("rank"))
          cols.action = idx;
        else if (c.includes("desc") || c.includes("reason") || c.includes("note"))
          cols.desc = idx;
        else if (c.includes("officer") || c.includes("author") || c.includes("by"))
          cols.officer = idx;
        else if (c.includes("date")) cols.date = idx;
      });
      break;
    }
  }
  if (headerIdx < 0) headerIdx = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const username = clean(r[cols.user]);
    if (!username || isSectionHeader(username)) continue;
    const action = clean(r[cols.action]) || "Rank Change";
    const description = cols.desc != null ? clean(r[cols.desc]) : null;
    const officer = cols.officer != null ? clean(r[cols.officer]) : null;
    const effective = cols.date != null ? parseDate(r[cols.date]) : null;
    await q(
      `
      insert into admin_logs (
        username, username_key, subdivision, action, description,
        officer_name, effective_date, source_workbook, source_row
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      on conflict do nothing
      `,
      [
        username,
        key(username),
        null,
        action,
        description,
        officer,
        effective,
        workbook,
        i,
      ],
    );
    counts.historical_logs++;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
