import { Injectable, NotFoundException } from "@nestjs/common";
import { WalkingSkeleton, type WalkingSkeletonState } from "@nextstep/domain";

interface FlowRecord {
  flow: WalkingSkeleton;
  householdId: string;
  athleteId: string;
  assessmentId?: string;
  mediaReady: boolean;
}

@Injectable()
export class WalkingSkeletonService {
  readonly #flows = new Map<string, FlowRecord>();
  readonly #plans = new Map<string, string>();
  readonly #sessions = new Map<string, string>();
  readonly #media = new Map<string, string>();
  readonly #createdAthletes = new Map<string, string>();
  readonly #plansByRequest = new Map<string, string>();
  readonly #sessionsByRequest = new Map<string, string>();
  readonly #mediaByRequest = new Map<string, string>();
  #sequence = 0;

  createAthlete(input: {
    householdId: string;
    displayName: string;
    actorId: string;
    idempotencyKey: string;
  }): WalkingSkeletonState {
    const requestKey = `${input.actorId}:create-athlete:${input.idempotencyKey}`;
    const existingAthleteId = this.#createdAthletes.get(requestKey);
    if (existingAthleteId) return this.snapshot(existingAthleteId);

    const athleteId = this.#nextId("athlete");
    const flow = new WalkingSkeleton();
    const state = flow.createAthlete(
      {
        athleteId,
        householdId: input.householdId,
        displayName: input.displayName,
      },
      this.#context(input.actorId, input.idempotencyKey, new Date()),
    );
    this.#flows.set(athleteId, {
      flow,
      householdId: input.householdId,
      athleteId,
      mediaReady: false,
    });
    this.#createdAthletes.set(requestKey, athleteId);
    return state;
  }

  assertHousehold(athleteId: string, householdId: string): void {
    const record = this.#record(athleteId);
    if (record.householdId !== householdId) {
      throw new NotFoundException("Athlete was not found.");
    }
  }

  assertPlanHousehold(planId: string, householdId: string): void {
    const athleteId = this.#plans.get(planId);
    if (!athleteId) throw new NotFoundException("Practice plan was not found.");
    this.assertHousehold(athleteId, householdId);
  }

  assertSessionHousehold(sessionId: string, householdId: string): void {
    const athleteId = this.#sessions.get(sessionId);
    if (!athleteId)
      throw new NotFoundException("Practice session was not found.");
    this.assertHousehold(athleteId, householdId);
  }

  assertMediaHousehold(mediaAssetId: string, householdId: string): void {
    const athleteId = this.#media.get(mediaAssetId);
    if (!athleteId) throw new NotFoundException("Media asset was not found.");
    this.assertHousehold(athleteId, householdId);
  }

  baseline(
    athleteId: string,
    actorId: string,
    idempotencyKey: string,
  ): WalkingSkeletonState {
    return this.#record(athleteId).flow.assignFoundationCampaign(
      this.#context(actorId, idempotencyKey, new Date()),
    );
  }

  generatePlan(input: {
    athleteId: string;
    actorId: string;
    idempotencyKey: string;
  }): {
    id: string;
    athleteId: string;
    status: string;
  } {
    this.#record(input.athleteId);
    const requestKey = `${input.actorId}:generate-plan:${input.idempotencyKey}`;
    const existingId = this.#plansByRequest.get(requestKey);
    if (existingId)
      return {
        id: existingId,
        athleteId: input.athleteId,
        status: "GENERATED",
      };
    const id = this.#nextId("plan");
    this.#plans.set(id, input.athleteId);
    this.#plansByRequest.set(requestKey, id);
    return { id, athleteId: input.athleteId, status: "GENERATED" };
  }

  startSession(input: {
    planId: string;
    actorId: string;
    idempotencyKey: string;
  }): {
    id: string;
    athleteId: string;
    status: string;
  } {
    const athleteId = this.#plans.get(input.planId);
    if (!athleteId) throw new NotFoundException("Practice plan was not found.");
    const requestKey = `${input.actorId}:start-session:${input.idempotencyKey}`;
    const existingId = this.#sessionsByRequest.get(requestKey);
    if (existingId) return { id: existingId, athleteId, status: "IN_PROGRESS" };
    const id = this.#nextId("session");
    this.#sessions.set(id, athleteId);
    this.#sessionsByRequest.set(requestKey, id);
    return { id, athleteId, status: "IN_PROGRESS" };
  }

  completePractice(input: {
    actorId: string;
    idempotencyKey: string;
    sessionId: string;
    completedAt: Date;
    successfulAttempts: number;
    safetyFlag: boolean;
  }): WalkingSkeletonState {
    const athleteId = this.#sessions.get(input.sessionId);
    if (!athleteId)
      throw new NotFoundException("Practice session was not found.");
    return this.#record(athleteId).flow.completePractice(
      {
        sessionId: input.sessionId,
        successfulAttempts: input.successfulAttempts,
        safetyFlag: input.safetyFlag,
      },
      this.#context(input.actorId, input.idempotencyKey, input.completedAt),
    );
  }

  createUploadIntent(input: {
    athleteId: string;
    actorId: string;
    idempotencyKey: string;
  }): {
    mediaAssetId: string;
    uploadUrl: string;
    expiresAt: string;
    requiredHeaders: Record<string, string>;
  } {
    this.#record(input.athleteId);
    const requestKey = `${input.actorId}:upload-intent:${input.idempotencyKey}`;
    const existingId = this.#mediaByRequest.get(requestKey);
    const mediaAssetId = existingId ?? this.#nextId("media");
    if (!existingId) {
      this.#media.set(mediaAssetId, input.athleteId);
      this.#mediaByRequest.set(requestKey, mediaAssetId);
    }
    return {
      mediaAssetId,
      uploadUrl: `http://127.0.0.1:9000/private-evidence/${mediaAssetId}`,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      requiredHeaders: { "content-type": "video/mp4" },
    };
  }

  completeUpload(mediaAssetId: string): {
    id: string;
    athleteId: string;
    status: string;
  } {
    const athleteId = this.#media.get(mediaAssetId);
    if (!athleteId) throw new NotFoundException("Media asset was not found.");
    this.#record(athleteId).mediaReady = true;
    return { id: mediaAssetId, athleteId, status: "READY" };
  }

  submitEvidence(input: {
    athleteId: string;
    actorId: string;
    idempotencyKey: string;
    evidenceId: string;
    consentRecordId: string;
    assignedCoachId: string;
  }): WalkingSkeletonState {
    const record = this.#record(input.athleteId);
    if (!record.mediaReady)
      throw new Error("Media must be READY before evidence submission.");
    const state = record.flow.submitEvidence(
      {
        evidenceId: input.evidenceId,
        consentRecordId: input.consentRecordId,
        assignedCoachId: input.assignedCoachId,
      },
      this.#context(input.actorId, input.idempotencyKey, new Date()),
    );
    const assigned = state.events.find(
      ({ eventType }) => eventType === "AssessmentAssigned",
    );
    record.assessmentId = String(
      (assigned?.payload as { assessmentId?: string }).assessmentId,
    );
    return state;
  }

  coachQueue(
    coachId: string,
  ): Array<{ assessmentId: string; athleteId: string }> {
    return [...this.#flows.values()].flatMap((record) => {
      const assigned = record.flow
        .snapshot()
        .events.find(
          ({ eventType, payload }) =>
            eventType === "AssessmentAssigned" &&
            (payload as { coachId?: string }).coachId === coachId,
        );
      return assigned && record.assessmentId
        ? [{ assessmentId: record.assessmentId, athleteId: record.athleteId }]
        : [];
    });
  }

  assess(input: {
    assessmentId: string;
    actorId: string;
    idempotencyKey: string;
    outcome: "PASS" | "RETRY" | "UNABLE_TO_ASSESS";
  }): WalkingSkeletonState {
    const record = [...this.#flows.values()].find(
      ({ assessmentId }) => assessmentId === input.assessmentId,
    );
    if (!record) throw new NotFoundException("Assessment was not found.");
    const assignment = record.flow
      .snapshot()
      .events.find(({ eventType }) => eventType === "AssessmentAssigned");
    if (
      (assignment?.payload as { coachId?: string }).coachId !== input.actorId
    ) {
      throw new NotFoundException("Assessment was not found.");
    }
    return record.flow.completeAssessment(
      { assessmentId: input.assessmentId, outcome: input.outcome },
      this.#context(input.actorId, input.idempotencyKey, new Date()),
    );
  }

  passport(athleteId: string): WalkingSkeletonState["passport"] {
    return this.#record(athleteId).flow.snapshot().passport;
  }

  snapshot(athleteId: string): WalkingSkeletonState {
    return this.#record(athleteId).flow.snapshot();
  }

  #record(athleteId: string): FlowRecord {
    const record = this.#flows.get(athleteId);
    if (!record) throw new NotFoundException("Athlete was not found.");
    return record;
  }

  #context(actorId: string, idempotencyKey: string, now: Date) {
    return {
      actorId,
      correlationId: this.#nextId("correlation"),
      idempotencyKey,
      now,
      nextId: (kind: string) => this.#nextId(kind),
    };
  }

  #nextId(kind: string): string {
    return `${kind}-${++this.#sequence}`;
  }
}
