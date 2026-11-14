import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/format";
import { listPastChiefs } from "@/lib/queries";

export const metadata: Metadata = { title: "Past Chiefs" };
export const dynamic = "force-dynamic";

export default async function PastChiefsPage() {
  const chiefs = await listPastChiefs();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Leadership</p>
          <h1 className="section__title">Past Chiefs of Security</h1>
          <p className="section__lede">
            There is no dedicated Past Chiefs sheet in the workbook. Entries
            below are best-effort seeds and need confirmation.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="notice">
          Checklist for department staff: confirm each username, add missing
          former Chiefs, and fill start/end dates. Marked entries still need
          confirmation.
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Chief</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {chiefs.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Avatar username={c.username} size={32} />
                  </td>
                  <td>
                    <Link href={`/members/${encodeURIComponent(c.username)}`}>
                      {c.username}
                    </Link>
                  </td>
                  <td>{formatDate(c.started_on)}</td>
                  <td>{c.ended_on ? formatDate(c.ended_on) : "Present / unknown"}</td>
                  <td style={{ whiteSpace: "normal", maxWidth: "28rem" }}>
                    {c.notes || "—"}
                  </td>
                  <td>
                    {c.needs_confirmation ? (
                      <span className="badge">Needs confirmation</span>
                    ) : (
                      <span className="badge badge--active">Confirmed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {chiefs.length === 0 ? (
            <div className="empty">No past chiefs seeded yet.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}
