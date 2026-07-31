import type { DomainEvent } from "@nextstep/domain";

export interface PassportProjection {
  sourceEventId: string;
  athleteId: string;
  type: "SKILL_VERIFIED";
  occurredAt: string;
  verified: true;
  title: string;
}

export class PassportProjector {
  readonly #processed = new Set<string>();
  readonly #entries: PassportProjection[] = [];

  handle(event: DomainEvent): void {
    if (this.#processed.has(event.eventId)) return;
    this.#processed.add(event.eventId);
    if (event.eventType !== "SkillStateChanged") return;
    const payload = event.payload as {
      nodeKey?: string;
      newState?: string;
    };
    if (payload.newState !== "MASTERED") return;
    this.#entries.push({
      sourceEventId: event.eventId,
      athleteId: event.aggregateId,
      type: "SKILL_VERIFIED",
      occurredAt: event.occurredAt,
      verified: true,
      title:
        payload.nodeKey === "foundation.ball.bilateral-control-check"
          ? "Both Hands Check verified"
          : "Skill verified",
    });
  }

  entriesFor(athleteId: string): PassportProjection[] {
    return this.#entries.filter((entry) => entry.athleteId === athleteId);
  }
}
