import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const seedPath = resolve(
  import.meta.dirname,
  "../../../content/basketball/seed/seed_curriculum.json",
);
const seed = JSON.parse(await readFile(seedPath, "utf8"));
const errors = [];
const domainKeys = new Set(seed.domains.map(({ key }) => key));
const stageKeys = new Set(seed.stages.map(({ key }) => key));
const nodeKeys = new Set(seed.nodes.map(({ key }) => key));
const drillKeys = new Set(seed.drills.map(({ key }) => key));
const rubricKeys = new Set(seed.rubrics.map(({ key }) => key));

function requireUnique(label, items) {
  if (new Set(items).size !== items.length)
    errors.push(`${label} keys are not unique.`);
}

requireUnique("Domain", [...domainKeys]);
requireUnique("Stage", [...stageKeys]);
requireUnique("Node", [...nodeKeys]);
requireUnique("Drill", [...drillKeys]);
requireUnique("Rubric", [...rubricKeys]);

for (const node of seed.nodes) {
  if (!domainKeys.has(node.domainKey))
    errors.push(`${node.key}: unknown domain ${node.domainKey}.`);
  if (!stageKeys.has(node.stageKey))
    errors.push(`${node.key}: unknown stage ${node.stageKey}.`);
  for (const prerequisite of node.hardPrerequisiteKeys) {
    if (!nodeKeys.has(prerequisite))
      errors.push(`${node.key}: missing prerequisite ${prerequisite}.`);
  }
  if (node.metadata?.rubricKey && !rubricKeys.has(node.metadata.rubricKey)) {
    errors.push(`${node.key}: missing rubric ${node.metadata.rubricKey}.`);
  }
}

for (const drill of seed.drills) {
  if (!nodeKeys.has(drill.primaryNodeKey))
    errors.push(`${drill.key}: unknown primary node.`);
}

for (const campaign of seed.campaigns) {
  const exposed = new Set(
    campaign.steps.map(({ nodeKey }) => nodeKey).filter(Boolean),
  );
  for (const step of campaign.steps) {
    if (!step.nodeKey || !nodeKeys.has(step.nodeKey))
      errors.push(`${campaign.key}: invalid campaign step.`);
    const node = seed.nodes.find(({ key }) => key === step.nodeKey);
    for (const prerequisite of node?.hardPrerequisiteKeys ?? []) {
      if (!exposed.has(prerequisite))
        errors.push(
          `${campaign.key}: ${step.nodeKey} depends on unexposed ${prerequisite}.`,
        );
    }
  }
}

const checkpoint = seed.nodes.find(
  ({ key }) => key === "foundation.ball.bilateral-control-check",
);
if (checkpoint?.completionRule.assessmentType !== "ASYNC_VIDEO") {
  errors.push("Walking-skeleton checkpoint must use ASYNC_VIDEO.");
}
const campaign = seed.campaigns.find(
  ({ key }) => key === "campaign.foundation.core-1",
);
const checkpointIndex =
  campaign?.steps.findIndex(({ nodeKey }) => nodeKey === checkpoint?.key) ?? -1;
const unlockIndex =
  campaign?.steps.findIndex(
    ({ nodeKey }) => nodeKey === "foundation.ball.moving-control",
  ) ?? -1;
if (checkpointIndex < 0 || unlockIndex !== checkpointIndex + 1) {
  errors.push(
    "Moving-control must immediately follow the walking-skeleton checkpoint.",
  );
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Curriculum valid: ${seed.nodes.length} nodes, ${seed.drills.length} drills, ${seed.campaigns.length} campaign(s).`,
  );
}
