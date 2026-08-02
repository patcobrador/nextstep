import "reflect-metadata";

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "./app.module.js";
import { DevelopmentFlowRepository } from "./development-flow.repository.js";
import { PrismaService } from "./prisma.service.js";

describe("Checkpoint A HTTP contract and object authorisation", () => {
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

  const seedDemo = (): void => {
    execFileSync(
      process.execPath,
      ["--import", "tsx", "src/checkpoint-a.seed.ts"],
      {
        cwd: process.cwd(),
        env: { ...process.env, NEXTSTEP_DEMO_MODE: "enabled" },
        stdio: "pipe",
      },
    );
  };

  beforeEach(async () => {
    app = await startApplication();
    await app.get(DevelopmentFlowRepository).clearTestData();
  });

  afterEach(async () => {
    await app.close();
  });

  it("exposes health checks and RFC 7807 authentication errors", async () => {
    const server = app.getHttpServer();
    await request(server).get("/v1/health/live").expect(200, { status: "ok" });
    const unauthorized = await request(server)
      .get(`/v1/athletes/${randomUUID()}/dashboard`)
      .expect("content-type", /application\/problem\+json/)
      .expect(401);
    expect(unauthorized.body.title).toBe("Unauthorized");
    expect(unauthorized.headers["x-correlation-id"]).toBe(
      unauthorized.body.correlationId,
    );
  });

  it("restores an idempotent athlete response after API reconstruction", async () => {
    const headers = {
      "x-actor-id": "durable-parent",
      "x-household-id": "durable-household",
    };
    const created = await request(app.getHttpServer())
      .post("/v1/households/durable-household/athletes")
      .set(headers)
      .set("Idempotency-Key", "durable-create")
      .send({ displayName: "Ari" })
      .expect(201);
    await app.close();
    app = await startApplication();
    const replayed = await request(app.getHttpServer())
      .post("/v1/households/durable-household/athletes")
      .set(headers)
      .set("Idempotency-Key", "durable-create")
      .send({ displayName: "Ari" })
      .expect(201);
    expect(replayed.body.id).toBe(created.body.id);
  });

  it("keeps relational practice, snapshot state, stable identities, passport, and authorisation aligned", async () => {
    seedDemo();
    const server = app.getHttpServer();
    const athleteId = "25fd56b2-b2f1-4645-8ee6-adbac147069e";
    const otherAthleteId = "c4abbb6c-b113-41d9-882e-ff295f7b380e";
    const householdId = "c9663e3a-ab64-4d8b-9cb8-68fbe5f6cda3";
    const otherHouseholdId = "07094fa0-beac-44e5-a247-bcf4052a373c";
    const planId = "7a12f155-c291-4307-87b4-93e90ec853a2";
    const headers = {
      "x-actor-id": "checkpoint-a-parent",
      "x-household-id": householdId,
    };
    const otherHeaders = {
      "x-actor-id": "checkpoint-a-other-parent",
      "x-household-id": otherHouseholdId,
    };

    const me = await request(server).get("/v1/me").set(headers).expect(200);
    expect(me.body.displayName).toBe("Pat Johnson");
    const dashboard = await request(server)
      .get(`/v1/athletes/${athleteId}/dashboard`)
      .set(headers)
      .expect(200);
    expect(dashboard.body.primaryAction.destination).toContain(planId);
    const tree = await request(server)
      .get(`/v1/athletes/${athleteId}/skill-tree`)
      .set(headers)
      .expect(200);
    expect(tree.body.domains).toHaveLength(8);
    expect(tree.body.domains[0]).toEqual(
      expect.objectContaining({
        completedNodeCount: expect.any(Number),
        progress: expect.any(Number),
      }),
    );
    const active = tree.body.nodes.find(
      (node: { state: string }) => node.state === "ACTIVE",
    );
    const locked = tree.body.nodes.find(
      (node: { state: string }) => node.state === "LOCKED",
    );
    expect(active).toBeTruthy();
    expect(locked.whyLocked).toBeTruthy();
    await request(server)
      .get(`/v1/athletes/${athleteId}/skills/${locked.id}`)
      .set(headers)
      .expect(200);

    await request(server)
      .get(`/v1/athletes/${athleteId}/dashboard`)
      .set({ ...headers, "x-household-id": otherHouseholdId })
      .expect(404);
    await request(server)
      .get(`/v1/athletes/${otherAthleteId}/dashboard`)
      .set(headers)
      .expect(404);
    await request(server)
      .get(`/v1/practice-plans/${planId}`)
      .set(otherHeaders)
      .expect(404);
    await request(server)
      .get(`/v1/athletes/${athleteId}/passport`)
      .set(otherHeaders)
      .expect(404);

    const plan = await request(server)
      .get(`/v1/practice-plans/${planId}`)
      .set(headers)
      .expect(200);
    expect(plan.body).toEqual(
      expect.objectContaining({
        id: planId,
        title: "Both-hand ball control",
        purpose: expect.any(String),
      }),
    );
    const started = await request(server)
      .post(`/v1/practice-plans/${planId}/sessions`)
      .set(headers)
      .set("Idempotency-Key", "checkpoint-a-start")
      .send({ clientSessionId: "browser-demo" })
      .expect(201);
    const sessionId = started.body.id as string;
    expect(started.body.practicePlanId).toBe(planId);
    await request(server)
      .get(`/v1/practice-sessions/${sessionId}`)
      .set(otherHeaders)
      .expect(404);

    for (const [index, step] of plan.body.steps.entries()) {
      await request(server)
        .post(`/v1/practice-sessions/${sessionId}/attempts`)
        .set(headers)
        .set("Idempotency-Key", `attempt-${step.id}`)
        .send({
          planStepId: step.id,
          attemptNumber: 1,
          resultType: step.resultType,
          result: true,
          skipped: false,
          completedAt: `2026-08-02T10:0${index}:00.000Z`,
        })
        .expect(201);
    }
    const resumed = await request(server)
      .get(`/v1/practice-sessions/${sessionId}`)
      .set(headers)
      .expect(200);
    expect(resumed.body.attempts).toHaveLength(plan.body.steps.length);

    const completionBody = {
      enjoymentRating: 5,
      difficultyRating: 3,
      safetyFlag: false,
      completedAt: "2026-08-02T10:10:00.000Z",
    };
    const completed = await request(server)
      .post(`/v1/practice-sessions/${sessionId}/complete`)
      .set(headers)
      .set("Idempotency-Key", "checkpoint-a-complete")
      .send(completionBody)
      .expect(200);
    expect(completed.body.session).toEqual(
      expect.objectContaining({
        id: sessionId,
        practicePlanId: planId,
        status: "COMPLETED",
      }),
    );
    const replayed = await request(server)
      .post(`/v1/practice-sessions/${sessionId}/complete`)
      .set(headers)
      .set("Idempotency-Key", "checkpoint-a-complete")
      .send(completionBody)
      .expect(200);
    expect(replayed.body).toEqual(completed.body);
    await request(server)
      .post(`/v1/practice-sessions/${sessionId}/complete`)
      .set(headers)
      .set("Idempotency-Key", "checkpoint-a-complete-conflict")
      .send({ ...completionBody, difficultyRating: 5 })
      .expect(409);

    await app.close();
    app = await startApplication();
    const persisted = await request(app.getHttpServer())
      .get(`/v1/practice-sessions/${sessionId}`)
      .set(headers)
      .expect(200);
    expect(persisted.body.status).toBe("COMPLETED");
    const passport = await request(app.getHttpServer())
      .get(`/v1/athletes/${athleteId}/passport`)
      .set(headers)
      .expect(200);
    const completionEvents = passport.body.timeline.filter(
      (event: { eventType: string }) =>
        event.eventType === "PRACTICE_COMPLETED",
    );
    expect(completionEvents).toHaveLength(3);

    const database = app.get(PrismaService).client;
    expect(
      await database.passportEvent.count({
        where: { athleteId, eventType: "PRACTICE_COMPLETED" },
      }),
    ).toBe(3);
    expect(
      await database.idempotencyRecord.count({
        where: {
          operation: "checkpoint-a-complete-session",
          key: "checkpoint-a-complete",
        },
      }),
    ).toBe(1);
    const outbox = await database.outboxEvent.findFirst({
      where: { eventType: "PracticeSessionCompleted", aggregateId: athleteId },
    });
    expect(outbox?.payload).toEqual(
      expect.objectContaining({ planId, sessionId }),
    );
    const snapshot = await database.developmentFlowSnapshot.findUniqueOrThrow({
      where: { athleteId },
    });
    expect(JSON.stringify(snapshot.state)).toContain(sessionId);
  });
});
