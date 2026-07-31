import { describe, expect, it } from "vitest";

import { WalkingSkeleton } from "./walking-skeleton.js";

describe("complete parent-to-passport walking skeleton", () => {
  it("unlocks progression and projects one private passport event", () => {
    const flow = new WalkingSkeleton();
    let sequence = 0;
    const context = (idempotencyKey: string, now: string) => ({
      actorId: "parent-1",
      correlationId: "correlation-1",
      idempotencyKey,
      now: new Date(now),
      nextId: (kind: string) => `${kind}-${++sequence}`,
    });

    flow.createAthlete(
      {
        athleteId: "athlete-1",
        householdId: "household-1",
        displayName: "Mason",
      },
      context("create-athlete", "2026-08-01T09:00:00.000Z"),
    );
    flow.assignFoundationCampaign(
      context("baseline", "2026-08-01T09:05:00.000Z"),
    );
    flow.completePractice(
      { sessionId: "session-1", successfulAttempts: 1 },
      context("practice-1", "2026-08-01T09:30:00.000Z"),
    );
    flow.completePractice(
      { sessionId: "session-2", successfulAttempts: 0 },
      context("practice-2", "2026-08-03T09:30:00.000Z"),
    );
    const practiceResult = flow.completePractice(
      { sessionId: "session-3", successfulAttempts: 1 },
      context("practice-3", "2026-08-06T09:30:00.000Z"),
    );
    expect(practiceResult.athlete.checkpointState).toBe("EVIDENCE_PENDING");

    flow.submitEvidence(
      {
        evidenceId: "evidence-1",
        consentRecordId: "consent-1",
        assignedCoachId: "coach-1",
      },
      context("evidence-1", "2026-08-06T10:00:00.000Z"),
    );
    const assigned = flow
      .snapshot()
      .events.find(({ eventType }) => eventType === "AssessmentAssigned");
    const assessmentId = String(assigned?.payload.assessmentId);
    const assessed = flow.completeAssessment(
      { assessmentId, outcome: "PASS" },
      context("assessment-decision-1", "2026-08-06T11:00:00.000Z"),
    );

    expect(assessed.athlete.checkpointState).toBe("MASTERED");
    expect(assessed.athlete.checkpointVerified).toBe(true);
    expect(assessed.athlete.availableNodeKeys).toEqual([
      "foundation.ball.moving-control",
    ]);
    expect(assessed.passport).toHaveLength(1);
    expect(assessed.passport[0]?.verified).toBe(true);

    const replayed = flow.completeAssessment(
      { assessmentId, outcome: "PASS" },
      context("assessment-decision-1", "2026-08-06T11:00:00.000Z"),
    );
    expect(replayed.passport).toHaveLength(1);
    expect(
      replayed.events.filter(
        ({ eventType }) => eventType === "AssessmentCompleted",
      ),
    ).toHaveLength(1);
  });
});
