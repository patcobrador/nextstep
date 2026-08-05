"use client";

import type { components } from "@nextstep/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { stateClass, stateLabel } from "./circular-skill-tree";

export function SkillDetailPanel({
  athleteId,
  skill,
}: {
  athleteId: string;
  skill: components["schemas"]["AthleteSkillDetail"];
}) {
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape")
        router.push(`/athletes/${athleteId}/skill-tree`);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [athleteId, router]);
  return (
    <aside className="skill-detail-panel" aria-labelledby="skill-detail-title">
      <Link
        className="panel-close"
        href={`/athletes/${athleteId}/skill-tree`}
        aria-label="Close skill details"
      >
        ×
      </Link>
      <p className="eyebrow">{skill.domainKey.replaceAll("-", " ")}</p>
      <h2 id="skill-detail-title" ref={heading} tabIndex={-1}>
        {skill.childName ?? skill.name}
      </h2>
      <p className={`state-badge ${stateClass(skill.presentationState)}`}>
        {stateLabel[skill.presentationState]}
      </p>
      <p className="skill-objective">{skill.objective}</p>
      <div className="detail-section">
        <h3>Why it matters</h3>
        <p>{skill.whyItMatters}</p>
      </div>
      {skill.childCues.length ? (
        <div className="detail-section">
          <h3>Coaching cues</h3>
          <ul>
            {skill.childCues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {skill.presentationState === "CURRENT" ? (
        <div className="current-guidance">
          <h3>
            {skill.state === "EVIDENCE_PENDING"
              ? "Evidence is the next step"
              : skill.state === "REVIEW_PENDING"
                ? "Review is pending"
                : "This is the prescribed focus"}
          </h3>
          <p>
            {skill.state === "EVIDENCE_PENDING"
              ? "Practice requirements are complete. Upload or continue the private evidence submission to move forward."
              : skill.state === "REVIEW_PENDING"
                ? "No new practice is required while the private submission waits for assignment or review."
                : "The pathway has selected this step as the athlete's work right now."}
          </p>
        </div>
      ) : null}
      {skill.presentationState === "UP_NEXT" ? (
        <div className="up-next-guidance">
          <h3>{skill.primaryAction.title}</h3>
          <p>{skill.primaryAction.description}</p>
        </div>
      ) : null}
      {skill.presentationState === "COMPLETED" ? (
        <div className="completion-guidance">
          <h3>Completed</h3>
          <p>This step is complete and recorded in the athlete's passport.</p>
        </div>
      ) : null}
      {skill.presentationState === "LOCKED" ? (
        <div className="lock-explanation">
          <h3>What comes first</h3>
          <p>{skill.whyLocked}</p>
          {(skill.remainingRequirements ?? []).map((requirement) => (
            <span key={requirement}>○ {requirement}</span>
          ))}
        </div>
      ) : null}
      {skill.safety.length ? (
        <div className="detail-section">
          <h3>Practise safely</h3>
          <ul>
            {skill.safety.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {skill.primaryAction.type !== "REST" ? (
        <Link
          className="button button-primary full-button"
          href={skill.primaryAction.destination}
        >
          {skill.primaryAction.ctaLabel}
        </Link>
      ) : (
        <p className="next-action-note">
          <strong>{skill.primaryAction.title}</strong>
          <br />
          {skill.primaryAction.description}
        </p>
      )}
    </aside>
  );
}
