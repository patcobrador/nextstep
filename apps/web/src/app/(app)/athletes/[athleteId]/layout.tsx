import type { ReactNode } from "react";

import { ApplicationShell } from "../../../../components/application-shell";
import { api } from "../../../../lib/api";

export default async function AthleteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const user = await api.me();
  const household = user.households[0];
  const athletes = household ? await api.athletes(household.id) : [];
  await api.athlete(athleteId);
  return (
    <ApplicationShell user={user} athletes={athletes} athleteId={athleteId}>
      {children}
    </ApplicationShell>
  );
}
