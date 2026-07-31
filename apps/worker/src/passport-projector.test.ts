import { createDomainEvent } from "@nextstep/domain";
import { describe, expect, it } from "vitest";

import { PassportProjector } from "./passport-projector.js";

describe("passport projector", () => {
  it("is idempotent under duplicate event delivery", () => {
    const projector = new PassportProjector();
    const event = createDomainEvent({
      eventId: "event-1",
      eventType: "SkillStateChanged",
      aggregateId: "athlete-1",
      aggregateType: "Athlete",
      occurredAt: new Date("2026-08-06T11:00:00.000Z"),
      actorId: "coach-1",
      correlationId: "correlation-1",
      payload: {
        nodeKey: "foundation.ball.bilateral-control-check",
        priorState: "REVIEW_PENDING",
        newState: "MASTERED",
      },
    });

    projector.handle(event);
    projector.handle(event);

    expect(projector.entriesFor("athlete-1")).toHaveLength(1);
  });
});
