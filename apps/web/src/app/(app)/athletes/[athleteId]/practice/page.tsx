import { redirect } from "next/navigation";

import { api } from "../../../../../lib/api";

export default async function PracticeEntryPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const dashboard = await api.dashboard(athleteId);
  if (
    ["START_PRACTICE", "CONTINUE_PRACTICE"].includes(
      dashboard.primaryAction.type,
    )
  )
    redirect(dashboard.primaryAction.destination);
  return (
    <section className="page-state">
      <p className="eyebrow">Practice</p>
      <h1>{dashboard.primaryAction.title}</h1>
      <p>{dashboard.primaryAction.description}</p>
    </section>
  );
}
