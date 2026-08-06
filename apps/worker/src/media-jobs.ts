import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@nextstep/database";
import type {
  MediaConfiguration,
  PrivateMediaStore,
  Scanner,
} from "@nextstep/media";
import { collectBytes, validateMedia } from "@nextstep/media";

const consumerKey = "checkpoint-b1-media-v1";

export class MediaJobs {
  constructor(
    private readonly database: PrismaClient,
    private readonly media: PrivateMediaStore,
    private readonly scanner: Scanner,
    private readonly config: MediaConfiguration,
  ) {}

  async runOnce(): Promise<boolean> {
    if (await this.processValidation()) return true;
    if (await this.markExpiredForDeletion()) return true;
    return this.processDeletion();
  }

  private async processValidation(): Promise<boolean> {
    const event = await this.database.outboxEvent.findFirst({
      where: { eventType: "MediaUploaded", status: "PENDING" },
      orderBy: { occurredAt: "asc" },
    });
    if (!event) return false;
    const mediaAssetId = (event.payload as { mediaAssetId?: string })
      .mediaAssetId;
    if (!mediaAssetId) {
      await this.failEvent(event.id, "INVALID_EVENT_PAYLOAD", true);
      return true;
    }
    const asset = await this.database.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });
    if (!asset) {
      await this.failEvent(event.id, "MEDIA_NOT_FOUND", true);
      return true;
    }
    const claim = await this.database.mediaAsset.updateMany({
      where: { id: asset.id, status: "UPLOADED", version: asset.version },
      data: {
        status: "PROCESSING",
        processingStartedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (claim.count !== 1) {
      if (
        [
          "READY",
          "REJECTED",
          "QUARANTINED",
          "DELETION_PENDING",
          "DELETED",
        ].includes(asset.status)
      ) {
        await this.completeEvent(event.id);
      }
      return true;
    }
    try {
      const stream = await this.media.getObject(asset.objectKey);
      const bytes = await collectBytes(stream, this.config.maximumBytes);
      const result = bytes
        ? await validateMedia({
            bytes,
            config: this.config,
            declaredBytes: Number(asset.sizeBytes),
            expectedSha256: asset.checksumSha256 ?? "",
            scanner: this.scanner,
          })
        : { code: "SIZE_EXCEEDED" as const, status: "REJECTED" as const };
      const now = new Date();
      const rejectionRetention = new Date(
        now.getTime() + this.config.abandonedRetentionHours * 60 * 60 * 1000,
      );
      await this.database.$transaction(async (tx) => {
        const finalised = await tx.mediaAsset.updateMany({
          where: {
            id: asset.id,
            status: "PROCESSING",
            version: asset.version + 1,
          },
          data:
            result.status === "READY"
              ? {
                  status: "READY",
                  detectedMimeType: result.mimeType,
                  durationMs: result.durationMs,
                  checksumSha256: result.sha256,
                  readyAt: now,
                  processingStartedAt: null,
                  retentionExpiresAt: null,
                  rejectionCode: null,
                  version: { increment: 1 },
                }
              : {
                  status: result.status,
                  rejectionCode: result.code,
                  processingStartedAt: null,
                  retentionExpiresAt: rejectionRetention,
                  version: { increment: 1 },
                },
        });
        if (finalised.count === 1) {
          await tx.outboxEvent.create({
            data: {
              id: randomUUID(),
              eventType:
                result.status === "READY" ? "MediaReady" : "MediaRejected",
              eventVersion: 1,
              aggregateType: "MediaAsset",
              aggregateId: asset.id,
              actorId: event.actorId,
              correlationId: event.correlationId,
              causationId: event.id,
              payload: {
                mediaAssetId: asset.id,
                status: result.status,
                ...(result.status === "READY"
                  ? {}
                  : { rejectionCode: result.code }),
              },
              occurredAt: now,
            },
          });
        }
        await tx.processedEvent.create({
          data: { consumerKey, eventId: event.id },
        });
        await tx.outboxEvent.update({
          where: { id: event.id },
          data: { status: "PUBLISHED", publishedAt: now },
        });
      });
    } catch {
      await this.database.mediaAsset.updateMany({
        where: { id: asset.id, status: "PROCESSING" },
        data: {
          status: "UPLOADED",
          processingStartedAt: null,
          version: { increment: 1 },
        },
      });
      await this.failEvent(event.id, "MEDIA_PROCESSING_FAILED");
    }
    return true;
  }

  private async markExpiredForDeletion(): Promise<boolean> {
    const asset = await this.database.mediaAsset.findFirst({
      where: {
        status: { in: ["UPLOADING", "REJECTED", "QUARANTINED"] },
        retentionExpiresAt: { lte: new Date() },
      },
      orderBy: { retentionExpiresAt: "asc" },
    });
    if (!asset) return false;
    await this.database.mediaAsset.updateMany({
      where: { id: asset.id, status: asset.status, version: asset.version },
      data: { status: "DELETION_PENDING", version: { increment: 1 } },
    });
    return true;
  }

  private async processDeletion(): Promise<boolean> {
    const now = new Date();
    const asset = await this.database.mediaAsset.findFirst({
      where: {
        status: "DELETION_PENDING",
        OR: [
          { retentionHoldUntil: null },
          { retentionHoldUntil: { lte: now } },
        ],
      },
      orderBy: { retentionExpiresAt: "asc" },
    });
    if (!asset) return false;
    try {
      await this.media.deleteObject(asset.objectKey);
      await this.database.$transaction(async (tx) => {
        await tx.mediaAsset.update({
          where: { id: asset.id },
          data: {
            status: "DELETED",
            deletedAt: now,
            version: { increment: 1 },
          },
        });
        await tx.evidenceSubmission.updateMany({
          where: { mediaAssetId: asset.id, status: "WITHDRAWN" },
          data: {
            status: "DELETED",
            deletedAt: now,
            version: { increment: 1 },
          },
        });
        await tx.outboxEvent.create({
          data: {
            id: randomUUID(),
            eventType: "MediaDeleted",
            eventVersion: 1,
            aggregateType: "MediaAsset",
            aggregateId: asset.id,
            actorId: asset.uploaderUserId,
            correlationId: randomUUID(),
            payload: { mediaAssetId: asset.id },
            occurredAt: now,
          },
        });
      });
    } catch {
      return false;
    }
    return true;
  }

  private async completeEvent(eventId: string): Promise<void> {
    await this.database.$transaction([
      this.database.processedEvent.create({ data: { consumerKey, eventId } }),
      this.database.outboxEvent.update({
        where: { id: eventId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      }),
    ]);
  }

  private async failEvent(
    eventId: string,
    code: string,
    terminal = false,
  ): Promise<void> {
    const event = await this.database.outboxEvent.findUniqueOrThrow({
      where: { id: eventId },
      select: { attempts: true },
    });
    await this.database.outboxEvent.update({
      where: { id: eventId },
      data: {
        attempts: { increment: 1 },
        lastErrorCode: code,
        ...(terminal || event.attempts >= 4 ? { status: "FAILED" } : {}),
      },
    });
  }
}
