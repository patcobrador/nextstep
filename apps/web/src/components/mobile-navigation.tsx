"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNavigation({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const items = [
    ["Dashboard", `/athletes/${athleteId}`],
    ["Skill tree", `/athletes/${athleteId}/skill-tree`],
    ["Practice", `/athletes/${athleteId}/practice`],
    ["Passport", `/athletes/${athleteId}/passport`],
  ] as const;
  return (
    <div className="mobile-navigation">
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">☰</span> Menu
      </button>
      {open ? (
        <nav id="mobile-navigation-menu" aria-label="Mobile primary">
          {items.map(([label, href]) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
