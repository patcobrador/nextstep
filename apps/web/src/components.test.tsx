// @vitest-environment jsdom

import type { components } from "@nextstep/contracts";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CircularSkillTree } from "./components/circular-skill-tree";
import { DashboardPrimaryAction } from "./components/dashboard-primary-action";
import { EvidenceExperience } from "./components/evidence-experience";
import { MobileNavigation } from "./components/mobile-navigation";
import { PathwayOrientation } from "./components/pathway-orientation";
import { PracticeRunner } from "./components/practice-runner";
import { SkillDetailPanel } from "./components/skill-detail-panel";

const { push, savePracticeStep } = vi.hoisted(() => ({
  push: vi.fn(),
  savePracticeStep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("./app/actions/practice", () => ({
  savePracticeStep,
  completePractice: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./app/actions/evidence", () => ({
  completeEvidenceUpload: vi.fn(),
  createEvidenceIntent: vi.fn(),
  grantEvidencePlayback: vi.fn(),
  loadEvidence: vi.fn(),
  recordEvidenceConsent: vi.fn(),
  requestEvidenceDeletion: vi.fn(),
  submitEvidenceForAssessment: vi.fn(),
  withdrawEvidenceConsent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

type SkillTree = components["schemas"]["SkillTree"];
type SkillDetail = components["schemas"]["AthleteSkillDetail"];
type PracticePlan = components["schemas"]["PracticePlan"];
type PracticeSession = components["schemas"]["PracticeSessionDetail"];

const tree: SkillTree = {
  curriculumVersion: "foundation-1",
  campaign: {
    id: "campaign",
    key: "control",
    name: "Control First",
    stageKey: "foundation",
    progress: 0.25,
  },
  domains: [
    {
      key: "ball-mastery",
      name: "Ball Mastery",
      sortOrder: 10,
      completedNodeCount: 1,
      totalNodeCount: 3,
      progress: 1 / 3,
    },
    {
      key: "passing",
      name: "Passing & Receiving",
      sortOrder: 20,
      completedNodeCount: 0,
      totalNodeCount: 1,
      progress: 0,
    },
  ],
  nodes: [
    {
      id: "active",
      key: "active",
      name: "Both Hands Check",
      childName: "Both Hands Check",
      domainKey: "ball-mastery",
      stageKey: "foundation",
      type: "CHECKPOINT",
      state: "ACTIVE",
      presentationState: "CURRENT",
      demonstrated: false,
      verified: false,
      whyLocked: null,
      prerequisiteNodeIds: [],
      remainingRequirements: [],
    },
    {
      id: "locked",
      key: "locked",
      name: "Walk and Dribble",
      childName: "Walk and Dribble",
      domainKey: "ball-mastery",
      stageKey: "foundation",
      type: "SKILL",
      state: "LOCKED",
      presentationState: "LOCKED",
      demonstrated: false,
      verified: false,
      whyLocked: "Complete Both Hands Check first.",
      prerequisiteNodeIds: ["active"],
      remainingRequirements: ["Both Hands Check"],
    },
    {
      id: "up-next",
      key: "ready-hands",
      name: "Ready Hands",
      childName: "Passing & Receiving",
      domainKey: "passing",
      stageKey: "foundation",
      type: "SKILL",
      state: "AVAILABLE",
      presentationState: "UP_NEXT",
      demonstrated: false,
      verified: false,
      whyLocked: null,
      prerequisiteNodeIds: [],
      remainingRequirements: [],
    },
  ],
  currentNodeId: "active",
  currentFocusReason:
    "This practice is prescribed from the athlete's current pathway state.",
  primaryAction: {
    type: "START_PRACTICE",
    title: "Today's prescribed practice is ready",
    description: "A short guided session supports the current pathway focus.",
    ctaLabel: "Start practice",
    destination: "/athletes/athlete/practice/plan",
  },
  branchChoices: [],
};

describe("Checkpoint A web components", () => {
  it("provides accessible mobile navigation for all four destinations", async () => {
    render(<MobileNavigation athleteId="athlete" />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", { name: "Passport" }).getAttribute("href"),
    ).toBe("/athletes/athlete/passport");
  });

  it("identifies one current focus and presents available future work as up next", () => {
    render(<CircularSkillTree athleteId="athlete" tree={tree} />);
    expect(
      screen.getByLabelText(
        "Ball Mastery. 1 of 3 complete. Current: Both Hands Check",
      ),
    ).not.toBeNull();
    expect(screen.getAllByText("Current")).toHaveLength(1);
    expect(screen.getByText("Up next")).not.toBeNull();
    expect(screen.queryByText("Available")).toBeNull();
  });

  it("switches between one interactive map and list while preserving selection and focus", async () => {
    const { container } = render(
      <CircularSkillTree
        athleteId="athlete"
        tree={tree}
        selectedNodeId="up-next"
      />,
    );
    expect(
      container.querySelectorAll('[data-pathway-view="map"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-pathway-view="list"]'),
    ).toHaveLength(0);
    const listButton = screen.getByRole("button", { name: "List view" });
    await userEvent.click(listButton);
    expect(listButton).toBe(document.activeElement);
    expect(
      container.querySelectorAll('[data-pathway-view="map"]'),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll('[data-pathway-view="list"]'),
    ).toHaveLength(1);
    expect(
      screen
        .getByRole("link", { name: /Passing & Receiving/ })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen.getByText("Visible now, but not currently prescribed."),
    ).not.toBeNull();
  });

  it("shows the authoritative current focus and action above the pathway", () => {
    render(<PathwayOrientation athleteId="athlete" tree={tree} />);
    expect(
      screen.getByRole("heading", { name: "Both Hands Check" }),
    ).not.toBeNull();
    expect(screen.getByRole("link", { name: "Start practice" })).not.toBeNull();
  });

  it.each([
    ["START_PRACTICE", "Start practice"],
    ["UPLOAD_EVIDENCE", "Upload evidence"],
    ["VIEW_SUBMISSION", "View submission"],
  ] as const)(
    "keeps %s primary and View pathway secondary",
    (type, ctaLabel) => {
      render(
        <DashboardPrimaryAction
          athleteId="athlete"
          campaign={tree.campaign}
          action={{
            type,
            title: "Authoritative next action",
            description: "Follow this action now.",
            ctaLabel,
            destination: "/next",
          }}
        />,
      );
      expect(
        screen.getByRole("link", { name: new RegExp(ctaLabel) }).className,
      ).toContain("button-primary");
      expect(screen.getByRole("link", { name: "View pathway" }).className).toBe(
        "text-link",
      );
    },
  );

  it("uses a caught-up state without promoting the pathway as a primary task", () => {
    render(
      <DashboardPrimaryAction
        athleteId="athlete"
        campaign={tree.campaign}
        action={{
          type: "REST",
          title: "You're caught up for today",
          description: "Your next practice will appear here when it is ready.",
          ctaLabel: "View pathway",
          destination: "/athletes/athlete/skill-tree",
        }}
      />,
    );
    expect(screen.queryByRole("link", { name: "Start practice" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "View pathway" }).className,
    ).toContain("button-secondary");
  });

  it("moves focus into skill detail and closes it with Escape", async () => {
    const skill: SkillDetail = {
      ...tree.nodes[1]!,
      objective: "Move with control.",
      whyItMatters: "Control creates options.",
      childCues: ["Eyes up"],
      commonErrors: [],
      safety: [],
      primaryAction: {
        type: "REST",
        title: "Keep following the pathway",
        ctaLabel: "View tree",
        destination: "/athletes/athlete/skill-tree",
      },
    };
    render(<SkillDetailPanel athleteId="athlete" skill={skill} />);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("heading", { name: "Walk and Dribble" }),
      ),
    );
    await userEvent.keyboard("{Escape}");
    expect(push).toHaveBeenCalledWith("/athletes/athlete/skill-tree");
  });

  it("explains an up-next skill and returns to the prescribed current step", () => {
    const skill: SkillDetail = {
      ...tree.nodes[2]!,
      objective: "Receive with ready hands.",
      whyItMatters: "Ready hands create control.",
      childCues: [],
      commonErrors: [],
      safety: [],
      primaryAction: {
        type: "RETURN_TO_CURRENT",
        title: "Up next — not today's focus",
        description:
          "Both Hands Check is the prescribed focus. Finish that step before starting this one.",
        ctaLabel: "Return to Current Step",
        destination: "/athletes/athlete/skill-tree/active",
      },
    };
    render(<SkillDetailPanel athleteId="athlete" skill={skill} />);
    expect(screen.getByText("Up next", { exact: true })).not.toBeNull();
    expect(
      screen.getByText(/Both Hands Check is the prescribed focus/),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Return to Current Step" })
        .getAttribute("href"),
    ).toBe("/athletes/athlete/skill-tree/active");
    expect(screen.queryByText("No practice due")).toBeNull();
  });

  it("persists the current prescribed step before moving forward", async () => {
    const plan: PracticePlan = {
      id: "plan",
      athleteId: "athlete",
      title: "Control",
      purpose: "Purpose",
      status: "STARTED",
      targetDurationMinutes: 10,
      generationReasons: [],
      createdAt: new Date().toISOString(),
      expiresAt: null,
      steps: [
        {
          id: "step-1",
          sequence: 1,
          type: "DRILL",
          title: "Right hand",
          resultType: "BOOLEAN",
          prescriptionReason: "Current focus",
          content: { childCues: ["Eyes up"] },
        },
        {
          id: "step-2",
          sequence: 2,
          type: "DRILL",
          title: "Left hand",
          resultType: "BOOLEAN",
          prescriptionReason: "Current focus",
          content: {},
        },
      ],
    };
    const session: PracticeSession = {
      id: "session",
      practicePlanId: "plan",
      athleteId: "athlete",
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      version: 1,
      attempts: [],
    };
    render(
      <PracticeRunner athleteId="athlete" plan={plan} session={session} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save & next" }));
    await waitFor(() =>
      expect(savePracticeStep).toHaveBeenCalledWith("session", plan.steps[0]),
    );
    expect(screen.getByRole("heading", { name: "Left hand" })).not.toBeNull();
  });

  it("presents accessible recording, safety, privacy, format and consent guidance", () => {
    render(
      <EvidenceExperience
        athleteId="athlete"
        householdId="household"
        isOwner
        nodeId="node"
        instructions={{
          movement: "Dribble with the right hand, then the left hand.",
          framing: "Keep the full athlete and ball visible.",
          maxDurationSeconds: 60,
          requiredSequence: ["20 seconds right", "20 seconds left"],
          equipment: ["One basketball", "A clear practice area"],
          safety: ["Stop if the surface becomes unsafe."],
          privacy: ["Keep names and addresses out of frame."],
          supportedFormat: "MP4 with H.264 video",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Record the Both Hands Check" }),
    ).not.toBeNull();
    expect(screen.getByText(/does not yet allow coach review/i)).not.toBeNull();
    expect(screen.getByText(/MOV, HEVC/i)).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Record capture/upload consent" }),
    ).not.toBeNull();
  });
});
