import { redirect } from "next/navigation";

import { api } from "../lib/api";

export const dynamic = "force-dynamic";
import { localAuthEnabled, localIdentity } from "../lib/local-auth";

export default async function HomePage() {
  if (localAuthEnabled() && !(await localIdentity())) redirect("/local-auth");
  const user = await api.me();
  const household = user.households[0];
  if (!household)
    return (
      <main className="standalone-state">
        <h1>No household yet</h1>
        <p>Your household will appear here when onboarding is complete.</p>
      </main>
    );
  const athletes = await api.athletes(household.id);
  if (!athletes[0])
    return (
      <main className="standalone-state">
        <h1>No athlete yet</h1>
        <p>Create an athlete to begin a guided pathway.</p>
      </main>
    );
  redirect(`/athletes/${athletes[0].id}`);
}
