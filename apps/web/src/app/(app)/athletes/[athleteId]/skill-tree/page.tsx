import { CircularSkillTree } from "../../../../../components/circular-skill-tree";
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
        <p>Explore the pathway without skipping the progression rules.</p>
      </header>
      <CircularSkillTree athleteId={athleteId} tree={tree} />
    </div>
  );
}
