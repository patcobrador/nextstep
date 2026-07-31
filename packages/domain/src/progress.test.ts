import { describe, expect, it } from "vitest";

import {
  applyAssessmentOutcome,
  evaluatePracticeProgress,
} from "./progress.js";

const checkpointRule = {
  minimumCompletedSessions: 3,
  minimumCalendarSpanDays: 5,
  requiredSuccessfulAttempts: 2,
  requiresEvidence: true,
  revisitAfterDays: 28,
};

describe("progress evaluation", () => {
  it("preserves the configured multi-day checkpoint rule", () => {
    const result = evaluatePracticeProgress("ACTIVE", checkpointRule, [
      {
        sessionId: "session-1",
        completedAt: new Date("2026-08-01T09:00:00.000Z"),
        successfulAttempts: 1,
        safetyFlag: false,
      },
      {
        sessionId: "session-2",
        completedAt: new Date("2026-08-03T09:00:00.000Z"),
        successfulAttempts: 0,
        safetyFlag: false,
      },
      {
        sessionId: "session-3",
        completedAt: new Date("2026-08-06T09:00:00.000Z"),
        successfulAttempts: 1,
        safetyFlag: false,
      },
    ]);

    expect(result.state).toBe("EVIDENCE_PENDING");
    expect(result.changed).toBe(true);
  });

  it("does not count a replayed session twice", () => {
    const repeated = {
      sessionId: "session-1",
      completedAt: new Date("2026-08-01T09:00:00.000Z"),
      successfulAttempts: 2,
      safetyFlag: false,
    };
    const result = evaluatePracticeProgress("ACTIVE", checkpointRule, [
      repeated,
      repeated,
    ]);

    expect(result.state).toBe("ACTIVE");
    expect(result.explanation).toContain(
      "Complete 2 more qualifying practice session(s).",
    );
  });

  it("never advances from a safety-flagged session", () => {
    const result = evaluatePracticeProgress("ACTIVE", checkpointRule, [
      {
        sessionId: "unsafe-session",
        completedAt: new Date("2026-08-06T09:00:00.000Z"),
        successfulAttempts: 10,
        safetyFlag: true,
      },
    ]);

    expect(result.state).toBe("ACTIVE");
  });

  it("distinguishes pass, retry and unassessable evidence", () => {
    expect(applyAssessmentOutcome("REVIEW_PENDING", "PASS").state).toBe(
      "MASTERED",
    );
    expect(applyAssessmentOutcome("REVIEW_PENDING", "RETRY").state).toBe(
      "NEEDS_WORK",
    );
    expect(
      applyAssessmentOutcome("REVIEW_PENDING", "UNABLE_TO_ASSESS").state,
    ).toBe("EVIDENCE_PENDING");
  });
});
