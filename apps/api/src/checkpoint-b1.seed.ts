import { createPrismaClient } from "@nextstep/database";
import {
  CAPTURE_CONSENT_PURPOSE,
  REVIEW_CONSENT_PURPOSE,
} from "@nextstep/domain";

import "./checkpoint-a.seed.js";
import { stableUuid } from "./development-flow.repository.js";

if (
  process.env["NODE_ENV"] === "production" ||
  process.env["NEXTSTEP_DEMO_MODE"] !== "enabled"
) {
  throw new Error(
    "Checkpoint B1 fixture requires NEXTSTEP_DEMO_MODE=enabled outside production.",
  );
}

const database = createPrismaClient();
const athleteId = stableUuid("checkpoint-a:athlete:mason");
const caregiverActor = "checkpoint-b1-caregiver";
const caregiverUserId = stableUuid(`user:${caregiverActor}`);
const nodeId = stableUuid(
  "checkpoint-a:node:foundation.ball.bilateral-control-check",
);

await database.$transaction(async (tx) => {
  await tx.user.upsert({
    where: { identityProviderKey: `local:${caregiverActor}` },
    update: { displayName: "Sam Johnson" },
    create: {
      id: caregiverUserId,
      identityProviderKey: `local:${caregiverActor}`,
      displayName: "Sam Johnson",
    },
  });
  await tx.householdMembership.upsert({
    where: {
      householdId_userId: {
        householdId: stableUuid("checkpoint-a:household:mason"),
        userId: caregiverUserId,
      },
    },
    update: { role: "CAREGIVER", revokedAt: null },
    create: {
      householdId: stableUuid("checkpoint-a:household:mason"),
      userId: caregiverUserId,
      role: "CAREGIVER",
    },
  });
  const evidence = await tx.evidenceSubmission.findMany({
    where: { athleteId },
    select: { id: true, mediaAssetId: true },
  });
  const evidenceIds = evidence.map(({ id }) => id);
  const mediaIds = evidence.map(({ mediaAssetId }) => mediaAssetId);
  if (evidenceIds.length) {
    const assessments = await tx.assessment.findMany({
      where: { evidenceSubmissionId: { in: evidenceIds } },
      select: { id: true },
    });
    const assessmentIds = assessments.map(({ id }) => id);
    await tx.assessmentCriterionScore.deleteMany({
      where: { assessmentId: { in: assessmentIds } },
    });
    await tx.assessmentFeedback.deleteMany({
      where: { assessmentId: { in: assessmentIds } },
    });
    await tx.assessment.deleteMany({ where: { id: { in: assessmentIds } } });
    await tx.evidenceSubmission.deleteMany({
      where: { id: { in: evidenceIds } },
    });
    await tx.mediaAsset.deleteMany({ where: { id: { in: mediaIds } } });
  }
  await tx.consentRecord.deleteMany({
    where: {
      athleteId,
      purposeKey: {
        in: [CAPTURE_CONSENT_PURPOSE, REVIEW_CONSENT_PURPOSE],
      },
    },
  });
  await tx.idempotencyRecord.deleteMany({
    where: {
      operation: {
        in: [
          "record-evidence-consent",
          "withdraw-evidence-consent",
          "create-evidence-upload-intent",
          "complete-evidence-upload",
          "create-evidence-playback-grant",
          "submit-evidence",
          "request-evidence-deletion",
        ],
      },
    },
  });
  await tx.athleteSkillProgress.update({
    where: { athleteId_nodeId: { athleteId, nodeId } },
    data: {
      state: "EVIDENCE_PENDING",
      stateVersion: 3,
      demonstratedAt: new Date("2026-08-04T00:00:00.000Z"),
      verifiedAt: null,
      verifyingAssessmentId: null,
    },
  });
  await tx.practicePlan.updateMany({
    where: { athleteId, status: { in: ["GENERATED", "STARTED"] } },
    data: { status: "COMPLETED" },
  });
});

await database.$disconnect();
console.log(
  JSON.stringify(
    { message: "Checkpoint B1 demo fixture loaded.", athleteId, nodeId },
    null,
    2,
  ),
);
