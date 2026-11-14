import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "SD-SCPF · Security Department",
    template: "%s · SD-SCPF",
  },
  description:
    "Public Security Department records for SCPF — roster, discharges, subdivisions, awards, and administrative logs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="site-shell antialiased">
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
