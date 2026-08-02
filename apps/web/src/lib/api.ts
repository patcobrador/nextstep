import "server-only";

import type { components } from "@nextstep/contracts";
import { redirect } from "next/navigation";

import { localAuthEnabled, localIdentity } from "./local-auth";

export class ApiProblem extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    detail: string,
    readonly correlationId?: string,
  ) {
    super(detail);
  }
}

const baseUrl = () =>
  process.env["NEXTSTEP_API_BASE_URL"] ??
  process.env["NEXT_PUBLIC_API_BASE_URL"] ??
  "http://127.0.0.1:3001/v1";

async function headers(extra?: HeadersInit): Promise<Headers> {
  const identity = await localIdentity();
  if (!identity) {
    if (localAuthEnabled()) redirect("/local-auth");
    throw new Error(
      "No configured identity adapter is available to the web application.",
    );
  }
  return new Headers({
    accept: "application/json",
    "x-actor-id": identity.actorId,
    "x-household-id": identity.householdId,
    ...Object.fromEntries(new Headers(extra).entries()),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: await headers(init?.headers),
    cache: "no-store",
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as Partial<
      components["schemas"]["Problem"]
    >;
    throw new ApiProblem(
      response.status,
      problem.title ?? "Request failed",
      problem.detail ?? "NextStep could not load this information.",
      typeof problem.correlationId === "string"
        ? problem.correlationId
        : undefined,
    );
  }
  return (await response.json()) as T;
}

export const api = {
  me: () => request<components["schemas"]["CurrentUser"]>("/me"),
  athletes: (householdId: string) =>
    request<components["schemas"]["Athlete"][]>(
      `/households/${householdId}/athletes`,
    ),
  athlete: (athleteId: string) =>
    request<components["schemas"]["Athlete"]>(`/athletes/${athleteId}`),
  dashboard: (athleteId: string) =>
    request<components["schemas"]["AthleteDashboard"]>(
      `/athletes/${athleteId}/dashboard`,
    ),
  skillTree: (athleteId: string) =>
    request<components["schemas"]["SkillTree"]>(
      `/athletes/${athleteId}/skill-tree`,
    ),
  skillDetail: (athleteId: string, nodeId: string) =>
    request<components["schemas"]["AthleteSkillDetail"]>(
      `/athletes/${athleteId}/skills/${nodeId}`,
    ),
  practicePlan: (planId: string) =>
    request<components["schemas"]["PracticePlan"]>(`/practice-plans/${planId}`),
  practiceSession: (sessionId: string) =>
    request<components["schemas"]["PracticeSessionDetail"]>(
      `/practice-sessions/${sessionId}`,
    ),
  passport: (athleteId: string) =>
    request<components["schemas"]["AthletePassport"]>(
      `/athletes/${athleteId}/passport`,
    ),
  startSession: (planId: string) =>
    request<components["schemas"]["PracticeSession"]>(
      `/practice-plans/${planId}/sessions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `web-start-${planId}`,
        },
        body: JSON.stringify({
          clientSessionId: `web-${planId}`,
          startedOffline: false,
        }),
      },
    ),
  recordAttempt: (
    sessionId: string,
    body: components["schemas"]["PracticeAttemptRequest"],
  ) =>
    request<components["schemas"]["PracticeAttempt"]>(
      `/practice-sessions/${sessionId}/attempts`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `web-attempt-${sessionId}-${body.planStepId}-${body.attemptNumber}`,
        },
        body: JSON.stringify(body),
      },
    ),
  completeSession: (
    sessionId: string,
    body: components["schemas"]["CompletePracticeSessionRequest"],
  ) =>
    request<components["schemas"]["PracticeCompletionResult"]>(
      `/practice-sessions/${sessionId}/complete`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `web-complete-${sessionId}`,
        },
        body: JSON.stringify(body),
      },
    ),
};
