import type { Metadata } from "next";
import Link from "next/link";
import {
  FilterBar,
  FilterSubmit,
  SearchField,
  SelectField,
} from "@/components/FilterBar";
import { formatDate } from "@/lib/format";
import { distinctActions, listAdminLogs } from "@/lib/queries";

export const metadata: Metadata = { title: "Administrative Logs" };
export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    action?: string;
    subdivision?: string;
  }>;
}) {
  const sp = await searchParams;
  const [logs, actions] = await Promise.all([
    listAdminLogs({
      q: sp.q,
      action: sp.action,
      subdivision: sp.subdivision,
      limit: 200,
    }),
    distinctActions(),
  ]);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Operations</p>
          <h1 className="section__title">Administrative Logs</h1>
          <p className="section__lede">
            Hire, promote, demote, discharge, and fire actions from the primary
            workbook, plus historical enrichment where available.
          </p>
        </div>
      </div>
      <section className="section">
        <FilterBar action="/admin-logs">
          <SearchField
            defaultValue={sp.q}
            placeholder="Username or officer"
          />
          <SelectField
            name="action"
            defaultValue={sp.action || "all"}
            options={[
              { value: "all", label: "All actions" },
              ...actions.map((a) => ({ value: a, label: a })),
            ]}
          />
          <SelectField
            name="subdivision"
            defaultValue={sp.subdivision || "all"}
            options={[
              { value: "all", label: "All subdivisions" },
              { value: "General Corps", label: "General Corps" },
              { value: "Combat Medic", label: "Combat Medics" },
              { value: "Specialized Control Unit", label: "SCU" },
            ]}
          />
          <FilterSubmit />
        </FilterBar>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Username</th>
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
                  <td>
                    <Link href={`/members/${encodeURIComponent(log.username)}`}>
                      {log.username}
                    </Link>
                  </td>
                  <td>{log.action}</td>
                  <td>{log.subdivision || "—"}</td>
                  <td>{log.description || "—"}</td>
                  <td>{log.officer_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 ? <div className="empty">No logs match.</div> : null}
        </div>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Showing {logs.length} entr{logs.length === 1 ? "y" : "ies"}
        </p>
      </section>
    </>
  );
}
