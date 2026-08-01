import "reflect-metadata";

import { randomUUID } from "node:crypto";

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "./app.module.js";
import { DevelopmentFlowRepository } from "./development-flow.repository.js";
import { PrismaService } from "./prisma.service.js";

describe("HTTP walking skeleton and object authorisation", () => {
  let app: INestApplication;

  const startApplication = async (): Promise<INestApplication> => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const application = module.createNestApplication();
    application.setGlobalPrefix("v1");
    await application.init();
    return application;
  };

  beforeEach(async () => {
    app = await startApplication();
    await app.get(DevelopmentFlowRepository).clearTestData();
  });

  afterEach(async () => {
    await app.close();
  });

  it("exposes public health checks and RFC 7807 authentication errors", async () => {
    const server = app.getHttpServer();
    await request(server).get("/v1/health/live").expect(200, { status: "ok" });
    const ready = await request(server).get("/v1/health/ready").expect(200);
    expect(ready.body.dependencies.database).toBe("up");

    const unauthorized = await request(server)
      .get(`/v1/athletes/${randomUUID()}/dashboard`)
      .expect("content-type", /application\/problem\+json/)
      .expect(401);
    expect(unauthorized.body.title).toBe("Unauthorized");
    expect(unauthorized.body.correlationId).toBeTruthy();
    expect(unauthorized.headers["x-correlation-id"]).toBe(
      unauthorized.body.correlationId,
    );
  });

  it("restores an idempotent athlete response after an API restart", async () => {
    const requestDetails = {
      householdId: "durable-household",
      headers: {
        "x-actor-id": "durable-parent",
        "x-household-id": "durable-household",
      },
    };
    const created = await request(app.getHttpServer())
      .post(`/v1/households/${requestDetails.householdId}/athletes`)
      .set(requestDetails.headers)
      .set("Idempotency-Key", "durable-create")
      .send({ displayName: "Ari" })
      .expect(201);

    await app.close();
    app = await startApplication();

    const replayed = await request(app.getHttpServer())
      .post(`/v1/households/${requestDetails.householdId}/athletes`)
      .set(requestDetails.headers)
      .set("Idempotency-Key", "durable-create")
      .send({ displayName: "Ari" })
      .expect(201);
    expect(replayed.body.id).toBe(created.body.id);
  });

  it("completes the parent-to-passport HTTP walking skeleton exactly once", async () => {
    const server = app.getHttpServer();
    const householdId = "household-parent-1";
    const parentHeaders = {
      "x-actor-id": "parent-1",
      "x-household-id": householdId,
    };

    const created = await request(server)
      .post(`/v1/households/${householdId}/athletes`)
      .set(parentHeaders)
      .set("Idempotency-Key", "athlete-create-1")
      .send({ displayName: "Mason" })
      .expect(201);
    const athleteId = created.body.id as string;

    const replayedCreate = await request(server)
      .post(`/v1/households/${householdId}/athletes`)
      .set(parentHeaders)
      .set("Idempotency-Key", "athlete-create-1")
      .send({ displayName: "Mason" })
      .expect(201);
    expect(replayedCreate.body.id).toBe(athleteId);

    const conflictingReplay = await request(server)
      .post(`/v1/households/${householdId}/athletes`)
      .set(parentHeaders)
      .set("Idempotency-Key", "athlete-create-1")
      .send({ displayName: "Different athlete" })
      .expect("content-type", /application\/problem\+json/)
      .expect(409);
    expect(conflictingReplay.body.title).toBe("Conflict");

    await request(server)
      .post(`/v1/athletes/${athleteId}/baseline`)
      .set(parentHeaders)
      .set("Idempotency-Key", "baseline-1")
      .send({ sportKey: "basketball" })
      .expect(200);

    const practiceDates = [
      "2026-08-01T09:00:00.000Z",
      "2026-08-03T09:00:00.000Z",
      "2026-08-06T09:00:00.000Z",
    ];
    for (const [index, completedAt] of practiceDates.entries()) {
      const plan = await request(server)
        .post(`/v1/athletes/${athleteId}/practice-plans`)
        .set(parentHeaders)
        .set("Idempotency-Key", `plan-${index}`)
        .send({ durationPreset: "STANDARD" })
        .expect(201);
      const replayedPlan = await request(server)
        .post(`/v1/athletes/${athleteId}/practice-plans`)
        .set(parentHeaders)
        .set("Idempotency-Key", `plan-${index}`)
        .send({ durationPreset: "STANDARD" })
        .expect(201);
      expect(replayedPlan.body.id).toBe(plan.body.id);
      const session = await request(server)
        .post(`/v1/practice-plans/${plan.body.id}/sessions`)
        .set(parentHeaders)
        .set("Idempotency-Key", `session-${index}`)
        .send({})
        .expect(201);
      await request(server)
        .post(`/v1/practice-plans/${plan.body.id}/sessions`)
        .set({ ...parentHeaders, "x-household-id": "different-household" })
        .set("Idempotency-Key", `cross-tenant-session-${index}`)
        .send({})
        .expect(404);
      await request(server)
        .post(`/v1/practice-sessions/${session.body.id}/complete`)
        .set(parentHeaders)
        .set("Idempotency-Key", `complete-${index}`)
        .send({
          completedAt,
          successfulAttempts: index === 1 ? 0 : 1,
          safetyFlag: false,
        })
        .expect(200);
    }

    const readyForEvidence = await request(server)
      .get(`/v1/athletes/${athleteId}/dashboard`)
      .set(parentHeaders)
      .expect(200);
    expect(readyForEvidence.body.checkpointState).toBe("EVIDENCE_PENDING");

    const intent = await request(server)
      .post("/v1/evidence/upload-intents")
      .set(parentHeaders)
      .set("Idempotency-Key", "upload-intent-1")
      .send({ athleteId })
      .expect(201);
    expect(intent.body.uploadUrl).toMatch(/^http:\/\/127\.0\.0\.1/);

    await request(server)
      .post(`/v1/evidence/upload-intents/${intent.body.mediaAssetId}/complete`)
      .set({ ...parentHeaders, "x-household-id": "different-household" })
      .set("Idempotency-Key", "cross-tenant-upload-complete")
      .send({ checksumSha256: "a".repeat(64) })
      .expect(404);

    await request(server)
      .post(`/v1/evidence/upload-intents/${intent.body.mediaAssetId}/complete`)
      .set(parentHeaders)
      .set("Idempotency-Key", "upload-complete-1")
      .send({ checksumSha256: "a".repeat(64) })
      .expect(202);

    await request(server)
      .post("/v1/evidence-submissions")
      .set(parentHeaders)
      .set("Idempotency-Key", "evidence-submit-1")
      .send({
        athleteId,
        evidenceId: "evidence-1",
        consentRecordId: "consent-1",
        assignedCoachId: "coach-1",
      })
      .expect(201);

    const queue = await request(server)
      .get("/v1/coach/assessment-queue")
      .set("x-actor-id", "coach-1")
      .expect(200);
    expect(queue.body.items).toHaveLength(1);
    const assessmentId = queue.body.items[0].assessmentId as string;

    await request(server)
      .post(`/v1/coach/assessments/${assessmentId}/decision`)
      .set("x-actor-id", "unassigned-coach")
      .set("Idempotency-Key", "unauthorised-decision")
      .send({ outcome: "PASS" })
      .expect(404);

    await request(server)
      .post(`/v1/coach/assessments/${assessmentId}/decision`)
      .set("x-actor-id", "coach-1")
      .set("Idempotency-Key", "decision-pass-1")
      .send({ outcome: "PASS" })
      .expect(200);
    await request(server)
      .post(`/v1/coach/assessments/${assessmentId}/decision`)
      .set("x-actor-id", "coach-1")
      .set("Idempotency-Key", "decision-pass-1")
      .send({ outcome: "PASS" })
      .expect(200);

    const progressed = await request(server)
      .get(`/v1/athletes/${athleteId}/dashboard`)
      .set(parentHeaders)
      .expect(200);
    expect(progressed.body.checkpointState).toBe("MASTERED");
    expect(progressed.body.checkpointVerified).toBe(true);
    expect(progressed.body.availableNodeKeys).toEqual([
      "foundation.ball.moving-control",
    ]);

    const passport = await request(server)
      .get(`/v1/athletes/${athleteId}/passport`)
      .set(parentHeaders)
      .expect(200);
    expect(passport.body.timeline).toHaveLength(1);
    expect(passport.body.timeline[0].verified).toBe(true);

    const database = app.get(PrismaService).client;
    expect(
      await database.developmentFlowSnapshot.count({ where: { athleteId } }),
    ).toBe(1);
    expect(await database.outboxEvent.count()).toBeGreaterThan(0);
    expect(
      await database.idempotencyRecord.count({
        where: { operation: "assess-evidence" },
      }),
    ).toBe(1);

    await request(server)
      .get(`/v1/athletes/${athleteId}/passport`)
      .set({ ...parentHeaders, "x-household-id": "different-household" })
      .expect(404);
  });
});
