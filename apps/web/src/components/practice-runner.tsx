"use client";

import type { components } from "@nextstep/contracts";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { completePractice, savePracticeStep } from "../app/actions/practice";

type Plan = components["schemas"]["PracticePlan"];
type Session = components["schemas"]["PracticeSessionDetail"];

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

export function PracticeRunner({
  athleteId,
  plan,
  session,
}: {
  athleteId: string;
  plan: Plan;
  session: Session;
}) {
  const attempted = useMemo(
    () => new Set(session.attempts.map(({ planStepId }) => planStepId)),
    [session.attempts],
  );
  const initial = Math.min(
    plan.steps.findIndex(({ id }) => !attempted.has(id)),
    plan.steps.length - 1,
  );
  const [index, setIndex] = useState(
    initial < 0 ? plan.steps.length - 1 : initial,
  );
  const [enjoyment, setEnjoyment] = useState(4);
  const [difficulty, setDifficulty] = useState(3);
  const [saved, setSaved] = useState(attempted);
  const [pending, startTransition] = useTransition();
  const step = plan.steps[index]!;
  const instructions = strings(step.content["instructions"]);
  const childCues = strings(step.content["childCues"]);
  const parentCues = strings(step.content["parentCues"]);
  const allSaved = plan.steps.every(({ id }) => saved.has(id));

  const next = () =>
    startTransition(async () => {
      if (!saved.has(step.id)) {
        await savePracticeStep(session.id, step);
        setSaved((prior) => new Set(prior).add(step.id));
      }
      if (index < plan.steps.length - 1) setIndex(index + 1);
    });

  const leave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      saved.size > 0 &&
      !window.confirm(
        "Leave this practice? Your completed steps are saved and you can resume later.",
      )
    )
      event.preventDefault();
  };

  return (
    <section className="practice-runner" aria-labelledby="practice-step-title">
      <header className="runner-header">
        <div>
          <p className="eyebrow">Guided practice</p>
          <strong>{plan.title}</strong>
        </div>
        <span aria-label={`Step ${index + 1} of ${plan.steps.length}`}>
          {index + 1} / {plan.steps.length}
        </span>
      </header>
      <div className="step-progress" aria-hidden="true">
        <span
          style={{ width: `${((index + 1) / plan.steps.length) * 100}%` }}
        />
      </div>
      <div className="runner-content">
        <p className="step-type">
          {step.type.toLowerCase().replaceAll("_", " ")}
        </p>
        <h1 id="practice-step-title">{step.title}</h1>
        <p className="practice-target">
          {step.targetRepetitions
            ? `${step.targetRepetitions} repetitions`
            : step.targetDurationSeconds
              ? `${Math.ceil(step.targetDurationSeconds / 60)} minutes`
              : "Complete this guided step"}
        </p>
        {instructions.length ? (
          <ol className="instruction-list">
            {instructions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        ) : (
          <p>
            {String(
              step.content["purpose"] ??
                "Follow the coaching cues and move with control.",
            )}
          </p>
        )}
        <div className="cue-grid">
          <section>
            <h2>Athlete cues</h2>
            {childCues.length ? (
              <ul>
                {childCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            ) : (
              <p>Stay balanced and in control.</p>
            )}
          </section>
          <section>
            <h2>Parent cues</h2>
            {parentCues.length ? (
              <ul>
                {parentCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            ) : (
              <p>Give one clear cue at a time.</p>
            )}
          </section>
        </div>
      </div>
      {index === plan.steps.length - 1 && allSaved ? (
        <div className="practice-reflection">
          <h2>Finish and save</h2>
          <label>
            Enjoyment{" "}
            <select
              value={enjoyment}
              onChange={(event) => setEnjoyment(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
          <label>
            Difficulty{" "}
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
          <button
            className="button button-primary"
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                completePractice(
                  athleteId,
                  plan.id,
                  session.id,
                  enjoyment,
                  difficulty,
                ),
              )
            }
          >
            {pending ? "Saving…" : "Complete practice"}
          </button>
        </div>
      ) : null}
      <footer className="runner-controls">
        <Link
          href={`/athletes/${athleteId}`}
          className="text-link"
          onClick={leave}
        >
          Leave practice
        </Link>
        <div>
          <button
            className="button button-secondary"
            type="button"
            disabled={index === 0 || pending}
            onClick={() => setIndex(index - 1)}
          >
            Previous
          </button>
          <button
            className="button button-primary"
            type="button"
            disabled={
              pending || (index === plan.steps.length - 1 && saved.has(step.id))
            }
            onClick={next}
          >
            {pending ? "Saving…" : saved.has(step.id) ? "Next" : "Save & next"}
          </button>
        </div>
      </footer>
    </section>
  );
}
