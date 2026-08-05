import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createPrismaClient } from "@nextstep/database";
import {
  DeterministicLocalScanner,
  mediaConfiguration,
  type PrivateMediaStore,
} from "@nextstep/media";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaJobs } from "./media-jobs.js";

class MemoryStore implements PrivateMediaStore {
  beforeGet?: () => Promise<void>;
  objects = new Map<string, Uint8Array>();
  async createUploadGrant(input: {
    contentType: string;
    expiresAt?: Date;
    objectKey: string;
  }) {
    return {
      expiresAt: input.expiresAt ?? new Date(),
      requiredHeaders: { "content-type": input.contentType },
      url: "http://private.invalid/upload",
    };
  }
  async createPlaybackGrant(_objectKey: string, expiresAt?: Date) {
    return {
      expiresAt: expiresAt ?? new Date(),
      url: "http://private.invalid/play",
    };
  }
  async deleteObject(objectKey: string) {
    this.objects.delete(objectKey);
  }
  async getObject(objectKey: string) {
    await this.beforeGet?.();
    const bytes = this.objects.get(objectKey) ?? new Uint8Array();
    return (async function* () {
      yield bytes;
    })();
  }
  async headObject(objectKey: string) {
    const bytes = this.objects.get(objectKey);
    return bytes
      ? { contentLength: bytes.byteLength, contentType: "video/mp4" }
      : null;
  }
}

