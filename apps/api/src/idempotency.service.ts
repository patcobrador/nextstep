import { createHash, randomUUID } from "node:crypto";

import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@nextstep/database";

import { PrismaService } from "./prisma.service.js";

export interface IdempotencyCommand {
  actorId: string;
  key: string;
  operation: string;
  request: unknown;
}

const requestHash = (request: unknown): string =>
  createHash("sha256").update(JSON.stringify(request)).digest("hex");

@Injectable()
export class IdempotencyService {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService,
  ) {}

  async replay<T>(command: IdempotencyCommand): Promise<T | undefined> {
    const record = await this.database.client.idempotencyRecord.findUnique({
      where: {
        actorId_operation_key: {
          actorId: command.actorId,
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

  record(
    command: IdempotencyCommand,
    response: unknown,
    resourceId: string,
    responseCode = 200,
  ): Prisma.IdempotencyRecordCreateInput {
    return {
      id: randomUUID(),
      actorId: command.actorId,
      operation: command.operation,
      key: command.key,
      requestHash: requestHash(command.request),
      responseCode,
      responseBody: response as Prisma.InputJsonValue,
      resourceId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}
