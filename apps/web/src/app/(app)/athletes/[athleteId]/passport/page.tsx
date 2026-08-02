import Image from "next/image";

import { api } from "../../../../../lib/api";

export const metadata = { title: "Private Passport" };

export default async function PassportPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const passport = await api.passport(athleteId);
  const groups = passport.timeline.reduce((result, event) => {
    const month = new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
      timeZone: "Australia/Sydney",
    }).format(new Date(event.occurredAt));
    result.set(month, [...(result.get(month) ?? []), event]);
    return result;
  }, new Map<string, typeof passport.timeline>());
  return (
    <div className="page-stack">
      <header className="passport-heading">
        <div>
          <p className="eyebrow">Private athlete passport</p>
          <h1>{passport.athlete.displayName}’s journey</h1>
          <p>Visible only to authorised parents in this household.</p>
        </div>
        <Image src="/brand/nextstep-logo.png" alt="" width={96} height={96} />
      </header>
      {passport.timeline.length ? (
        <div
          className="timeline"
          role="region"
          aria-label="Athlete passport events"
        >
          {[...groups.entries()].map(([month, events]) => (
            <section
              key={month}
              aria-labelledby={`month-${month.replaceAll(" ", "-")}`}
            >
              <h2 id={`month-${month.replaceAll(" ", "-")}`}>{month}</h2>
              <ol>
                {events.map((event) => (
                  <li key={event.id} tabIndex={0}>
                    <span className="timeline-marker" aria-hidden="true">
                      {event.eventType === "PRACTICE_COMPLETED" ? "✓" : "○"}
                    </span>
                    <article>
                      <div>
                        <strong>{event.title}</strong>
                        {event.verified ? (
                          <span className="verified-badge">Verified</span>
                        ) : null}
                      </div>
                      {event.summary ? <p>{event.summary}</p> : null}
                      <time dateTime={event.occurredAt}>
                        {new Intl.DateTimeFormat("en-AU", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Australia/Sydney",
                        }).format(new Date(event.occurredAt))}
                      </time>
                    </article>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <section className="page-state">
          <Image src="/brand/nextstep-logo.png" alt="" width={72} height={72} />
          <h2>No passport activity yet</h2>
          <p>
            Campaign and practice events will appear here when they are
            persisted.
          </p>
        </section>
      )}
    </div>
  );
}
