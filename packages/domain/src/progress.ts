export const progressStates = [
  "LOCKED",
  "AVAILABLE",
  "ACTIVE",
  "PRACTICE_COMPLETE",
  "EVIDENCE_PENDING",
  "REVIEW_PENDING",
  "NEEDS_WORK",
  "MASTERED",
  "REVISIT_DUE",
  "ARCHIVED",
] as const;

export type ProgressState = (typeof progressStates)[number];

export interface CompletionRule {
  minimumCompletedSessions: number;
  minimumCalendarSpanDays: number;
  requiredSuccessfulAttempts: number;
  requiresEvidence: boolean;
  revisitAfterDays: number;
}

export interface QualifyingPractice {
  sessionId: string;
  completedAt: Date;
  successfulAttempts: number;
  safetyFlag: boolean;
}

export interface ProgressEvaluation {
  state: ProgressState;
  changed: boolean;
  explanation: string[];
  revisitDueAt?: Date;
}

const calendarDay = (value: Date): number =>
  Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

export function evaluatePracticeProgress(
  currentState: ProgressState,
  rule: CompletionRule,
  practices: readonly QualifyingPractice[],
): ProgressEvaluation {
  const uniqueSessions = new Map(
    practices.map((practice) => [practice.sessionId, practice]),
  );
  const safePractices = [...uniqueSessions.values()].filter(
    (practice) => !practice.safetyFlag,
  );
  const ordered = safePractices.toSorted(
    (left, right) => left.completedAt.getTime() - right.completedAt.getTime(),
  );
  const successfulAttempts = ordered.reduce(
    (total, practice) => total + practice.successfulAttempts,
    0,
  );
  const spanDays =
    ordered.length < 2
      ? 0
      : Math.floor(
          (calendarDay(ordered.at(-1)!.completedAt) -
            calendarDay(ordered[0]!.completedAt)) /
            86_400_000,
        );

  const explanation: string[] = [];
  if (ordered.length < rule.minimumCompletedSessions) {
    explanation.push(
      `Complete ${rule.minimumCompletedSessions - ordered.length} more qualifying practice session(s).`,
    );
  }
  if (spanDays < rule.minimumCalendarSpanDays) {
    explanation.push(
      `Continue practice across ${rule.minimumCalendarSpanDays - spanDays} more calendar day(s).`,
    );
  }
  if (successfulAttempts < rule.requiredSuccessfulAttempts) {
    explanation.push(
      `Record ${rule.requiredSuccessfulAttempts - successfulAttempts} more successful attempt(s).`,
    );
  }

  if (explanation.length > 0) {
    const nextState: ProgressState =
      ordered.length > 0 ? "ACTIVE" : currentState;
    return {
      state: nextState,
      changed: nextState !== currentState,
      explanation,
    };
  }

  const nextState: ProgressState = rule.requiresEvidence
    ? "EVIDENCE_PENDING"
    : "MASTERED";
  const mostRecent = ordered.at(-1)!.completedAt;
  return {
    state: nextState,
    changed: nextState !== currentState,
    explanation: rule.requiresEvidence
      ? ["Practice requirements met. Submit private evidence for review."]
      : ["Completion requirements met."],
    ...(nextState === "MASTERED"
      ? {
          revisitDueAt: new Date(
            mostRecent.getTime() + rule.revisitAfterDays * 86_400_000,
          ),
        }
      : {}),
  };
}

export type AssessmentOutcome = "PASS" | "RETRY" | "UNABLE_TO_ASSESS";

export function applyAssessmentOutcome(
  currentState: ProgressState,
  outcome: AssessmentOutcome,
): ProgressEvaluation {
  if (currentState !== "REVIEW_PENDING") {
    throw new Error(`Assessment cannot complete from ${currentState}.`);
  }
  if (outcome === "PASS") {
    return {
      state: "MASTERED",
      changed: true,
      explanation: ["Coach verified the configured rubric."],
    };
  }
  if (outcome === "RETRY") {
    return {
      state: "NEEDS_WORK",
      changed: true,
      explanation: ["Coach prescribed remediation before another submission."],
    };
  }
  return {
    state: "EVIDENCE_PENDING",
    changed: true,
    explanation: ["Evidence could not be assessed. Submit a replacement clip."],
  };
}
