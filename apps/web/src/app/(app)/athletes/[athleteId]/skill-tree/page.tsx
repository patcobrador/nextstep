import { CircularSkillTree } from "../../../../../components/circular-skill-tree";
import { PathwayOrientation } from "../../../../../components/pathway-orientation";
import { api } from "../../../../../lib/api";

export const metadata = { title: "Skill Tree" };

export default async function SkillTreePage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const tree = await api.skillTree(athleteId);
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{tree.campaign.stageKey} pathway</p>
          <h1>Skill Tree</h1>
        </div>
        <p>See where you are in the journey and what comes later.</p>
      </header>
      <PathwayOrientation athleteId={athleteId} tree={tree} />
      <CircularSkillTree athleteId={athleteId} tree={tree} />
    </div>
  );
}
