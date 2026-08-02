"use server";

import type { components } from "@nextstep/contracts";
import { redirect } from "next/navigation";

import { api } from "../../lib/api";

export async function startPractice(athleteId: string, planId: string) {
  const session = await api.startSession(planId);
  redirect(`/athletes/${athleteId}/practice/${planId}?session=${session.id}`);
}

export async function savePracticeStep(
  sessionId: string,
  step: components["schemas"]["PracticePlanStep"],
) {
  await api.recordAttempt(sessionId, {
    planStepId: step.id,
    attemptNumber: 1,
    resultType: step.resultType ?? "NONE",
    result: step.resultType === "OBSERVATION" ? "Completed with parent" : true,
    difficultyRating: 3,
    cueUnderstood: true,
    skipped: false,
    completedAt: new Date().toISOString(),
  });
}

export async function completePractice(
  athleteId: string,
  planId: string,
  sessionId: string,
  enjoymentRating: number,
  difficultyRating: number,
) {
  await api.completeSession(sessionId, {
    enjoymentRating,
    difficultyRating,
    safetyFlag: false,
    completedAt: new Date().toISOString(),
  });
  redirect(
    `/athletes/${athleteId}/practice/${planId}/complete?session=${sessionId}`,
  );
}
