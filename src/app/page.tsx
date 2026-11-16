import Link from "next/link";
import { GfxPanel } from "@/components/GfxPanel";
import { HomeHero } from "@/components/HomeHero";
import { getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getStats();

  return (
    <>
      <HomeHero />

      <section id="mission" className="section mission">
        <p className="section__eyebrow">Foundation · Security Department</p>
        <h2 className="section__title">Site security, not spectacle</h2>
        <p className="section__lede">
          The SCP Foundation secures, contains, and protects anomalous objects,
          entities, and phenomena. The Security Department guards Foundation
          personnel and facilities, enforces site procedure, and responds when
          containment fails. This public directory covers SD-SCPF personnel
          records — roster, subdivisions, administrative actions, and honors —
          without inventing anomalies or claiming external authority.
        </p>
      </section>

      <GfxPanel
        src="/gfx/r6/roster-rollcall.jpg"
        alt="R6 Security Department operatives standing roll-call"
        eyebrow="01 · Roster"
        title="Personnel on the line"
        text="Active officers and operatives under Site Command and the Chief of Security — searchable by rank, subdivision, and tenure across General Corps, Combat Medics, and Specialized Control Unit."
      />

      <GfxPanel
        src="/gfx/r6/training-drill.jpg"
        alt="R6 Security Department training drill"
        eyebrow="02 · Corps & training"
        title="Drill until response is reflex"
        text="Subdivisions train for facility defense and breach support: formation discipline, medical response, and specialized control. Public boards list who serves where — not operational playbooks."
        reverse
      />

      <GfxPanel
        src="/gfx/r6/records-console.jpg"
        alt="R6 Security Department operative at records console"
        eyebrow="03 · Records & logs"
        title="Procedure leaves a paper trail"
        text="Department records and administrative logs document hire, promote, demote, discharge, and fire actions. Clinical history for a department that keeps the lights on for everyone else."
      />

      <GfxPanel
        src="/gfx/r6/awards-salute.jpg"
        alt="R6 Security Department awards salute"
        eyebrow="04 · Medals"
        title="Recognition under the seal"
        text="High honors, medals, ribbons, and Hall of Fame inductees — formal acknowledgment for service that usually stays off the public stage."
        reverse
      />

      <GfxPanel
        src="/gfx/r6/breach-ready.jpg"
        alt="R6 Security Department breach response stack"
        eyebrow="05 · Breach response"
        title="When containment slips"
        text="Security answers the alarm: hold corridors, protect staff, restore control so Foundation containment can resume. Armed site response — not Mobile Task Forces unless a subdivision’s own charter says otherwise."
      />

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
              text: "Personnel under Site Command — rank, subdivision, and tenure.",
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
