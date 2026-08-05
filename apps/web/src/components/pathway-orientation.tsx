import type { components } from "@nextstep/contracts";
import Link from "next/link";

export function PathwayOrientation({
  athleteId,
  tree,
}: {
  athleteId: string;
  tree: components["schemas"]["SkillTree"];
}) {
  const current =
    tree.nodes.find(({ id }) => id === tree.currentNodeId) ?? null;
  const action = tree.primaryAction;
  return (
    <section
      className="current-focus-card"
      aria-labelledby="current-focus-title"
    >
      <div className="current-focus-copy">
        <p className="eyebrow">Current focus</p>
        <h2 id="current-focus-title">
          {current?.childName ?? current?.name ?? "Pathway up to date"}
        </h2>
        <p className="pathway-position">
          {tree.campaign.name} · {tree.campaign.stageKey} stage ·{" "}
          {Math.round(tree.campaign.progress * 100)}% complete
        </p>
        <p>{tree.currentFocusReason}</p>
      </div>
      <div className="current-focus-action" data-action-type={action.type}>
        <strong>{action.title}</strong>
        {action.description ? <p>{action.description}</p> : null}
        {action.type !== "REST" ? (
          <Link className="button button-primary" href={action.destination}>
            {action.ctaLabel}
          </Link>
        ) : (
          <Link className="text-link" href={`/athletes/${athleteId}`}>
            Back to dashboard
          </Link>
        )}
      </div>
    </section>
  );
}
