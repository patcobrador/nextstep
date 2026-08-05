import { describe, expect, it } from "vitest";

import {
  createGuidedNavigation,
  presentationStateFor,
  selectCurrentNode,
  type GuidanceNode,
} from "./guided-navigation.js";

const active: GuidanceNode = {
  id: "current",
  name: "Passing Foundations",
  childName: "Passing Foundations",
  state: "ACTIVE",
};

describe("authoritative parent guidance", () => {
  it("makes prescribed practice the primary action", () => {
    const guidance = createGuidedNavigation({
      athleteId: "athlete",
      nodesInCampaignOrder: [active],
      plan: { id: "plan", status: "GENERATED" },
    });
    expect(guidance.primaryAction).toMatchObject({
      type: "START_PRACTICE",
      ctaLabel: "Start practice",
      destination: "/athletes/athlete/practice/plan",
    });
  });

  it("makes evidence upload primary when practice requirements are complete", () => {
    const guidance = createGuidedNavigation({
      athleteId: "athlete",
      nodesInCampaignOrder: [{ ...active, state: "EVIDENCE_PENDING" }],
    });
    expect(guidance.primaryAction).toMatchObject({
      type: "UPLOAD_EVIDENCE",
      ctaLabel: "Upload evidence",
    });
  });

  it("resumes a ready draft instead of starting another upload", () => {
    const guidance = createGuidedNavigation({
      athleteId: "athlete",
      nodesInCampaignOrder: [{ ...active, state: "EVIDENCE_PENDING" }],
      evidence: { id: "evidence", status: "DRAFT", mediaStatus: "READY" },
    });
    expect(guidance.primaryAction).toMatchObject({
      type: "CONTINUE_EVIDENCE",
      ctaLabel: "Continue evidence submission",
      destination: "/athletes/athlete/evidence/evidence",
    });
  });

  it("shows submitted evidence waiting for coach assignment", () => {
    const guidance = createGuidedNavigation({
      athleteId: "athlete",
      nodesInCampaignOrder: [{ ...active, state: "REVIEW_PENDING" }],
      evidence: {
        id: "evidence",
        status: "SUBMITTED",
        mediaStatus: "READY",
        assessmentStatus: "UNASSIGNED",
      },
    });
    expect(guidance.primaryAction).toMatchObject({
      type: "VIEW_SUBMISSION",
      title: "Waiting for coach assignment",
      ctaLabel: "View submission",
    });
  });

  it("uses a caught-up state instead of promoting the pathway as a task", () => {
    const guidance = createGuidedNavigation({
      athleteId: "athlete",
      nodesInCampaignOrder: [],
    });
    expect(guidance.primaryAction).toMatchObject({
      type: "REST",
      title: "You're caught up for today",
      reasonCodes: ["NO_IMMEDIATE_WORK"],
    });
  });

  it("never treats the first available node as the prescribed current node", () => {
    const available: GuidanceNode = {
      id: "available",
      name: "Passing & Receiving",
      state: "AVAILABLE",
    };
    expect(selectCurrentNode([available, active])?.id).toBe("current");
    expect(presentationStateFor(available, "current")).toBe("UP_NEXT");
    expect(presentationStateFor(active, "current")).toBe("CURRENT");
  });
});
