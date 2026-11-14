"use client";

import { useEffect, useRef, useState } from "react";
import { SdFigureCanvas } from "./SdFigureCanvas";

const BEATS = [
  {
    id: "formation",
    at: 0.08,
    code: "01",
    title: "Formation",
    text: "Standard Security Department posture — quiet, present, ready.",
  },
  {
    id: "training",
    at: 0.32,
    code: "02",
    title: "Training",
    text: "Drill until the response is muscle, not debate.",
  },
  {
    id: "pursuit",
    at: 0.55,
    code: "03",
    title: "Pursuit",
    text: "When the line moves, the Department moves with it.",
  },
  {
    id: "breach",
    at: 0.82,
    code: "04",
    title: "Breach response",
    text: "Contain. Suppress. Hold the dark so others keep the light.",
  },
];

function nearestBeat(progress: number) {
  let best = BEATS[0];
  let bestDist = Infinity;
  for (const beat of BEATS) {
    const d = Math.abs(progress - beat.at);
    if (d < bestDist) {
      best = beat;
      bestDist = d;
    }
  }
  return best;
}

export default function ScrollSdFigure() {
  const trackRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 720px)");
    const apply = () => setReduced(mq.matches || narrow.matches);
    apply();
    mq.addEventListener("change", apply);
    narrow.addEventListener("change", apply);
    setReady(true);
    return () => {
      mq.removeEventListener("change", apply);
      narrow.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const raw = total > 0 ? -rect.top / total : 0;
      const next = Math.min(1, Math.max(0, raw));
      progressRef.current = next;
      setProgress(next);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const beat = nearestBeat(progress);

  return (
    <section
      ref={trackRef}
      className="scroll-stage"
      aria-label="Security Department operative scroll sequence"
    >
      <div className="scroll-stage__sticky">
        <div className="scroll-stage__atmosphere" aria-hidden />
        {ready ? (
          <div className="scroll-stage__canvas-wrap">
            <SdFigureCanvas progressRef={progressRef} reduced={reduced} />
          </div>
        ) : (
          <div className="scroll-stage__fallback" aria-hidden />
        )}

        <div className="scroll-stage__hud">
          <p className="scroll-stage__eyebrow">Operative cycle · SD standard</p>
          <div className="scroll-stage__beat" key={beat.id}>
            <span className="scroll-stage__code">Beat {beat.code}</span>
            <h2 className="scroll-stage__title">{beat.title}</h2>
            <p className="scroll-stage__text">{beat.text}</p>
          </div>
          <div
            className="scroll-stage__meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Scroll sequence progress"
          >
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          <ol className="scroll-stage__toc">
            {BEATS.map((item) => (
              <li
                key={item.id}
                className={
                  item.id === beat.id
                    ? "scroll-stage__toc-item is-active"
                    : "scroll-stage__toc-item"
                }
              >
                {item.title}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
