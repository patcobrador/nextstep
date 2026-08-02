import Link from "next/link";

import { ProgressRing } from "../../../../components/progress-ring";
import { api } from "../../../../lib/api";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const [dashboard, tree, passport] = await Promise.all([
    api.dashboard(athleteId),
    api.skillTree(athleteId),
    api.passport(athleteId),
  ]);
  const focus =
    tree.nodes.find(({ state }) => state === "ACTIVE") ??
    tree.nodes.find(({ state }) => state === "AVAILABLE");
  const recent = passport.timeline
    .filter(({ eventType }) => eventType === "PRACTICE_COMPLETED")
    .slice(0, 3);
  const latest = passport.timeline[0];
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Parent dashboard</p>
          <h1>{dashboard.athlete.displayName}’s next step</h1>
        </div>
        <p>One clear pathway. One prescribed practice at a time.</p>
      </header>
      <section
        className="dashboard-hero"
        aria-labelledby="primary-action-title"
      >
        <div>
          <p className="eyebrow">Continue the pathway</p>
          <h2 id="primary-action-title">{dashboard.primaryAction.title}</h2>
          <p>{dashboard.primaryAction.description}</p>
          <Link
            className="button button-primary"
            href={dashboard.primaryAction.destination}
          >
            {dashboard.primaryAction.ctaLabel} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ProgressRing
          value={dashboard.campaign.progress}
          label={`${dashboard.campaign.name} pathway`}
        />
      </section>
      <div className="dashboard-grid">
        <section className="surface-card">
          <p className="eyebrow">Current campaign</p>
          <h2>{dashboard.campaign.name}</h2>
          <p>
            {Math.round(dashboard.campaign.progress * 100)}% of this pathway is
            complete.
          </p>
          {dashboard.campaign.nextMilestoneName ? (
            <p className="muted">
              Next milestone: {dashboard.campaign.nextMilestoneName}
            </p>
          ) : null}
        </section>
        <section className="surface-card">
          <p className="eyebrow">Current focus</p>
          <h2>{focus?.childName ?? focus?.name ?? "Pathway orientation"}</h2>
          <p>
            {focus
              ? `Status: ${focus.state.toLowerCase().replaceAll("_", " ")}`
              : "A new focus will appear when it is prescribed."}
          </p>
          {focus ? (
            <Link
              className="text-link"
              href={`/athletes/${athleteId}/skill-tree/${focus.id}`}
            >
              View skill details →
            </Link>
          ) : null}
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="surface-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Recent practice</p>
              <h2>Saved sessions</h2>
            </div>
            <span>{dashboard.weeklySummary.meaningfulPractices} this week</span>
          </div>
          {recent.length ? (
            <ol className="activity-list">
              {recent.map((event) => (
                <li key={event.id}>
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>{event.title}</strong>
                    <time dateTime={event.occurredAt}>
                      {formatDate(event.occurredAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-copy">Completed practices will appear here.</p>
          )}
        </section>
        <section className="surface-card">
          <p className="eyebrow">Latest passport activity</p>
          <h2>{latest?.title ?? "Your private timeline is ready"}</h2>
          <p>
            {latest?.summary ??
              "Campaign and practice milestones will be recorded here."}
          </p>
          {latest ? (
            <time dateTime={latest.occurredAt}>
              {formatDate(latest.occurredAt)}
            </time>
          ) : null}
          <br />
          <Link className="text-link" href={`/athletes/${athleteId}/passport`}>
            Open private passport →
          </Link>
        </section>
      </div>
    </div>
  );
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(new Date(value));
