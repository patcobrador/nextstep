"use server";

import type { components } from "@nextstep/contracts";

import { api } from "../../lib/api";

export const recordEvidenceConsent = async (
  householdId: string,
  athleteId: string,
  purposeKey:
    | "PRIVATE_EVIDENCE_CAPTURE_UPLOAD"
    | "ASSIGNED_COACH_EVIDENCE_REVIEW",
) =>
  api.recordConsent(
    householdId,
    {
      athleteId,
      purposeKey,
      policyVersion: "b1-2026-08-04",
      granted: true,
    },
    `web-consent-${crypto.randomUUID()}`,
  );

export const withdrawEvidenceConsent = async (consentId: string) =>
  api.withdrawConsent(consentId);

export const createEvidenceIntent = async (
  body: components["schemas"]["CreateUploadIntentRequest"],
) => api.createEvidenceUploadIntent(body, `web-upload-${crypto.randomUUID()}`);

export const completeEvidenceUpload = async (
  mediaAssetId: string,
  checksumSha256: string,
) => api.completeEvidenceUpload(mediaAssetId, checksumSha256);

export const loadEvidence = async (evidenceId: string) =>
  api.evidence(evidenceId);

export const grantEvidencePlayback = async (evidenceId: string) =>
  api.evidencePlayback(evidenceId, `web-playback-${crypto.randomUUID()}`);

export const submitEvidenceForAssessment = async (
  evidenceId: string,
  reviewConsentRecordId: string,
) => api.submitEvidence({ evidenceId, reviewConsentRecordId });

export const requestEvidenceDeletion = async (evidenceId: string) =>
  api.deleteEvidence(evidenceId);
