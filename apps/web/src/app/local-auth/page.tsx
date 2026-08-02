import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import {
  localAuthEnabled,
  localPersonas,
  setLocalPersona,
} from "../../lib/local-auth";

export const metadata = { title: "Local sign in" };
export const dynamic = "force-dynamic";

export default function LocalAuthPage() {
  if (!localAuthEnabled()) notFound();

  async function signIn(formData: FormData) {
    "use server";
    if (!localAuthEnabled()) notFound();
    await setLocalPersona(String(formData.get("persona")));
    redirect("/");
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="local-auth-title">
        <Image
          src="/brand/nextstep-logo.png"
          alt="NextStep Sports"
          width={148}
          height={148}
          priority
        />
        <p className="eyebrow">Local development</p>
        <h1 id="local-auth-title">Choose a parent persona</h1>
        <p>
          This explicit local path is only available in the configured
          demonstration environment.
        </p>
        <form action={signIn} className="persona-list">
          {localPersonas.map((persona, index) => (
            <label className="persona-option" key={persona.key}>
              <input
                type="radio"
                name="persona"
                value={persona.key}
                defaultChecked={index === 0}
              />
              <span>
                <strong>{persona.label}</strong>
                <small>{persona.description}</small>
              </span>
            </label>
          ))}
          <button className="button button-primary" type="submit">
            Continue to NextStep
          </button>
        </form>
      </section>
    </main>
  );
}
