import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Prisma } from "@nextstep/database";
import { createPrismaClient } from "@nextstep/database";
import { WalkingSkeleton } from "@nextstep/domain";

import { stableUuid } from "./development-flow.repository.js";

if (
  process.env["NODE_ENV"] === "production" ||
  process.env["NEXTSTEP_DEMO_MODE"] !== "enabled"
) {
  throw new Error(
    "Checkpoint A fixture requires NEXTSTEP_DEMO_MODE=enabled outside production.",
  );
}

type SeedNode = {
  key: string;
  name: string;
  childName?: string;
  type: "SKILL" | "CHECKPOINT" | "MILESTONE";
  domainKey: string;
  stageKey: string;
  objective: string;
  whyItMatters: string;
  parentInstructions?: string;
  childCues?: string[];
  commonErrors?: string[];
  safety?: string[];
  hardPrerequisiteKeys: string[];
  softPrerequisiteKeys: string[];
  completionRule: object;
  retentionRule: object;
  metadata?: object;
};
type SeedDrill = {
  key: string;
  name: string;
  primaryNodeKey: string;
  [key: string]: unknown;
};
type SeedRubric = {
  key: string;
  name: string;
  version: number;
  assessmentType: "ASYNC_VIDEO" | "IN_PERSON";
  evidenceInstructions: object;
  passRule: object;
  criteria: Array<{
    key: string;
    name: string;
    description?: string;
    isCritical: boolean;
    scaleAnchors: object;
  }>;
};
type CurriculumSeed = {
  sport: { key: string; name: string; metadata?: object };
  curriculumVersion: {
    versionKey: string;
    name: string;
    changeSummary?: string;
    status: string;
  };
  domains: Array<{ key: string; name: string; sortOrder: number }>;
  stages: Array<{
    key: string;
    name: string;
    sortOrder: number;
    ageGuidance: object;
  }>;
  nodes: SeedNode[];
  drills: SeedDrill[];
  rubrics: SeedRubric[];
  campaigns: Array<{
    key: string;
    name: string;
    description?: string;
    stageKey: string;
    settings: object;
    steps: Array<{
      nodeKey: string;
      sequence: number;
      required?: boolean;
      branchGroupKey?: string;
      branchOptionKey?: string;
    }>;
  }>;
};

const database = createPrismaClient();
const seed = JSON.parse(
  await readFile(
    resolve(
      import.meta.dirname,
      "../../../content/basketball/seed/seed_curriculum.json",
    ),
    "utf8",
  ),
) as CurriculumSeed;
const id = (kind: string, key: string) =>
  stableUuid(`checkpoint-a:${kind}:${key}`);
const asJson = (value: unknown) => value as Prisma.InputJsonValue;

const demo = {
  parentActor: "checkpoint-a-parent",
  otherActor: "checkpoint-a-other-parent",
  householdId: id("household", "mason"),
  otherHouseholdId: id("household", "other"),
  athleteId: id("athlete", "mason"),
  otherAthleteId: id("athlete", "other"),
  campaignAssignmentId: id("athlete-campaign", "mason-foundation"),
  otherCampaignAssignmentId: id("athlete-campaign", "taylor-foundation"),
  planId: id("practice-plan", "current"),
};

