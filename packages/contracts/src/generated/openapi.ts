// Generated from contracts/openapi.yaml. Do not edit.
export interface paths {
  "/health/live": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Confirm that the API process is alive */
    get: operations["getLiveness"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/health/ready": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Confirm that required API dependencies are available */
    get: operations["getReadiness"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/me": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Return the authenticated user and authorised household context */
    get: operations["getCurrentUser"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/households/{householdId}/athletes": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        householdId: components["parameters"]["HouseholdId"];
      };
      cookie?: never;
    };
    /** List active and optionally archived athletes in the household */
    get: operations["listAthletes"];
    put?: never;
    /** Create a parent-controlled private athlete profile */
    post: operations["createAthlete"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/households/{householdId}/consents": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        householdId: components["parameters"]["HouseholdId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Record a versioned, purpose-specific adult consent decision */
    post: operations["recordConsent"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/consents/{consentId}/withdraw": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        consentId: components["parameters"]["ConsentId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["withdrawConsent"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    get: operations["getAthlete"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations["updateAthlete"];
    trace?: never;
  };
  "/athletes/{athleteId}/baseline": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Submit baseline inputs and assign a recommended starting campaign */
    post: operations["submitBaseline"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}/dashboard": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    /** Return the athlete's single primary next action and concise progress context */
    get: operations["getAthleteDashboard"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}/skill-tree": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    get: operations["getSkillTree"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}/skills/{nodeId}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
        nodeId: components["parameters"]["NodeId"];
      };
      cookie?: never;
    };
    /** Return contextual skill content, progress and remaining requirements */
    get: operations["getAthleteSkillDetail"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}/branch-selections": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["selectCampaignBranch"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}/practice-plans": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["generatePracticePlan"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/practice-plans/{planId}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        planId: components["parameters"]["PlanId"];
      };
      cookie?: never;
    };
    get: operations["getPracticePlan"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/practice-plans/{planId}/sessions": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        planId: components["parameters"]["PlanId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["startPracticeSession"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/practice-sessions/{sessionId}/attempts": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["recordPracticeAttempt"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/practice-sessions/{sessionId}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    /** Retrieve resumable practice-session state */
    get: operations["getPracticeSession"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations["updatePracticeSession"];
    trace?: never;
  };
  "/practice-sessions/{sessionId}/complete": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["completePracticeSession"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/evidence/upload-intents": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["createEvidenceUploadIntent"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/evidence/upload-intents/{mediaAssetId}/complete": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        mediaAssetId: components["parameters"]["MediaAssetId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Finalise a direct private upload and queue media validation */
    post: operations["completeEvidenceUpload"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/evidence-submissions": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["submitEvidence"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/evidence-submissions/{evidenceId}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        evidenceId: components["parameters"]["EvidenceId"];
      };
      cookie?: never;
    };
    get: operations["getEvidenceSubmission"];
    put?: never;
    post?: never;
    /** Request worker-driven deletion of private evidence */
    delete: operations["requestEvidenceDeletion"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/evidence-submissions/{evidenceId}/playback-grants": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        evidenceId: components["parameters"]["EvidenceId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Create a short-lived, audited playback grant after object authorisation */
    post: operations["createEvidencePlaybackGrant"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/coach/assessment-queue": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["getCoachAssessmentQueue"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/coach/assessments/{assessmentId}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assessmentId: components["parameters"]["AssessmentId"];
      };
      cookie?: never;
    };
    get: operations["getCoachAssessment"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/coach/assessments/{assessmentId}/decision": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assessmentId: components["parameters"]["AssessmentId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["submitAssessmentDecision"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/assessments/{assessmentId}/appeals": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assessmentId: components["parameters"]["AssessmentId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["appealAssessment"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/athletes/{athleteId}/passport": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    get: operations["getAthletePassport"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/bookings": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["createBooking"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/orders": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["createOrder"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/webhooks/stripe": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["receiveStripeWebhook"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/admin/curricula": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["createCurriculumDraft"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/admin/curricula/{curriculumId}/validate": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        curriculumId: components["parameters"]["CurriculumId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["validateCurriculum"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/admin/curricula/{curriculumId}/publish": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        curriculumId: components["parameters"]["CurriculumId"];
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations["publishCurriculum"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    CurrentUser: {
      /** Format: uuid */
      id: string;
      displayName?: string | null;
      roles: string[];
      households: {
        /** Format: uuid */
        id: string;
        name?: string | null;
        role: string;
      }[];
    };
    Athlete: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      householdId: string;
      displayName: string;
      /** @example U10 */
      ageBand: string;
      birthMonth?: number | null;
      birthYear?: number | null;
      laterality?: string | null;
      /** @enum {string} */
      status: "ACTIVE" | "ARCHIVED" | "DELETION_PENDING";
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
    };
    CreateAthleteRequest: {
      displayName: string;
      ageBand: string;
      birthMonth?: number;
      birthYear?: number;
      laterality?: string;
      consents: components["schemas"]["ConsentGrant"][];
    };
    UpdateAthleteRequest: {
      displayName?: string;
      ageBand?: string;
      laterality?: string | null;
      /** @enum {string} */
      status?: "ACTIVE" | "ARCHIVED";
    };
    ConsentGrant: {
      purposeKey: string;
      policyVersion: string;
      granted: boolean;
    };
    RecordConsentRequest: {
      /** Format: uuid */
      athleteId?: string | null;
      /** @enum {string} */
      purposeKey:
        | "PRIVATE_EVIDENCE_CAPTURE_UPLOAD"
        | "ASSIGNED_COACH_EVIDENCE_REVIEW";
      policyVersion: string;
      granted: boolean;
    };
    ConsentRecord: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      householdId: string;
      /** Format: uuid */
      athleteId?: string | null;
      /** @enum {string} */
      purposeKey:
        | "PRIVATE_EVIDENCE_CAPTURE_UPLOAD"
        | "ASSIGNED_COACH_EVIDENCE_REVIEW";
      policyVersion: string;
      granted: boolean;
      /** Format: date-time */
      recordedAt: string;
      /** Format: date-time */
      withdrawnAt?: string | null;
    };
    BaselineRequest: {
      /** @constant */
      sportKey: "basketball";
      experienceLevel: string;
      environment: components["schemas"]["PracticeEnvironment"];
      observations: {
        key: string;
        value: unknown;
      }[];
    };
    BaselineResult: {
      /** Format: uuid */
      athleteId: string;
      curriculumVersion: string;
      recommendedStageKey: string;
      campaign: components["schemas"]["CampaignSummary"];
      explanation: string[];
      /** @constant */
      mayChooseMoreFoundationalStart?: true;
    };
    AthleteDashboard: {
      athlete: components["schemas"]["Athlete"];
      primaryAction: components["schemas"]["NextAction"];
      campaign: components["schemas"]["CampaignSummary"];
      weeklySummary: {
        meaningfulPractices: number;
        progressing: boolean;
        revisitDueCount?: number;
      };
      pendingAssessment?: components["schemas"]["AssessmentSummary"] | null;
    };
    NextAction: {
      /** @enum {string} */
      type:
        | "START_PRACTICE"
        | "CONTINUE_PRACTICE"
        | "CHOOSE_BRANCH"
        | "SUBMIT_EVIDENCE"
        | "REVIEW_FEEDBACK"
        | "BOOK_ASSESSMENT"
        | "REVISIT"
        | "REST";
      title: string;
      description?: string | null;
      ctaLabel: string;
      destination: string;
      reasonCodes?: string[];
    };
    CampaignSummary: {
      /** Format: uuid */
      id: string;
      key: string;
      name: string;
      stageKey: string;
      progress: number;
      nextMilestoneName?: string | null;
    };
    SkillTree: {
      curriculumVersion: string;
      campaign: components["schemas"]["CampaignSummary"];
      domains: {
        key: string;
        name: string;
        sortOrder: number;
        completedNodeCount: number;
        totalNodeCount: number;
        progress: number;
      }[];
      nodes: components["schemas"]["AthleteSkillNode"][];
      branchChoices?: components["schemas"]["BranchChoice"][];
    };
    AthleteSkillNode: {
      /** Format: uuid */
      id: string;
      key: string;
      name: string;
      childName?: string | null;
      domainKey: string;
      stageKey: string;
      /** @enum {string} */
      type?: "SKILL" | "CHECKPOINT" | "MILESTONE";
      state: components["schemas"]["ProgressState"];
      demonstrated: boolean;
      verified: boolean;
      whyLocked?: string | null;
      prerequisiteNodeIds?: string[];
      /** Format: date-time */
      revisitDueAt?: string | null;
      remainingRequirements?: string[];
    };
    AthleteSkillDetail: components["schemas"]["AthleteSkillNode"] & {
      objective: string;
      whyItMatters: string;
      childCues: string[];
      commonErrors?: string[];
      safety: string[];
      primaryAction: components["schemas"]["NextAction"];
      evidenceInstructions?:
        | null
        | components["schemas"]["EvidenceInstructions"];
    };
    EvidenceInstructions: {
      movement: string;
      framing: string;
      maxDurationSeconds: number;
      requiredSequence: string[];
      equipment: string[];
      safety: string[];
      privacy: string[];
      /** @constant */
      supportedFormat: "MP4 with H.264 video";
    };
    BranchChoice: {
      branchGroupKey: string;
      title: string;
      description?: string | null;
      options: {
        /** Format: uuid */
        nodeId: string;
        title: string;
        tradeoff: string;
      }[];
    };
    /** @enum {string} */
    ProgressState:
      | "LOCKED"
      | "AVAILABLE"
      | "ACTIVE"
      | "PRACTICE_COMPLETE"
      | "EVIDENCE_PENDING"
      | "REVIEW_PENDING"
      | "NEEDS_WORK"
      | "MASTERED"
      | "REVISIT_DUE"
      | "ARCHIVED";
    PracticeEnvironment: {
      /** @enum {string} */
      locationType: "INDOOR" | "OUTDOOR";
      /** @enum {string} */
      spaceClass: "SMALL" | "MEDIUM" | "COURT";
      /** @default false */
      noiseRestricted: boolean;
      surface?: string | null;
      equipmentKeys: string[];
    };
    GeneratePracticePlanRequest: {
      /** @enum {string} */
      durationPreset: "QUICK" | "STANDARD" | "EXTENDED";
      environment: components["schemas"]["PracticeEnvironment"];
      /** Format: uuid */
      selectedBranchNodeId?: string | null;
      recentLoad: {
        /** @enum {string} */
        fatigue: "LOW" | "NORMAL" | "HIGH";
        pain: boolean;
        note?: string | null;
      };
    };
    PracticePlan: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      athleteId: string;
      title: string;
      purpose: string;
      /** @enum {string} */
      status: "GENERATED" | "STARTED" | "COMPLETED" | "EXPIRED" | "CANCELLED";
      targetDurationMinutes: number;
      generationReasons: string[];
      steps: components["schemas"]["PracticePlanStep"][];
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      expiresAt?: string | null;
    };
    PracticePlanStep: {
      /** Format: uuid */
      id: string;
      sequence: number;
      /** @enum {string} */
      type:
        | "SAFETY_CHECK"
        | "WARMUP"
        | "DRILL"
        | "RETRIEVAL"
        | "CHALLENGE"
        | "COOLDOWN"
        | "REFLECTION";
      /** Format: uuid */
      nodeId?: string | null;
      /** Format: uuid */
      drillId?: string | null;
      title: string;
      targetDurationSeconds?: number | null;
      targetRepetitions?: number | null;
      /** @enum {string} */
      resultType?:
        | "BOOLEAN"
        | "COUNT"
        | "DURATION"
        | "SUCCESS_RATIO"
        | "OBSERVATION"
        | "NONE";
      prescriptionReason: string;
      content: {
        [key: string]: unknown;
      };
    };
    PracticeSession: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      practicePlanId: string;
      /** Format: uuid */
      athleteId: string;
      /** @enum {string} */
      status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "ABANDONED"
        | "SAFETY_STOPPED";
      /** Format: date-time */
      startedAt?: string | null;
      /** Format: date-time */
      completedAt?: string | null;
      /** Format: date-time */
      createdAt: string;
      /** @default 1 */
      version: number;
    };
    PracticeSessionDetail: components["schemas"]["PracticeSession"] & {
      attempts: components["schemas"]["PracticeAttempt"][];
    };
    UpdatePracticeSessionRequest: {
      /** @enum {string} */
      status?: "IN_PROGRESS" | "ABANDONED" | "SAFETY_STOPPED";
    };
    PracticeAttemptRequest: {
      /** Format: uuid */
      planStepId: string;
      attemptNumber: number;
      /** @enum {string} */
      resultType:
        | "BOOLEAN"
        | "COUNT"
        | "DURATION"
        | "SUCCESS_RATIO"
        | "OBSERVATION"
        | "NONE";
      result?: unknown;
      difficultyRating?: number | null;
      cueUnderstood?: boolean | null;
      skipped: boolean;
      skipReason?: string | null;
      /** Format: date-time */
      completedAt?: string;
    };
    PracticeAttempt: components["schemas"]["PracticeAttemptRequest"] & {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      sessionId: string;
    };
    CompletePracticeSessionRequest: {
      enjoymentRating: number;
      difficultyRating: number;
      parentObservation?: string | null;
      safetyFlag: boolean;
      safetyNote?: string | null;
      /** Format: date-time */
      completedAt?: string;
    };
    PracticeCompletionResult: {
      session: components["schemas"]["PracticeSession"];
      progressChanges: {
        /** Format: uuid */
        nodeId: string;
        priorState: components["schemas"]["ProgressState"];
        newState: components["schemas"]["ProgressState"];
        reason: string;
      }[];
      nextAction: components["schemas"]["NextAction"];
    };
    CreateUploadIntentRequest: {
      /** Format: uuid */
      athleteId: string;
      /** Format: uuid */
      nodeId: string;
      /** Format: uuid */
      consentRecordId: string;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      durationMs?: number | null;
      checksumSha256?: string | null;
    };
    UploadIntent: {
      /** Format: uuid */
      evidenceId: string;
      /** Format: uuid */
      mediaAssetId: string;
      /** Format: uri */
      uploadUrl: string;
      /** Format: date-time */
      expiresAt: string;
      requiredHeaders: {
        [key: string]: string;
      };
      /** @default false */
      multipart: boolean;
    };
    CompleteEvidenceUploadRequest: {
      checksumSha256: string;
      uploadId?: string | null;
      parts?: {
        partNumber: number;
        etag: string;
      }[];
    };
    MediaAsset: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      athleteId: string;
      /** @enum {string} */
      status:
        | "UPLOADING"
        | "UPLOADED"
        | "PROCESSING"
        | "READY"
        | "REJECTED"
        | "QUARANTINED"
        | "DELETION_PENDING"
        | "DELETED";
      rejectionCode?: string | null;
      sizeBytes: number;
      durationMs?: number | null;
      version: number;
      /** Format: date-time */
      uploadExpiresAt?: string | null;
      /** Format: date-time */
      retentionExpiresAt?: string | null;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      readyAt?: string | null;
    };
    PlaybackGrant: {
      /** Format: uri */
      url: string;
      /** Format: date-time */
      expiresAt: string;
    };
    SubmitEvidenceRequest: {
      /** Format: uuid */
      evidenceId: string;
      /** Format: uuid */
      reviewConsentRecordId: string;
    };
    EvidenceSubmission: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      athleteId: string;
      /** Format: uuid */
      nodeId: string;
      /** Format: uuid */
      mediaAssetId: string;
      /** Format: uuid */
      consentRecordId: string;
      /** Format: uuid */
      reviewConsentRecordId?: string | null;
      /** @enum {string} */
      status:
        | "DRAFT"
        | "SUBMITTED"
        | "ASSIGNED"
        | "REVIEWED"
        | "WITHDRAWN"
        | "DELETED";
      media: components["schemas"]["MediaAsset"];
      version: number;
      /** Format: uuid */
      assessmentId?: string | null;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      submittedAt?: string | null;
      /** Format: date-time */
      withdrawnAt?: string | null;
      /** Format: date-time */
      deletionRequestedAt?: string | null;
      /** Format: date-time */
      deletedAt?: string | null;
    };
    AssessmentSummary: {
      /** Format: uuid */
      id: string;
      athleteDisplayName: string;
      nodeName: string;
      /** @enum {string} */
      type:
        | "PARENT_OBSERVATION"
        | "ASYNC_VIDEO"
        | "LIVE_REMOTE"
        | "IN_PERSON"
        | "ORGANISATION";
      /** @enum {string} */
      status:
        | "REQUESTED"
        | "UNASSIGNED"
        | "ASSIGNED"
        | "IN_REVIEW"
        | "COMPLETED"
        | "APPEALED"
        | "SUPERSEDED"
        | "CANCELLED";
      /** Format: date-time */
      requestedAt: string;
      /** Format: date-time */
      dueAt?: string | null;
      /** @enum {string|null} */
      outcome?: "PASS" | "RETRY" | "UNABLE_TO_ASSESS" | "CANCELLED" | null;
    };
    AssessmentDetail: components["schemas"]["AssessmentSummary"] & {
      athleteContext: {
        ageBand: string;
        relevantHistory: string[];
      };
      rubric: components["schemas"]["RubricSnapshot"];
      /** Format: uri */
      playbackUrl?: string | null;
      /** Format: date-time */
      playbackExpiresAt?: string | null;
    };
    RubricSnapshot: {
      key: string;
      version: number;
      passRule: {
        [key: string]: unknown;
      };
      criteria: {
        /** Format: uuid */
        id: string;
        key: string;
        name: string;
        description: string;
        isCritical: boolean;
        scaleAnchors: {
          [key: string]: string;
        };
      }[];
    };
    AssessmentDecisionRequest: {
      /** @enum {string} */
      outcome: "PASS" | "RETRY" | "UNABLE_TO_ASSESS";
      criterionScores: {
        /** Format: uuid */
        criterionId: string;
        score: number;
        note?: string | null;
        evidenceTimestampMs?: number | null;
      }[];
      positives: string[];
      primaryCue: string;
      nextAction: {
        /** @enum {string} */
        type:
          | "UNLOCK"
          | "PRESCRIBE_REMEDIATION"
          | "RESUBMIT_EVIDENCE"
          | "BOOK_LIVE_REVIEW";
        nodeIds?: string[];
      };
      reviewerNote?: string | null;
    };
    AssessmentResult: {
      /** Format: uuid */
      assessmentId: string;
      /** @enum {string} */
      outcome: "PASS" | "RETRY" | "UNABLE_TO_ASSESS";
      /** Format: date-time */
      completedAt: string;
      progressChanges: {
        /** Format: uuid */
        nodeId: string;
        priorState: components["schemas"]["ProgressState"];
        newState: components["schemas"]["ProgressState"];
      }[];
    };
    AthletePassport: {
      athlete: components["schemas"]["Athlete"];
      currentStageKey?: string | null;
      domainSummaries: {
        domainKey: string;
        name: string;
        demonstratedCount: number;
        verifiedCount: number;
      }[];
      timeline: {
        /** Format: uuid */
        id: string;
        eventType: string;
        /** Format: date-time */
        occurredAt: string;
        title: string;
        summary?: string | null;
        /** @default false */
        verified: boolean;
      }[];
      nextCursor?: string | null;
    };
    CreateBookingRequest: {
      /** Format: uuid */
      householdId: string;
      /** Format: uuid */
      athleteId: string;
      /** Format: uuid */
      coachId: string;
      /** Format: uuid */
      availabilitySlotId?: string | null;
      serviceKey: string;
      /** Format: date-time */
      startsAt: string;
      /** Format: date-time */
      endsAt: string;
      timezone: string;
      venue: {
        [key: string]: unknown;
      };
      /** @constant */
      parentPresenceAcknowledged?: true;
    };
    Booking: {
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      householdId: string;
      /** Format: uuid */
      athleteId: string;
      /** Format: uuid */
      coachId: string;
      serviceKey: string;
      /** Format: date-time */
      startsAt: string;
      /** Format: date-time */
      endsAt: string;
      /** @enum {string} */
      status:
        | "DRAFT"
        | "PAYMENT_PENDING"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW"
        | "DISPUTED"
        | "REFUNDED";
      /** Format: uuid */
      orderId?: string | null;
    };
    CreateOrderRequest: {
      /** Format: uuid */
      householdId: string;
      /** @example AUD */
      currency: string;
      lines: {
        itemType: string;
        itemRef?: string | null;
        description: string;
        quantity: number;
        unitPriceMinor: number;
      }[];
    };
    Order: {
      /** Format: uuid */
      id: string;
      /** @enum {string} */
      status:
        | "DRAFT"
        | "PAYMENT_PENDING"
        | "PAID"
        | "FAILED"
        | "CANCELLED"
        | "REFUNDED"
        | "PARTIALLY_REFUNDED"
        | "DISPUTED";
      currency: string;
      subtotalMinor: number;
      taxMinor: number;
      totalMinor: number;
      providerClientSecret?: string | null;
    };
    CreateCurriculumRequest: {
      sportKey: string;
      versionKey: string;
      name: string;
      /** Format: uuid */
      cloneFromVersionId?: string | null;
    };
    CurriculumVersion: {
      /** Format: uuid */
      id: string;
      sportKey: string;
      versionKey: string;
      name: string;
      /** @enum {string} */
      status: "DRAFT" | "VALIDATING" | "APPROVED" | "PUBLISHED" | "RETIRED";
      /** Format: date-time */
      effectiveFrom?: string | null;
      /** Format: date-time */
      publishedAt?: string | null;
    };
    CurriculumValidationReport: {
      valid: boolean;
      errors: components["schemas"]["ValidationMessage"][];
      warnings: components["schemas"]["ValidationMessage"][];
      stats: {
        [key: string]: unknown;
      };
    };
    ValidationMessage: {
      code: string;
      message: string;
      resourceType?: string | null;
      resourceKey?: string | null;
    };
    Problem: {
      /** Format: uri-reference */
      type: string;
      title: string;
      status: number;
      code: string;
      detail?: string | null;
      correlationId: string;
      meta?: {
        [key: string]: unknown;
      };
    };
  };
  responses: {
    /** @description Problem details */
    Problem: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/problem+json": components["schemas"]["Problem"];
      };
    };
  };
  parameters: {
    HouseholdId: string;
    AthleteId: string;
    PlanId: string;
    SessionId: string;
    NodeId: string;
    ConsentId: string;
    MediaAssetId: string;
    EvidenceId: string;
    AssessmentId: string;
    CurriculumId: string;
    IdempotencyKey: string;
    IfMatch: string;
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getLiveness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Process is alive */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            /** @constant */
            status: "ok";
          };
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getReadiness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description API is ready */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            /** @constant */
            status: "ready";
            dependencies: {
              [key: string]: string;
            };
          };
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getCurrentUser: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current user */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["CurrentUser"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  listAthletes: {
    parameters: {
      query?: {
        includeArchived?: boolean;
      };
      header?: never;
      path: {
        householdId: components["parameters"]["HouseholdId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Athlete list */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            items: components["schemas"]["Athlete"][];
          };
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  createAthlete: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        householdId: components["parameters"]["HouseholdId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateAthleteRequest"];
      };
    };
    responses: {
      /** @description Athlete created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Athlete"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  recordConsent: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        householdId: components["parameters"]["HouseholdId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["RecordConsentRequest"];
      };
    };
    responses: {
      /** @description Consent decision recorded */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ConsentRecord"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  withdrawConsent: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        consentId: components["parameters"]["ConsentId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Consent withdrawal recorded without deleting history */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ConsentRecord"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getAthlete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Athlete profile */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Athlete"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  updateAthlete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/merge-patch+json": components["schemas"]["UpdateAthleteRequest"];
      };
    };
    responses: {
      /** @description Athlete updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Athlete"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  submitBaseline: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["BaselineRequest"];
      };
    };
    responses: {
      /** @description Baseline result and campaign recommendation */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["BaselineResult"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getAthleteDashboard: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Dashboard */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AthleteDashboard"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getSkillTree: {
    parameters: {
      query?: {
        domainKey?: string;
        stageKey?: string;
      };
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Athlete-specific curriculum tree and progress state */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["SkillTree"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getAthleteSkillDetail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
        nodeId: components["parameters"]["NodeId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Athlete-specific skill detail */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AthleteSkillDetail"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  selectCampaignBranch: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          branchGroupKey: string;
          /** Format: uuid */
          selectedNodeId: string;
        };
      };
    };
    responses: {
      /** @description Updated branch and next action */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AthleteDashboard"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  generatePracticePlan: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["GeneratePracticePlanRequest"];
      };
    };
    responses: {
      /** @description Persisted practice plan snapshot */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticePlan"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getPracticePlan: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        planId: components["parameters"]["PlanId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Practice plan */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticePlan"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  startPracticeSession: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        planId: components["parameters"]["PlanId"];
      };
      cookie?: never;
    };
    requestBody?: {
      content: {
        "application/json": {
          clientSessionId?: string;
          /** @default false */
          startedOffline?: boolean;
        };
      };
    };
    responses: {
      /** @description Practice session started */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticeSession"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  recordPracticeAttempt: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["PracticeAttemptRequest"];
      };
    };
    responses: {
      /** @description Attempt recorded */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticeAttempt"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getPracticeSession: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Current session and recorded attempts */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticeSessionDetail"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  updatePracticeSession: {
    parameters: {
      query?: never;
      header: {
        "If-Match": components["parameters"]["IfMatch"];
      };
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/merge-patch+json": components["schemas"]["UpdatePracticeSessionRequest"];
      };
    };
    responses: {
      /** @description Session updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticeSession"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  completePracticeSession: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        sessionId: components["parameters"]["SessionId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CompletePracticeSessionRequest"];
      };
    };
    responses: {
      /** @description Completion result and progress changes */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PracticeCompletionResult"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  createEvidenceUploadIntent: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateUploadIntentRequest"];
      };
    };
    responses: {
      /** @description Short-lived private upload intent */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["UploadIntent"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  completeEvidenceUpload: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        mediaAssetId: components["parameters"]["MediaAssetId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CompleteEvidenceUploadRequest"];
      };
    };
    responses: {
      /** @description Upload accepted for private validation and processing */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["MediaAsset"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  submitEvidence: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["SubmitEvidenceRequest"];
      };
    };
    responses: {
      /** @description Evidence submitted and assessment requested */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["EvidenceSubmission"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getEvidenceSubmission: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        evidenceId: components["parameters"]["EvidenceId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Evidence state and authorised playback details when available */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["EvidenceSubmission"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  requestEvidenceDeletion: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        evidenceId: components["parameters"]["EvidenceId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deletion workflow accepted */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["EvidenceSubmission"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  createEvidencePlaybackGrant: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        evidenceId: components["parameters"]["EvidenceId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Short-lived playback grant */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PlaybackGrant"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getCoachAssessmentQueue: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Assigned assessments ordered by due time */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            items: components["schemas"]["AssessmentSummary"][];
            nextCursor?: string | null;
          };
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  getCoachAssessment: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        assessmentId: components["parameters"]["AssessmentId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Assigned assessment, rubric and short-lived media access */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AssessmentDetail"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  submitAssessmentDecision: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        assessmentId: components["parameters"]["AssessmentId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["AssessmentDecisionRequest"];
      };
    };
    responses: {
      /** @description Assessment completed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AssessmentResult"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  appealAssessment: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        assessmentId: components["parameters"]["AssessmentId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          reason: string;
        };
      };
    };
    responses: {
      /** @description Appeal opened */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components["responses"]["Problem"];
    };
  };
  getAthletePassport: {
    parameters: {
      query?: {
        cursor?: string;
        eventType?: string;
      };
      header?: never;
      path: {
        athleteId: components["parameters"]["AthleteId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Private athlete passport and timeline */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AthletePassport"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  createBooking: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateBookingRequest"];
      };
    };
    responses: {
      /** @description Booking created, possibly pending payment */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Booking"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  createOrder: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateOrderRequest"];
      };
    };
    responses: {
      /** @description Order and payment client secret/reference */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["Order"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  receiveStripeWebhook: {
    parameters: {
      query?: never;
      header: {
        "Stripe-Signature": string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          [key: string]: unknown;
        };
      };
    };
    responses: {
      /** @description Webhook accepted or already processed */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid signature or payload */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  createCurriculumDraft: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateCurriculumRequest"];
      };
    };
    responses: {
      /** @description Curriculum draft created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["CurriculumVersion"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  validateCurriculum: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        curriculumId: components["parameters"]["CurriculumId"];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Graph/content validation report */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["CurriculumValidationReport"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
  publishCurriculum: {
    parameters: {
      query?: never;
      header: {
        "Idempotency-Key": components["parameters"]["IdempotencyKey"];
      };
      path: {
        curriculumId: components["parameters"]["CurriculumId"];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          approvalToken: string;
          /** Format: date-time */
          effectiveFrom?: string;
        };
      };
    };
    responses: {
      /** @description Published immutable curriculum version */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["CurriculumVersion"];
        };
      };
      default: components["responses"]["Problem"];
    };
  };
}
