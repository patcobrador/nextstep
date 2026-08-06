import type { components } from "@nextstep/contracts";

type NextAction = components["schemas"]["NextAction"];
type PresentationState = components["schemas"]["PathwayPresentationState"];
type ProgressState = components["schemas"]["ProgressState"];

export type GuidanceNode = {
  id: string;
  name: string;
  childName?: string | null;
  state: ProgressState;
};

export type GuidanceEvidence = {
  id: string;
  status: "DRAFT" | "SUBMITTED" | "ASSIGNED";
  mediaStatus: components["schemas"]["MediaAsset"]["status"];
  assessmentStatus?:
    | components["schemas"]["AssessmentSummary"]["status"]
    | undefined;
};

export type GuidancePlan = {
  id: string;
  status: "GENERATED" | "STARTED";
};

const currentStatePriority: ProgressState[] = [
  "REVIEW_PENDING",
  "EVIDENCE_PENDING",
  "NEEDS_WORK",
  "ACTIVE",
  "REVISIT_DUE",
  "PRACTICE_COMPLETE",
];

const completedStates = new Set<ProgressState>([
  "PRACTICE_COMPLETE",
  "EVIDENCE_PENDING",
  "REVIEW_PENDING",
  "MASTERED",
]);

export const selectCurrentNode = (
  nodesInCampaignOrder: GuidanceNode[],
): GuidanceNode | null => {
  for (const state of currentStatePriority) {
    const node = nodesInCampaignOrder.find(
      (candidate) => candidate.state === state,
    );
    if (node) return node;
  }
  return null;
};

export const presentationStateFor = (
  node: GuidanceNode,
  currentNodeId: string | null,
): PresentationState => {
  if (node.id === currentNodeId) return "CURRENT";
  if (completedStates.has(node.state)) return "COMPLETED";
  if (node.state === "AVAILABLE") return "UP_NEXT";
  if (node.state === "LOCKED" || node.state === "ARCHIVED") return "LOCKED";
  return "UP_NEXT";
};

export const createEvidenceUploadAction = (
  athleteId: string,
  nodeId: string,
): NextAction => ({
  type: "UPLOAD_EVIDENCE",
  title: "Practice complete. Upload evidence to continue",
  description:
    "Review the safety and privacy guidance before choosing a private video.",
  ctaLabel: "Upload evidence",
  destination: `/athletes/${athleteId}/skills/${nodeId}/evidence`,
  reasonCodes: ["EVIDENCE_REQUIRED"],
});

