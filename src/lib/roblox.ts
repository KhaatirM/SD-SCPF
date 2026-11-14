import { sql, usernameKey } from "./db";

type CacheRow = {
  username_key: string;
  roblox_user_id: string | number | null;
  image_url: string | null;
  fetched_at: string;
};

const MEMORY = new Map<string, string | null>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export async function getAvatarUrl(username: string): Promise<string | null> {
  const k = usernameKey(username);
  if (MEMORY.has(k)) return MEMORY.get(k) ?? null;

  const cached = await sql<CacheRow>(
    `select * from avatar_cache where username_key = $1`,
    [k],
  );
  const row = cached[0];
  if (row?.fetched_at) {
    const age = Date.now() - new Date(row.fetched_at).getTime();
    if (age < CACHE_TTL_MS) {
      MEMORY.set(k, row.image_url);
      return row.image_url;
    }
  }

  try {
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      next: { revalidate: 86400 },
    });
    if (!userRes.ok) {
      MEMORY.set(k, null);
      return null;
    }
    const userJson = (await userRes.json()) as {
      data?: { id: number; name: string }[];
    };
    const user = userJson.data?.[0];
    if (!user) {
      await upsertCache(k, null, null);
      MEMORY.set(k, null);
      return null;
    }

    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`,
      { next: { revalidate: 86400 } },
    );
    if (!thumbRes.ok) {
      await upsertCache(k, user.id, null);
      MEMORY.set(k, null);
      return null;
    }
    const thumbJson = (await thumbRes.json()) as {
      data?: { imageUrl?: string }[];
    };
    const imageUrl = thumbJson.data?.[0]?.imageUrl ?? null;
    await upsertCache(k, user.id, imageUrl);
    MEMORY.set(k, imageUrl);
    return imageUrl;
  } catch {
    MEMORY.set(k, row?.image_url ?? null);
    return row?.image_url ?? null;
  }
}

async function upsertCache(
  username_key: string,
  roblox_user_id: number | null,
  image_url: string | null,
) {
  await sql(
    `
    insert into avatar_cache (username_key, roblox_user_id, image_url, fetched_at)
    values ($1, $2, $3, now())
    on conflict (username_key) do update set
      roblox_user_id = excluded.roblox_user_id,
      image_url = excluded.image_url,
      fetched_at = now()
    `,
    [username_key, roblox_user_id, image_url],
  );
}
