import Image from "next/image";
import Link from "next/link";

export function HomeHero() {
  return (
    <section className="hero">
      <div className="hero__atmosphere" aria-hidden />
      <div className="hero__content">
        <div className="hero__brand-lockup">
          <Image
            src="/brand/sd-logo.png"
            alt="SCP Foundation Security Department emblem"
            width={220}
            height={220}
            priority
            className="hero__logo"
          />
          <h1 className="hero__brand">
            <span>SCP Foundation</span>
            Security Department
          </h1>
        </div>
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
          <Link className="btn" href="#operative-cycle">
            Watch the cycle
          </Link>
        </div>
      </div>
    </section>
  );
}
