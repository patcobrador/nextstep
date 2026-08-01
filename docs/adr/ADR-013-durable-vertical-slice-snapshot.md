# ADR-013: Durable vertical-slice aggregate snapshot

Status: Accepted  
Date: 1 August 2026

## Context

The first walking skeleton originally held its aggregate and resource indexes in process memory. The production schema already describes the long-term relational read and workflow models, but mapping every later product slice is not required to establish durable command handling.

## Decision

Persist the first vertical slice as a versioned `DevelopmentFlowSnapshot` plus typed resource indexes. Each accepted command atomically writes the new aggregate snapshot, its idempotency response, new resource indexes and domain events in the transactional outbox.

The existing relational athlete and household records are created at the boundary. As later slices implement campaign, practice, evidence and assessment modules, their relational models become the authoritative query models without changing the domain transition rules or public API.

## Consequences

- Restarting the API no longer loses the walking-skeleton state.
- Replayed commands return their persisted response, and key reuse with a different request is rejected.
- Outbox publication can be added independently of command transactions.
- Snapshot version checks reject concurrent aggregate updates.
- The snapshot is an implementation bridge, not permission to bypass the production relational models in later feature slices.
