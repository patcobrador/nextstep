import { createHash, randomUUID } from "node:crypto";

import { ConflictException, Injectable } from "@nestjs/common";
import type { Prisma } from "@nextstep/database";
import {
  WalkingSkeleton,
  type DomainEvent,
  type WalkingSkeletonPersistenceState,
} from "@nextstep/domain";

import { PrismaService } from "./prisma.service.js";

export interface FlowAdapterState {
  assessmentId?: string;
  mediaReady: boolean;
}

export interface DurableFlowRecord {
  athleteId: string;
  householdId: string;
  flow: WalkingSkeleton;
  adapter: FlowAdapterState;
  version: number;
}

export interface IdempotentCommand {
  actorId: string;
  operation: string;
  key: string;
  request: unknown;
}

interface PersistOptions {
  command: IdempotentCommand;
  response: unknown;
  events: DomainEvent[];
  resources?: Array<{ id: string; type: string }>;
}

const asInputJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

export const stableUuid = (value: string): string => {
  const bytes = createHash("sha256").update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const requestHash = (request: unknown): string =>
  createHash("sha256").update(JSON.stringify(request)).digest("hex");

@Injectable()
export class DevelopmentFlowRepository {
  constructor(private readonly database: PrismaService) {}

  async replay<T>(command: IdempotentCommand): Promise<T | undefined> {
    const record = await this.database.client.idempotencyRecord.findUnique({
      where: {
        actorId_operation_key: {
          actorId: stableUuid(command.actorId),
          operation: command.operation,
          key: command.key,
        },
      },
    });
    if (!record) return undefined;
    if (record.requestHash !== requestHash(command.request)) {
      throw new ConflictException(
        "Idempotency-Key was already used with a different request.",
      );
    }
    return record.responseBody as T;
  }

  async create(
    record: DurableFlowRecord,
    options: PersistOptions,
    displayName: string,
  ): Promise<void> {
    const userId = stableUuid(`user:${options.command.actorId}`);
    const householdId = stableUuid(`household:${record.householdId}`);
    await this.database.client.$transaction(async (transaction) => {
      await transaction.user.upsert({
        where: { identityProviderKey: `local:${options.command.actorId}` },
        update: {},
        create: {
          id: userId,
          identityProviderKey: `local:${options.command.actorId}`,
          displayName: options.command.actorId,
        },
      });
      await transaction.household.upsert({
        where: { id: householdId },
        update: {},
        create: { id: householdId, name: record.householdId },
      });
      await transaction.householdMembership.upsert({
        where: { householdId_userId: { householdId, userId } },
        update: { revokedAt: null },
        create: { householdId, userId, role: "OWNER" },
      });
      await transaction.athlete.create({
        data: {
          id: record.athleteId,
          householdId,
          displayName,
          ageBand: "UNSPECIFIED",
        },
      });
      await transaction.developmentFlowSnapshot.create({
        data: this.#snapshotData(record),
      });
      await this.#writeSideEffects(transaction, record, options);
    });
  }

  async save(
    record: DurableFlowRecord,
    options: PersistOptions,
  ): Promise<void> {
    await this.database.client.$transaction(async (transaction) => {
      const updated = await transaction.developmentFlowSnapshot.updateMany({
        where: {
          athleteId: record.athleteId,
          aggregateVersion: record.version,
        },
        data: {
          state: asInputJson(record.flow.persistenceState()),
          adapterState: asInputJson(record.adapter),
          aggregateVersion: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          "The athlete changed concurrently; retry the command.",
        );
      }
      await this.#writeSideEffects(transaction, record, options);
    });
    record.version += 1;
  }

  async load(athleteId: string): Promise<DurableFlowRecord | undefined> {
    const snapshot =
      await this.database.client.developmentFlowSnapshot.findUnique({
        where: { athleteId },
      });
    return snapshot ? this.#record(snapshot) : undefined;
  }

  async loadByResource(
    resourceId: string,
    type: string,
  ): Promise<DurableFlowRecord | undefined> {
    const resource =
      await this.database.client.developmentFlowResource.findUnique({
        where: { id: resourceId },
        include: { flow: true },
      });
    if (!resource || resource.type !== type) return undefined;
    return this.#record(resource.flow);
  }

  async list(): Promise<DurableFlowRecord[]> {
    const snapshots =
      await this.database.client.developmentFlowSnapshot.findMany();
    return snapshots.map((snapshot) => this.#record(snapshot));
  }

  async clearTestData(): Promise<void> {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("Test data cannot be cleared in production.");
    }
    await this.database.client.$transaction([
      this.database.client.processedEvent.deleteMany(),
      this.database.client.outboxEvent.deleteMany(),
      this.database.client.idempotencyRecord.deleteMany(),
      this.database.client.developmentFlowResource.deleteMany(),
      this.database.client.developmentFlowSnapshot.deleteMany(),
      this.database.client.athlete.deleteMany(),
      this.database.client.householdMembership.deleteMany(),
      this.database.client.household.deleteMany(),
      this.database.client.user.deleteMany(),
    ]);
  }

  #record(snapshot: {
    athleteId: string;
    householdKey: string;
    aggregateVersion: number;
    state: Prisma.JsonValue;
    adapterState: Prisma.JsonValue;
  }): DurableFlowRecord {
    return {
      athleteId: snapshot.athleteId,
      householdId: snapshot.householdKey,
      version: snapshot.aggregateVersion,
      flow: WalkingSkeleton.restore(
        snapshot.state as unknown as WalkingSkeletonPersistenceState,
      ),
      adapter: snapshot.adapterState as unknown as FlowAdapterState,
    };
  }

  #snapshotData(record: DurableFlowRecord) {
    return {
      athleteId: record.athleteId,
      householdKey: record.householdId,
      aggregateVersion: record.version,
      state: asInputJson(record.flow.persistenceState()),
      adapterState: asInputJson(record.adapter),
    };
  }

  async #writeSideEffects(
    transaction: Prisma.TransactionClient,
    record: DurableFlowRecord,
    options: PersistOptions,
  ): Promise<void> {
    if (options.events.length > 0) {
      await transaction.outboxEvent.createMany({
        data: options.events.map((event) => ({
          id: event.eventId,
          eventType: event.eventType,
          eventVersion: event.eventVersion,
          aggregateType: event.aggregateType,
          aggregateId: record.athleteId,
          actorId: stableUuid(event.actorId),
          correlationId: stableUuid(event.correlationId),
          ...(event.causationId
            ? { causationId: stableUuid(event.causationId) }
            : {}),
          payload: asInputJson(event.payload),
          status: "PENDING",
          occurredAt: new Date(event.occurredAt),
        })),
        skipDuplicates: true,
      });
    }
    if (options.resources?.length) {
      await transaction.developmentFlowResource.createMany({
        data: options.resources.map((resource) => ({
          ...resource,
          athleteId: record.athleteId,
        })),
        skipDuplicates: true,
      });
    }
    await transaction.idempotencyRecord.create({
      data: {
        id: randomUUID(),
        actorId: stableUuid(options.command.actorId),
        operation: options.command.operation,
        key: options.command.key,
        requestHash: requestHash(options.command.request),
        responseCode: 200,
        responseBody: asInputJson(options.response),
        resourceId: record.athleteId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }
}
