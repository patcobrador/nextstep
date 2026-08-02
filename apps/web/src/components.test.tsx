// @vitest-environment jsdom

import type { components } from "@nextstep/contracts";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CircularSkillTree } from "./components/circular-skill-tree";
import { MobileNavigation } from "./components/mobile-navigation";
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
      demonstrated: false,
      verified: false,
      whyLocked: "Complete Both Hands Check first.",
      prerequisiteNodeIds: ["active"],
      remainingRequirements: ["Both Hands Check"],
    },
  ],
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

  it("renders curriculum states, progress, visual navigation, and lock explanations", () => {
    render(<CircularSkillTree athleteId="athlete" tree={tree} />);
    expect(
      screen.getByLabelText(
        "Ball Mastery. 1 of 3 complete. Current focus: Both Hands Check",
      ),
    ).not.toBeNull();
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
    expect(screen.getByText("Complete Both Hands Check first.")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "All skills" })).not.toBeNull();
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
        destination: "skill-tree",
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
});
