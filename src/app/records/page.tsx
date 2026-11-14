import type { Metadata } from "next";
import Link from "next/link";
import {
  FilterBar,
  FilterSubmit,
  SearchField,
  SelectField,
} from "@/components/FilterBar";
import { formatDate, tenureLabel } from "@/lib/format";
import { listDepartmentRecords } from "@/lib/queries";

export const metadata: Metadata = { title: "Department Records" };
export const dynamic = "force-dynamic";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const members = await listDepartmentRecords({
    q: sp.q,
    status: sp.status,
  });

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Directory</p>
          <h1 className="section__title">Department Records</h1>
          <p className="section__lede">
            Public personnel directory from the Department Records sheet.
            Hire dates are present for a subset of rows.
          </p>
        </div>
      </div>
      <section className="section">
        <FilterBar action="/records">
          <SearchField defaultValue={sp.q} placeholder="Search username" />
          <SelectField
            name="status"
            defaultValue={sp.status || "all"}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "discharged", label: "Discharged" },
            ]}
          />
          <FilterSubmit />
        </FilterBar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Status</th>
                <th>Rank</th>
                <th>Hire date</th>
                <th>Tenure</th>
                <th>Timezone</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/members/${encodeURIComponent(m.roblox_username)}`}>
                      {m.roblox_username}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge--${m.status}`}>{m.status}</span>
                  </td>
                  <td>{m.rank || "—"}</td>
                  <td>{formatDate(m.hire_date)}</td>
                  <td>{tenureLabel(m.hire_date)}</td>
                  <td>{m.timezone || "—"}</td>
                  <td>{m.level || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Showing {members.length} record{members.length === 1 ? "" : "s"}
          {members.length >= 200 ? " (capped — refine filters to narrow)" : ""}
        </p>
      </section>
    </>
  );
}
