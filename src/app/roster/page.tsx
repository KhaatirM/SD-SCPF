import type { Metadata } from "next";
import {
  FilterBar,
  FilterSubmit,
  SearchField,
  SelectField,
} from "@/components/FilterBar";
import { MemberRow } from "@/components/MemberRow";
import { distinctRanks, listActiveMembers } from "@/lib/queries";

export const metadata: Metadata = { title: "Roster" };
export const dynamic = "force-dynamic";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subdivision?: string; rank?: string }>;
}) {
  const sp = await searchParams;
  const [members, ranks] = await Promise.all([
    listActiveMembers({
      q: sp.q,
      subdivision: sp.subdivision && sp.subdivision !== "all" ? sp.subdivision : undefined,
      rank: sp.rank && sp.rank !== "all" ? sp.rank : undefined,
    }),
    distinctRanks(),
  ]);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Personnel</p>
          <h1 className="section__title">Active Roster</h1>
          <p className="section__lede">
            Currently listed active Security Department members.
          </p>
        </div>
      </div>
      <section className="section">
        <FilterBar action="/roster">
          <SearchField defaultValue={sp.q} placeholder="Search username" />
          <SelectField
            name="subdivision"
            defaultValue={sp.subdivision || "all"}
            options={[
              { value: "all", label: "All subdivisions" },
              { value: "Office of the Chief", label: "Office of the Chief" },
              { value: "General Corps", label: "General Corps" },
              { value: "Combat Medic", label: "Combat Medics" },
              { value: "Specialized Control Unit", label: "SCU" },
            ]}
          />
          <SelectField
            name="rank"
            defaultValue={sp.rank || "all"}
            options={[
              { value: "all", label: "All ranks" },
              ...ranks.map((r) => ({ value: r, label: r })),
            ]}
          />
          <FilterSubmit />
        </FilterBar>
        <div className="list-panel">
          <div className="list-head">
            <span />
            <span>Username</span>
            <span>Rank</span>
            <span className="hide-sm">Subdivision</span>
            <span className="hide-sm">Tenure</span>
            <span />
          </div>
          {members.length === 0 ? (
            <div className="empty">No active members match these filters.</div>
          ) : (
            members.map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </div>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Showing {members.length} active member
          {members.length === 1 ? "" : "s"}
          {members.length >= 200 ? " (capped — refine filters to narrow)" : ""}
        </p>
      </section>
    </>
  );
}
