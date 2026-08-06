import "reflect-metadata";

import { execFileSync } from "node:child_process";

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { PrivateMediaStore } from "@nextstep/media";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "./app.module.js";
import { stableUuid } from "./development-flow.repository.js";
import { B1_CONSENT_POLICY_VERSION } from "./evidence.service.js";
import { PRIVATE_MEDIA_STORE } from "./media.provider.js";
import { PrismaService } from "./prisma.service.js";

class MemoryMediaStore implements PrivateMediaStore {
  objects = new Map<string, Uint8Array>();

  async createUploadGrant(input: {
    contentType: string;
    expiresAt?: Date;
    objectKey: string;
  }) {
    return {
      expiresAt: input.expiresAt ?? new Date(Date.now() + 900_000),
      requiredHeaders: { "content-type": input.contentType },
      url: `http://private.invalid/upload/${encodeURIComponent(input.objectKey)}`,
    };
  }

  async createPlaybackGrant(objectKey: string, expiresAt?: Date) {
    return {
      expiresAt: expiresAt ?? new Date(Date.now() + 300_000),
      url: `http://private.invalid/play/${encodeURIComponent(objectKey)}`,
    };
  }

  async deleteObject(objectKey: string) {
    this.objects.delete(objectKey);
  }

  async getObject(objectKey: string) {
    const value = this.objects.get(objectKey) ?? new Uint8Array();
    return (async function* () {
      yield value;
    })();
  }

  async headObject(objectKey: string) {
    const value = this.objects.get(objectKey);
    return value
      ? { contentLength: value.byteLength, contentType: "video/mp4" }
      : null;
  }
}

