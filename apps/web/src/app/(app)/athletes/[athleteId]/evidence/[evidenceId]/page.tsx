import { EvidenceExperience } from "../../../../../../components/evidence-experience";
import { api } from "../../../../../../lib/api";

export default async function ExistingEvidencePage({
  params,
}: {
  params: Promise<{ athleteId: string; evidenceId: string }>;
}) {
  const { athleteId, evidenceId } = await params;
  const [athlete, evidence, user] = await Promise.all([
    api.athlete(athleteId),
    api.evidence(evidenceId),
    api.me(),
  ]);
  if (evidence.athleteId !== athleteId)
    throw new Error("Evidence was not found.");
  const skill = await api.skillDetail(athleteId, evidence.nodeId);
  if (!skill.evidenceInstructions)
    throw new Error("Evidence instructions are unavailable.");
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
      nodeId={evidence.nodeId}
      initialEvidence={evidence}
    />
  );
}
