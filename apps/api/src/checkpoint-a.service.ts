import { randomUUID } from "node:crypto";

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { components } from "@nextstep/contracts";
import type { Prisma } from "@nextstep/database";
import { createDomainEvent } from "@nextstep/domain";

import { AuthorisationService } from "./authorisation.service.js";
import {
  DevelopmentFlowRepository,
  type IdempotentCommand,
} from "./development-flow.repository.js";
import type { AuthenticatedIdentity } from "./identity.js";
import { PrismaService } from "./prisma.service.js";

type AthleteDto = components["schemas"]["Athlete"];
type DashboardDto = components["schemas"]["AthleteDashboard"];
type SkillTreeDto = components["schemas"]["SkillTree"];
type SkillDetailDto = components["schemas"]["AthleteSkillDetail"];
type PracticePlanDto = components["schemas"]["PracticePlan"];
type PracticeSessionDto = components["schemas"]["PracticeSession"];
type PracticeSessionDetailDto = components["schemas"]["PracticeSessionDetail"];
type PassportDto = components["schemas"]["AthletePassport"];
type NextActionDto = components["schemas"]["NextAction"];

const completedStates = new Set([
  "PRACTICE_COMPLETE",
  "EVIDENCE_PENDING",
  "REVIEW_PENDING",
  "MASTERED",
]);

