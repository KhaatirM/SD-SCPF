import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberRow } from "@/components/MemberRow";
import { listBySubdivision } from "@/lib/queries";
import { SUBDIVISIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sub = SUBDIVISIONS.find((s) => s.slug === slug);
  return { title: sub?.name || "Subdivision" };
}

export default async function SubdivisionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sub = SUBDIVISIONS.find((s) => s.slug === slug);
  if (!sub) notFound();
  const members = await listBySubdivision(sub.match);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero__inner">
          <p className="section__eyebrow">Subdivisions</p>
          <h1 className="section__title">{sub.name}</h1>
          <p className="section__lede">{sub.blurb}</p>
          <nav style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {SUBDIVISIONS.map((s) => (
              <Link
                key={s.slug}
                href={`/subdivisions/${s.slug}`}
                className="btn"
                style={
                  s.slug === slug
                    ? { borderColor: "var(--accent)", color: "var(--accent)" }
                    : undefined
                }
              >
                {s.short}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <section className="section">
        {slug === "scu" ? (
          <div className="notice">
            The Specialized Control Unit sheet in the source workbook is empty.
            This board is derived from administrative logs and leadership
            listings where possible — confirm and expand with the department.
          </div>
        ) : null}
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
            <div className="empty">No active members listed for this unit.</div>
          ) : (
            members.map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </div>
        <p className="muted" style={{ marginTop: "1rem" }}>
          {members.length} active
        </p>
      </section>
    </>
  );
}
