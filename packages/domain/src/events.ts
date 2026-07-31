export interface DomainEvent<TPayload extends object = object> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  occurredAt: string;
  actorId: string;
  correlationId: string;
  causationId?: string;
  payload: TPayload;
}

export function createDomainEvent<TPayload extends object>(input: {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date;
  actorId: string;
  correlationId: string;
  causationId?: string;
  payload: TPayload;
}): DomainEvent<TPayload> {
  return {
    eventId: input.eventId,
    eventType: input.eventType,
    eventVersion: 1,
    aggregateId: input.aggregateId,
    aggregateType: input.aggregateType,
    occurredAt: input.occurredAt.toISOString(),
    actorId: input.actorId,
    correlationId: input.correlationId,
    ...(input.causationId === undefined
      ? {}
      : { causationId: input.causationId }),
    payload: input.payload,
  };
}
