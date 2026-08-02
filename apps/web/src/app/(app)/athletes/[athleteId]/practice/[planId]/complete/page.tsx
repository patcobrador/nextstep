import Link from "next/link";

import { api } from "../../../../../../../lib/api";

export const metadata = { title: "Practice Complete" };

export default async function PracticeCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string; planId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { athleteId, planId } = await params;
  const { session: sessionId } = await searchParams;
  const [plan, session, passport] = await Promise.all([
    api.practicePlan(planId),
    sessionId ? api.practiceSession(sessionId) : null,
    api.passport(athleteId),
  ]);
  return (
    <section className="completion-card">
      <div className="completion-mark" aria-hidden="true">
        ✓
      </div>
      <p className="eyebrow">Practice saved</p>
      <h1>{plan.title} complete</h1>
      <p>
        Every prescribed step has been recorded. This result will still be here
        after refresh or restart.
      </p>
      {session?.completedAt ? (
        <time dateTime={session.completedAt}>
          {new Intl.DateTimeFormat("en-AU", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Australia/Sydney",
          }).format(new Date(session.completedAt))}
        </time>
      ) : null}
      <div className="completion-actions">
        <Link
          className="button button-primary"
          href={`/athletes/${athleteId}/passport`}
        >
          View passport
        </Link>
        <Link
          className="button button-secondary"
          href={`/athletes/${athleteId}`}
        >
          Back to dashboard
        </Link>
      </div>
      <p className="muted">
        Latest passport activity:{" "}
        {passport.timeline[0]?.title ?? "Practice recorded"}
      </p>
    </section>
  );
}
