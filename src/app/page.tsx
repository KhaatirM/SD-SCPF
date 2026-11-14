import Link from "next/link";
import { getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <>
      <section className="hero">
        <div className="hero__atmosphere" aria-hidden />
        <div className="hero__content">
          <h1 className="hero__brand">
            <span>SCP Foundation</span>
            Security Department
          </h1>
          <p className="hero__headline">
            We die in the dark so they may live in the light.
          </p>
          <p className="hero__support">
            Public personnel directory for SD-SCPF — active roster, discharges,
            subdivision boards, medals, and administrative history.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--solid" href="/roster">
              Open Roster
            </Link>
            <Link className="btn" href="/awards">
              Medals & Hall of Fame
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="section__eyebrow">Facility overview</p>
        <h2 className="section__title">Department at a glance</h2>
        <p className="section__lede">
          Figures seeded from the 2026–2027 Security Department workbook.
        </p>
        <div className="stat-strip">
          <div className="stat-strip__item">
            <div className="stat-strip__value">{stats?.active ?? 0}</div>
            <div className="stat-strip__label">Active</div>
          </div>
          <div className="stat-strip__item">
            <div className="stat-strip__value">{stats?.discharged ?? 0}</div>
            <div className="stat-strip__label">Discharged</div>
          </div>
          <div className="stat-strip__item">
            <div className="stat-strip__value">{stats?.logs ?? 0}</div>
            <div className="stat-strip__label">Admin logs</div>
          </div>
          <div className="stat-strip__item">
            <div className="stat-strip__value">{stats?.awards ?? 0}</div>
            <div className="stat-strip__label">Award grants</div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <p className="section__eyebrow">Directories</p>
        <h2 className="section__title">Enter a section</h2>
        <div className="doorway-grid">
          {[
            {
              href: "/roster",
              code: "01",
              title: "Active Roster",
              text: "Searchable personnel list with rank, subdivision, and tenure.",
            },
            {
              href: "/subdivisions/general-corps",
              code: "02",
              title: "Subdivisions",
              text: "General Corps, Combat Medics, and Specialized Control Unit boards.",
            },
            {
              href: "/records",
              code: "03",
              title: "Department Records",
              text: "Full public directory including hire dates and status.",
            },
            {
              href: "/admin-logs",
              code: "04",
              title: "Administrative Logs",
              text: "Hire, promote, demote, discharge, and fire actions.",
            },
            {
              href: "/awards",
              code: "05",
              title: "Medals & Hall of Fame",
              text: "High honors, medals, ribbons, and inductees.",
            },
            {
              href: "/past-chiefs",
              code: "06",
              title: "Past Chiefs",
              text: "Chief of Security timeline — curated and pending confirmation.",
            },
            {
              href: "/discharged",
              code: "07",
              title: "Discharged",
              text: "Former personnel with provisional honorable / dishonorable grouping.",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="doorway">
              <div className="doorway__code">Section {item.code}</div>
              <h3 className="doorway__title">{item.title}</h3>
              <p className="doorway__text">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
