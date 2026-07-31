import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./styles.css";

export const metadata: Metadata = {
  title: "Next Step Sports",
  description: "A private, guided youth basketball development pathway.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="app-shell">
          <header className="brand-bar">
            <Link href="/" className="brand" aria-label="Next Step dashboard">
              <span aria-hidden="true">↗</span> Next Step
            </Link>
            <span className="athlete-chip">Mason · Foundation</span>
          </header>
          <nav aria-label="Primary" className="primary-nav">
            <Link href="/">Dashboard</Link>
            <Link href="/skill-tree">Skill Tree &amp; Progress</Link>
            <Link href="/practice">Practice</Link>
          </nav>
          <main id="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
