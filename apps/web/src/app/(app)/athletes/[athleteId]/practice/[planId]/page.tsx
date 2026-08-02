import { startPractice } from "../../../../../actions/practice";
import { PracticeRunner } from "../../../../../../components/practice-runner";
import { api } from "../../../../../../lib/api";

export const metadata = { title: "Guided Practice" };

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string; planId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { athleteId, planId } = await params;
  const { session: sessionId } = await searchParams;
  const plan = await api.practicePlan(planId);
  if (sessionId) {
    const session = await api.practiceSession(sessionId);
    return (
      <PracticeRunner athleteId={athleteId} plan={plan} session={session} />
    );
  }
  return (
    <div className="page-stack practice-overview">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Prescribed practice</p>
          <h1>{plan.title}</h1>
        </div>
        <span>{plan.targetDurationMinutes} min</span>
      </header>
      <p className="lead-copy">{plan.purpose}</p>
      <section className="surface-card">
        <h2>Today’s guided steps</h2>
        <ol className="practice-step-list">
          {plan.steps.map((step) => (
            <li key={step.id}>
              <span>{step.sequence}</span>
              <div>
                <strong>{step.title}</strong>
                <small>
                  {step.targetRepetitions
                    ? `${step.targetRepetitions} repetitions`
                    : step.targetDurationSeconds
                      ? `${Math.ceil(step.targetDurationSeconds / 60)} minutes`
                      : "Guided step"}
                </small>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="safety-callout">
        <strong>Before starting</strong> Use a dry, clear surface. Stop if pain
        occurs.
      </p>
      <form action={startPractice.bind(null, athleteId, planId)}>
        <button className="button button-primary button-large" type="submit">
          {plan.status === "STARTED"
            ? "Resume practice"
            : "Begin guided practice"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
