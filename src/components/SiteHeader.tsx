import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/roster", label: "Roster" },
  { href: "/subdivisions/general-corps", label: "Subdivisions" },
  { href: "/records", label: "Records" },
  { href: "/admin-logs", label: "Admin Logs" },
  { href: "/awards", label: "Medals" },
  { href: "/past-chiefs", label: "Past Chiefs" },
  { href: "/discharged", label: "Discharged" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-brand">
          <Image
            src="/brand/sd-logo.png"
            alt=""
            width={40}
            height={40}
            className="site-brand__logo"
            priority
          />
          <span className="site-brand__text">
            <span className="site-brand__org">SCPF</span>
            <span className="site-brand__dept">Security Department</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="site-nav__link">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
