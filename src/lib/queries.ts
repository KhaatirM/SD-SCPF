import { sql, usernameKey } from "./db";
import type {
  AdminLog,
  Award,
  AwardGrant,
  HallOfFameEntry,
  Member,
  PastChief,
} from "./types";

export async function getStats() {
  const rows = await sql<{
    active: number;
    discharged: number;
    logs: number;
    awards: number;
  }>(`
    select
      (select count(*)::int from members where status = 'active') as active,
      (select count(*)::int from members where status = 'discharged') as discharged,
      (select count(*)::int from admin_logs) as logs,
      (select count(*)::int from award_grants) as awards
  `);
  return rows[0];
}

export async function listActiveMembers(opts: {
  q?: string;
  subdivision?: string;
  rank?: string;
  limit?: number;
} = {}): Promise<Member[]> {
  const params: unknown[] = [];
  const where = ["status = 'active'"];
  if (opts.q) {
    params.push(`%${opts.q.trim().toLowerCase()}%`);
    where.push(`username_key like $${params.length}`);
  }
  if (opts.subdivision) {
    params.push(`%${opts.subdivision}%`);
    where.push(`subdivision ilike $${params.length}`);
  }
  if (opts.rank) {
    params.push(opts.rank);
    where.push(`rank = $${params.length}`);
  }
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  params.push(limit);
  return sql<Member>(
    `
    select * from members
    where ${where.join(" and ")}
    order by
      case when rank is null then 1 else 0 end,
      rank asc,
      roblox_username asc
    limit $${params.length}
    `,
    params,
  );
}

export async function listDischargedMembers(opts: {
  q?: string;
  type?: string;
  limit?: number;
} = {}): Promise<Member[]> {
  const params: unknown[] = [];
  const where = ["status = 'discharged'"];
  if (opts.q) {
    params.push(`%${opts.q.trim().toLowerCase()}%`);
    where.push(`username_key like $${params.length}`);
  }
  if (opts.type && opts.type !== "all") {
    params.push(opts.type);
    where.push(`discharge_type = $${params.length}`);
  }
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  params.push(limit);
  return sql<Member>(
    `
    select * from members
    where ${where.join(" and ")}
    order by roblox_username asc
    limit $${params.length}
    `,
    params,
  );
}

export async function getMember(username: string): Promise<Member | null> {
  const rows = await sql<Member>(
    `select * from members where username_key = $1 limit 1`,
    [usernameKey(username)],
  );
  return rows[0] ?? null;
}

export async function getMemberAwards(username: string): Promise<
  (AwardGrant & { award_name: string; award_category: string })[]
> {
  return sql(
    `
    select ag.*, a.name as award_name, a.category as award_category
    from award_grants ag
    join awards a on a.id = ag.award_id
    where ag.username_key = $1
    order by a.category, a.sort_order
    `,
    [usernameKey(username)],
  );
}

export async function getMemberLogs(username: string): Promise<AdminLog[]> {
  return sql<AdminLog>(
    `
    select * from admin_logs
    where username_key = $1
    order by effective_date desc nulls last, id desc
    `,
    [usernameKey(username)],
  );
}

export async function listBySubdivision(match: string): Promise<Member[]> {
  return sql<Member>(
    `
    select * from members
    where status = 'active' and subdivision ilike $1
    order by
      case when rank is null then 1 else 0 end,
      rank asc,
      roblox_username asc
    `,
    [`%${match}%`],
  );
}

export async function listDepartmentRecords(opts: {
  q?: string;
  status?: string;
  limit?: number;
} = {}): Promise<Member[]> {
  const params: unknown[] = [];
  const where = ["1=1"];
  if (opts.q) {
    params.push(`%${opts.q.trim().toLowerCase()}%`);
    where.push(`username_key like $${params.length}`);
  }
  if (opts.status && opts.status !== "all") {
    params.push(opts.status);
    where.push(`status = $${params.length}`);
  }
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  params.push(limit);
  return sql<Member>(
    `
    select id, roblox_username, username_key, status, rank, hire_date,
           timezone, level, subdivision
    from members
    where ${where.join(" and ")}
    order by status asc, roblox_username asc
    limit $${params.length}
    `,
    params,
  );
}

export async function listAdminLogs(opts: {
  q?: string;
  action?: string;
  subdivision?: string;
  limit?: number;
} = {}): Promise<AdminLog[]> {
  const params: unknown[] = [];
  const where = ["1=1"];
  if (opts.q) {
    params.push(`%${opts.q.trim().toLowerCase()}%`);
    where.push(
      `(username_key like $${params.length} or lower(coalesce(officer_name,'')) like $${params.length})`,
    );
  }
  if (opts.action && opts.action !== "all") {
    params.push(opts.action);
    where.push(`action = $${params.length}`);
  }
  if (opts.subdivision && opts.subdivision !== "all") {
    params.push(`%${opts.subdivision}%`);
    where.push(`subdivision ilike $${params.length}`);
  }
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 400);
  params.push(limit);
  return sql<AdminLog>(
    `
    select * from admin_logs
    where ${where.join(" and ")}
    order by effective_date desc nulls last, id desc
    limit $${params.length}
    `,
    params,
  );
}

export async function listAwards(): Promise<Award[]> {
  return sql<Award>(`select * from awards order by sort_order, name`);
}

export async function listAwardGrants(): Promise<
  (AwardGrant & { award_name: string; award_category: string })[]
> {
  return sql(
    `
    select ag.*, a.name as award_name, a.category as award_category
    from award_grants ag
    join awards a on a.id = ag.award_id
    order by a.sort_order, ag.username
    `,
  );
}

export async function listHallOfFame(): Promise<HallOfFameEntry[]> {
  return sql<HallOfFameEntry>(
    `select * from hall_of_fame_entries order by sort_order, username`,
  );
}

export async function listPastChiefs(): Promise<PastChief[]> {
  return sql<PastChief>(
    `select * from past_chiefs order by sort_order, started_on nulls last`,
  );
}

export async function distinctRanks(): Promise<string[]> {
  const rows = await sql<{ rank: string }>(
    `select distinct rank from members where status = 'active' and rank is not null order by rank`,
  );
  return rows.map((r) => r.rank);
}

export async function distinctActions(): Promise<string[]> {
  const rows = await sql<{ action: string }>(
    `select distinct action from admin_logs order by action`,
  );
  return rows.map((r) => r.action);
}
