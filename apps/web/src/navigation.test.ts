import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const layout = readFileSync(
  resolve(process.cwd(), "src/app/layout.tsx"),
  "utf8",
);
const tree = readFileSync(
  resolve(process.cwd(), "src/app/skill-tree/page.tsx"),
  "utf8",
);

describe("navigation accessibility contract", () => {
  it("exposes only the three primary destinations", () => {
    expect(layout).toContain("Dashboard");
    expect(layout).toContain("Skill Tree &amp; Progress");
    expect(layout).toContain("Practice");
    expect(layout).toContain('aria-label="Primary"');
  });

  it("provides a skip link and accessible skill-list alternative", () => {
    expect(layout).toContain("Skip to content");
    expect(tree).toContain('<ol className="skill-list">');
    expect(tree).toContain(
      "Locked — complete three practices across five days",
    );
  });
});
