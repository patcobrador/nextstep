import "server-only";

import { cookies } from "next/headers";

export const localAuthEnabled = (): boolean =>
  process.env["NEXTSTEP_LOCAL_AUTH"] === "enabled";

export const localPersonas = [
  {
    key: "checkpoint-a-parent",
    actorId: "checkpoint-a-parent",
    householdId: "c9663e3a-ab64-4d8b-9cb8-68fbe5f6cda3",
    label: "Pat Johnson",
    description: "Mason's parent",
  },
  {
    key: "checkpoint-a-other-parent",
    actorId: "checkpoint-a-other-parent",
    householdId: "07094fa0-beac-44e5-a247-bcf4052a373c",
    label: "Alex Reed",
    description: "Unrelated parent for access checks",
  },
  {
    key: "checkpoint-b1-caregiver",
    actorId: "checkpoint-b1-caregiver",
    householdId: "c9663e3a-ab64-4d8b-9cb8-68fbe5f6cda3",
    label: "Sam Johnson",
    description: "Mason's caregiver (non-destructive evidence access)",
  },
] as const;

const cookieName = "nextstep-local-persona";

export async function localIdentity(): Promise<{
  actorId: string;
  householdId: string;
} | null> {
  if (!localAuthEnabled()) return null;
  const key = (await cookies()).get(cookieName)?.value;
  const persona = localPersonas.find((candidate) => candidate.key === key);
  return persona
    ? { actorId: persona.actorId, householdId: persona.householdId }
    : null;
}

export async function setLocalPersona(key: string): Promise<void> {
  if (!localAuthEnabled()) throw new Error("Local authentication is disabled.");
  if (!localPersonas.some((persona) => persona.key === key)) {
    throw new Error("Unknown local persona.");
  }
  (await cookies()).set(cookieName, key, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env["NODE_ENV"] === "production" &&
      process.env["NEXTSTEP_LOCAL_AUTH_SECURE_COOKIE"] === "enabled",
    path: "/",
  });
}

export async function clearLocalPersona(): Promise<void> {
  (await cookies()).delete(cookieName);
}
