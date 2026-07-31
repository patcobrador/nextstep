import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const seed = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "../../content/basketball/seed/seed_curriculum.json",
    ),
    "utf8",
  ),
);

describe("approved Foundation fixture", () => {
  it("places the deterministic unlock after the video checkpoint", () => {
    const steps = seed.campaigns[0].steps;
    const checkpoint = steps.findIndex(
      ({ nodeKey }: { nodeKey: string }) =>
        nodeKey === "foundation.ball.bilateral-control-check",
    );
    expect(steps[checkpoint + 1].nodeKey).toBe(
      "foundation.ball.moving-control",
    );
  });
});
