import type { components } from "@nextstep/contracts";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { clearLocalPersona, localAuthEnabled } from "../lib/local-auth";
import { MobileNavigation } from "./mobile-navigation";

export function ApplicationShell({
  user,
  athletes,
  athleteId,
  children,
}: {
  user: components["schemas"]["CurrentUser"];
  athletes: components["schemas"]["Athlete"][];
  athleteId: string;
  children: ReactNode;
}) {
  const athlete = athletes.find(({ id }) => id === athleteId);
  async function signOut() {
    "use server";
    await clearLocalPersona();
    redirect("/local-auth");
  }
  const links = [
    ["Dashboard", `/athletes/${athleteId}`],
    ["Skill Tree", `/athletes/${athleteId}/skill-tree`],
    ["Practice", `/athletes/${athleteId}/practice`],
    ["Passport", `/athletes/${athleteId}/passport`],
  ] as const;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="side-navigation">
        <Link
          href={`/athletes/${athleteId}`}
          className="brand-link"
          aria-label="NextStep dashboard"
        >
          <Image
            src="/brand/nextstep-logo.png"
            alt="NextStep Sports"
            width={112}
            height={112}
            priority
          />
        </Link>
        <nav aria-label="Primary">
          {links.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-footer">
          <span>{user.displayName ?? "Parent"}</span>
          {localAuthEnabled() ? (
            <form action={signOut}>
              <button className="text-button" type="submit">
                Switch persona
              </button>
            </form>
          ) : null}
        </div>
      </aside>
      <div className="shell-content">
        <header className="top-bar">
          <Link href={`/athletes/${athleteId}`} className="mobile-brand">
            <Image
              src="/brand/nextstep-logo.png"
              alt="NextStep Sports"
              width={52}
              height={52}
            />
          </Link>
          <div className="athlete-context">
            <span className="context-label">Athlete</span>
            {athletes.length > 1 ? (
              <details className="athlete-switcher">
                <summary>{athlete?.displayName ?? "Choose athlete"}</summary>
                <div>
                  {athletes.map((item) => (
                    <Link href={`/athletes/${item.id}`} key={item.id}>
                      {item.displayName}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <strong>{athlete?.displayName ?? "Athlete"}</strong>
            )}
          </div>
          <MobileNavigation athleteId={athleteId} />
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
