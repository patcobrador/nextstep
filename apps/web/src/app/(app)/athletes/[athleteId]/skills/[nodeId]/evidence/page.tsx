import { EvidenceExperience } from "../../../../../../../components/evidence-experience";
import { api } from "../../../../../../../lib/api";

export default async function NewEvidencePage({
  params,
}: {
  params: Promise<{ athleteId: string; nodeId: string }>;
}) {
  const { athleteId, nodeId } = await params;
  const [athlete, skill, user] = await Promise.all([
    api.athlete(athleteId),
    api.skillDetail(athleteId, nodeId),
    api.me(),
  ]);
  if (!skill.evidenceInstructions)
    throw new Error("This checkpoint is not ready for evidence.");
  const household = user.households.find(
    ({ id }) => id === athlete.householdId,
  );
  if (!household)
    throw new Error("The athlete household could not be resolved.");
  return (
    <EvidenceExperience
      athleteId={athleteId}
      householdId={household.id}
      instructions={skill.evidenceInstructions}
      isOwner={household.role === "OWNER"}
      nodeId={nodeId}
    />
  );
}
