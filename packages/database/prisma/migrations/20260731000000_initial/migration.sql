-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETION_PENDING');

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "AthleteStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETION_PENDING');

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('SKILL', 'CHECKPOINT', 'MILESTONE');

-- CreateEnum
CREATE TYPE "PrerequisiteType" AS ENUM ('HARD', 'SOFT');

-- CreateEnum
CREATE TYPE "ProgressState" AS ENUM ('LOCKED', 'AVAILABLE', 'ACTIVE', 'PRACTICE_COMPLETE', 'EVIDENCE_PENDING', 'REVIEW_PENDING', 'NEEDS_WORK', 'MASTERED', 'REVISIT_DUE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PracticePlanStatus" AS ENUM ('GENERATED', 'STARTED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PracticeSessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'SAFETY_STOPPED');

-- CreateEnum
CREATE TYPE "PracticeResultType" AS ENUM ('BOOLEAN', 'COUNT', 'DURATION', 'SUCCESS_RATIO', 'OBSERVATION', 'NONE');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'REJECTED', 'QUARANTINED', 'DELETION_PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('DRAFT', 'UPLOADING', 'SUBMITTED', 'ASSIGNED', 'REVIEWED', 'RETRY_REQUIRED', 'WITHDRAWN', 'DELETED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('PARENT_OBSERVATION', 'ASYNC_VIDEO', 'LIVE_REMOTE', 'IN_PERSON', 'ORGANISATION');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('REQUESTED', 'UNASSIGNED', 'ASSIGNED', 'IN_REVIEW', 'COMPLETED', 'APPEALED', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssessmentOutcome" AS ENUM ('PASS', 'RETRY', 'UNABLE_TO_ASSESS', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoachStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "identityProviderKey" TEXT NOT NULL,
    "displayName" TEXT,
    "emailHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mfaSatisfied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMembership" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "HouseholdRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "HouseholdMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "athleteId" UUID,
    "consentingUserId" UUID NOT NULL,
    "purposeKey" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMPTZ(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Athlete" (
    "id" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "ageBand" TEXT NOT NULL,
    "birthMonth" INTEGER,
    "birthYear" INTEGER,
    "laterality" TEXT,
    "status" "AthleteStatus" NOT NULL DEFAULT 'ACTIVE',
    "safetyConstraints" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteSportProfile" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "sportId" UUID NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "environment" JSONB NOT NULL,
    "baseline" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AthleteSportProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumVersion" (
    "id" UUID NOT NULL,
    "sportId" UUID NOT NULL,
    "versionKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "changeSummary" TEXT,
    "effectiveFrom" TIMESTAMPTZ(3),
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDomain" (
    "id" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SkillDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "ageGuidance" JSONB NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "stageId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "settings" JSONB NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignStep" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "branchGroupKey" TEXT,
    "branchOptionKey" TEXT,

    CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillNode" (
    "id" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "stageId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "childName" TEXT,
    "type" "NodeType" NOT NULL,
    "objective" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "completionRule" JSONB NOT NULL,
    "retentionRule" JSONB NOT NULL,

    CONSTRAINT "SkillNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillPrerequisite" (
    "id" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "prerequisiteNodeId" UUID NOT NULL,
    "type" "PrerequisiteType" NOT NULL,

    CONSTRAINT "SkillPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drill" (
    "id" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Drill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillDrill" (
    "id" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "drillId" UUID NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SkillDrill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRubric" (
    "id" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL,
    "evidenceInstructions" JSONB NOT NULL,
    "passRule" JSONB NOT NULL,

    CONSTRAINT "AssessmentRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterion" (
    "id" UUID NOT NULL,
    "rubricId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isCritical" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "scaleAnchors" JSONB NOT NULL,

    CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteCampaign" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "curriculumVersionId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "branchSelections" JSONB,

    CONSTRAINT "AthleteCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteSkillProgress" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "state" "ProgressState" NOT NULL,
    "stateVersion" INTEGER NOT NULL DEFAULT 1,
    "demonstratedAt" TIMESTAMPTZ(3),
    "verifiedAt" TIMESTAMPTZ(3),
    "verifyingAssessmentId" UUID,
    "revisitDueAt" TIMESTAMPTZ(3),
    "transitionEventId" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AthleteSkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticePlan" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "athleteCampaignId" UUID NOT NULL,
    "status" "PracticePlanStatus" NOT NULL DEFAULT 'GENERATED',
    "targetDurationMinutes" INTEGER NOT NULL,
    "environmentSnapshot" JSONB NOT NULL,
    "generationReasons" JSONB NOT NULL,
    "ruleSnapshot" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3),

    CONSTRAINT "PracticePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticePlanStep" (
    "id" UUID NOT NULL,
    "practicePlanId" UUID NOT NULL,
    "nodeId" UUID,
    "drillId" UUID,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "resultType" "PracticeResultType" NOT NULL,
    "prescriptionReason" TEXT NOT NULL,
    "contentSnapshot" JSONB NOT NULL,

    CONSTRAINT "PracticePlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" UUID NOT NULL,
    "practicePlanId" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "clientSessionId" TEXT,
    "status" "PracticeSessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedOffline" BOOLEAN NOT NULL DEFAULT false,
    "reflection" JSONB,
    "safetyFlag" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAttempt" (
    "id" UUID NOT NULL,
    "practiceSessionId" UUID NOT NULL,
    "planStepId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "resultType" "PracticeResultType" NOT NULL,
    "result" JSONB,
    "difficultyRating" INTEGER,
    "cueUnderstood" BOOLEAN,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "skipReason" TEXT,
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "uploaderUserId" UUID NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "objectKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "declaredMimeType" TEXT NOT NULL,
    "detectedMimeType" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "durationMs" INTEGER,
    "checksumSha256" TEXT,
    "rejectionCode" TEXT,
    "retentionPolicyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSubmission" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "nodeId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "consentRecordId" UUID NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'DRAFT',
    "captureTime" TIMESTAMPTZ(3),
    "retentionPolicyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMPTZ(3),

    CONSTRAINT "EvidenceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CoachStatus" NOT NULL DEFAULT 'PENDING',
    "identityVerifiedAt" TIMESTAMPTZ(3),
    "calibrationPassedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachCredential" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "credentialType" TEXT NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "referenceHash" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),

    CONSTRAINT "CoachCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPrivilege" (
    "id" UUID NOT NULL,
    "coachProfileId" UUID NOT NULL,
    "sportId" UUID NOT NULL,
    "stageKey" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CoachPrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "evidenceSubmissionId" UUID NOT NULL,
    "rubricId" UUID NOT NULL,
    "assignedCoachId" UUID,
    "type" "AssessmentType" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "outcome" "AssessmentOutcome",
    "rubricSnapshot" JSONB NOT NULL,
    "dueAt" TIMESTAMPTZ(3),
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCriterionScore" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "rubricCriterionId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "evidenceTimestampMs" INTEGER,

    CONSTRAINT "AssessmentCriterionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentFeedback" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "positives" JSONB NOT NULL,
    "primaryCue" TEXT NOT NULL,
    "nextAction" JSONB NOT NULL,
    "reviewerNote" TEXT,
    "correctionOfId" UUID,
    "correctionReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportEvent" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "sourceEventId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "curriculumProvenance" JSONB,

    CONSTRAINT "PassportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "correlationId" UUID NOT NULL,
    "causationId" UUID,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "lastErrorCode" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "consumerKey" TEXT NOT NULL,
    "eventId" UUID NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("consumerKey","eventId")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseCode" INTEGER NOT NULL,
    "responseBody" JSONB,
    "resourceId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" UUID,
    "reasonCode" TEXT,
    "correlationId" UUID NOT NULL,
    "safeMetadata" JSONB,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" UUID NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "sourceFlow" TEXT NOT NULL,
    "athleteId" UUID,
    "ownerUserId" UUID,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SafetyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_identityProviderKey_key" ON "User"("identityProviderKey");

-- CreateIndex
CREATE INDEX "HouseholdMembership_userId_revokedAt_idx" ON "HouseholdMembership"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMembership_householdId_userId_key" ON "HouseholdMembership"("householdId", "userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_householdId_purposeKey_recordedAt_idx" ON "ConsentRecord"("householdId", "purposeKey", "recordedAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_athleteId_purposeKey_idx" ON "ConsentRecord"("athleteId", "purposeKey");

-- CreateIndex
CREATE INDEX "Athlete_householdId_status_idx" ON "Athlete"("householdId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteSportProfile_athleteId_sportId_key" ON "AthleteSportProfile"("athleteId", "sportId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_key_key" ON "Sport"("key");

-- CreateIndex
CREATE INDEX "CurriculumVersion_sportId_status_idx" ON "CurriculumVersion"("sportId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_sportId_versionKey_key" ON "CurriculumVersion"("sportId", "versionKey");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDomain_curriculumVersionId_key_key" ON "SkillDomain"("curriculumVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_curriculumVersionId_key_key" ON "Stage"("curriculumVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_curriculumVersionId_key_key" ON "Campaign"("curriculumVersionId", "key");

-- CreateIndex
CREATE INDEX "CampaignStep_campaignId_branchGroupKey_idx" ON "CampaignStep"("campaignId", "branchGroupKey");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignStep_campaignId_sequence_nodeId_key" ON "CampaignStep"("campaignId", "sequence", "nodeId");

-- CreateIndex
CREATE INDEX "SkillNode_domainId_stageId_idx" ON "SkillNode"("domainId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillNode_curriculumVersionId_key_key" ON "SkillNode"("curriculumVersionId", "key");

-- CreateIndex
CREATE INDEX "SkillPrerequisite_prerequisiteNodeId_idx" ON "SkillPrerequisite"("prerequisiteNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillPrerequisite_nodeId_prerequisiteNodeId_key" ON "SkillPrerequisite"("nodeId", "prerequisiteNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Drill_curriculumVersionId_key_key" ON "Drill"("curriculumVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SkillDrill_nodeId_drillId_key" ON "SkillDrill"("nodeId", "drillId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRubric_curriculumVersionId_key_version_key" ON "AssessmentRubric"("curriculumVersionId", "key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RubricCriterion_rubricId_key_key" ON "RubricCriterion"("rubricId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteCampaign_athleteId_campaignId_key" ON "AthleteCampaign"("athleteId", "campaignId");

-- CreateIndex
CREATE INDEX "AthleteSkillProgress_athleteId_state_idx" ON "AthleteSkillProgress"("athleteId", "state");

-- CreateIndex
CREATE INDEX "AthleteSkillProgress_revisitDueAt_idx" ON "AthleteSkillProgress"("revisitDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteSkillProgress_athleteId_nodeId_key" ON "AthleteSkillProgress"("athleteId", "nodeId");

-- CreateIndex
CREATE INDEX "PracticePlan_athleteId_status_idx" ON "PracticePlan"("athleteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PracticePlanStep_practicePlanId_sequence_key" ON "PracticePlanStep"("practicePlanId", "sequence");

-- CreateIndex
CREATE INDEX "PracticeSession_athleteId_status_idx" ON "PracticeSession"("athleteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSession_practicePlanId_clientSessionId_key" ON "PracticeSession"("practicePlanId", "clientSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAttempt_practiceSessionId_planStepId_attemptNumber_key" ON "PracticeAttempt"("practiceSessionId", "planStepId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_athleteId_status_idx" ON "MediaAsset"("athleteId", "status");

-- CreateIndex
CREATE INDEX "EvidenceSubmission_athleteId_nodeId_status_idx" ON "EvidenceSubmission"("athleteId", "nodeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceSubmission_mediaAssetId_key" ON "EvidenceSubmission"("mediaAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

-- CreateIndex
CREATE INDEX "CoachCredential_coachProfileId_credentialType_status_idx" ON "CoachCredential"("coachProfileId", "credentialType", "status");

-- CreateIndex
CREATE INDEX "CoachCredential_expiresAt_idx" ON "CoachCredential"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPrivilege_coachProfileId_sportId_stageKey_assessmentTy_key" ON "CoachPrivilege"("coachProfileId", "sportId", "stageKey", "assessmentType");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_evidenceSubmissionId_key" ON "Assessment"("evidenceSubmissionId");

-- CreateIndex
CREATE INDEX "Assessment_assignedCoachId_status_dueAt_idx" ON "Assessment"("assignedCoachId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Assessment_athleteId_status_idx" ON "Assessment"("athleteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCriterionScore_assessmentId_rubricCriterionId_key" ON "AssessmentCriterionScore"("assessmentId", "rubricCriterionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentFeedback_assessmentId_key" ON "AssessmentFeedback"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PassportEvent_sourceEventId_key" ON "PassportEvent"("sourceEventId");

-- CreateIndex
CREATE INDEX "PassportEvent_athleteId_occurredAt_idx" ON "PassportEvent"("athleteId", "occurredAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_occurredAt_idx" ON "OutboxEvent"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateId_occurredAt_idx" ON "OutboxEvent"("aggregateId", "occurredAt");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_actorId_operation_key_key" ON "IdempotencyRecord"("actorId", "operation", "key");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_occurredAt_idx" ON "AuditEvent"("resourceType", "resourceId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_occurredAt_idx" ON "AuditEvent"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "SafetyIncident_severity_status_createdAt_idx" ON "SafetyIncident"("severity", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_consentingUserId_fkey" FOREIGN KEY ("consentingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteSportProfile" ADD CONSTRAINT "AthleteSportProfile_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteSportProfile" ADD CONSTRAINT "AthleteSportProfile_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDomain" ADD CONSTRAINT "SkillDomain_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillNode" ADD CONSTRAINT "SkillNode_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillNode" ADD CONSTRAINT "SkillNode_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "SkillDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillNode" ADD CONSTRAINT "SkillNode_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_prerequisiteNodeId_fkey" FOREIGN KEY ("prerequisiteNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drill" ADD CONSTRAINT "Drill_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDrill" ADD CONSTRAINT "SkillDrill_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillDrill" ADD CONSTRAINT "SkillDrill_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRubric" ADD CONSTRAINT "AssessmentRubric_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRubric" ADD CONSTRAINT "AssessmentRubric_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterion" ADD CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "AssessmentRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteCampaign" ADD CONSTRAINT "AthleteCampaign_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteCampaign" ADD CONSTRAINT "AthleteCampaign_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteCampaign" ADD CONSTRAINT "AthleteCampaign_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteSkillProgress" ADD CONSTRAINT "AthleteSkillProgress_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteSkillProgress" ADD CONSTRAINT "AthleteSkillProgress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteSkillProgress" ADD CONSTRAINT "AthleteSkillProgress_verifyingAssessmentId_fkey" FOREIGN KEY ("verifyingAssessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlan" ADD CONSTRAINT "PracticePlan_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlan" ADD CONSTRAINT "PracticePlan_athleteCampaignId_fkey" FOREIGN KEY ("athleteCampaignId") REFERENCES "AthleteCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlanStep" ADD CONSTRAINT "PracticePlanStep_practicePlanId_fkey" FOREIGN KEY ("practicePlanId") REFERENCES "PracticePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlanStep" ADD CONSTRAINT "PracticePlanStep_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlanStep" ADD CONSTRAINT "PracticePlanStep_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_practicePlanId_fkey" FOREIGN KEY ("practicePlanId") REFERENCES "PracticePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_practiceSessionId_fkey" FOREIGN KEY ("practiceSessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_planStepId_fkey" FOREIGN KEY ("planStepId") REFERENCES "PracticePlanStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSubmission" ADD CONSTRAINT "EvidenceSubmission_consentRecordId_fkey" FOREIGN KEY ("consentRecordId") REFERENCES "ConsentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachCredential" ADD CONSTRAINT "CoachCredential_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPrivilege" ADD CONSTRAINT "CoachPrivilege_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPrivilege" ADD CONSTRAINT "CoachPrivilege_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_evidenceSubmissionId_fkey" FOREIGN KEY ("evidenceSubmissionId") REFERENCES "EvidenceSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "AssessmentRubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_assignedCoachId_fkey" FOREIGN KEY ("assignedCoachId") REFERENCES "CoachProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCriterionScore" ADD CONSTRAINT "AssessmentCriterionScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCriterionScore" ADD CONSTRAINT "AssessmentCriterionScore_rubricCriterionId_fkey" FOREIGN KEY ("rubricCriterionId") REFERENCES "RubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFeedback" ADD CONSTRAINT "AssessmentFeedback_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassportEvent" ADD CONSTRAINT "PassportEvent_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