export function createGuidedNavigation(input: {
  athleteId: string;
  nodesInCampaignOrder: GuidanceNode[];
  plan?: GuidancePlan | null;
  evidence?: GuidanceEvidence | null;
}): {
  currentNodeId: string | null;
  currentFocusReason: string;
  primaryAction: NextAction;
} {
  const current = selectCurrentNode(input.nodesInCampaignOrder);
  const currentNodeId = current?.id ?? null;
  const pathwayDestination = `/athletes/${input.athleteId}/skill-tree`;

  if (current && input.evidence) {
    const destination = `/athletes/${input.athleteId}/evidence/${input.evidence.id}`;
    if (input.evidence.status === "DRAFT") {
      const ready = input.evidence.mediaStatus === "READY";
      return {
        currentNodeId,
        currentFocusReason:
          "Practice requirements are complete. Finish the private evidence submission to continue.",
        primaryAction: {
          type: "CONTINUE_EVIDENCE",
          title: ready
            ? "Evidence ready to submit"
            : "Continue private evidence upload",
          description: ready
            ? "Review the private draft, then provide review consent when you are ready to submit."
            : "Resume the existing private draft. You do not need to start another upload.",
          ctaLabel: ready
            ? "Continue evidence submission"
            : "Continue evidence upload",
          destination,
          reasonCodes: ["EVIDENCE_DRAFT_EXISTS"],
        },
      };
    }

    const reviewStarted =
      input.evidence.status === "ASSIGNED" ||
      ["ASSIGNED", "IN_REVIEW"].includes(input.evidence.assessmentStatus ?? "");
    return {
      currentNodeId,
      currentFocusReason: reviewStarted
        ? "Evidence is assigned for review. No new practice is required while the review is pending."
        : "Evidence is submitted. No new practice is required while coach assignment is pending.",
      primaryAction: {
        type: reviewStarted ? "VIEW_STATUS" : "VIEW_SUBMISSION",
        title: reviewStarted
          ? "Waiting for coach review"
          : "Waiting for coach assignment",
        description: reviewStarted
          ? "The private submission is with the assigned coach."
          : "The private submission is safe. A coach has not been assigned yet.",
        ctaLabel: reviewStarted ? "View status" : "View submission",
        destination,
        reasonCodes: [
          reviewStarted ? "COACH_REVIEW_PENDING" : "COACH_ASSIGNMENT_PENDING",
        ],
      },
    };
  }

  if (current?.state === "EVIDENCE_PENDING") {
    return {
      currentNodeId,
      currentFocusReason:
        "Practice requirements are complete. Private checkpoint evidence is the next required step.",
      primaryAction: createEvidenceUploadAction(input.athleteId, current.id),
    };
  }

  if (current?.state === "REVIEW_PENDING") {
    return {
      currentNodeId,
      currentFocusReason:
        "Evidence is submitted. No new practice is required while review is pending.",
      primaryAction: {
        type: "VIEW_STATUS",
        title: "Waiting for coach review",
        description:
          "No new practice is required while the submission is reviewed.",
        ctaLabel: "View status",
        destination: `${pathwayDestination}/${current.id}`,
        reasonCodes: ["COACH_REVIEW_PENDING"],
      },
    };
  }

  if (current && input.plan) {
    const started = input.plan.status === "STARTED";
    const improvement = current.state === "NEEDS_WORK";
    return {
      currentNodeId,
      currentFocusReason: improvement
        ? "The latest pathway result prescribed focused improvement practice."
        : "This practice is prescribed from the athlete's current pathway state.",
      primaryAction: {
        type: started ? "CONTINUE_PRACTICE" : "START_PRACTICE",
        title: improvement
          ? "Improvement practice is ready"
          : started
            ? "Continue prescribed practice"
            : "Today's prescribed practice is ready",
        description: improvement
          ? "A focused practice addresses the current improvement cue."
          : "A short guided session supports the current pathway focus.",
        ctaLabel: improvement
          ? started
            ? "Continue improvement practice"
            : "Start improvement practice"
          : started
            ? "Continue practice"
            : "Start practice",
        destination: `/athletes/${input.athleteId}/practice/${input.plan.id}`,
        reasonCodes: [
          improvement ? "IMPROVEMENT_PRACTICE" : "CURRENT_PATHWAY_FOCUS",
        ],
      },
    };
  }

  return {
    currentNodeId,
    currentFocusReason: current
      ? "There is no practice or evidence task prescribed for this focus right now."
      : "There is no immediate prescribed step right now.",
    primaryAction: {
      type: "REST",
      title: "You're caught up for today",
      description: "Your next practice will appear here when it is ready.",
      ctaLabel: "View pathway",
      destination: pathwayDestination,
      reasonCodes: ["NO_IMMEDIATE_WORK"],
    },
  };
}

export function createSkillDetailAction(input: {
  athleteId: string;
  selected: GuidanceNode & { presentationState: PresentationState };
  current: GuidanceNode | null;
  primaryAction: NextAction;
}): NextAction {
  if (input.selected.presentationState === "CURRENT")
    return input.primaryAction;

  if (input.selected.presentationState === "COMPLETED") {
    return {
      type: "VIEW_HISTORY",
      title: "Completed and recorded",
      description:
        "This step is complete. Its verified history is kept in the private passport.",
      ctaLabel: "View history",
      destination: `/athletes/${input.athleteId}/passport`,
      reasonCodes: ["PATHWAY_STEP_COMPLETED"],
    };
  }

  if (input.current) {
    const currentName = input.current.childName ?? input.current.name;
    return {
      type: "RETURN_TO_CURRENT",
      title:
        input.selected.presentationState === "UP_NEXT"
          ? "Up next — not today's focus"
          : "Complete the current step first",
      description:
        input.selected.presentationState === "UP_NEXT"
          ? `${currentName} is the prescribed focus. Finish that step before starting this one.`
          : `${currentName} is the prescribed focus. The listed prerequisites must be completed before this step unlocks.`,
      ctaLabel: "Return to Current Step",
      destination: `/athletes/${input.athleteId}/skill-tree/${input.current.id}`,
      reasonCodes: ["CURRENT_STEP_REQUIRED"],
    };
  }

  return {
    type: "REST",
    title: "Not prescribed right now",
    description:
      "You're caught up. The next prescribed step will appear on the dashboard when it is ready.",
    ctaLabel: "Back to dashboard",
    destination: `/athletes/${input.athleteId}`,
    reasonCodes: ["NO_IMMEDIATE_WORK"],
  };
}
