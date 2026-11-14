import { getAvatarUrl } from "@/lib/roblox";

export async function Avatar({
  username,
  size = 40,
}: {
  username: string;
  size?: number;
}) {
  const url = await getAvatarUrl(username);
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size }}
      title={username}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" width={size} height={size} />
      ) : (
        <span className="avatar__fallback">{initials}</span>
      )}
    </span>
  );
}
