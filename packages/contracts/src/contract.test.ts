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
