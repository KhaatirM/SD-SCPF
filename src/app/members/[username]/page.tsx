import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { dischargeLabel, formatDate, tenureLabel } from "@/lib/format";
import {
  getMember,
  getMemberAwards,
  getMemberLogs,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: decodeURIComponent(username) };
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  const member = await getMember(username);
  if (!member) notFound();
  const [awards, logs] = await Promise.all([
    getMemberAwards(member.roblox_username),
    getMemberLogs(member.roblox_username),
  ]);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Personnel file</p>
          <div className="profile">
            <Avatar username={member.roblox_username} size={112} />
            <div className="profile__identity">
              <h1>{member.roblox_username}</h1>
              <span className={`badge badge--${member.status}`}>
                {member.status}
              </span>
              {member.status === "discharged" ? (
                <span
                  className={`badge badge--${member.discharge_type || "unknown"}`}
                  style={{ marginLeft: "0.4rem" }}
                >
                  {dischargeLabel(
                    member.discharge_type,
                    member.discharge_provisional,
                  )}
                </span>
              ) : null}
              <div className="profile__grid">
                <div>
                  <span className="kv__label">Rank</span>
                  <div className="kv__value">{member.rank || "—"}</div>
                </div>
                <div>
                  <span className="kv__label">Position</span>
                  <div className="kv__value">{member.position || "—"}</div>
                </div>
                <div>
                  <span className="kv__label">Subdivision</span>
                  <div className="kv__value">{member.subdivision || "—"}</div>
                </div>
                <div>
                  <span className="kv__label">Level</span>
                  <div className="kv__value">{member.level || "—"}</div>
                </div>
                <div>
                  <span className="kv__label">Hire date</span>
                  <div className="kv__value">{formatDate(member.hire_date)}</div>
                </div>
                <div>
                  <span className="kv__label">Tenure</span>
                  <div className="kv__value">{tenureLabel(member.hire_date)}</div>
                </div>
                <div>
                  <span className="kv__label">Timezone</span>
                  <div className="kv__value">{member.timezone || "—"}</div>
                </div>
                <div>
                  <span className="kv__label">Strikes / notes</span>
                  <div className="kv__value">{member.strikes_note || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="stack-block" style={{ marginTop: 0 }}>
          <h2 className="section__title">Awards</h2>
          {awards.length === 0 ? (
            <p className="muted">No awards on file.</p>
          ) : (
            <ul className="award-list">
              {awards.map((a) => (
                <li key={a.id}>
                  <span>
                    {a.award_name}
                    <span className="muted"> · {a.award_category}</span>
                  </span>
                  <span>{a.grant_count > 1 ? `×${a.grant_count}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="stack-block">
          <h2 className="section__title">Administrative history</h2>
          {logs.length === 0 ? (
            <p className="muted">No public admin log entries.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Subdivision</th>
                    <th>Description</th>
                    <th>Officer</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.effective_date)}</td>
                      <td>{log.action}</td>
                      <td>{log.subdivision || "—"}</td>
                      <td>{log.description || "—"}</td>
                      <td>
                        {log.officer_name ? (
                          <Link
                            href={`/members/${encodeURIComponent(log.officer_name)}`}
                          >
                            {log.officer_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
