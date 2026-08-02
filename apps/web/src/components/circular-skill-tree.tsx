import type { components } from "@nextstep/contracts";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

type Tree = components["schemas"]["SkillTree"];

const stateLabel: Record<components["schemas"]["ProgressState"], string> = {
  LOCKED: "Locked",
  AVAILABLE: "Available",
  ACTIVE: "Current focus",
  PRACTICE_COMPLETE: "Practice complete",
  EVIDENCE_PENDING: "Awaiting next checkpoint",
  REVIEW_PENDING: "Review pending",
  NEEDS_WORK: "Ready to retry",
  MASTERED: "Completed",
  REVISIT_DUE: "Revisit due",
  ARCHIVED: "Archived",
};

export function CircularSkillTree({
  athleteId,
  tree,
  selectedNodeId,
}: {
  athleteId: string;
  tree: Tree;
  selectedNodeId?: string;
}) {
  return (
    <>
      <div className="skill-orbit" aria-label="Visual skill tree">
        <div className="orbit-lines" aria-hidden="true" />
        <div className="tree-brand-centre">
          <Image
            src="/brand/nextstep-logo.png"
            alt="NextStep Sports"
            width={164}
            height={164}
            priority
          />
        </div>
        {tree.domains.map((domain, index) => {
          const angle = (Math.PI * 2 * index) / tree.domains.length;
          const nodes = tree.nodes.filter(
            ({ domainKey }) => domainKey === domain.key,
          );
          const representative =
            nodes.find(({ state }) => state === "ACTIVE") ??
            nodes.find(({ state }) => state === "AVAILABLE") ??
            nodes[0];
          if (!representative) return null;
          return (
            <Link
              href={`/athletes/${athleteId}/skill-tree/${representative.id}`}
              className={`domain-orb state-${representative.state.toLowerCase()} ${selectedNodeId === representative.id ? "is-selected" : ""}`}
              style={
                {
                  "--orbit-left": `${50 + Math.sin(angle) * 37}%`,
                  "--orbit-top": `${50 - Math.cos(angle) * 37}%`,
                } as CSSProperties
              }
              key={domain.key}
              aria-label={`${domain.name}. ${domain.completedNodeCount} of ${domain.totalNodeCount} complete. ${stateLabel[representative.state]}: ${representative.childName ?? representative.name}`}
            >
              <span className="domain-progress" aria-hidden="true">
                {Math.round(domain.progress * 100)}%
              </span>
              <strong>{domain.name}</strong>
              <small>{representative.childName ?? representative.name}</small>
              <span className="state-tag">
                {stateLabel[representative.state]}
              </span>
            </Link>
          );
        })}
      </div>
      <section className="accessible-tree" aria-labelledby="all-skills-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Accessible pathway view</p>
            <h2 id="all-skills-heading">All skills</h2>
          </div>
          <p>
            Choose any skill to inspect it. Locked skills explain what comes
            first.
          </p>
        </div>
        {tree.domains.map((domain) => (
          <section
            className="skill-domain-list"
            key={domain.key}
            aria-labelledby={`domain-${domain.key}`}
          >
            <h3 id={`domain-${domain.key}`}>
              {domain.name}{" "}
              <span>
                {domain.completedNodeCount}/{domain.totalNodeCount}
              </span>
            </h3>
            <ul>
              {tree.nodes
                .filter(({ domainKey }) => domainKey === domain.key)
                .map((node) => (
                  <li key={node.id}>
                    <Link
                      href={`/athletes/${athleteId}/skill-tree/${node.id}`}
                      aria-current={
                        selectedNodeId === node.id ? "true" : undefined
                      }
                    >
                      <span>
                        <strong>{node.childName ?? node.name}</strong>
                        <small>{node.name}</small>
                      </span>
                      <span
                        className={`state-badge state-${node.state.toLowerCase()}`}
                      >
                        {stateLabel[node.state]}
                      </span>
                    </Link>
                    {node.state === "LOCKED" ? <p>{node.whyLocked}</p> : null}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </section>
    </>
  );
}

export { stateLabel };