describe("Checkpoint B1 private evidence authorisation and integration", () => {
  const athleteId = stableUuid("checkpoint-a:athlete:mason");
  const nodeId = stableUuid(
    "checkpoint-a:node:foundation.ball.bilateral-control-check",
  );
  const householdId = stableUuid("checkpoint-a:household:mason");
  const otherHouseholdId = stableUuid("checkpoint-a:household:other");
  const ownerHeaders = {
    "x-actor-id": "checkpoint-a-parent",
    "x-household-id": householdId,
  };
  const otherHeaders = {
    "x-actor-id": "checkpoint-a-other-parent",
    "x-household-id": otherHouseholdId,
  };
  const caregiverHeaders = {
    "x-actor-id": "checkpoint-b1-caregiver",
    "x-household-id": householdId,
  };
  let app: INestApplication;
  let media: MemoryMediaStore;
  let database: PrismaService;

  beforeEach(async () => {
    media = new MemoryMediaStore();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PRIVATE_MEDIA_STORE)
      .useValue(media)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
    database = app.get(PrismaService);
    execFileSync(
      process.execPath,
      ["--import", "tsx", "src/checkpoint-b1.seed.ts"],
      {
        cwd: process.cwd(),
        env: { ...process.env, NEXTSTEP_DEMO_MODE: "enabled" },
        stdio: "pipe",
      },
    );
  });

  afterEach(async () => {
    await database.client.coachProfile.deleteMany({
      where: {
        user: {
          identityProviderKey: {
            in: [
              "local:checkpoint-b1-assigned-coach",
              "local:checkpoint-b1-other-coach",
            ],
          },
        },
      },
    });
    await database.client.user.deleteMany({
      where: {
        identityProviderKey: {
          in: [
            "local:checkpoint-b1-assigned-coach",
            "local:checkpoint-b1-other-coach",
          ],
        },
      },
    });
    await app.close();
  });

  const consent = (
    purposeKey:
      | "PRIVATE_EVIDENCE_CAPTURE_UPLOAD"
      | "ASSIGNED_COACH_EVIDENCE_REVIEW",
    key: string,
    headers = ownerHeaders,
  ) =>
    request(app.getHttpServer())
      .post(`/v1/households/${householdId}/consents`)
      .set(headers)
      .set("Idempotency-Key", key)
      .send({
        athleteId,
        purposeKey,
        policyVersion: B1_CONSENT_POLICY_VERSION,
        granted: true,
      });

  const intent = async (
    consentRecordId: string,
    key: string,
    headers = ownerHeaders,
  ) => {
    const bytes = Buffer.alloc(80);
    const response = await request(app.getHttpServer())
      .post("/v1/evidence/upload-intents")
      .set(headers)
      .set("Idempotency-Key", key)
      .send({
        athleteId,
        nodeId,
        consentRecordId,
        filename: "synthetic.mp4",
        mimeType: "video/mp4",
        sizeBytes: bytes.byteLength,
      })
      .expect(201);
    const stored = await database.client.mediaAsset.findUniqueOrThrow({
      where: { id: response.body.mediaAssetId },
    });
    media.objects.set(stored.objectKey, bytes);
    return response.body as {
      evidenceId: string;
      mediaAssetId: string;
      expiresAt: string;
    };
  };

  it("sequences capture consent, private draft playback, review consent, and submission", async () => {
    await request(app.getHttpServer())
      .post("/v1/evidence/upload-intents")
      .set(ownerHeaders)
      .set("Idempotency-Key", "missing-capture")
      .send({
        athleteId,
        nodeId,
        consentRecordId: crypto.randomUUID(),
        filename: "synthetic.mp4",
        mimeType: "video/mp4",
        sizeBytes: 80,
      })
      .expect(409);

    const capture = await consent(
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "capture-consent",
    ).expect(201);
    const created = await intent(capture.body.id, "private-draft");
    const stored = await database.client.mediaAsset.findUniqueOrThrow({
      where: { id: created.mediaAssetId },
    });
    expect(stored.objectKey).toMatch(/^evidence\/[0-9a-f-]+\/[0-9a-f-]+$/);
    expect(stored.objectKey).not.toContain(athleteId);
    expect(stored.objectKey).not.toContain("synthetic.mp4");

    await database.client.mediaAsset.update({
      where: { id: created.mediaAssetId },
      data: {
        status: "READY",
        detectedMimeType: "video/mp4",
        durationMs: 2_000,
        readyAt: new Date(),
      },
    });
    const playback = await request(app.getHttpServer())
      .post(`/v1/evidence-submissions/${created.evidenceId}/playback-grants`)
      .set(ownerHeaders)
      .set("Idempotency-Key", "draft-playback")
      .expect(201);
    expect(playback.body.url).toContain("private.invalid/play");
    expect(
      new Date(playback.body.expiresAt).getTime() - Date.now(),
    ).toBeLessThanOrEqual(300_000);

    await request(app.getHttpServer())
      .post("/v1/evidence-submissions")
      .set(ownerHeaders)
      .set("Idempotency-Key", "missing-review")
      .send({
        evidenceId: created.evidenceId,
        reviewConsentRecordId: crypto.randomUUID(),
      })
      .expect(409);
    const review = await consent(
      "ASSIGNED_COACH_EVIDENCE_REVIEW",
      "review-consent",
    ).expect(201);
    const submitted = await request(app.getHttpServer())
      .post("/v1/evidence-submissions")
      .set(ownerHeaders)
      .set("Idempotency-Key", "submit-ready")
      .send({
        evidenceId: created.evidenceId,
        reviewConsentRecordId: review.body.id,
      })
      .expect(201);
    expect(submitted.body).toMatchObject({
      status: "SUBMITTED",
      reviewConsentRecordId: review.body.id,
    });
    expect(submitted.body.assessmentId).toEqual(expect.any(String));
    const replayed = await request(app.getHttpServer())
      .post("/v1/evidence-submissions")
      .set(ownerHeaders)
      .set("Idempotency-Key", "submit-ready")
      .send({
        evidenceId: created.evidenceId,
        reviewConsentRecordId: review.body.id,
      })
      .expect(201);
    expect(replayed.body).toEqual(submitted.body);
  });

  it("denies cross-household access and new playback after capture withdrawal", async () => {
    const capture = await consent(
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "capture-withdraw",
    ).expect(201);
    const created = await intent(capture.body.id, "withdraw-draft");
    await database.client.mediaAsset.update({
      where: { id: created.mediaAssetId },
      data: { status: "READY", readyAt: new Date() },
    });
    await request(app.getHttpServer())
      .get(`/v1/evidence-submissions/${created.evidenceId}`)
      .set(otherHeaders)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/v1/consents/${capture.body.id}/withdraw`)
      .set(ownerHeaders)
      .set("Idempotency-Key", "withdraw-capture")
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/evidence-submissions/${created.evidenceId}/playback-grants`)
      .set(ownerHeaders)
      .set("Idempotency-Key", "play-after-withdraw")
      .expect(404);
    const asset = await database.client.mediaAsset.findUniqueOrThrow({
      where: { id: created.mediaAssetId },
    });
    expect(asset.status).toBe("DELETION_PENDING");
  });

  it("rejects completion after upload expiry", async () => {
    const capture = await consent(
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "capture-expired",
    ).expect(201);
    const created = await intent(capture.body.id, "expired-intent");
    await database.client.mediaAsset.update({
      where: { id: created.mediaAssetId },
      data: { uploadExpiresAt: new Date(Date.now() - 1_000) },
    });
    await request(app.getHttpServer())
      .post(`/v1/evidence/upload-intents/${created.mediaAssetId}/complete`)
      .set(ownerHeaders)
      .set("Idempotency-Key", "complete-expired")
      .send({ checksumSha256: "0".repeat(64) })
      .expect(409);
    await request(app.getHttpServer())
      .post("/v1/evidence/upload-intents")
      .set(ownerHeaders)
      .set("Idempotency-Key", "expired-intent")
      .send({
        athleteId,
        nodeId,
        consentRecordId: capture.body.id,
        filename: "synthetic.mp4",
        mimeType: "video/mp4",
        sizeBytes: 80,
      })
      .expect(409);
  });

  it("replays an upload intent without persisting its signed URL", async () => {
    const capture = await consent(
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "capture-replay",
    ).expect(201);
    const created = await intent(capture.body.id, "replay-private-draft");
    const replayed = await request(app.getHttpServer())
      .post("/v1/evidence/upload-intents")
      .set(ownerHeaders)
      .set("Idempotency-Key", "replay-private-draft")
      .send({
        athleteId,
        nodeId,
        consentRecordId: capture.body.id,
        filename: "synthetic.mp4",
        mimeType: "video/mp4",
        sizeBytes: 80,
      })
      .expect(201);
    expect(replayed.body).toMatchObject({
      evidenceId: created.evidenceId,
      mediaAssetId: created.mediaAssetId,
    });
    const persisted = await database.client.idempotencyRecord.findFirstOrThrow({
      where: {
        key: "replay-private-draft",
        operation: "create-evidence-upload-intent",
      },
    });
    expect(JSON.stringify(persisted.responseBody)).not.toContain("uploadUrl");
    expect(JSON.stringify(persisted.responseBody)).not.toContain("X-Amz-");
  });

  it("authorises only the assigned active MFA coach while review consent is active", async () => {
    const capture = await consent(
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "capture-coach-playback",
    ).expect(201);
    const created = await intent(capture.body.id, "coach-playback-draft");
    await database.client.mediaAsset.update({
      where: { id: created.mediaAssetId },
      data: { status: "READY", readyAt: new Date() },
    });
    const review = await consent(
      "ASSIGNED_COACH_EVIDENCE_REVIEW",
      "review-coach-playback",
    ).expect(201);
    const submitted = await request(app.getHttpServer())
      .post("/v1/evidence-submissions")
      .set(ownerHeaders)
      .set("Idempotency-Key", "submit-for-coach-playback")
      .send({
        evidenceId: created.evidenceId,
        reviewConsentRecordId: review.body.id,
      })
      .expect(201);
    const coachUser = await database.client.user.upsert({
      where: { identityProviderKey: "local:checkpoint-b1-assigned-coach" },
      update: { mfaSatisfied: true, status: "ACTIVE" },
      create: {
        identityProviderKey: "local:checkpoint-b1-assigned-coach",
        displayName: "Synthetic assigned coach",
        mfaSatisfied: true,
      },
    });
    const coach = await database.client.coachProfile.upsert({
      where: { userId: coachUser.id },
      update: { status: "ACTIVE" },
      create: {
        userId: coachUser.id,
        status: "ACTIVE",
        identityVerifiedAt: new Date(),
        calibrationPassedAt: new Date(),
      },
    });
    const otherCoachUser = await database.client.user.upsert({
      where: { identityProviderKey: "local:checkpoint-b1-other-coach" },
      update: { mfaSatisfied: true, status: "ACTIVE" },
      create: {
        identityProviderKey: "local:checkpoint-b1-other-coach",
        displayName: "Synthetic unassigned coach",
        mfaSatisfied: true,
      },
    });
    await database.client.coachProfile.upsert({
      where: { userId: otherCoachUser.id },
      update: { status: "ACTIVE" },
      create: { userId: otherCoachUser.id, status: "ACTIVE" },
    });
    await database.client.$transaction([
      database.client.assessment.update({
        where: { id: submitted.body.assessmentId },
        data: {
          assignedCoachId: coach.id,
          assignedAt: new Date(),
          status: "ASSIGNED",
        },
      }),
      database.client.evidenceSubmission.update({
        where: { id: created.evidenceId },
        data: { status: "ASSIGNED" },
      }),
    ]);
    const coachHeaders = { "x-actor-id": "checkpoint-b1-assigned-coach" };
    const playback = await request(app.getHttpServer())
      .post(`/v1/evidence-submissions/${created.evidenceId}/playback-grants`)
      .set(coachHeaders)
      .set("Idempotency-Key", "assigned-coach-playback")
      .expect(201);
    expect(
      new Date(playback.body.expiresAt).getTime() - Date.now(),
    ).toBeLessThanOrEqual(300_000);
    await request(app.getHttpServer())
      .post(`/v1/evidence-submissions/${created.evidenceId}/playback-grants`)
      .set("x-actor-id", "checkpoint-b1-other-coach")
      .set("Idempotency-Key", "unassigned-coach-playback")
      .expect(404);
    await request(app.getHttpServer())
      .post(`/v1/consents/${review.body.id}/withdraw`)
      .set(ownerHeaders)
      .set("Idempotency-Key", "withdraw-review-consent")
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/evidence-submissions/${created.evidenceId}/playback-grants`)
      .set(coachHeaders)
      .set("Idempotency-Key", "coach-playback-after-withdrawal")
      .expect(404);
  });

  it("allows a caregiver to upload and submit but denies withdrawal and deletion", async () => {
    const capture = await consent(
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "caregiver-capture",
      caregiverHeaders,
    ).expect(201);
    const created = await intent(
      capture.body.id,
      "caregiver-draft",
      caregiverHeaders,
    );
    await database.client.mediaAsset.update({
      where: { id: created.mediaAssetId },
      data: { status: "READY", readyAt: new Date() },
    });
    const review = await consent(
      "ASSIGNED_COACH_EVIDENCE_REVIEW",
      "caregiver-review",
      caregiverHeaders,
    ).expect(201);
    await request(app.getHttpServer())
      .post("/v1/evidence-submissions")
      .set(caregiverHeaders)
      .set("Idempotency-Key", "caregiver-submit")
      .send({
        evidenceId: created.evidenceId,
        reviewConsentRecordId: review.body.id,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/consents/${capture.body.id}/withdraw`)
      .set(caregiverHeaders)
      .set("Idempotency-Key", "caregiver-withdraw")
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/v1/evidence-submissions/${created.evidenceId}`)
      .set(caregiverHeaders)
      .set("Idempotency-Key", "caregiver-delete")
      .expect(403);
  });
});
