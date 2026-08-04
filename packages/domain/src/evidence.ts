export const CAPTURE_CONSENT_PURPOSE = "PRIVATE_EVIDENCE_CAPTURE_UPLOAD";
export const REVIEW_CONSENT_PURPOSE = "ASSIGNED_COACH_EVIDENCE_REVIEW";

export type PrivateMediaStatus =
  | "UPLOADING"
  | "UPLOADED"
  | "PROCESSING"
  | "READY"
  | "REJECTED"
  | "QUARANTINED"
  | "DELETION_PENDING"
  | "DELETED";

export type ImmutableEvidenceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ASSIGNED"
  | "REVIEWED"
  | "WITHDRAWN"
  | "DELETED";

const mediaTransitions: Record<PrivateMediaStatus, PrivateMediaStatus[]> = {
  UPLOADING: ["UPLOADED", "DELETION_PENDING"],
  UPLOADED: ["PROCESSING", "DELETION_PENDING"],
  PROCESSING: ["READY", "REJECTED", "QUARANTINED", "DELETION_PENDING"],
  READY: ["DELETION_PENDING"],
  REJECTED: ["DELETION_PENDING"],
  QUARANTINED: ["DELETION_PENDING"],
  DELETION_PENDING: ["DELETED"],
  DELETED: [],
};

const evidenceTransitions: Record<
  ImmutableEvidenceStatus,
  ImmutableEvidenceStatus[]
> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["ASSIGNED", "WITHDRAWN"],
  ASSIGNED: ["REVIEWED", "WITHDRAWN"],
  REVIEWED: [],
  WITHDRAWN: ["DELETED"],
  DELETED: [],
};

export const canTransitionMedia = (
  from: PrivateMediaStatus,
  to: PrivateMediaStatus,
): boolean => mediaTransitions[from].includes(to);

export const canTransitionEvidence = (
  from: ImmutableEvidenceStatus,
  to: ImmutableEvidenceStatus,
): boolean => evidenceTransitions[from].includes(to);

export interface ConsentDecision {
  athleteId: string | null;
  granted: boolean;
  policyVersion: string;
  purposeKey: string;
  withdrawnAt: Date | null;
}

export const isActiveConsent = (
  consent: ConsentDecision | undefined,
  input: { athleteId: string; policyVersion: string; purposeKey: string },
): boolean =>
  consent !== undefined &&
  consent.athleteId === input.athleteId &&
  consent.purposeKey === input.purposeKey &&
  consent.policyVersion === input.policyVersion &&
  consent.granted &&
  consent.withdrawnAt === null;
