import { CircularSkillTree } from "../../../../../../components/circular-skill-tree";
import { PathwayOrientation } from "../../../../../../components/pathway-orientation";
import { SkillDetailPanel } from "../../../../../../components/skill-detail-panel";
import { api } from "../../../../../../lib/api";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string; nodeId: string }>;
}) {
  const { athleteId, nodeId } = await params;
  const [tree, skill] = await Promise.all([
    api.skillTree(athleteId),
    api.skillDetail(athleteId, nodeId),
  ]);
  return (
    <div className="tree-detail-layout">
      <div className="page-stack">
        <header className="page-heading">
          <div>
            <p className="eyebrow">{tree.campaign.stageKey} pathway</p>
            <h1>Skill Tree</h1>
          </div>
          <p>See where you are in the journey and what comes later.</p>
        </header>
        <PathwayOrientation athleteId={athleteId} tree={tree} />
        <CircularSkillTree
          athleteId={athleteId}
          tree={tree}
          selectedNodeId={nodeId}
        />
      </div>
      <SkillDetailPanel athleteId={athleteId} skill={skill} />
    </div>
  );
}
