import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="page-grid">
      <section className="hero-card" aria-labelledby="next-action-heading">
        <p className="eyebrow">Your next step</p>
        <h1 id="next-action-heading">Build control with both hands</h1>
        <p>
          A guided 20-minute Foundation practice with clear parent and athlete
          cues.
        </p>
        <Link className="primary-action" href="/practice">
          Start practice <span aria-hidden="true">→</span>
        </Link>
      </section>
      <section className="summary-card" aria-labelledby="pathway-heading">
        <p className="eyebrow">Current campaign</p>
        <h2 id="pathway-heading">Control First</h2>
        <dl>
          <div>
            <dt>Practices this week</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Next checkpoint</dt>
            <dd>Both Hands Check</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Practising</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
