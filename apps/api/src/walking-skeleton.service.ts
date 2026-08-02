import { randomUUID } from "node:crypto";

import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WalkingSkeleton, type WalkingSkeletonState } from "@nextstep/domain";

import {
  DevelopmentFlowRepository,
  type DurableFlowRecord,
  type IdempotentCommand,
} from "./development-flow.repository.js";

@Injectable()
export class WalkingSkeletonService {
  constructor(
    @Inject(DevelopmentFlowRepository)
    private readonly repository: DevelopmentFlowRepository,
  ) {}

  async createAthlete(input: {
    householdId: string;
    displayName: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<WalkingSkeletonState> {
    const command = this.#command(
      input.actorId,
      "create-athlete",
      input.idempotencyKey,
      input,
    );
    const replay = await this.repository.replay<WalkingSkeletonState>(command);
    if (replay) return replay;

    const athleteId = randomUUID();
    const flow = new WalkingSkeleton();
    const state = flow.createAthlete(
      {
        athleteId,
        householdId: input.householdId,
        displayName: input.displayName,
      },
      this.#context(input.actorId, input.idempotencyKey, new Date()),
    );
    const record: DurableFlowRecord = {
      athleteId,
      householdId: input.householdId,
      flow,
      adapter: { mediaReady: false },
      version: 1,
    };
    await this.repository.create(
      record,
      { command, response: state, events: state.events },
      input.displayName,
    );
    return state;
  }

  async assertHousehold(athleteId: string, householdId: string): Promise<void> {
    const record = await this.#record(athleteId);
    if (record.householdId !== householdId) {
      throw new NotFoundException("Athlete was not found.");
    }
  }

  async assertPlanHousehold(
    planId: string,
    householdId: string,
  ): Promise<void> {
    await this.#assertResourceHousehold(planId, "PLAN", householdId);
  }

  async assertSessionHousehold(
    sessionId: string,
    householdId: string,
  ): Promise<void> {
    await this.#assertResourceHousehold(sessionId, "SESSION", householdId);
  }

  async assertMediaHousehold(
    mediaAssetId: string,
    householdId: string,
  ): Promise<void> {
    await this.#assertResourceHousehold(mediaAssetId, "MEDIA", householdId);
  }

  async baseline(
    athleteId: string,
    actorId: string,
    idempotencyKey: string,
  ): Promise<WalkingSkeletonState> {
    const command = this.#command(actorId, "baseline", idempotencyKey, {
      athleteId,
    });
    const replay = await this.repository.replay<WalkingSkeletonState>(command);
    if (replay) return replay;
    const record = await this.#record(athleteId);
    const priorEventCount = record.flow.snapshot().events.length;
    const state = record.flow.assignFoundationCampaign(
      this.#context(actorId, idempotencyKey, new Date()),
    );
    await this.repository.save(record, {
      command,
      response: state,
      events: state.events.slice(priorEventCount),
    });
    return state;
  }

  async generatePlan(input: {
    athleteId: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{ id: string; athleteId: string; status: string }> {
    const command = this.#command(
      input.actorId,
      "generate-plan",
      input.idempotencyKey,
      input,
    );
    const replay = await this.repository.replay<{
      id: string;
      athleteId: string;
      status: string;
    }>(command);
    if (replay) return replay;
    const record = await this.#record(input.athleteId);
    const response = {
      id: randomUUID(),
      athleteId: input.athleteId,
      status: "GENERATED",
    };
    await this.repository.save(record, {
      command,
      response,
      events: [],
      resources: [{ id: response.id, type: "PLAN" }],
    });
    return response;
  }

  async startSession(input: {
    planId: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{ id: string; athleteId: string; status: string }> {
    const command = this.#command(
      input.actorId,
      "start-session",
      input.idempotencyKey,
      input,
    );
    const replay = await this.repository.replay<{
      id: string;
      athleteId: string;
      status: string;
    }>(command);
    if (replay) return replay;
    const record = await this.#resource(input.planId, "PLAN");
    const response = {
      id: randomUUID(),
      athleteId: record.athleteId,
      status: "IN_PROGRESS",
    };
    await this.repository.save(record, {
      command,
      response,
      events: [],
      resources: [{ id: response.id, type: "SESSION" }],
    });
    return response;
  }

  async completePractice(input: {
    actorId: string;
    idempotencyKey: string;
    sessionId: string;
    planId?: string;
    completedAt: Date;
    successfulAttempts: number;
    safetyFlag: boolean;
  }): Promise<WalkingSkeletonState> {
    const command = this.#command(
      input.actorId,
      "complete-practice",
      input.idempotencyKey,
      { ...input, completedAt: input.completedAt.toISOString() },
    );
    const replay = await this.repository.replay<WalkingSkeletonState>(command);
    if (replay) return replay;
    const record = await this.#resource(input.sessionId, "SESSION");
    const planId =
      input.planId ??
      (await this.repository.latestResource(input.sessionId, "PLAN"));
    const priorEventCount = record.flow.snapshot().events.length;
    const state = record.flow.completePractice(
      {
        planId,
        sessionId: input.sessionId,
        successfulAttempts: input.successfulAttempts,
        safetyFlag: input.safetyFlag,
      },
      this.#context(input.actorId, input.idempotencyKey, input.completedAt),
    );
    await this.repository.save(record, {
      command,
      response: state,
      events: state.events.slice(priorEventCount),
    });
    return state;
  }

  async createUploadIntent(input: {
    athleteId: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{
    mediaAssetId: string;
    uploadUrl: string;
    expiresAt: string;
    requiredHeaders: Record<string, string>;
  }> {
    const command = this.#command(
      input.actorId,
      "upload-intent",
      input.idempotencyKey,
      input,
    );
    type Response = {
      mediaAssetId: string;
      uploadUrl: string;
      expiresAt: string;
      requiredHeaders: Record<string, string>;
    };
    const replay = await this.repository.replay<Response>(command);
    if (replay) return replay;
    const record = await this.#record(input.athleteId);
    const mediaAssetId = randomUUID();
    const response: Response = {
      mediaAssetId,
      uploadUrl: `http://127.0.0.1:9000/private-evidence/${mediaAssetId}`,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      requiredHeaders: { "content-type": "video/mp4" },
    };
    await this.repository.save(record, {
      command,
      response,
      events: [],
      resources: [{ id: mediaAssetId, type: "MEDIA" }],
    });
    return response;
  }

  async completeUpload(input: {
    mediaAssetId: string;
    actorId: string;
    idempotencyKey: string;
  }): Promise<{ id: string; athleteId: string; status: string }> {
    const command = this.#command(
      input.actorId,
      "complete-upload",
      input.idempotencyKey,
      input,
    );
    const replay = await this.repository.replay<{
      id: string;
      athleteId: string;
      status: string;
    }>(command);
    if (replay) return replay;
    const record = await this.#resource(input.mediaAssetId, "MEDIA");
    record.adapter.mediaReady = true;
    const response = {
      id: input.mediaAssetId,
      athleteId: record.athleteId,
      status: "READY",
    };
    await this.repository.save(record, {
      command,
      response,
      events: [],
    });
    return response;
  }

  async submitEvidence(input: {
    athleteId: string;
    actorId: string;
    idempotencyKey: string;
    evidenceId: string;
    consentRecordId: string;
    assignedCoachId: string;
  }): Promise<WalkingSkeletonState> {
    const command = this.#command(
      input.actorId,
      "submit-evidence",
      input.idempotencyKey,
      input,
    );
    const replay = await this.repository.replay<WalkingSkeletonState>(command);
    if (replay) return replay;
    const record = await this.#record(input.athleteId);
    if (!record.adapter.mediaReady) {
      throw new Error("Media must be READY before evidence submission.");
    }
    const priorEventCount = record.flow.snapshot().events.length;
    const state = record.flow.submitEvidence(
      {
        evidenceId: input.evidenceId,
        consentRecordId: input.consentRecordId,
        assignedCoachId: input.assignedCoachId,
      },
      this.#context(input.actorId, input.idempotencyKey, new Date()),
    );
    const assigned = state.events.findLast(
      ({ eventType }) => eventType === "AssessmentAssigned",
    );
    const assessmentId = String(
      (assigned?.payload as { assessmentId?: string }).assessmentId,
    );
    record.adapter.assessmentId = assessmentId;
    await this.repository.save(record, {
      command,
      response: state,
      events: state.events.slice(priorEventCount),
      resources: [{ id: assessmentId, type: "ASSESSMENT" }],
    });
    return state;
  }

  async coachQueue(
    coachId: string,
  ): Promise<Array<{ assessmentId: string; athleteId: string }>> {
    const records = await this.repository.list();
    return records.flatMap((record) => {
      const assigned = record.flow
        .snapshot()
        .events.find(
          ({ eventType, payload }) =>
            eventType === "AssessmentAssigned" &&
            (payload as { coachId?: string }).coachId === coachId,
        );
      return assigned && record.adapter.assessmentId
        ? [
            {
              assessmentId: record.adapter.assessmentId,
              athleteId: record.athleteId,
            },
          ]
        : [];
    });
  }

  async assess(input: {
    assessmentId: string;
    actorId: string;
    idempotencyKey: string;
    outcome: "PASS" | "RETRY" | "UNABLE_TO_ASSESS";
  }): Promise<WalkingSkeletonState> {
    const command = this.#command(
      input.actorId,
      "assess-evidence",
      input.idempotencyKey,
      input,
    );
    const replay = await this.repository.replay<WalkingSkeletonState>(command);
    if (replay) return replay;
    const record = await this.#resource(input.assessmentId, "ASSESSMENT");
    const assignment = record.flow
      .snapshot()
      .events.find(({ eventType }) => eventType === "AssessmentAssigned");
    if (
      (assignment?.payload as { coachId?: string }).coachId !== input.actorId
    ) {
      throw new NotFoundException("Assessment was not found.");
    }
    const priorEventCount = record.flow.snapshot().events.length;
    const state = record.flow.completeAssessment(
      { assessmentId: input.assessmentId, outcome: input.outcome },
      this.#context(input.actorId, input.idempotencyKey, new Date()),
    );
    await this.repository.save(record, {
      command,
      response: state,
      events: state.events.slice(priorEventCount),
    });
    return state;
  }

  async passport(athleteId: string): Promise<WalkingSkeletonState["passport"]> {
    return (await this.#record(athleteId)).flow.snapshot().passport;
  }

  async snapshot(athleteId: string): Promise<WalkingSkeletonState> {
    return (await this.#record(athleteId)).flow.snapshot();
  }

  async #record(athleteId: string): Promise<DurableFlowRecord> {
    const record = await this.repository.load(athleteId);
    if (!record) throw new NotFoundException("Athlete was not found.");
    return record;
  }

  async #resource(id: string, type: string): Promise<DurableFlowRecord> {
    const record = await this.repository.loadByResource(id, type);
    if (!record) throw new NotFoundException(`${type} was not found.`);
    return record;
  }

  async #assertResourceHousehold(
    id: string,
    type: string,
    householdId: string,
  ): Promise<void> {
    const record = await this.#resource(id, type);
    if (record.householdId !== householdId) {
      throw new NotFoundException(`${type} was not found.`);
    }
  }

  #command(
    actorId: string,
    operation: string,
    key: string,
    request: unknown,
  ): IdempotentCommand {
    return { actorId, operation, key, request };
  }

  #context(actorId: string, idempotencyKey: string, now: Date) {
    return {
      actorId,
      correlationId: randomUUID(),
      idempotencyKey,
      now,
      nextId: () => randomUUID(),
    };
  }
}
