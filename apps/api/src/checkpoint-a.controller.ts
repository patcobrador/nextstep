import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { components } from "@nextstep/contracts";
import type { Request } from "express";

import { CheckpointAService } from "./checkpoint-a.service.js";
import { requireIdentity } from "./identity.js";

@Controller()
export class CheckpointAController {
  constructor(private readonly service: CheckpointAService) {}

  @Get("me")
  me(@Req() request: Request) {
    return this.service.currentUser(requireIdentity(request));
  }

  @Get("households/:householdId/athletes")
  athletes(@Req() request: Request, @Param("householdId") householdId: string) {
    return this.service.athletes(requireIdentity(request), householdId);
  }

  @Get("athletes/:athleteId")
  athlete(@Req() request: Request, @Param("athleteId") athleteId: string) {
    return this.service.athlete(requireIdentity(request), athleteId);
  }

  @Get("athletes/:athleteId/dashboard")
  dashboard(@Req() request: Request, @Param("athleteId") athleteId: string) {
    return this.service.dashboard(requireIdentity(request), athleteId);
  }

  @Get("athletes/:athleteId/skill-tree")
  tree(@Req() request: Request, @Param("athleteId") athleteId: string) {
    return this.service.skillTree(requireIdentity(request), athleteId);
  }

  @Get("athletes/:athleteId/skills/:nodeId")
  detail(
    @Req() request: Request,
    @Param("athleteId") athleteId: string,
    @Param("nodeId") nodeId: string,
  ) {
    return this.service.skillDetail(
      requireIdentity(request),
      athleteId,
      nodeId,
    );
  }

  @Get("practice-plans/:planId")
  plan(@Req() request: Request, @Param("planId") planId: string) {
    return this.service.practicePlan(requireIdentity(request), planId);
  }

  @Get("practice-sessions/:sessionId")
  session(@Req() request: Request, @Param("sessionId") sessionId: string) {
    return this.service.practiceSession(requireIdentity(request), sessionId);
  }

  @Post("practice-plans/:planId/sessions")
  startSession(
    @Req() request: Request,
    @Param("planId") planId: string,
    @Body() body: { clientSessionId?: string; startedOffline?: boolean },
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.startSession(
      requireIdentity(request),
      planId,
      body,
      requiredKey(idempotencyKey),
    );
  }

  @Post("practice-sessions/:sessionId/attempts")
  recordAttempt(
    @Req() request: Request,
    @Param("sessionId") sessionId: string,
    @Body() body: components["schemas"]["PracticeAttemptRequest"],
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.recordAttempt(
      requireIdentity(request),
      sessionId,
      body,
      requiredKey(idempotencyKey),
    );
  }

  @Post("practice-sessions/:sessionId/complete")
  @HttpCode(200)
  completeSession(
    @Req() request: Request,
    @Param("sessionId") sessionId: string,
    @Body() body: components["schemas"]["CompletePracticeSessionRequest"],
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.service.completeSession(
      requireIdentity(request),
      sessionId,
      body,
      requiredKey(idempotencyKey),
    );
  }

  @Get("athletes/:athleteId/passport")
  passport(@Req() request: Request, @Param("athleteId") athleteId: string) {
    return this.service.passport(requireIdentity(request), athleteId);
  }
}

const requiredKey = (value?: string): string => {
  if (!value) throw new BadRequestException("Idempotency-Key is required.");
  return value;
};