const jsonObject = (
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

@Injectable()
export class CheckpointAService {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService,
    @Inject(AuthorisationService)
    private readonly authorisation: AuthorisationService,
    @Inject(DevelopmentFlowRepository)
    private readonly flowRepository: DevelopmentFlowRepository,
  ) {}

  async currentUser(
    identity: AuthenticatedIdentity,
  ): Promise<components["schemas"]["CurrentUser"]> {
    const actor = await this.authorisation.actor(identity);
    const user = await this.database.client.user.findUniqueOrThrow({
      where: { id: actor.userId },
      include: {
        memberships: {
          where: { revokedAt: null },
          include: { household: true },
        },
      },
    });
    return {
      id: user.id,
      displayName: user.displayName,
      roles: user.memberships.map(({ role }) => role),
      households: user.memberships.map(({ household, role }) => ({
        id: household.id,
        name: household.name,
        role,
      })),
    };
  }

  async athletes(
    identity: AuthenticatedIdentity,
    householdId: string,
  ): Promise<AthleteDto[]> {
    await this.authorisation.household(identity, householdId);
    const athletes = await this.database.client.athlete.findMany({
      where: { householdId, status: "ACTIVE" },
      orderBy: { displayName: "asc" },
    });
    return athletes.map((athlete) => this.athleteDto(athlete));
  }

  async athlete(
    identity: AuthenticatedIdentity,
    athleteId: string,
  ): Promise<AthleteDto> {
    await this.authorisation.athlete(identity, athleteId);
    const athlete = await this.database.client.athlete.findUniqueOrThrow({
      where: { id: athleteId },
    });
    return this.athleteDto(athlete);
  }

  async dashboard(
    identity: AuthenticatedIdentity,
    athleteId: string,
  ): Promise<DashboardDto> {
    await this.authorisation.athlete(identity, athleteId);
    const athlete = await this.database.client.athlete.findUnique({
      where: { id: athleteId },
      include: {
        campaigns: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { assignedAt: "desc" },
          include: { campaign: { include: { stage: true, steps: true } } },
        },
        practicePlans: {
          where: { status: { in: ["GENERATED", "STARTED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        skillProgress: true,
        assessments: {
          where: {
            status: {
              in: ["REQUESTED", "UNASSIGNED", "ASSIGNED", "IN_REVIEW"],
            },
          },
          orderBy: { requestedAt: "desc" },
          take: 1,
        },
      },
    });
    if (!athlete || !athlete.campaigns[0])
      throw new NotFoundException("Athlete campaign was not found.");
    const assignment = athlete.campaigns[0];
    const completed = athlete.skillProgress.filter(({ state }) =>
      completedStates.has(state),
    ).length;
    const total = assignment.campaign.steps.length;
    const plan = athlete.practicePlans[0];
    const startOfWeek = new Date();
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7);
    const meaningfulPractices =
      await this.database.client.practiceSession.count({
        where: {
          athleteId,
          status: "COMPLETED",
          completedAt: { gte: startOfWeek },
        },
      });
    return {
      athlete: this.athleteDto(athlete),
      primaryAction: plan
        ? this.practiceAction(athleteId, plan.id, plan.status === "STARTED")
        : this.restAction(
            "Practice complete",
            "Your latest prescribed practice is safely recorded.",
          ),
      campaign: {
        id: assignment.campaign.id,
        key: assignment.campaign.key,
        name: assignment.campaign.name,
        stageKey: assignment.campaign.stage.key,
        progress: total === 0 ? 0 : completed / total,
        nextMilestoneName: null,
      },
      weeklySummary: {
        meaningfulPractices,
        progressing: meaningfulPractices > 0,
        revisitDueCount: athlete.skillProgress.filter(
          ({ state }) => state === "REVISIT_DUE",
        ).length,
      },
      pendingAssessment: null,
    };
  }

  async skillTree(
    identity: AuthenticatedIdentity,
    athleteId: string,
  ): Promise<SkillTreeDto> {
    await this.authorisation.athlete(identity, athleteId);
    const assignment = await this.database.client.athleteCampaign.findFirst({
      where: { athleteId, status: "ACTIVE" },
      orderBy: { assignedAt: "desc" },
      include: {
        curriculumVersion: true,
        campaign: {
          include: {
            stage: true,
            steps: {
              orderBy: { sequence: "asc" },
              include: {
                node: {
                  include: {
                    domain: true,
                    stage: true,
                    prerequisites: true,
                    progress: { where: { athleteId } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!assignment)
      throw new NotFoundException("Athlete campaign was not found.");
    const steps = assignment.campaign.steps;
    const domains = new Map<
      string,
      {
        key: string;
        name: string;
        sortOrder: number;
        total: number;
        completed: number;
      }
    >();
    for (const { node } of steps) {
      const current = domains.get(node.domain.key) ?? {
        key: node.domain.key,
        name: node.domain.name,
        sortOrder: node.domain.sortOrder,
        total: 0,
        completed: 0,
      };
      current.total += 1;
      if (completedStates.has(node.progress[0]?.state ?? "LOCKED"))
        current.completed += 1;
      domains.set(current.key, current);
    }
    const totalCompleted = [...domains.values()].reduce(
      (sum, domain) => sum + domain.completed,
      0,
    );
    return {
      curriculumVersion: assignment.curriculumVersion.versionKey,
      campaign: {
        id: assignment.campaign.id,
        key: assignment.campaign.key,
        name: assignment.campaign.name,
        stageKey: assignment.campaign.stage.key,
        progress: steps.length === 0 ? 0 : totalCompleted / steps.length,
        nextMilestoneName:
          steps.find(({ node }) => node.type === "MILESTONE")?.node.name ??
          null,
      },
      domains: [...domains.values()]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((domain) => ({
          key: domain.key,
          name: domain.name,
          sortOrder: domain.sortOrder,
          completedNodeCount: domain.completed,
          totalNodeCount: domain.total,
          progress: domain.total === 0 ? 0 : domain.completed / domain.total,
        })),
      nodes: steps.map(({ node }) => {
        const state = node.progress[0]?.state ?? "LOCKED";
        const remaining = node.prerequisites
          .filter(({ prerequisiteNodeId }) => {
            const prerequisite = steps.find(
              ({ node: candidate }) => candidate.id === prerequisiteNodeId,
            )?.node;
            return (
              !prerequisite ||
              !completedStates.has(prerequisite.progress[0]?.state ?? "LOCKED")
            );
          })
          .map(
            ({ prerequisiteNodeId }) =>
              steps.find(
                ({ node: candidate }) => candidate.id === prerequisiteNodeId,
              )?.node.name ?? "Complete the prerequisite skill",
          );
        return {
          id: node.id,
          key: node.key,
          name: node.name,
          childName: node.childName,
          domainKey: node.domain.key,
          stageKey: node.stage.key,
          type: node.type,
          state,
          demonstrated: completedStates.has(state),
          verified: state === "MASTERED",
          whyLocked:
            state === "LOCKED"
              ? `Complete ${remaining.join(" and ") || "the earlier pathway steps"} first.`
              : null,
          prerequisiteNodeIds: node.prerequisites.map(
            ({ prerequisiteNodeId }) => prerequisiteNodeId,
          ),
          revisitDueAt: node.progress[0]?.revisitDueAt?.toISOString() ?? null,
          remainingRequirements: remaining,
        };
      }),
      branchChoices: [],
    };
  }

  async skillDetail(
    identity: AuthenticatedIdentity,
    athleteId: string,
    nodeId: string,
  ): Promise<SkillDetailDto> {
    const tree = await this.skillTree(identity, athleteId);
    const summary = tree.nodes.find(({ id }) => id === nodeId);
    if (!summary) throw new NotFoundException("Skill was not found.");
    const node = await this.database.client.skillNode.findUnique({
      where: { id: nodeId },
    });
    if (!node) throw new NotFoundException("Skill was not found.");
    const content = jsonObject(node.content);
    const plan = await this.database.client.practicePlan.findFirst({
      where: {
        athleteId,
        status: { in: ["GENERATED", "STARTED"] },
        ...(summary.state === "ACTIVE" ? {} : { steps: { some: { nodeId } } }),
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      ...summary,
      objective: node.objective,
      whyItMatters:
        typeof content["whyItMatters"] === "string"
          ? content["whyItMatters"]
          : node.objective,
      childCues: stringArray(content["childCues"]).slice(0, 3),
      commonErrors: stringArray(content["commonErrors"]),
      safety: stringArray(content["safety"]),
      primaryAction:
        summary.state === "LOCKED"
          ? this.restAction(
              "Keep following the pathway",
              summary.whyLocked ?? "A prerequisite is still required.",
            )
          : plan
            ? this.practiceAction(athleteId, plan.id, plan.status === "STARTED")
            : this.restAction(
                "No practice due",
                "Your next prescribed practice will appear on the dashboard.",
              ),
    };
  }

  async practicePlan(
    identity: AuthenticatedIdentity,
    planId: string,
  ): Promise<PracticePlanDto> {
    await this.authorisation.practicePlan(identity, planId);
    const plan = await this.database.client.practicePlan.findUnique({
      where: { id: planId },
      include: { steps: { orderBy: { sequence: "asc" } } },
    });
    if (!plan) throw new NotFoundException("Practice plan was not found.");
    const snapshot = jsonObject(plan.ruleSnapshot);
    return {
      id: plan.id,
      athleteId: plan.athleteId,
      title:
        typeof snapshot["title"] === "string"
          ? snapshot["title"]
          : "Prescribed practice",
      purpose:
        typeof snapshot["purpose"] === "string"
          ? snapshot["purpose"]
          : "Build the current pathway skill with a short guided session.",
      status: plan.status,
      targetDurationMinutes: plan.targetDurationMinutes,
      generationReasons: stringArray(plan.generationReasons),
      steps: plan.steps.map((step) => {
        const content = jsonObject(step.contentSnapshot);
        return {
          id: step.id,
          sequence: step.sequence,
          type: step.type as components["schemas"]["PracticePlanStep"]["type"],
          nodeId: step.nodeId,
          drillId: step.drillId,
          title:
            typeof content["title"] === "string"
              ? content["title"]
              : `Practice step ${step.sequence}`,
          targetDurationSeconds:
            typeof content["targetDurationSeconds"] === "number"
              ? content["targetDurationSeconds"]
              : null,
          targetRepetitions:
            typeof content["targetRepetitions"] === "number"
              ? content["targetRepetitions"]
              : null,
          resultType: step.resultType,
          prescriptionReason: step.prescriptionReason,
          content,
        };
      }),
      createdAt: plan.createdAt.toISOString(),
      expiresAt: plan.expiresAt?.toISOString() ?? null,
    };
  }

  async practiceSession(
    identity: AuthenticatedIdentity,
    sessionId: string,
  ): Promise<PracticeSessionDetailDto> {
    await this.authorisation.practiceSession(identity, sessionId);
    const session = await this.database.client.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        attempts: {
          orderBy: [{ completedAt: "asc" }, { attemptNumber: "asc" }],
        },
      },
    });
    if (!session)
      throw new NotFoundException("Practice session was not found.");
    return {
      ...this.sessionDto(session),
      attempts: session.attempts.map((attempt) => ({
        id: attempt.id,
        sessionId: attempt.practiceSessionId,
        planStepId: attempt.planStepId,
        attemptNumber: attempt.attemptNumber,
        resultType: attempt.resultType,
        result: attempt.result,
        difficultyRating: attempt.difficultyRating,
        cueUnderstood: attempt.cueUnderstood,
        skipped: attempt.skipped,
        skipReason: attempt.skipReason,
        completedAt: attempt.completedAt.toISOString(),
      })),
    };
  }

  async passport(
    identity: AuthenticatedIdentity,
    athleteId: string,
  ): Promise<PassportDto> {
    await this.authorisation.athlete(identity, athleteId);
    const athlete = await this.database.client.athlete.findUnique({
      where: { id: athleteId },
      include: {
        passportEvents: { orderBy: { occurredAt: "desc" } },
        campaigns: {
          where: { status: "ACTIVE" },
          take: 1,
          include: { campaign: { include: { stage: true } } },
        },
        skillProgress: { include: { node: { include: { domain: true } } } },
      },
    });
    if (!athlete) throw new NotFoundException("Athlete was not found.");
    const summaries = new Map<
      string,
      {
        domainKey: string;
        name: string;
        demonstratedCount: number;
        verifiedCount: number;
      }
    >();
    for (const progress of athlete.skillProgress) {
      const summary = summaries.get(progress.node.domain.key) ?? {
        domainKey: progress.node.domain.key,
        name: progress.node.domain.name,
        demonstratedCount: 0,
        verifiedCount: 0,
      };
      if (completedStates.has(progress.state)) summary.demonstratedCount += 1;
      if (progress.state === "MASTERED") summary.verifiedCount += 1;
      summaries.set(summary.domainKey, summary);
    }
    return {
      athlete: this.athleteDto(athlete),
      currentStageKey: athlete.campaigns[0]?.campaign.stage.key ?? null,
      domainSummaries: [...summaries.values()],
      timeline: athlete.passportEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        title: event.title,
        summary: event.summary,
        verified: event.verified,
      })),
      nextCursor: null,
    };
  }

  async startSession(
    identity: AuthenticatedIdentity,
    planId: string,
    body: { clientSessionId?: string; startedOffline?: boolean },
    idempotencyKey: string,
  ): Promise<PracticeSessionDto> {
    const authorised = await this.authorisation.practicePlan(identity, planId);
    const command = this.command(
      identity.actorId,
      "checkpoint-a-start-session",
      idempotencyKey,
      { planId, ...body },
    );
    const replay =
      await this.flowRepository.replay<PracticeSessionDto>(command);
    if (replay) return replay;
    const record = await this.flowRepository.load(authorised.athleteId);
    if (!record)
      throw new NotFoundException("Athlete command state was not found.");
    const now = new Date();
    const sessionId = randomUUID();
    const response = this.sessionDto({
      id: sessionId,
      practicePlanId: planId,
      athleteId: authorised.athleteId,
      status: "IN_PROGRESS",
      startedAt: now,
      completedAt: null,
      createdAt: now,
    });
    const event = createDomainEvent({
      eventId: randomUUID(),
      eventType: "PracticeSessionStarted",
      aggregateId: authorised.athleteId,
      aggregateType: "Athlete",
      occurredAt: now,
      actorId: identity.actorId,
      correlationId: randomUUID(),
      payload: { planId, sessionId },
    });
    await this.flowRepository.save(record, {
      command,
      response,
      events: [event],
      resources: [{ id: sessionId, type: "SESSION" }],
      relationalWrites: async (tx) => {
        await tx.practicePlan.update({
          where: { id: planId },
          data: { status: "STARTED" },
        });
        await tx.practiceSession.create({
          data: {
            id: sessionId,
            practicePlanId: planId,
            athleteId: authorised.athleteId,
            clientSessionId: body.clientSessionId ?? idempotencyKey,
            startedOffline: body.startedOffline ?? false,
            status: "IN_PROGRESS",
            startedAt: now,
            createdAt: now,
          },
        });
        await tx.passportEvent.upsert({
          where: { sourceEventId: event.eventId },
          update: {},
          create: {
            id: randomUUID(),
            athleteId: authorised.athleteId,
            sourceEventId: event.eventId,
            eventType: "PRACTICE_STARTED",
            occurredAt: now,
            title: "Prescribed practice started",
            summary: "Progress is saved as each guided step is completed.",
          },
        });
      },
    });
    return response;
  }

  async recordAttempt(
    identity: AuthenticatedIdentity,
    sessionId: string,
    body: components["schemas"]["PracticeAttemptRequest"],
    idempotencyKey: string,
  ): Promise<components["schemas"]["PracticeAttempt"]> {
    const authorised = await this.authorisation.practiceSession(
      identity,
      sessionId,
    );
    const command = this.command(
      identity.actorId,
      "checkpoint-a-record-attempt",
      idempotencyKey,
      { sessionId, ...body },
    );
    const replay =
      await this.flowRepository.replay<
        components["schemas"]["PracticeAttempt"]
      >(command);
    if (replay) return replay;
    const record = await this.flowRepository.load(authorised.athleteId);
    if (!record)
      throw new NotFoundException("Athlete command state was not found.");
    const step = await this.database.client.practicePlanStep.findFirst({
      where: { id: body.planStepId, practicePlanId: authorised.planId },
    });
    if (!step) throw new NotFoundException("Practice step was not found.");
    const attemptId = randomUUID();
    const attemptCompletedAt = new Date(
      body.completedAt ?? new Date().toISOString(),
    );
    const response: components["schemas"]["PracticeAttempt"] = {
      id: attemptId,
      sessionId,
      ...body,
    };
    const event = createDomainEvent({
      eventId: randomUUID(),
      eventType: "PracticeAttemptRecorded",
      aggregateId: authorised.athleteId,
      aggregateType: "Athlete",
      occurredAt: attemptCompletedAt,
      actorId: identity.actorId,
      correlationId: randomUUID(),
      payload: {
        planId: authorised.planId,
        sessionId,
        planStepId: body.planStepId,
        attemptNumber: body.attemptNumber,
      },
    });
    await this.flowRepository.save(record, {
      command,
      response,
      events: [event],
      relationalWrites: async (tx) => {
        await tx.practiceAttempt.create({
          data: {
            id: attemptId,
            practiceSessionId: sessionId,
            planStepId: body.planStepId,
            attemptNumber: body.attemptNumber,
            resultType: body.resultType,
            ...(body.result === undefined
              ? {}
              : { result: body.result as Prisma.InputJsonValue }),
            difficultyRating: body.difficultyRating ?? null,
            cueUnderstood: body.cueUnderstood ?? null,
            skipped: body.skipped,
            skipReason: body.skipReason ?? null,
            successful:
              !body.skipped &&
              (body.resultType !== "BOOLEAN" || body.result === true),
            completedAt: attemptCompletedAt,
          },
        });
      },
    });
    return response;
  }

  async completeSession(
    identity: AuthenticatedIdentity,
    sessionId: string,
    body: components["schemas"]["CompletePracticeSessionRequest"],
    idempotencyKey: string,
  ): Promise<components["schemas"]["PracticeCompletionResult"]> {
    const authorised = await this.authorisation.practiceSession(
      identity,
      sessionId,
    );
    const command = this.command(
      identity.actorId,
      "checkpoint-a-complete-session",
      idempotencyKey,
      { sessionId, ...body },
    );
    const replay =
      await this.flowRepository.replay<
        components["schemas"]["PracticeCompletionResult"]
      >(command);
    if (replay) return replay;
    const record = await this.flowRepository.load(authorised.athleteId);
    if (!record)
      throw new NotFoundException("Athlete command state was not found.");
    const session = await this.database.client.practiceSession.findUnique({
      where: { id: sessionId },
      include: { attempts: true, practicePlan: { include: { steps: true } } },
    });
    if (!session)
      throw new NotFoundException("Practice session was not found.");
    if (session.status === "COMPLETED")
      throw new ConflictException("Practice session is already complete.");
    const completedStepIds = new Set(
      session.attempts.map(({ planStepId }) => planStepId),
    );
    if (
      session.practicePlan.steps.some(({ id }) => !completedStepIds.has(id))
    ) {
      throw new ConflictException(
        "Complete or skip every prescribed step before finishing.",
      );
    }
    const completedAt = new Date(body.completedAt ?? new Date().toISOString());
    const priorSnapshot = record.flow.snapshot();
    const priorEventCount = priorSnapshot.events.length;
    const nextSnapshot = record.flow.completePractice(
      {
        planId: authorised.planId,
        sessionId,
        successfulAttempts: session.attempts.filter(
          ({ successful }) => successful,
        ).length,
        safetyFlag: body.safetyFlag,
      },
      {
        actorId: identity.actorId,
        correlationId: randomUUID(),
        idempotencyKey,
        now: completedAt,
        nextId: () => randomUUID(),
      },
    );
    const checkpoint = await this.database.client.skillNode.findFirst({
      where: {
        key: "foundation.ball.bilateral-control-check",
        progress: { some: { athleteId: authorised.athleteId } },
      },
      include: { progress: { where: { athleteId: authorised.athleteId } } },
    });
    if (!checkpoint)
      throw new NotFoundException("Checkpoint progress was not found.");
    const priorState = checkpoint.progress[0]?.state ?? "ACTIVE";
    const newState = nextSnapshot.athlete.checkpointState;
    const event = nextSnapshot.events
      .slice(priorEventCount)
      .find(({ eventType }) => eventType === "PracticeSessionCompleted");
    if (!event)
      throw new ConflictException(
        "Practice completion event was not produced.",
      );
    const completedSession = this.sessionDto({
      ...session,
      status: "COMPLETED",
      completedAt,
    });
    const response: components["schemas"]["PracticeCompletionResult"] = {
      session: completedSession,
      progressChanges:
        priorState === newState
          ? []
          : [
              {
                nodeId: checkpoint.id,
                priorState,
                newState,
                reason: "Authoritative practice requirements were evaluated.",
              },
            ],
      nextAction: this.restAction(
        newState === "EVIDENCE_PENDING"
          ? "Practice requirement complete"
          : "Practice saved",
        newState === "EVIDENCE_PENDING"
          ? "The checkpoint is ready for the next milestone in a later checkpoint."
          : "Return to the pathway when you are ready.",
      ),
    };
    await this.flowRepository.save(record, {
      command,
      response,
      events: nextSnapshot.events.slice(priorEventCount),
      relationalWrites: async (tx) => {
        await tx.practiceSession.update({
          where: { id: sessionId },
          data: {
            status: "COMPLETED",
            completedAt,
            safetyFlag: body.safetyFlag,
            reflection: {
              enjoymentRating: body.enjoymentRating,
              difficultyRating: body.difficultyRating,
              parentObservation: body.parentObservation,
              safetyNote: body.safetyNote,
            },
          },
        });
        await tx.practicePlan.update({
          where: { id: authorised.planId },
          data: { status: "COMPLETED" },
        });
        await tx.athleteSkillProgress.update({
          where: {
            athleteId_nodeId: {
              athleteId: authorised.athleteId,
              nodeId: checkpoint.id,
            },
          },
          data: {
            state: newState,
            demonstratedAt: completedAt,
            transitionEventId: event.eventId,
            stateVersion: { increment: 1 },
          },
        });
        await tx.passportEvent.upsert({
          where: { sourceEventId: event.eventId },
          update: {},
          create: {
            id: randomUUID(),
            athleteId: authorised.athleteId,
            sourceEventId: event.eventId,
            eventType: "PRACTICE_COMPLETED",
            occurredAt: completedAt,
            title: "Both-hand ball control completed",
            summary: "The prescribed plan and every guided step were saved.",
            curriculumProvenance: {
              planId: authorised.planId,
              sessionId,
              nodeKey: checkpoint.key,
            },
          },
        });
      },
    });
    return response;
  }

  sessionDto(session: {
    id: string;
    practicePlanId: string;
    athleteId: string;
    status: PracticeSessionDto["status"];
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }): PracticeSessionDto {
    return {
      id: session.id,
      practicePlanId: session.practicePlanId,
      athleteId: session.athleteId,
      status: session.status,
      startedAt: session.startedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      version: 1,
    };
  }

  private athleteDto(athlete: {
    id: string;
    householdId: string;
    displayName: string;
    ageBand: string;
    birthMonth: number | null;
    birthYear: number | null;
    laterality: string | null;
    status: AthleteDto["status"];
    createdAt: Date;
    updatedAt: Date;
  }): AthleteDto {
    return {
      id: athlete.id,
      householdId: athlete.householdId,
      displayName: athlete.displayName,
      ageBand: athlete.ageBand,
      birthMonth: athlete.birthMonth,
      birthYear: athlete.birthYear,
      laterality: athlete.laterality,
      status: athlete.status,
      createdAt: athlete.createdAt.toISOString(),
      updatedAt: athlete.updatedAt.toISOString(),
    };
  }

  private practiceAction(
    athleteId: string,
    planId: string,
    started: boolean,
  ): NextActionDto {
    return {
      type: started ? "CONTINUE_PRACTICE" : "START_PRACTICE",
      title: started
        ? "Continue prescribed practice"
        : "Your prescribed practice is ready",
      description: "A short guided session based on the current pathway state.",
      ctaLabel: started ? "Continue practice" : "Start practice",
      destination: `/athletes/${athleteId}/practice/${planId}`,
      reasonCodes: ["CURRENT_PATHWAY_FOCUS"],
    };
  }

  private restAction(title: string, description: string): NextActionDto {
    return {
      type: "REST",
      title,
      description,
      ctaLabel: "View skill tree",
      destination: "skill-tree",
      reasonCodes: [],
    };
  }

  private command(
    actorId: string,
    operation: string,
    key: string,
    request: unknown,
  ): IdempotentCommand {
    return { actorId, operation, key, request };
  }
}
