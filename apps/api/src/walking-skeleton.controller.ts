import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";

import { WalkingSkeletonService } from "./walking-skeleton.service.js";

const requiredHeader = (value: string | undefined, name: string): string => {
  if (!value) throw new BadRequestException(`${name} is required.`);
  return value;
};

@Controller()
export class WalkingSkeletonController {
  constructor(private readonly service: WalkingSkeletonService) {}

  @Post("households/:householdId/athletes")
  createAthlete(
    @Param("householdId") householdId: string,
    @Body() body: { displayName: string },
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.createAthlete({
      householdId,
      displayName: body.displayName,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    }).athlete;
  }

  @Post("athletes/:athleteId/baseline")
  @HttpCode(200)
  baseline(
    @Param("athleteId") athleteId: string,
    @Headers("x-household-id") householdId?: string,
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertHousehold(
      athleteId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.baseline(
      athleteId,
      requiredHeader(actorId, "x-actor-id"),
      requiredHeader(idempotencyKey, "Idempotency-Key"),
    ).athlete;
  }

  @Post("athletes/:athleteId/practice-plans")
  generatePlan(
    @Param("athleteId") athleteId: string,
    @Headers("x-household-id") householdId?: string,
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertHousehold(
      athleteId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.generatePlan({
      athleteId,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Post("practice-plans/:planId/sessions")
  startSession(
    @Param("planId") planId: string,
    @Headers("x-household-id") householdId?: string,
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertPlanHousehold(
      planId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.startSession({
      planId,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Post("practice-sessions/:sessionId/complete")
  @HttpCode(200)
  completePractice(
    @Param("sessionId") sessionId: string,
    @Body()
    body: {
      completedAt: string;
      successfulAttempts: number;
      safetyFlag: boolean;
    },
    @Headers("x-actor-id") actorId?: string,
    @Headers("x-household-id") householdId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertSessionHousehold(
      sessionId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.completePractice({
      sessionId,
      completedAt: new Date(body.completedAt),
      successfulAttempts: body.successfulAttempts,
      safetyFlag: body.safetyFlag,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Post("evidence/upload-intents")
  createUploadIntent(
    @Body() body: { athleteId: string },
    @Headers("x-household-id") householdId?: string,
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertHousehold(
      body.athleteId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.createUploadIntent({
      athleteId: body.athleteId,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Post("evidence/upload-intents/:mediaAssetId/complete")
  @HttpCode(202)
  completeUpload(
    @Param("mediaAssetId") mediaAssetId: string,
    @Headers("x-household-id") householdId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertMediaHousehold(
      mediaAssetId,
      requiredHeader(householdId, "x-household-id"),
    );
    requiredHeader(idempotencyKey, "Idempotency-Key");
    return this.service.completeUpload(mediaAssetId);
  }

  @Post("evidence-submissions")
  submitEvidence(
    @Body()
    body: {
      athleteId: string;
      evidenceId: string;
      consentRecordId: string;
      assignedCoachId: string;
    },
    @Headers("x-household-id") householdId?: string,
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    this.service.assertHousehold(
      body.athleteId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.submitEvidence({
      ...body,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Get("coach/assessment-queue")
  coachQueue(@Headers("x-actor-id") coachId?: string) {
    return {
      items: this.service.coachQueue(requiredHeader(coachId, "x-actor-id")),
    };
  }

  @Post("coach/assessments/:assessmentId/decision")
  @HttpCode(200)
  assess(
    @Param("assessmentId") assessmentId: string,
    @Body() body: { outcome: "PASS" | "RETRY" | "UNABLE_TO_ASSESS" },
    @Headers("x-actor-id") actorId?: string,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.assess({
      assessmentId,
      outcome: body.outcome,
      actorId: requiredHeader(actorId, "x-actor-id"),
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Get("athletes/:athleteId/passport")
  passport(
    @Param("athleteId") athleteId: string,
    @Headers("x-household-id") householdId?: string,
  ) {
    this.service.assertHousehold(
      athleteId,
      requiredHeader(householdId, "x-household-id"),
    );
    return { timeline: this.service.passport(athleteId) };
  }

  @Get("athletes/:athleteId/dashboard")
  dashboard(
    @Param("athleteId") athleteId: string,
    @Headers("x-household-id") householdId?: string,
  ) {
    this.service.assertHousehold(
      athleteId,
      requiredHeader(householdId, "x-household-id"),
    );
    return this.service.snapshot(athleteId).athlete;
  }
}
