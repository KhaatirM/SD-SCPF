"use client";

import dynamic from "next/dynamic";

const ScrollSdFigure = dynamic(() => import("./ScrollSdFigure"), {
  ssr: false,
  loading: () => (
    <section className="scroll-stage scroll-stage--loading" aria-hidden>
      <div className="scroll-stage__sticky">
        <div className="scroll-stage__fallback" />
        <div className="scroll-stage__hud">
          <p className="scroll-stage__eyebrow">Loading operative sequence</p>
        </div>
      </div>
    </section>
  ),
});

/** Client boundary so `dynamic(..., { ssr: false })` stays off the server graph. */
export function HomeScrollExperience() {
  return <ScrollSdFigure />;
}
