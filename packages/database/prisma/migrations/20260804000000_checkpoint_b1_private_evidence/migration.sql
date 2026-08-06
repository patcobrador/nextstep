-- Checkpoint B1 expands existing evidence records without rewriting prior attempts.
ALTER TABLE "MediaAsset"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "uploadExpiresAt" TIMESTAMPTZ(3),
  ADD COLUMN "processingStartedAt" TIMESTAMPTZ(3),
  ADD COLUMN "retentionExpiresAt" TIMESTAMPTZ(3),
  ADD COLUMN "retentionHoldUntil" TIMESTAMPTZ(3),
  ADD COLUMN "retentionHoldReason" TEXT;

ALTER TABLE "EvidenceSubmission"
  ADD COLUMN "reviewConsentRecordId" UUID,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "withdrawnAt" TIMESTAMPTZ(3),
  ADD COLUMN "deletionRequestedAt" TIMESTAMPTZ(3),
  ADD COLUMN "deletedAt" TIMESTAMPTZ(3);

ALTER TABLE "Assessment"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "startedAt" TIMESTAMPTZ(3);

CREATE INDEX "MediaAsset_status_uploadExpiresAt_idx"
  ON "MediaAsset"("status", "uploadExpiresAt");
CREATE INDEX "MediaAsset_status_retentionExpiresAt_idx"
  ON "MediaAsset"("status", "retentionExpiresAt");

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_uploaderUserId_fkey"
  FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvidenceSubmission"
  ADD CONSTRAINT "EvidenceSubmission_reviewConsentRecordId_fkey"
  FOREIGN KEY ("reviewConsentRecordId") REFERENCES "ConsentRecord"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
