import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import {
  FilterBar,
  FilterSubmit,
  SearchField,
  SelectField,
} from "@/components/FilterBar";
import { dischargeLabel } from "@/lib/format";
import { listDischargedMembers } from "@/lib/queries";

export const metadata: Metadata = { title: "Discharged" };
export const dynamic = "force-dynamic";

export default async function DischargedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const members = await listDischargedMembers({
    q: sp.q,
    type: sp.type,
  });

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Personnel</p>
          <h1 className="section__title">Discharged</h1>
          <p className="section__lede">
            Former personnel. Honorable / dishonorable labels are provisional
            when inferred from Discharge vs Fire admin actions.
          </p>
        </div>
      </div>
      <section className="section">
        <FilterBar action="/discharged">
          <SearchField defaultValue={sp.q} placeholder="Search username" />
          <SelectField
            name="type"
            defaultValue={sp.type || "all"}
            options={[
              { value: "all", label: "All types" },
              { value: "honorable", label: "Honorable (provisional)" },
              { value: "dishonorable", label: "Dishonorable (provisional)" },
              { value: "unknown", label: "Unclassified" },
            ]}
          />
          <FilterSubmit />
        </FilterBar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Username</th>
                <th>Last rank</th>
                <th>Classification</th>
                <th>Subdivision</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Avatar username={m.roblox_username} size={32} />
                  </td>
                  <td>
                    <Link href={`/members/${encodeURIComponent(m.roblox_username)}`}>
                      {m.roblox_username}
                    </Link>
                  </td>
                  <td>{m.rank || "—"}</td>
                  <td>
                    <span className={`badge badge--${m.discharge_type || "unknown"}`}>
                      {dischargeLabel(m.discharge_type, m.discharge_provisional)}
                    </span>
                  </td>
                  <td>{m.subdivision || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 ? (
            <div className="empty">No discharged members match.</div>
          ) : null}
        </div>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Showing {members.length} record{members.length === 1 ? "" : "s"}
          {members.length >= 200 ? " (capped — refine filters to narrow)" : ""}
        </p>
      </section>
    </>
  );
}
