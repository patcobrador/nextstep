"use client";

import { useEffect } from "react";

export default function AthleteError({
  error,
  reset,
}: {
  error: Error & { correlationId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Checkpoint A page error", {
      name: error.name,
      correlationId: error.correlationId,
    });
  }, [error]);
  return (
    <section className="page-state error-state" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn’t load this pathway.</h1>
      <p>
        Try again. If the problem continues, share correlation ID{" "}
        {error.correlationId ?? "unavailable"} with support.
      </p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
