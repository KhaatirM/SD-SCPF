import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { listAwardGrants, listAwards, listHallOfFame } from "@/lib/queries";

export const metadata: Metadata = { title: "Medals & Hall of Fame" };
export const dynamic = "force-dynamic";

export default async function AwardsPage() {
  const [awards, grants, hof] = await Promise.all([
    listAwards(),
    listAwardGrants(),
    listHallOfFame(),
  ]);

  const byCategory = {
    high_honor: awards.filter((a) => a.category === "high_honor"),
    medal: awards.filter((a) => a.category === "medal"),
    ribbon: awards.filter((a) => a.category === "ribbon"),
  };

  const grantsByAward = new Map<number, typeof grants>();
  for (const g of grants) {
    const list = grantsByAward.get(g.award_id) || [];
    list.push(g);
    grantsByAward.set(g.award_id, list);
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Recognition</p>
          <h1 className="section__title">Medals & Hall of Fame</h1>
          <p className="section__lede">
            High honors, medals, and ribbons from the Awards Database. Hall of
            Fame inductees are seeded from High Honors recipients.
          </p>
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">Hall of Fame</h2>
        <p className="section__lede">
          Inductees holding one or more High Honors. Confirm titles and blurbs
          with department leadership.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Member</th>
                <th>Title</th>
                <th>Honors</th>
              </tr>
            </thead>
            <tbody>
              {hof.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <Avatar username={entry.username} size={32} />
                  </td>
                  <td>
                    <Link href={`/members/${encodeURIComponent(entry.username)}`}>
                      {entry.username}
                    </Link>
                  </td>
                  <td>{entry.title || "—"}</td>
                  <td>{entry.blurb || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <h2 className="section__title">Awards database</h2>
        <div className="award-columns">
          {(
            [
              ["high_honor", "High Honors"],
              ["medal", "Medals"],
              ["ribbon", "Ribbons"],
            ] as const
          ).map(([key, label]) => (
            <div className="award-col" key={key}>
              <h3>{label}</h3>
              {byCategory[key].map((award) => {
                const recipients = grantsByAward.get(award.id) || [];
                return (
                  <div key={award.id} style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
                      {award.name}
                      <span className="muted"> · {recipients.length}</span>
                    </div>
                    <ul className="award-list">
                      {recipients.slice(0, 12).map((g) => (
                        <li key={g.id}>
                          <Link
                            href={`/members/${encodeURIComponent(g.username)}`}
                          >
                            {g.username}
                          </Link>
                          <span>
                            {g.grant_count > 1 ? `×${g.grant_count}` : ""}
                          </span>
                        </li>
                      ))}
                      {recipients.length > 12 ? (
                        <li className="muted">
                          +{recipients.length - 12} more
                        </li>
                      ) : null}
                      {recipients.length === 0 ? (
                        <li className="muted">No recipients listed</li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
