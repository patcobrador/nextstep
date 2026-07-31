import { createDomainEvent, type DomainEvent } from "./events.js";
import {
  applyAssessmentOutcome,
  evaluatePracticeProgress,
  type AssessmentOutcome,
  type ProgressState,
  type QualifyingPractice,
} from "./progress.js";

const checkpointKey = "foundation.ball.bilateral-control-check";
const unlockedNodeKey = "foundation.ball.moving-control";

export interface AthleteRecord {
  id: string;
  householdId: string;
  displayName: string;
  campaignKey?: string;
  checkpointState: ProgressState;
  checkpointVerified: boolean;
  availableNodeKeys: string[];
}

export interface PassportEntry {
  sourceEventId: string;
  athleteId: string;
  type: string;
  title: string;
  verified: boolean;
  occurredAt: string;
}

export interface WalkingSkeletonState {
  athlete: AthleteRecord;
  events: DomainEvent[];
  passport: PassportEntry[];
}

interface CommandContext {
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
  now: Date;
  nextId: (kind: string) => string;
}

export class WalkingSkeleton {
  readonly #events: DomainEvent[] = [];
  readonly #passport: PassportEntry[] = [];
  readonly #practices: QualifyingPractice[] = [];
  readonly #processed = new Set<string>();
  #athlete?: AthleteRecord;
  #assessmentId?: string;

  createAthlete(
    input: { athleteId: string; householdId: string; displayName: string },
    context: CommandContext,
  ): WalkingSkeletonState {
    if (!this.#mark(context.idempotencyKey)) return this.snapshot();
    this.#athlete = {
      id: input.athleteId,
      householdId: input.householdId,
      displayName: input.displayName,
      checkpointState: "LOCKED",
      checkpointVerified: false,
      availableNodeKeys: [],
    };
    this.#emit("AthleteCreated", input.athleteId, context, {
      householdId: input.householdId,
    });
    return this.snapshot();
  }

  assignFoundationCampaign(context: CommandContext): WalkingSkeletonState {
    if (!this.#mark(context.idempotencyKey)) return this.snapshot();
    const athlete = this.#requireAthlete();
    athlete.campaignKey = "campaign.foundation.core-1";
    athlete.checkpointState = "ACTIVE";
    this.#emit("AthleteBaselineCompleted", athlete.id, context, {
      recommendedStageKey: "foundation",
    });
    this.#emit("AthleteCampaignAssigned", athlete.id, context, {
      campaignKey: athlete.campaignKey,
    });
    return this.snapshot();
  }

  completePractice(
    input: {
      sessionId: string;
      successfulAttempts: number;
      safetyFlag?: boolean;
    },
    context: CommandContext,
  ): WalkingSkeletonState {
    if (!this.#mark(context.idempotencyKey)) return this.snapshot();
    const athlete = this.#requireAthlete();
    const planId = context.nextId("practice-plan");
    this.#emit("PracticePlanGenerated", athlete.id, context, { planId });
    this.#practices.push({
      sessionId: input.sessionId,
      completedAt: context.now,
      successfulAttempts: input.successfulAttempts,
      safetyFlag: input.safetyFlag ?? false,
    });
    this.#emit("PracticeSessionCompleted", athlete.id, context, {
      planId,
      sessionId: input.sessionId,
      safetyFlag: input.safetyFlag ?? false,
    });
    const priorState = athlete.checkpointState;
    const evaluation = evaluatePracticeProgress(
      priorState,
      {
        minimumCompletedSessions: 3,
        minimumCalendarSpanDays: 5,
        requiredSuccessfulAttempts: 2,
        requiresEvidence: true,
        revisitAfterDays: 28,
      },
      this.#practices,
    );
    athlete.checkpointState = evaluation.state;
    if (evaluation.changed) {
      this.#emit("SkillStateChanged", athlete.id, context, {
        nodeKey: checkpointKey,
        priorState,
        newState: evaluation.state,
      });
    }
    return this.snapshot();
  }

  submitEvidence(
    input: {
      evidenceId: string;
      consentRecordId: string;
      assignedCoachId: string;
    },
    context: CommandContext,
  ): WalkingSkeletonState {
    if (!this.#mark(context.idempotencyKey)) return this.snapshot();
    const athlete = this.#requireAthlete();
    if (athlete.checkpointState !== "EVIDENCE_PENDING") {
      throw new Error("Evidence is not currently eligible for submission.");
    }
    athlete.checkpointState = "REVIEW_PENDING";
    this.#assessmentId = context.nextId("assessment");
    this.#emit("EvidenceSubmitted", athlete.id, context, {
      consentRecordId: input.consentRecordId,
      evidenceId: input.evidenceId,
      nodeKey: checkpointKey,
    });
    this.#emit("AssessmentRequested", athlete.id, context, {
      assessmentId: this.#assessmentId,
      evidenceId: input.evidenceId,
    });
    this.#emit("AssessmentAssigned", athlete.id, context, {
      assessmentId: this.#assessmentId,
      coachId: input.assignedCoachId,
    });
    return this.snapshot();
  }

  completeAssessment(
    input: { assessmentId: string; outcome: AssessmentOutcome },
    context: CommandContext,
  ): WalkingSkeletonState {
    if (!this.#mark(context.idempotencyKey)) return this.snapshot();
    const athlete = this.#requireAthlete();
    if (input.assessmentId !== this.#assessmentId) {
      throw new Error("Assessment is not assigned to this checkpoint.");
    }
    const priorState = athlete.checkpointState;
    const result = applyAssessmentOutcome(priorState, input.outcome);
    athlete.checkpointState = result.state;
    this.#emit("AssessmentCompleted", athlete.id, context, {
      assessmentId: input.assessmentId,
      outcome: input.outcome,
    });
    const stateEvent = this.#emit("SkillStateChanged", athlete.id, context, {
      nodeKey: checkpointKey,
      priorState,
      newState: result.state,
    });
    if (input.outcome === "PASS") {
      athlete.checkpointVerified = true;
      athlete.availableNodeKeys = [unlockedNodeKey];
      this.#emit("RevisitScheduled", athlete.id, context, {
        nodeKey: checkpointKey,
        revisitAfterDays: 28,
      });
      if (
        !this.#passport.some(
          ({ sourceEventId }) => sourceEventId === stateEvent.eventId,
        )
      ) {
        this.#passport.push({
          sourceEventId: stateEvent.eventId,
          athleteId: athlete.id,
          type: "SKILL_VERIFIED",
          title: "Both Hands Check verified",
          verified: true,
          occurredAt: context.now.toISOString(),
        });
      }
    }
    return this.snapshot();
  }

  snapshot(): WalkingSkeletonState {
    return {
      athlete: structuredClone(this.#requireAthlete()),
      events: structuredClone(this.#events),
      passport: structuredClone(this.#passport),
    };
  }

  #mark(key: string): boolean {
    if (this.#processed.has(key)) return false;
    this.#processed.add(key);
    return true;
  }

  #emit(
    eventType: string,
    aggregateId: string,
    context: CommandContext,
    payload: object,
  ): DomainEvent {
    const event = createDomainEvent({
      eventId: context.nextId("event"),
      eventType,
      aggregateId,
      aggregateType: "Athlete",
      occurredAt: context.now,
      actorId: context.actorId,
      correlationId: context.correlationId,
      payload,
    });
    this.#events.push(event);
    return event;
  }

  #requireAthlete(): AthleteRecord {
    if (!this.#athlete) throw new Error("Athlete has not been created.");
    return this.#athlete;
  }
}
