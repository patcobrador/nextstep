import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";

import { EvidenceService } from "./evidence.service.js";
import { requireIdentity } from "./identity.js";

const requiredKey = (value?: string) => {
  if (!value || value.length < 8)
    throw new BadRequestException("Idempotency-Key is required.");
  return value;
};

@Controller()
export class EvidenceController {
  constructor(
    @Inject(EvidenceService) private readonly service: EvidenceService,
  ) {}

  @Post("households/:householdId/consents")
  recordConsent(
    @Param("householdId") householdId: string,
    @Body()
    body: {
      athleteId?: string | null;
      granted: boolean;
      policyVersion: string;
      purposeKey: string;
    },
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.recordConsent({
      householdId,
      body,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }

  @Post("consents/:consentId/withdraw")
  @HttpCode(200)
  withdrawConsent(
    @Param("consentId") consentId: string,
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.withdrawConsent({
      consentId,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }

  @Post("evidence/upload-intents")
  createUploadIntent(
    @Body()
    body: {
      athleteId: string;
      nodeId: string;
      consentRecordId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      durationMs?: number | null;
      checksumSha256?: string | null;
    },
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.createUploadIntent({
      body,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }

  @Post("evidence/upload-intents/:mediaAssetId/complete")
  @HttpCode(202)
  completeUpload(
    @Param("mediaAssetId") mediaAssetId: string,
    @Body() body: { checksumSha256: string },
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.completeUpload({
      mediaAssetId,
      body,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }

  @Get("evidence-submissions/:evidenceId")
  getEvidence(
    @Param("evidenceId") evidenceId: string,
    @Req() request: Request,
  ) {
    return this.service.getEvidence(requireIdentity(request), evidenceId);
  }

  @Post("evidence-submissions/:evidenceId/playback-grants")
  createPlaybackGrant(
    @Param("evidenceId") evidenceId: string,
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.createPlaybackGrant({
      evidenceId,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }

  @Post("evidence-submissions")
  submitEvidence(
    @Body() body: { evidenceId: string; reviewConsentRecordId: string },
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.submitEvidence({
      body,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }

  @Delete("evidence-submissions/:evidenceId")
  @HttpCode(202)
  requestDeletion(
    @Param("evidenceId") evidenceId: string,
    @Req() request: Request,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.service.requestDeletion({
      evidenceId,
      identity: requireIdentity(request),
      idempotencyKey: requiredKey(key),
    });
  }
}