describe("restart-durable B1 media jobs", () => {
  const database = createPrismaClient();
  const ownedConsentIds = new Set<string>();
  const ownedEventIds = new Set<string>();
  const ownedMediaIds = new Set<string>();

  beforeEach(() => {
    execFileSync(
      process.execPath,
      ["--import", "tsx", "src/checkpoint-b1.seed.ts"],
      {
        cwd: resolve(process.cwd(), "../api"),
        env: { ...process.env, NEXTSTEP_DEMO_MODE: "enabled" },
        stdio: "pipe",
      },
    );
  });

  afterEach(async () => {
    const eventIds = [...ownedEventIds];
    const mediaIds = [...ownedMediaIds];
    await database.processedEvent.deleteMany({
      where: { eventId: { in: eventIds } },
    });
    await database.outboxEvent.deleteMany({
      where: {
        OR: [
          { id: { in: eventIds } },
          { aggregateId: { in: mediaIds }, aggregateType: "MediaAsset" },
          { causationId: { in: eventIds } },
        ],
      },
    });
    await database.evidenceSubmission.deleteMany({
      where: { mediaAssetId: { in: mediaIds } },
    });
    await database.mediaAsset.deleteMany({ where: { id: { in: mediaIds } } });
    await database.consentRecord.deleteMany({
      where: { id: { in: [...ownedConsentIds] } },
    });
    await database.$disconnect();
  });

  it("validates a queued synthetic MP4 and physically deletes a withdrawn draft", async () => {
    const bytes = await readFile(
      resolve(
        process.cwd(),
        "../web/e2e/fixtures/evidence/bilateral-control-synthetic.mp4",
      ),
    );
    const athlete = await database.athlete.findFirstOrThrow({
      where: { displayName: "Mason Johnson" },
    });
    const node = await database.skillNode.findFirstOrThrow({
      where: { key: "foundation.ball.bilateral-control-check" },
    });
    const user = await database.user.findUniqueOrThrow({
      where: { identityProviderKey: "local:checkpoint-a-parent" },
    });
    const consent = await database.consentRecord.create({
      data: {
        householdId: athlete.householdId,
        athleteId: athlete.id,
        consentingUserId: user.id,
        purposeKey: "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
        policyVersion: "b1-2026-08-04",
        granted: true,
      },
    });
    const mediaAssetId = randomUUID();
    const evidenceId = randomUUID();
    const eventId = randomUUID();
    ownedConsentIds.add(consent.id);
    ownedEventIds.add(eventId);
    ownedMediaIds.add(mediaAssetId);
    const objectKey = `evidence/${randomUUID()}/${randomUUID()}`;
    const checksum = createHash("sha256").update(bytes).digest("hex");
    await database.$transaction([
      database.mediaAsset.create({
        data: {
          id: mediaAssetId,
          athleteId: athlete.id,
          uploaderUserId: user.id,
          status: "UPLOADED",
          objectKey,
          originalName: "bilateral-control-synthetic.mp4",
          declaredMimeType: "video/mp4",
          sizeBytes: BigInt(bytes.byteLength),
          checksumSha256: checksum,
          retentionPolicyKey: "b1-private-evidence",
        },
      }),
      database.evidenceSubmission.create({
        data: {
          id: evidenceId,
          athleteId: athlete.id,
          nodeId: node.id,
          mediaAssetId,
          consentRecordId: consent.id,
          retentionPolicyKey: "b1-private-evidence",
        },
      }),
      database.outboxEvent.create({
        data: {
          id: eventId,
          eventType: "MediaUploaded",
          aggregateType: "MediaAsset",
          aggregateId: mediaAssetId,
          actorId: user.id,
          correlationId: randomUUID(),
          payload: { mediaAssetId },
          occurredAt: new Date(),
        },
      }),
    ]);
    const store = new MemoryStore();
    store.objects.set(objectKey, bytes);
    const configuration = mediaConfiguration({
      ...process.env,
      NODE_ENV: "test",
    });
    expect(
      await new MediaJobs(
        database,
        store,
        new DeterministicLocalScanner(),
        configuration,
      ).runOnce(),
    ).toBe(true);
    expect(
      await database.mediaAsset.findUniqueOrThrow({
        where: { id: mediaAssetId },
      }),
    ).toMatchObject({ status: "READY", durationMs: 4_000 });

    await database.$transaction([
      database.evidenceSubmission.update({
        where: { id: evidenceId },
        data: { status: "WITHDRAWN", withdrawnAt: new Date() },
      }),
      database.mediaAsset.update({
        where: { id: mediaAssetId },
        data: { status: "DELETION_PENDING", retentionExpiresAt: new Date() },
      }),
    ]);
    expect(
      await new MediaJobs(
        database,
        store,
        new DeterministicLocalScanner(),
        configuration,
      ).runOnce(),
    ).toBe(true);
    expect(store.objects.has(objectKey)).toBe(false);
    expect(
      await database.mediaAsset.findUniqueOrThrow({
        where: { id: mediaAssetId },
      }),
    ).toMatchObject({ status: "DELETED" });
    expect(
      await database.evidenceSubmission.findUniqueOrThrow({
        where: { id: evidenceId },
      }),
    ).toMatchObject({ status: "DELETED" });

    const racingMediaId = randomUUID();
    const racingEventId = randomUUID();
    ownedEventIds.add(racingEventId);
    ownedMediaIds.add(racingMediaId);
    const racingObjectKey = `evidence/${randomUUID()}/${randomUUID()}`;
    await database.$transaction([
      database.mediaAsset.create({
        data: {
          id: racingMediaId,
          athleteId: athlete.id,
          uploaderUserId: user.id,
          status: "UPLOADED",
          objectKey: racingObjectKey,
          originalName: "bilateral-control-synthetic.mp4",
          declaredMimeType: "video/mp4",
          sizeBytes: BigInt(bytes.byteLength),
          checksumSha256: checksum,
          retentionPolicyKey: "b1-private-evidence",
        },
      }),
      database.outboxEvent.create({
        data: {
          id: racingEventId,
          eventType: "MediaUploaded",
          aggregateType: "MediaAsset",
          aggregateId: racingMediaId,
          actorId: user.id,
          correlationId: randomUUID(),
          payload: { mediaAssetId: racingMediaId },
          occurredAt: new Date(),
        },
      }),
    ]);
    store.objects.set(racingObjectKey, bytes);
    store.beforeGet = async () => {
      await database.mediaAsset.update({
        where: { id: racingMediaId },
        data: {
          status: "DELETION_PENDING",
          retentionExpiresAt: new Date(Date.now() + 60_000),
          version: { increment: 1 },
        },
      });
      store.beforeGet = undefined;
    };
    expect(
      await new MediaJobs(
        database,
        store,
        new DeterministicLocalScanner(),
        configuration,
      ).runOnce(),
    ).toBe(true);
    expect(
      await database.mediaAsset.findUniqueOrThrow({
        where: { id: racingMediaId },
      }),
    ).toMatchObject({ status: "DELETION_PENDING" });
    expect(
      await database.outboxEvent.findUniqueOrThrow({
        where: { id: racingEventId },
      }),
    ).toMatchObject({ status: "PUBLISHED" });
    expect(
      await database.outboxEvent.count({
        where: { causationId: racingEventId, eventType: "MediaReady" },
      }),
    ).toBe(0);
  });
});
