import { randomUUID } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@nextstep/database";
import {
  CAPTURE_CONSENT_PURPOSE,
  isActiveConsent,
  REVIEW_CONSENT_PURPOSE,
} from "@nextstep/domain";
import type { MediaConfiguration, PrivateMediaStore } from "@nextstep/media";

import {
  AuthorisationService,
  type AuthorisedActor,
} from "./authorisation.service.js";
import {
  IdempotencyService,
  type IdempotencyCommand,
} from "./idempotency.service.js";
import type { AuthenticatedIdentity } from "./identity.js";
import { MEDIA_CONFIGURATION, PRIVATE_MEDIA_STORE } from "./media.provider.js";
import { PrismaService } from "./prisma.service.js";

export const B1_CONSENT_POLICY_VERSION = "b1-2026-08-04";

type ConsentPurpose =
  | typeof CAPTURE_CONSENT_PURPOSE
  | typeof REVIEW_CONSENT_PURPOSE;

const asJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

@Injectable()
export class EvidenceService {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService,
    @Inject(AuthorisationService)
    private readonly authorisation: AuthorisationService,
    @Inject(IdempotencyService)
    private readonly idempotency: IdempotencyService,
    @Inject(PRIVATE_MEDIA_STORE) private readonly media: PrivateMediaStore,
    @Inject(MEDIA_CONFIGURATION)
    private readonly config: MediaConfiguration,
  ) {}

  async recordConsent(input: {
    body: {
      athleteId?: string | null;
      granted: boolean;
      policyVersion: string;
      purposeKey: string;
    };
    householdId: string;
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
  }) {
    const actor = await this.authorisation.household(
      input.identity,
      input.householdId,
    );
    const purposeKey = this.purpose(input.body.purposeKey);
    if (!input.body.athleteId)
      throw new BadRequestException(
        "athleteId is required for evidence consent.",
      );
    await this.assertAthleteHousehold(input.body.athleteId, input.householdId);
    if (input.body.policyVersion !== B1_CONSENT_POLICY_VERSION) {
      throw new BadRequestException(
        "The current evidence consent policy must be used.",
      );
    }
    const command = this.command(
      actor,
      "record-evidence-consent",
      input.idempotencyKey,
      input.body,
    );
    const replay =
      await this.idempotency.replay<ReturnType<typeof consentDto>>(command);
    if (replay) return replay;
    const id = randomUUID();
    const response = consentDto({
      id,
      householdId: input.householdId,
      athleteId: input.body.athleteId,
      purposeKey,
      policyVersion: input.body.policyVersion,
      granted: input.body.granted,
      recordedAt: new Date(),
      withdrawnAt: null,
    });
    await this.database.client.$transaction(async (tx) => {
      await tx.consentRecord.create({
        data: {
          id,
          householdId: input.householdId,
          athleteId: input.body.athleteId!,
          consentingUserId: actor.userId,
          purposeKey,
          policyVersion: input.body.policyVersion,
          granted: input.body.granted,
          recordedAt: new Date(response.recordedAt),
        },
      });
      await tx.auditEvent.create({
        data: this.audit(actor, "CONSENT_RECORDED", "ConsentRecord", id, {
          athleteId: input.body.athleteId,
          granted: input.body.granted,
          purposeKey,
          policyVersion: input.body.policyVersion,
        }),
      });
      await tx.idempotencyRecord.create({
        data: this.idempotency.record(command, response, id, 201),
      });
    });
    return response;
  }

  async withdrawConsent(input: {
    consentId: string;
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
  }) {
    const consent = await this.database.client.consentRecord.findUnique({
      where: { id: input.consentId },
    });
    if (!consent) throw this.notFound();
    const actor = await this.authorisation.household(
      input.identity,
      consent.householdId,
    );
    this.requireOwner(actor, consent.householdId);
    const command = this.command(
      actor,
      "withdraw-evidence-consent",
      input.idempotencyKey,
      { consentId: input.consentId },
    );
    const replay =
      await this.idempotency.replay<ReturnType<typeof consentDto>>(command);
    if (replay) return replay;
    const withdrawnAt = consent.withdrawnAt ?? new Date();
    const response = consentDto({ ...consent, withdrawnAt });
    await this.database.client.$transaction(async (tx) => {
      await tx.consentRecord.update({
        where: { id: consent.id },
        data: { withdrawnAt },
      });
      const affected = await tx.evidenceSubmission.findMany({
        where: {
          OR: [
            { consentRecordId: consent.id },
            { reviewConsentRecordId: consent.id },
          ],
          status: { in: ["DRAFT", "SUBMITTED", "ASSIGNED"] },
        },
        select: {
          id: true,
          mediaAssetId: true,
          assessment: { select: { id: true } },
        },
      });
      if (affected.length) {
        const evidenceIds = affected.map(({ id }) => id);
        const mediaIds = affected.map(({ mediaAssetId }) => mediaAssetId);
        await tx.evidenceSubmission.updateMany({
          where: { id: { in: evidenceIds } },
          data: { status: "WITHDRAWN", withdrawnAt, version: { increment: 1 } },
        });
        await tx.mediaAsset.updateMany({
          where: { id: { in: mediaIds }, status: { not: "DELETED" } },
          data: {
            status: "DELETION_PENDING",
            retentionExpiresAt: withdrawnAt,
            version: { increment: 1 },
          },
        });
        await tx.assessment.updateMany({
          where: {
            evidenceSubmissionId: { in: evidenceIds },
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          data: { status: "CANCELLED", version: { increment: 1 } },
        });
      }
      await tx.auditEvent.create({
        data: this.audit(
          actor,
          "CONSENT_WITHDRAWN",
          "ConsentRecord",
          consent.id,
          { purposeKey: consent.purposeKey },
        ),
      });
      await tx.outboxEvent.create({
        data: this.event(
          actor,
          "EvidenceConsentWithdrawn",
          "ConsentRecord",
          consent.id,
          { consentId: consent.id },
        ),
      });
      await tx.idempotencyRecord.create({
        data: this.idempotency.record(command, response, consent.id),
      });
    });
    return response;
  }

  async createUploadIntent(input: {
    body: {
      athleteId: string;
      nodeId: string;
      consentRecordId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      durationMs?: number | null;
      checksumSha256?: string | null;
    };
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
  }) {
    const authorised = await this.authorisation.athlete(
      input.identity,
      input.body.athleteId,
    );
    this.validateUploadDeclaration(input.body);
    await this.assertEvidenceCheckpoint(
      input.body.athleteId,
      input.body.nodeId,
    );
    await this.assertActiveConsent(
      input.body.consentRecordId,
      input.body.athleteId,
      CAPTURE_CONSENT_PURPOSE,
    );
    const command = this.command(
      authorised.actor,
      "create-evidence-upload-intent",
      input.idempotencyKey,
      input.body,
    );
    const replay = await this.idempotency.replay<{
      evidenceId: string;
      mediaAssetId: string;
    }>(command);
    if (replay) {
      const asset = await this.database.client.mediaAsset.findUnique({
        where: { id: replay.mediaAssetId },
      });
      if (
        !asset ||
        asset.status !== "UPLOADING" ||
        !asset.uploadExpiresAt ||
        asset.uploadExpiresAt <= new Date()
      ) {
        throw new ConflictException(
          "The upload intent has expired; create a replacement draft.",
        );
      }
      const grant = await this.media.createUploadGrant({
        contentType: asset.declaredMimeType,
        expiresAt: asset.uploadExpiresAt,
        objectKey: asset.objectKey,
      });
      return {
        ...replay,
        uploadUrl: grant.url,
        expiresAt: grant.expiresAt.toISOString(),
        requiredHeaders: grant.requiredHeaders,
        multipart: false,
      };
    }
    const evidenceId = randomUUID();
    const mediaAssetId = randomUUID();
    const objectKey = `evidence/${randomUUID()}/${randomUUID()}`;
    const grant = await this.media.createUploadGrant({
      contentType: input.body.mimeType,
      objectKey,
    });
    const retentionExpiresAt = new Date(
      grant.expiresAt.getTime() +
        this.config.abandonedRetentionHours * 60 * 60 * 1000,
    );
    await this.database.client.$transaction(async (tx) => {
      await tx.mediaAsset.create({
        data: {
          id: mediaAssetId,
          athleteId: input.body.athleteId,
          uploaderUserId: authorised.actor.userId,
          status: "UPLOADING",
          objectKey,
          originalName: input.body.filename,
          declaredMimeType: input.body.mimeType,
          sizeBytes: BigInt(input.body.sizeBytes),
          durationMs: input.body.durationMs ?? null,
          checksumSha256: input.body.checksumSha256?.toLowerCase() ?? null,
          retentionPolicyKey: "b1-private-evidence",
          uploadExpiresAt: grant.expiresAt,
          retentionExpiresAt,
        },
      });
      await tx.evidenceSubmission.create({
        data: {
          id: evidenceId,
          athleteId: input.body.athleteId,
          nodeId: input.body.nodeId,
          mediaAssetId,
          consentRecordId: input.body.consentRecordId,
          status: "DRAFT",
          retentionPolicyKey: "b1-private-evidence",
        },
      });
      await tx.auditEvent.create({
        data: this.audit(
          authorised.actor,
          "EVIDENCE_DRAFT_CREATED",
          "EvidenceSubmission",
          evidenceId,
          {
            athleteId: input.body.athleteId,
            mediaAssetId,
            nodeId: input.body.nodeId,
          },
        ),
      });
      await tx.idempotencyRecord.create({
        data: this.idempotency.record(
          command,
          { evidenceId, mediaAssetId },
          evidenceId,
          201,
        ),
      });
    });
    return {
      evidenceId,
      mediaAssetId,
      uploadUrl: grant.url,
      expiresAt: grant.expiresAt.toISOString(),
      requiredHeaders: grant.requiredHeaders,
      multipart: false,
    };
  }

  async completeUpload(input: {
    body: { checksumSha256: string };
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
    mediaAssetId: string;
  }) {
    if (!/^[a-f\d]{64}$/i.test(input.body.checksumSha256))
      throw new BadRequestException(
        "checksumSha256 must be a hexadecimal SHA-256 value.",
      );
    const record = await this.database.client.mediaAsset.findUnique({
      where: { id: input.mediaAssetId },
      include: { athlete: { select: { householdId: true } } },
    });
    if (!record) throw this.notFound();
    const actor = await this.authorisation.household(
      input.identity,
      record.athlete.householdId,
    );
    const command = this.command(
      actor,
      "complete-evidence-upload",
      input.idempotencyKey,
      { mediaAssetId: input.mediaAssetId, ...input.body },
    );
    const replay =
      await this.idempotency.replay<ReturnType<typeof mediaDto>>(command);
    if (replay) return replay;
    if (record.status !== "UPLOADING")
      throw new ConflictException(
        "Only an uploading media asset can be completed.",
      );
    if (!record.uploadExpiresAt || record.uploadExpiresAt <= new Date())
      throw new ConflictException("The upload intent has expired.");
    const head = await this.media.headObject(record.objectKey);
    if (!head)
      throw new ConflictException("The uploaded object was not found.");
    if (head.contentLength !== Number(record.sizeBytes))
      throw new ConflictException(
        "The uploaded object size does not match the intent.",
      );
    if (head.contentType !== "video/mp4")
      throw new ConflictException(
        "The uploaded object content type is unsupported.",
      );
    const updated = await this.database.client.$transaction(async (tx) => {
      const guarded = await tx.mediaAsset.updateMany({
        where: { id: record.id, status: "UPLOADING", version: record.version },
        data: {
          status: "UPLOADED",
          checksumSha256: input.body.checksumSha256.toLowerCase(),
          version: { increment: 1 },
        },
      });
      if (guarded.count !== 1)
        throw new ConflictException("The media asset changed concurrently.");
      const asset = await tx.mediaAsset.findUniqueOrThrow({
        where: { id: record.id },
      });
      const response = mediaDto(asset);
      await tx.outboxEvent.create({
        data: this.event(actor, "MediaUploaded", "MediaAsset", record.id, {
          mediaAssetId: record.id,
        }),
      });
      await tx.idempotencyRecord.create({
        data: this.idempotency.record(command, response, record.id, 202),
      });
      return response;
    });
    return updated;
  }

  async getEvidence(identity: AuthenticatedIdentity, evidenceId: string) {
    const { evidence } = await this.authoriseEvidence(identity, evidenceId);
    return evidenceDto(evidence);
  }

  async createPlaybackGrant(input: {
    evidenceId: string;
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
  }) {
    const authorised = await this.authoriseEvidence(
      input.identity,
      input.evidenceId,
    );
    if (
      authorised.evidence.status === "WITHDRAWN" ||
      authorised.evidence.status === "DELETED"
    )
      throw this.notFound();
    if (authorised.evidence.mediaAsset.status !== "READY")
      throw new ConflictException("Evidence is not ready for playback.");
    await this.assertActiveConsent(
      authorised.evidence.consentRecordId,
      authorised.evidence.athleteId,
      CAPTURE_CONSENT_PURPOSE,
    );
    if (authorised.kind === "coach") {
      if (!authorised.evidence.reviewConsentRecordId) throw this.notFound();
      await this.assertActiveConsent(
        authorised.evidence.reviewConsentRecordId,
        authorised.evidence.athleteId,
        REVIEW_CONSENT_PURPOSE,
      );
    }
    const command = this.command(
      authorised.actor,
      "create-evidence-playback-grant",
      input.idempotencyKey,
      { evidenceId: input.evidenceId },
    );
    const replay = await this.idempotency.replay<{ expiresAt: string }>(
      command,
    );
    const expiresAt = replay
      ? new Date(replay.expiresAt)
      : new Date(Date.now() + this.config.playbackGrantSeconds * 1000);
    if (expiresAt <= new Date())
      throw new ConflictException(
        "The playback grant has expired; request a new grant.",
      );
    const grant = await this.media.createPlaybackGrant(
      authorised.evidence.mediaAsset.objectKey,
      expiresAt,
    );
    if (!replay) {
      await this.database.client.$transaction([
        this.database.client.auditEvent.create({
          data: this.audit(
            authorised.actor,
            "EVIDENCE_PLAYBACK_GRANTED",
            "EvidenceSubmission",
            input.evidenceId,
            { accessType: authorised.kind },
          ),
        }),
        this.database.client.idempotencyRecord.create({
          data: this.idempotency.record(
            command,
            { expiresAt: grant.expiresAt.toISOString() },
            input.evidenceId,
            201,
          ),
        }),
      ]);
    }
    return { url: grant.url, expiresAt: grant.expiresAt.toISOString() };
  }

  async submitEvidence(input: {
    body: { evidenceId: string; reviewConsentRecordId: string };
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
  }) {
    const authorised = await this.authoriseEvidence(
      input.identity,
      input.body.evidenceId,
      true,
    );
    if (authorised.kind !== "parent") throw this.notFound();
    const evidence = authorised.evidence;
    await this.assertActiveConsent(
      evidence.consentRecordId,
      evidence.athleteId,
      CAPTURE_CONSENT_PURPOSE,
    );
    await this.assertActiveConsent(
      input.body.reviewConsentRecordId,
      evidence.athleteId,
      REVIEW_CONSENT_PURPOSE,
    );
    const command = this.command(
      authorised.actor,
      "submit-evidence",
      input.idempotencyKey,
      input.body,
    );
    const replay =
      await this.idempotency.replay<ReturnType<typeof evidenceDto>>(command);
    if (replay) return replay;
    if (evidence.status !== "DRAFT" || evidence.mediaAsset.status !== "READY")
      throw new ConflictException(
        "Only READY draft evidence can be submitted.",
      );
    const rubric = await this.database.client.assessmentRubric.findFirst({
      where: { nodeId: evidence.nodeId, assessmentType: "ASYNC_VIDEO" },
      include: { criteria: { orderBy: { sortOrder: "asc" } } },
      orderBy: { version: "desc" },
    });
    if (!rubric)
      throw new ConflictException(
        "The checkpoint assessment rubric is unavailable.",
      );
    const assessmentId = randomUUID();
    return this.database.client.$transaction(async (tx) => {
      const guarded = await tx.evidenceSubmission.updateMany({
        where: { id: evidence.id, status: "DRAFT", version: evidence.version },
        data: {
          reviewConsentRecordId: input.body.reviewConsentRecordId,
          status: "SUBMITTED",
          submittedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (guarded.count !== 1)
        throw new ConflictException("The evidence changed concurrently.");
      await tx.assessment.create({
        data: {
          id: assessmentId,
          athleteId: evidence.athleteId,
          evidenceSubmissionId: evidence.id,
          rubricId: rubric.id,
          type: "ASYNC_VIDEO",
          status: "UNASSIGNED",
          rubricSnapshot: asJson({
            key: rubric.key,
            version: rubric.version,
            evidenceInstructions: rubric.evidenceInstructions,
            passRule: rubric.passRule,
            criteria: rubric.criteria.map((criterion) => ({
              id: criterion.id,
              key: criterion.key,
              name: criterion.name,
              description: criterion.description,
              isCritical: criterion.isCritical,
              scaleAnchors: criterion.scaleAnchors,
            })),
          }),
        },
      });
      const progress = await tx.athleteSkillProgress.updateMany({
        where: {
          athleteId: evidence.athleteId,
          nodeId: evidence.nodeId,
          state: "EVIDENCE_PENDING",
        },
        data: { state: "REVIEW_PENDING", stateVersion: { increment: 1 } },
      });
      if (progress.count !== 1)
        throw new ConflictException(
          "The checkpoint progression state changed concurrently.",
        );
      const saved = await tx.evidenceSubmission.findUniqueOrThrow({
        where: { id: evidence.id },
        include: {
          mediaAsset: true,
          assessment: {
            select: {
              id: true,
              assignedCoach: {
                select: {
                  userId: true,
                  status: true,
                  user: { select: { mfaSatisfied: true } },
                },
              },
            },
          },
        },
      });
      const response = evidenceDto(saved);
      await tx.outboxEvent.create({
        data: this.event(
          authorised.actor,
          "AssessmentRequested",
          "EvidenceSubmission",
          evidence.id,
          {
            assessmentId,
            athleteId: evidence.athleteId,
            evidenceId: evidence.id,
            nodeId: evidence.nodeId,
          },
        ),
      });
      await tx.auditEvent.create({
        data: this.audit(
          authorised.actor,
          "EVIDENCE_SUBMITTED",
          "EvidenceSubmission",
          evidence.id,
          {
            assessmentId,
            athleteId: evidence.athleteId,
            nodeId: evidence.nodeId,
          },
        ),
      });
      await tx.idempotencyRecord.create({
        data: this.idempotency.record(command, response, evidence.id, 201),
      });
      return response;
    });
  }

  async requestDeletion(input: {
    evidenceId: string;
    identity: AuthenticatedIdentity;
    idempotencyKey: string;
  }) {
    const authorised = await this.authoriseEvidence(
      input.identity,
      input.evidenceId,
      true,
    );
    if (authorised.kind !== "parent") throw this.notFound();
    this.requireOwner(
      authorised.actor,
      authorised.evidence.athlete.householdId,
    );
    const command = this.command(
      authorised.actor,
      "request-evidence-deletion",
      input.idempotencyKey,
      { evidenceId: input.evidenceId },
    );
    const replay =
      await this.idempotency.replay<ReturnType<typeof evidenceDto>>(command);
    if (replay) return replay;
    if (authorised.evidence.status === "DELETED") throw this.notFound();
    const now = new Date();
    const withdrawActiveAttempt = ["DRAFT", "SUBMITTED", "ASSIGNED"].includes(
      authorised.evidence.status,
    );
    return this.database.client.$transaction(async (tx) => {
      const guarded = await tx.evidenceSubmission.updateMany({
        where: { id: input.evidenceId, version: authorised.evidence.version },
        data: {
          deletionRequestedAt: now,
          status: withdrawActiveAttempt
            ? "WITHDRAWN"
            : authorised.evidence.status,
          withdrawnAt: withdrawActiveAttempt
            ? now
            : authorised.evidence.withdrawnAt,
          version: { increment: 1 },
        },
      });
      if (guarded.count !== 1)
        throw new ConflictException("The evidence changed concurrently.");
      await tx.mediaAsset.update({
        where: { id: authorised.evidence.mediaAssetId },
        data: {
          status: "DELETION_PENDING",
          retentionExpiresAt: now,
          version: { increment: 1 },
        },
      });
      if (withdrawActiveAttempt) {
        await tx.assessment.updateMany({
          where: {
            evidenceSubmissionId: input.evidenceId,
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          data: { status: "CANCELLED", version: { increment: 1 } },
        });
      }
      const saved = await tx.evidenceSubmission.findUniqueOrThrow({
        where: { id: input.evidenceId },
        include: {
          mediaAsset: true,
          assessment: {
            select: {
              id: true,
              assignedCoach: {
                select: {
                  userId: true,
                  status: true,
                  user: { select: { mfaSatisfied: true } },
                },
              },
            },
          },
        },
      });
      const response = evidenceDto(saved);
      await tx.outboxEvent.create({
        data: this.event(
          authorised.actor,
          "EvidenceDeletionRequested",
          "EvidenceSubmission",
          input.evidenceId,
          {
            evidenceId: input.evidenceId,
            mediaAssetId: authorised.evidence.mediaAssetId,
          },
        ),
      });
      await tx.auditEvent.create({
        data: this.audit(
          authorised.actor,
          "EVIDENCE_DELETION_REQUESTED",
          "EvidenceSubmission",
          input.evidenceId,
          {},
        ),
      });
      await tx.idempotencyRecord.create({
        data: this.idempotency.record(command, response, input.evidenceId, 202),
      });
      return response;
    });
  }

  private async authoriseEvidence(
    identity: AuthenticatedIdentity,
    evidenceId: string,
    parentOnly = false,
  ) {
    const evidence = await this.database.client.evidenceSubmission.findUnique({
      where: { id: evidenceId },
      include: {
        athlete: { select: { householdId: true } },
        mediaAsset: true,
        assessment: {
          select: {
            id: true,
            assignedCoach: {
              select: {
                userId: true,
                status: true,
                user: { select: { mfaSatisfied: true } },
              },
            },
          },
        },
      },
    });
    if (!evidence) throw this.notFound();
    const actor = await this.authorisation.actor(identity);
    if (actor.householdIds.includes(evidence.athlete.householdId)) {
      await this.authorisation.household(
        identity,
        evidence.athlete.householdId,
      );
      return { actor, evidence, kind: "parent" as const };
    }
    if (
      !parentOnly &&
      evidence.assessment?.assignedCoach?.userId === actor.userId &&
      evidence.assessment.assignedCoach.status === "ACTIVE" &&
      evidence.assessment.assignedCoach.user.mfaSatisfied
    ) {
      return { actor, evidence, kind: "coach" as const };
    }
    throw this.notFound();
  }

  private async assertActiveConsent(
    consentId: string,
    athleteId: string,
    purposeKey: ConsentPurpose,
  ) {
    const consent = await this.database.client.consentRecord.findUnique({
      where: { id: consentId },
    });
    if (
      !consent ||
      !isActiveConsent(consent, {
        athleteId,
        policyVersion: B1_CONSENT_POLICY_VERSION,
        purposeKey,
      })
    ) {
      throw new ConflictException(
        `${purposeKey} consent is required and must be active.`,
      );
    }
    const latest = await this.database.client.consentRecord.findFirst({
      where: { athleteId, householdId: consent.householdId, purposeKey },
      orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
      select: { id: true },
    });
    if (latest?.id !== consent.id)
      throw new ConflictException(
        `${purposeKey} consent is no longer current.`,
      );
    return consent;
  }

  private async assertAthleteHousehold(athleteId: string, householdId: string) {
    const athlete = await this.database.client.athlete.findFirst({
      where: { id: athleteId, householdId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!athlete) throw this.notFound();
  }

  private async assertEvidenceCheckpoint(athleteId: string, nodeId: string) {
    const progress = await this.database.client.athleteSkillProgress.findUnique(
      {
        where: { athleteId_nodeId: { athleteId, nodeId } },
        include: { node: { select: { type: true, completionRule: true } } },
      },
    );
    const rule = progress?.node.completionRule as
      | { requiresEvidence?: boolean }
      | undefined;
    if (
      !progress ||
      progress.state !== "EVIDENCE_PENDING" ||
      progress.node.type !== "CHECKPOINT" ||
      rule?.requiresEvidence !== true
    ) {
      throw new ConflictException(
        "This athlete checkpoint is not ready for evidence.",
      );
    }
  }

  private validateUploadDeclaration(body: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    durationMs?: number | null;
    checksumSha256?: string | null;
  }) {
    if (!body.filename.trim() || body.filename.length > 255)
      throw new BadRequestException("A valid filename is required.");
    if (body.mimeType !== "video/mp4")
      throw new BadRequestException(
        "Only MP4/H.264 pilot evidence is supported.",
      );
    if (
      !Number.isSafeInteger(body.sizeBytes) ||
      body.sizeBytes < 1 ||
      body.sizeBytes > this.config.maximumBytes
    )
      throw new BadRequestException(
        `Evidence must be no larger than ${this.config.maximumBytes} bytes.`,
      );
    if (
      body.durationMs != null &&
      (!Number.isSafeInteger(body.durationMs) ||
        body.durationMs < 1 ||
        body.durationMs > this.config.maximumDurationMs)
    )
      throw new BadRequestException(
        `Evidence must be no longer than ${this.config.maximumDurationMs} milliseconds.`,
      );
    if (body.checksumSha256 && !/^[a-f\d]{64}$/i.test(body.checksumSha256))
      throw new BadRequestException(
        "checksumSha256 must be a hexadecimal SHA-256 value.",
      );
  }

  private purpose(value: string): ConsentPurpose {
    if (value !== CAPTURE_CONSENT_PURPOSE && value !== REVIEW_CONSENT_PURPOSE)
      throw new BadRequestException("Unsupported evidence consent purpose.");
    return value;
  }

  private requireOwner(actor: AuthorisedActor, householdId: string) {
    if (actor.householdRoles[householdId] !== "OWNER")
      throw new ForbiddenException(
        "Only a household owner may perform this action.",
      );
  }

  private command(
    actor: AuthorisedActor,
    operation: string,
    key: string,
    request: unknown,
  ): IdempotencyCommand {
    return { actorId: actor.userId, operation, key, request };
  }

  private audit(
    actor: AuthorisedActor,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ): Prisma.AuditEventCreateInput {
    return {
      id: randomUUID(),
      actorId: actor.userId,
      action,
      resourceType,
      resourceId,
      correlationId: randomUUID(),
      safeMetadata: asJson(metadata),
      occurredAt: new Date(),
    };
  }

  private event(
    actor: AuthorisedActor,
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, unknown>,
  ): Prisma.OutboxEventCreateInput {
    return {
      id: randomUUID(),
      eventType,
      eventVersion: 1,
      aggregateType,
      aggregateId,
      actorId: actor.userId,
      correlationId: randomUUID(),
      payload: asJson(payload),
      occurredAt: new Date(),
    };
  }

  private notFound() {
    return new NotFoundException("The requested resource was not found.");
  }
}

const consentDto = (consent: {
  id: string;
  householdId: string;
  athleteId: string | null;
  purposeKey: string;
  policyVersion: string;
  granted: boolean;
  recordedAt: Date;
  withdrawnAt: Date | null;
}) => ({
  id: consent.id,
  householdId: consent.householdId,
  athleteId: consent.athleteId,
  purposeKey: consent.purposeKey,
  policyVersion: consent.policyVersion,
  granted: consent.granted,
  recordedAt: consent.recordedAt.toISOString(),
  withdrawnAt: consent.withdrawnAt?.toISOString() ?? null,
});

const mediaDto = (asset: {
  id: string;
  athleteId: string;
  status: string;
  rejectionCode: string | null;
  sizeBytes: bigint;
  durationMs: number | null;
  version: number;
  createdAt: Date;
  readyAt: Date | null;
  uploadExpiresAt: Date | null;
  retentionExpiresAt: Date | null;
}) => ({
  id: asset.id,
  athleteId: asset.athleteId,
  status: asset.status,
  rejectionCode: asset.rejectionCode,
  sizeBytes: Number(asset.sizeBytes),
  durationMs: asset.durationMs,
  version: asset.version,
  createdAt: asset.createdAt.toISOString(),
  readyAt: asset.readyAt?.toISOString() ?? null,
  uploadExpiresAt: asset.uploadExpiresAt?.toISOString() ?? null,
  retentionExpiresAt: asset.retentionExpiresAt?.toISOString() ?? null,
});

const evidenceDto = (evidence: {
  id: string;
  athleteId: string;
  nodeId: string;
  mediaAssetId: string;
  consentRecordId: string;
  reviewConsentRecordId: string | null;
  status: string;
  version: number;
  createdAt: Date;
  submittedAt: Date | null;
  withdrawnAt: Date | null;
  deletionRequestedAt: Date | null;
  deletedAt: Date | null;
  mediaAsset: Parameters<typeof mediaDto>[0];
  assessment: { id: string } | null;
}) => ({
  id: evidence.id,
  athleteId: evidence.athleteId,
  nodeId: evidence.nodeId,
  mediaAssetId: evidence.mediaAssetId,
  consentRecordId: evidence.consentRecordId,
  reviewConsentRecordId: evidence.reviewConsentRecordId,
  status: evidence.status,
  media: mediaDto(evidence.mediaAsset),
  version: evidence.version,
  assessmentId: evidence.assessment?.id ?? null,
  createdAt: evidence.createdAt.toISOString(),
  submittedAt: evidence.submittedAt?.toISOString() ?? null,
  withdrawnAt: evidence.withdrawnAt?.toISOString() ?? null,
  deletionRequestedAt: evidence.deletionRequestedAt?.toISOString() ?? null,
  deletedAt: evidence.deletedAt?.toISOString() ?? null,
});
