"use client";

import type { components } from "@nextstep/contracts";
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";

type Tree = components["schemas"]["SkillTree"];
type PresentationState = components["schemas"]["PathwayPresentationState"];

const stateLabel: Record<PresentationState, string> = {
  CURRENT: "Current",
  COMPLETED: "Completed",
  UP_NEXT: "Up next",
  LOCKED: "Locked",
  CHOOSE_NEXT_FOCUS: "Choose next focus",
};

const stateClass = (state: PresentationState) =>
  `path-state-${state.toLowerCase().replaceAll("_", "-")}`;

const stateMark: Record<PresentationState, string> = {
  CURRENT: "●",
  COMPLETED: "✓",
  UP_NEXT: "→",
  LOCKED: "○",
  CHOOSE_NEXT_FOCUS: "+",
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
  const [view, setView] = useState<"map" | "list">("map");
  return (
    <section className="pathway-explorer" aria-labelledby="pathway-view-title">
      <div className="view-switch-heading">
        <div>
          <p className="eyebrow">Explore the journey</p>
          <h2 id="pathway-view-title">Pathway view</h2>
        </div>
        <div className="view-switch" role="group" aria-label="Pathway view">
          <button
            type="button"
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            Map view
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List view
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div
          className="skill-orbit"
          aria-label="Map view of the skill pathway"
          data-pathway-view="map"
        >
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
              nodes.find(
                ({ presentationState }) => presentationState === "CURRENT",
              ) ??
              nodes.find(
                ({ presentationState }) => presentationState === "UP_NEXT",
              ) ??
              nodes.find(
                ({ presentationState }) => presentationState === "COMPLETED",
              ) ??
              nodes[0];
            if (!representative) return null;
            return (
              <Link
                href={`/athletes/${athleteId}/skill-tree/${representative.id}`}
                className={`domain-orb ${stateClass(representative.presentationState)} ${selectedNodeId === representative.id ? "is-selected" : ""}`}
                style={
                  {
                    "--orbit-left": `${50 + Math.sin(angle) * 37}%`,
                    "--orbit-top": `${50 - Math.cos(angle) * 37}%`,
                  } as CSSProperties
                }
                key={domain.key}
                aria-current={
                  selectedNodeId === representative.id ? "true" : undefined
                }
                aria-label={`${domain.name}. ${domain.completedNodeCount} of ${domain.totalNodeCount} complete. ${stateLabel[representative.presentationState]}: ${representative.childName ?? representative.name}${representative.presentationState === "LOCKED" && representative.whyLocked ? `. ${representative.whyLocked}` : ""}`}
              >
                <span className="domain-progress" aria-hidden="true">
                  {Math.round(domain.progress * 100)}%
                </span>
                <strong>{domain.name}</strong>
                <small>{representative.childName ?? representative.name}</small>
                <span className="state-tag">
                  <span aria-hidden="true">
                    {stateMark[representative.presentationState]}{" "}
                  </span>
                  {stateLabel[representative.presentationState]}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div data-pathway-view="list">
          <div className="section-heading">
            <p>
              The same pathway in a linear view. Locked steps explain what must
              happen first.
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
                    <li
                      key={node.id}
                      className={stateClass(node.presentationState)}
                    >
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
                          className={`state-badge ${stateClass(node.presentationState)}`}
                        >
                          <span aria-hidden="true">
                            {stateMark[node.presentationState]}{" "}
                          </span>
                          {stateLabel[node.presentationState]}
                        </span>
                      </Link>
                      {node.presentationState === "UP_NEXT" ? (
                        <p>Visible now, but not currently prescribed.</p>
                      ) : null}
                      {node.presentationState === "LOCKED" ? (
                        <p>{node.whyLocked}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export { stateClass, stateLabel };
