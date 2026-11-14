import Link from "next/link";
import { Avatar } from "./Avatar";
import { tenureLabel } from "@/lib/format";
import type { Member } from "@/lib/types";

export async function MemberRow({
  member,
  showStatus = false,
}: {
  member: Member;
  showStatus?: boolean;
}) {
  return (
    <Link href={`/members/${encodeURIComponent(member.roblox_username)}`} className="member-row">
      <Avatar username={member.roblox_username} size={36} />
      <span className="member-row__name">{member.roblox_username}</span>
      <span className="member-row__meta">{member.rank || "—"}</span>
      <span className="member-row__meta hide-sm">
        {member.subdivision || "—"}
      </span>
      <span className="member-row__meta hide-sm">
        {tenureLabel(member.hire_date)}
      </span>
      {showStatus ? (
        <span className={`badge badge--${member.status}`}>{member.status}</span>
      ) : null}
    </Link>
  );
}
