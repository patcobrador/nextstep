import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

const contract = parse(
  readFileSync(resolve(process.cwd(), "../../contracts/openapi.yaml"), "utf8"),
);

describe("OpenAPI walking-skeleton coverage", () => {
  it.each([
    "/households/{householdId}/athletes",
    "/athletes/{athleteId}/baseline",
    "/athletes/{athleteId}/practice-plans",
    "/practice-sessions/{sessionId}/complete",
    "/evidence/upload-intents",
    "/evidence/upload-intents/{mediaAssetId}/complete",
    "/evidence-submissions",
    "/coach/assessments/{assessmentId}/decision",
    "/athletes/{athleteId}/passport",
  ])("defines %s", (path) => {
    expect(contract.paths[path]).toBeDefined();
  });
});

describe("Checkpoint A contract", () => {
  it.each([
    ["/me", "get"],
    ["/households/{householdId}/athletes", "get"],
    ["/athletes/{athleteId}", "get"],
    ["/athletes/{athleteId}/dashboard", "get"],
    ["/athletes/{athleteId}/skill-tree", "get"],
    ["/athletes/{athleteId}/skills/{nodeId}", "get"],
    ["/practice-plans/{planId}", "get"],
    ["/practice-plans/{planId}/sessions", "post"],
    ["/practice-sessions/{sessionId}/attempts", "post"],
    ["/practice-sessions/{sessionId}", "get"],
    ["/practice-sessions/{sessionId}/complete", "post"],
    ["/athletes/{athleteId}/passport", "get"],
  ])("defines %s %s", (path, method) => {
    expect(contract.paths[path]?.[method]).toBeDefined();
  });

  it("makes domain progress and practice overview authoritative", () => {
    const domain =
      contract.components.schemas.SkillTree.properties.domains.items;
    expect(domain.required).toEqual(
      expect.arrayContaining([
        "completedNodeCount",
        "totalNodeCount",
        "progress",
      ]),
    );
    expect(contract.components.schemas.PracticePlan.required).toEqual(
      expect.arrayContaining(["title", "purpose"]),
    );
  });
});

describe("Checkpoint B1 private evidence contract", () => {
  it.each([
    ["/households/{householdId}/consents", "post"],
    ["/consents/{consentId}/withdraw", "post"],
    ["/evidence/upload-intents", "post"],
    ["/evidence/upload-intents/{mediaAssetId}/complete", "post"],
    ["/evidence-submissions", "post"],
    ["/evidence-submissions/{evidenceId}", "get"],
    ["/evidence-submissions/{evidenceId}", "delete"],
    ["/evidence-submissions/{evidenceId}/playback-grants", "post"],
  ])("defines %s %s", (path, method) => {
    expect(contract.paths[path]?.[method]).toBeDefined();
  });

  it("keeps deletion off the playback-grant collection", () => {
    expect(
      contract.paths["/evidence-submissions/{evidenceId}/playback-grants"]
        .delete,
    ).toBeUndefined();
  });

  it("separates capture and review consent and never embeds playback in evidence", () => {
    expect(
      contract.components.schemas.RecordConsentRequest.properties.purposeKey
        .enum,
    ).toEqual([
      "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      "ASSIGNED_COACH_EVIDENCE_REVIEW",
    ]);
    expect(contract.components.schemas.SubmitEvidenceRequest.required).toEqual([
      "evidenceId",
      "reviewConsentRecordId",
    ]);
    expect(
      contract.components.schemas.EvidenceSubmission.properties.playbackUrl,
    ).toBeUndefined();
  });
});
