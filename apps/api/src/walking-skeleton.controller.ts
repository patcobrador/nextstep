import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";

import { AuthorisationService } from "./authorisation.service.js";
import { requireIdentity } from "./identity.js";
import { WalkingSkeletonService } from "./walking-skeleton.service.js";

const requiredHeader = (value: string | undefined, name: string): string => {
  if (!value) throw new BadRequestException(`${name} is required.`);
  return value;
};

@Controller()
export class WalkingSkeletonController {
  constructor(
    @Inject(WalkingSkeletonService)
    private readonly service: WalkingSkeletonService,
    @Inject(AuthorisationService)
    private readonly authorisation: AuthorisationService,
  ) {}

  @Post("households/:householdId/athletes")
  async createAthlete(
    @Param("householdId") householdId: string,
    @Body() body: { displayName: string },
    @Req() request: Request,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return (
      await this.service.createAthlete({
        householdId,
        displayName: body.displayName,
        actorId: requireIdentity(request).actorId,
        idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
      })
    ).athlete;
  }

  @Post("athletes/:athleteId/baseline")
  @HttpCode(200)
  async baseline(
    @Param("athleteId") athleteId: string,
    @Req() request: Request,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const identity = requireIdentity(request);
    await this.authorisation.athlete(identity, athleteId);
    return (
      await this.service.baseline(
        athleteId,
        identity.actorId,
        requiredHeader(idempotencyKey, "Idempotency-Key"),
      )
    ).athlete;
  }

  @Post("athletes/:athleteId/practice-plans")
  async generatePlan(
    @Param("athleteId") athleteId: string,
    @Req() request: Request,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const identity = requireIdentity(request);
    await this.authorisation.athlete(identity, athleteId);
    return this.service.generatePlan({
      athleteId,
      actorId: identity.actorId,
      idempotencyKey: requiredHeader(idempotencyKey, "Idempotency-Key"),
    });
  }

  @Get("coach/assessment-queue")
  async coachQueue(@Headers("x-actor-id") coachId?: string) {
    return {
      items: await this.service.coachQueue(
        requiredHeader(coachId, "x-actor-id"),
      ),
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
}