await database.$transaction(async (tx) => {
  const sportId = id("sport", seed.sport.key);
  await tx.sport.upsert({
    where: { key: seed.sport.key },
    update: {
      name: seed.sport.name,
      metadata: asJson(seed.sport.metadata ?? {}),
    },
    create: {
      id: sportId,
      key: seed.sport.key,
      name: seed.sport.name,
      metadata: asJson(seed.sport.metadata ?? {}),
    },
  });
  const curriculumId = id("curriculum", seed.curriculumVersion.versionKey);
  await tx.curriculumVersion.upsert({
    where: {
      sportId_versionKey: {
        sportId,
        versionKey: seed.curriculumVersion.versionKey,
      },
    },
    update: {
      name: seed.curriculumVersion.name,
      status: "PUBLISHED",
      changeSummary: seed.curriculumVersion.changeSummary ?? null,
    },
    create: {
      id: curriculumId,
      sportId,
      versionKey: seed.curriculumVersion.versionKey,
      name: seed.curriculumVersion.name,
      status: "PUBLISHED",
      changeSummary: seed.curriculumVersion.changeSummary ?? null,
      publishedAt: new Date("2026-07-20T00:00:00.000Z"),
    },
  });
  for (const domain of seed.domains) {
    await tx.skillDomain.upsert({
      where: {
        curriculumVersionId_key: {
          curriculumVersionId: curriculumId,
          key: domain.key,
        },
      },
      update: { name: domain.name, sortOrder: domain.sortOrder },
      create: {
        id: id("domain", domain.key),
        curriculumVersionId: curriculumId,
        ...domain,
      },
    });
  }
  for (const stage of seed.stages) {
    await tx.stage.upsert({
      where: {
        curriculumVersionId_key: {
          curriculumVersionId: curriculumId,
          key: stage.key,
        },
      },
      update: {
        name: stage.name,
        sortOrder: stage.sortOrder,
        ageGuidance: asJson(stage.ageGuidance),
      },
      create: {
        id: id("stage", stage.key),
        curriculumVersionId: curriculumId,
        key: stage.key,
        name: stage.name,
        sortOrder: stage.sortOrder,
        ageGuidance: asJson(stage.ageGuidance),
      },
    });
  }
  for (const node of seed.nodes) {
    const content = {
      whyItMatters: node.whyItMatters,
      parentInstructions: node.parentInstructions,
      childCues: node.childCues ?? [],
      commonErrors: node.commonErrors ?? [],
      safety: node.safety ?? [],
      metadata: node.metadata ?? {},
    };
    await tx.skillNode.upsert({
      where: {
        curriculumVersionId_key: {
          curriculumVersionId: curriculumId,
          key: node.key,
        },
      },
      update: {
        name: node.name,
        childName: node.childName ?? null,
        objective: node.objective,
        content: asJson(content),
        completionRule: asJson(node.completionRule),
        retentionRule: asJson(node.retentionRule),
      },
      create: {
        id: id("node", node.key),
        curriculumVersionId: curriculumId,
        domainId: id("domain", node.domainKey),
        stageId: id("stage", node.stageKey),
        key: node.key,
        name: node.name,
        childName: node.childName ?? null,
        type: node.type,
        objective: node.objective,
        content: asJson(content),
        completionRule: asJson(node.completionRule),
        retentionRule: asJson(node.retentionRule),
      },
    });
  }
  for (const rubric of seed.rubrics) {
    const node = seed.nodes.find(
      ({ metadata }) =>
        (metadata as { rubricKey?: string } | undefined)?.rubricKey ===
        rubric.key,
    );
    if (!node) throw new Error(`Rubric ${rubric.key} has no owning node.`);
    const rubricId = id("rubric", `${rubric.key}:${rubric.version}`);
    await tx.assessmentRubric.upsert({
      where: {
        curriculumVersionId_key_version: {
          curriculumVersionId: curriculumId,
          key: rubric.key,
          version: rubric.version,
        },
      },
      update: {
        name: rubric.name,
        assessmentType: rubric.assessmentType,
        evidenceInstructions: asJson(rubric.evidenceInstructions),
        passRule: asJson(rubric.passRule),
      },
      create: {
        id: rubricId,
        curriculumVersionId: curriculumId,
        nodeId: id("node", node.key),
        key: rubric.key,
        name: rubric.name,
        version: rubric.version,
        assessmentType: rubric.assessmentType,
        evidenceInstructions: asJson(rubric.evidenceInstructions),
        passRule: asJson(rubric.passRule),
      },
    });
    for (const [index, criterion] of rubric.criteria.entries()) {
      await tx.rubricCriterion.upsert({
        where: {
          rubricId_key: { rubricId, key: criterion.key },
        },
        update: {
          name: criterion.name,
          description: criterion.description ?? null,
          isCritical: criterion.isCritical,
          sortOrder: index + 1,
          scaleAnchors: asJson(criterion.scaleAnchors),
        },
        create: {
          id: id("rubric-criterion", `${rubric.key}:${criterion.key}`),
          rubricId,
          key: criterion.key,
          name: criterion.name,
          description: criterion.description ?? null,
          isCritical: criterion.isCritical,
          sortOrder: index + 1,
          scaleAnchors: asJson(criterion.scaleAnchors),
        },
      });
    }
  }
  for (const node of seed.nodes) {
    for (const prerequisiteKey of node.hardPrerequisiteKeys) {
      await tx.skillPrerequisite.upsert({
        where: {
          nodeId_prerequisiteNodeId: {
            nodeId: id("node", node.key),
            prerequisiteNodeId: id("node", prerequisiteKey),
          },
        },
        update: { type: "HARD" },
        create: {
          id: id("prerequisite", `${node.key}:${prerequisiteKey}`),
          nodeId: id("node", node.key),
          prerequisiteNodeId: id("node", prerequisiteKey),
          type: "HARD",
        },
      });
    }
  }
  for (const drill of seed.drills) {
    const { key, name, primaryNodeKey, ...content } = drill;
    await tx.drill.upsert({
      where: {
        curriculumVersionId_key: { curriculumVersionId: curriculumId, key },
      },
      update: { name, content: asJson(content), status: "PUBLISHED" },
      create: {
        id: id("drill", key),
        curriculumVersionId: curriculumId,
        key,
        name,
        content: asJson(content),
        status: "PUBLISHED",
      },
    });
    await tx.skillDrill.upsert({
      where: {
        nodeId_drillId: {
          nodeId: id("node", primaryNodeKey),
          drillId: id("drill", key),
        },
      },
      update: { primary: true },
      create: {
        id: id("skill-drill", key),
        nodeId: id("node", primaryNodeKey),
        drillId: id("drill", key),
        primary: true,
      },
    });
  }
  const campaign = seed.campaigns[0]!;
  const campaignId = id("campaign", campaign.key);
  await tx.campaign.upsert({
    where: {
      curriculumVersionId_key: {
        curriculumVersionId: curriculumId,
        key: campaign.key,
      },
    },
    update: {
      name: campaign.name,
      description: campaign.description ?? null,
      settings: asJson(campaign.settings),
    },
    create: {
      id: campaignId,
      curriculumVersionId: curriculumId,
      stageId: id("stage", campaign.stageKey),
      key: campaign.key,
      name: campaign.name,
      description: campaign.description ?? null,
      settings: asJson(campaign.settings),
    },
  });
  for (const step of campaign.steps) {
    const campaignStepId = id(
      "campaign-step",
      `${campaign.key}:${step.sequence}`,
    );
    await tx.campaignStep.upsert({
      where: { id: campaignStepId },
      update: {
        campaignId,
        nodeId: id("node", step.nodeKey),
        sequence: step.sequence,
        required: step.required ?? true,
        branchGroupKey: step.branchGroupKey ?? null,
        branchOptionKey: step.branchOptionKey ?? null,
      },
      create: {
        id: campaignStepId,
        campaignId,
        nodeId: id("node", step.nodeKey),
        sequence: step.sequence,
        required: step.required ?? true,
        branchGroupKey: step.branchGroupKey ?? null,
        branchOptionKey: step.branchOptionKey ?? null,
      },
    });
  }

  for (const [actor, householdId, athleteId, athleteName] of [
    [demo.parentActor, demo.householdId, demo.athleteId, "Mason Johnson"],
    [
      demo.otherActor,
      demo.otherHouseholdId,
      demo.otherAthleteId,
      "Taylor Reed",
    ],
  ] as const) {
    const userId = stableUuid(`user:${actor}`);
    await tx.user.upsert({
      where: { identityProviderKey: `local:${actor}` },
      update: {
        displayName: actor === demo.parentActor ? "Pat Johnson" : "Alex Reed",
      },
      create: {
        id: userId,
        identityProviderKey: `local:${actor}`,
        displayName: actor === demo.parentActor ? "Pat Johnson" : "Alex Reed",
      },
    });
    await tx.household.upsert({
      where: { id: householdId },
      update: {},
      create: {
        id: householdId,
        name: `${athleteName.split(" ")[0]}'s household`,
      },
    });
    await tx.householdMembership.upsert({
      where: { householdId_userId: { householdId, userId } },
      update: { revokedAt: null },
      create: { householdId, userId, role: "OWNER" },
    });
    await tx.athlete.upsert({
      where: { id: athleteId },
      update: { householdId, displayName: athleteName, ageBand: "U10" },
      create: {
        id: athleteId,
        householdId,
        displayName: athleteName,
        ageBand: "U10",
      },
    });
  }

  await tx.athleteCampaign.upsert({
    where: { athleteId_campaignId: { athleteId: demo.athleteId, campaignId } },
    update: { status: "ACTIVE" },
    create: {
      id: demo.campaignAssignmentId,
      athleteId: demo.athleteId,
      campaignId,
      curriculumVersionId: curriculumId,
      status: "ACTIVE",
      assignedAt: new Date("2026-07-20T09:00:00.000Z"),
    },
  });
  await tx.athleteCampaign.upsert({
    where: {
      athleteId_campaignId: {
        athleteId: demo.otherAthleteId,
        campaignId,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      id: demo.otherCampaignAssignmentId,
      athleteId: demo.otherAthleteId,
      campaignId,
      curriculumVersionId: curriculumId,
      status: "ACTIVE",
      assignedAt: new Date("2026-07-20T09:00:00.000Z"),
    },
  });
  const mastered = new Set([
    "foundation.habits.safe-space-check",
    "foundation.movement.athletic-stance",
    "foundation.ball.hand-comfort",
    "foundation.ball.right-pound",
    "foundation.ball.left-pound",
  ]);
  const available = new Set([
    "foundation.passing.ready-hands",
    "foundation.shooting.setup",
    "foundation.habits.both-sides",
  ]);
  for (const step of campaign.steps) {
    const state =
      step.nodeKey === "foundation.ball.bilateral-control-check"
        ? "ACTIVE"
        : mastered.has(step.nodeKey)
          ? "MASTERED"
          : available.has(step.nodeKey)
            ? "AVAILABLE"
            : "LOCKED";
    await tx.athleteSkillProgress.upsert({
      where: {
        athleteId_nodeId: {
          athleteId: demo.athleteId,
          nodeId: id("node", step.nodeKey),
        },
      },
      update: { state },
      create: {
        id: id("progress", step.nodeKey),
        athleteId: demo.athleteId,
        nodeId: id("node", step.nodeKey),
        state,
      },
    });
  }

  const historical = [
    {
      key: "history-1",
      at: new Date("2026-07-27T08:30:00.000Z"),
      title: "Ball control foundations",
    },
    {
      key: "history-2",
      at: new Date("2026-07-30T08:30:00.000Z"),
      title: "Both hands practice",
    },
  ];
  const fixedPassportIds = [
    id("passport", "campaign-assigned"),
    ...historical.map((item) => id("passport", `${item.key}:completed`)),
  ];
  const priorSessions = await tx.practiceSession.findMany({
    where: { practicePlanId: demo.planId },
    select: { id: true },
  });
  await tx.passportEvent.deleteMany({
    where: {
      athleteId: demo.athleteId,
      id: { notIn: fixedPassportIds },
      eventType: { in: ["PRACTICE_STARTED", "PRACTICE_COMPLETED"] },
    },
  });
  await tx.idempotencyRecord.deleteMany({
    where: {
      actorId: stableUuid(demo.parentActor),
      operation: { startsWith: "checkpoint-a-" },
    },
  });
  await tx.outboxEvent.deleteMany({
    where: {
      aggregateId: demo.athleteId,
      eventType: {
        in: [
          "PracticeSessionStarted",
          "PracticeAttemptRecorded",
          "PracticeSessionCompleted",
        ],
      },
    },
  });
  if (priorSessions.length) {
    await tx.developmentFlowResource.deleteMany({
      where: {
        id: { in: priorSessions.map(({ id: sessionId }) => sessionId) },
      },
    });
    await tx.practiceSession.deleteMany({
      where: {
        id: { in: priorSessions.map(({ id: sessionId }) => sessionId) },
      },
    });
  }
  for (const item of historical) {
    const planId = id("practice-plan", item.key);
    const sessionId = id("practice-session", item.key);
    await tx.practicePlan.upsert({
      where: { id: planId },
      update: { status: "COMPLETED" },
      create: {
        id: planId,
        athleteId: demo.athleteId,
        athleteCampaignId: demo.campaignAssignmentId,
        status: "COMPLETED",
        targetDurationMinutes: 15,
        environmentSnapshot: asJson({
          locationType: "OUTDOOR",
          spaceClass: "SMALL",
          equipmentKeys: ["basketball"],
        }),
        generationReasons: asJson(["CURRENT_PATHWAY_FOCUS"]),
        ruleSnapshot: asJson({
          title: item.title,
          purpose: "Develop controlled bilateral dribbling.",
        }),
        createdAt: item.at,
      },
    });
    await tx.practiceSession.upsert({
      where: { id: sessionId },
      update: { status: "COMPLETED", completedAt: item.at },
      create: {
        id: sessionId,
        practicePlanId: planId,
        athleteId: demo.athleteId,
        clientSessionId: item.key,
        status: "COMPLETED",
        startedAt: new Date(item.at.getTime() - 15 * 60_000),
        completedAt: item.at,
        reflection: asJson({ enjoymentRating: 4, difficultyRating: 3 }),
      },
    });
    await tx.passportEvent.upsert({
      where: { sourceEventId: id("event", `${item.key}:completed`) },
      update: {},
      create: {
        id: id("passport", `${item.key}:completed`),
        athleteId: demo.athleteId,
        sourceEventId: id("event", `${item.key}:completed`),
        eventType: "PRACTICE_COMPLETED",
        occurredAt: item.at,
        title: `${item.title} completed`,
        summary: "A prescribed practice was completed and saved.",
      },
    });
  }

  await tx.practicePlan.upsert({
    where: { id: demo.planId },
    update: { status: "GENERATED" },
    create: {
      id: demo.planId,
      athleteId: demo.athleteId,
      athleteCampaignId: demo.campaignAssignmentId,
      status: "GENERATED",
      targetDurationMinutes: 18,
      environmentSnapshot: asJson({
        locationType: "OUTDOOR",
        spaceClass: "SMALL",
        equipmentKeys: ["basketball"],
      }),
      generationReasons: asJson(["CURRENT_PATHWAY_FOCUS", "BILATERAL_CONTROL"]),
      ruleSnapshot: asJson({
        title: "Both-hand ball control",
        purpose:
          "Build confident, controlled bounces with both hands before the checkpoint.",
      }),
      createdAt: new Date("2026-08-02T09:00:00.000Z"),
    },
  });
  const prescribed = [
    {
      key: "drill.safe-space-scan",
      type: "SAFETY_CHECK",
      seconds: 60,
      reps: null,
    },
    { key: "drill.pound-right-rounds", type: "DRILL", seconds: 360, reps: 20 },
    { key: "drill.pound-left-rounds", type: "DRILL", seconds: 360, reps: 20 },
    {
      key: "drill.one-win-one-next",
      type: "REFLECTION",
      seconds: 120,
      reps: null,
    },
  ];
  for (const [index, item] of prescribed.entries()) {
    const drill = seed.drills.find(({ key }) => key === item.key)!;
    const { key, name, primaryNodeKey, ...content } = drill;
    await tx.practicePlanStep.upsert({
      where: {
        practicePlanId_sequence: {
          practicePlanId: demo.planId,
          sequence: index + 1,
        },
      },
      update: {
        contentSnapshot: asJson({
          ...content,
          title: name,
          targetDurationSeconds: item.seconds,
          targetRepetitions: item.reps,
        }),
      },
      create: {
        id: id("plan-step", key),
        practicePlanId: demo.planId,
        nodeId: id("node", primaryNodeKey),
        drillId: id("drill", key),
        sequence: index + 1,
        type: item.type,
        resultType: item.type === "REFLECTION" ? "OBSERVATION" : "BOOLEAN",
        prescriptionReason:
          index === 0
            ? "Safety comes first."
            : "Supports the current Both Hands Check pathway focus.",
        contentSnapshot: asJson({
          ...content,
          title: name,
          targetDurationSeconds: item.seconds,
          targetRepetitions: item.reps,
        }),
      },
    });
  }

  await tx.passportEvent.upsert({
    where: { sourceEventId: id("event", "campaign-assigned") },
    update: {},
    create: {
      id: id("passport", "campaign-assigned"),
      athleteId: demo.athleteId,
      sourceEventId: id("event", "campaign-assigned"),
      eventType: "CAMPAIGN_ASSIGNED",
      occurredAt: new Date("2026-07-20T09:00:00.000Z"),
      title: "Control First pathway started",
      summary: campaign.name,
    },
  });

  const flow = new WalkingSkeleton();
  const context = (key: string, now: Date) => ({
    actorId: demo.parentActor,
    correlationId: id("correlation", key),
    idempotencyKey: key,
    now,
    nextId: (kind: string) => id(kind, key),
  });
  flow.createAthlete(
    {
      athleteId: demo.athleteId,
      householdId: demo.householdId,
      displayName: "Mason Johnson",
    },
    context("fixture-create", new Date("2026-07-20T08:55:00.000Z")),
  );
  flow.assignFoundationCampaign(
    context("fixture-baseline", new Date("2026-07-20T09:00:00.000Z")),
  );
  flow.completePractice(
    {
      planId: id("practice-plan", "history-1"),
      sessionId: id("practice-session", "history-1"),
      successfulAttempts: 2,
    },
    context("fixture-practice-1", historical[0]!.at),
  );
  flow.completePractice(
    {
      planId: id("practice-plan", "history-2"),
      sessionId: id("practice-session", "history-2"),
      successfulAttempts: 2,
    },
    context("fixture-practice-2", historical[1]!.at),
  );
  await tx.developmentFlowSnapshot.upsert({
    where: { athleteId: demo.athleteId },
    update: {
      householdKey: demo.householdId,
      aggregateVersion: 1,
      state: asJson(flow.persistenceState()),
      adapterState: asJson({ mediaReady: false }),
    },
    create: {
      athleteId: demo.athleteId,
      householdKey: demo.householdId,
      state: asJson(flow.persistenceState()),
      adapterState: asJson({ mediaReady: false }),
    },
  });
  await tx.developmentFlowResource.upsert({
    where: { id: demo.planId },
    update: { athleteId: demo.athleteId, type: "PLAN" },
    create: { id: demo.planId, athleteId: demo.athleteId, type: "PLAN" },
  });
});

await database.$disconnect();
console.log(
  JSON.stringify(
    { message: "Checkpoint A demo fixture loaded.", ...demo },
    null,
    2,
  ),
);
