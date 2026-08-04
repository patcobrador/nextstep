# ADR-011: Passport projection from immutable domain events

Status: Accepted
Date: 2026-08-04
Owners: Founder, Domain/data, Worker

## Context

Checkpoint A already exposes a passport read model. Future assessment outcomes must update it without coupling media or assessment transactions to presentation writes.

## Decision

- PostgreSQL assessment and progression state remain authoritative.
- Assessment/progression transactions emit versioned outbox events.
- The worker projects passport entries at least once, using `ProcessedEvent` and unique source-event IDs for idempotency.
- Passport entries never contain evidence URLs, object keys, credentials, or unrestricted feedback text.
- B1 emits upload, validation, withdrawal, deletion, and assessment-request events but does not add assessment-result passport entries. PASS/RETRY/UNABLE projection belongs to B2.

## Alternatives considered

Synchronous passport writes inside media transactions and reconstructing assessment truth from UI activity were rejected.

## Consequences

Passport consistency is eventual and restart durable. Checkpoint A passport behavior remains unchanged until B2 introduces assessment outcome projections.

## Security/privacy impact

The read model contains only structured, minimised milestone information and no media access material.

## Migration/rollback

Existing outbox, processed-event, and passport tables are sufficient; ADR-011 requires no B1-specific schema changes.

## Requirement IDs affected

FR-PASS-001 through FR-PASS-006, NFR-REL-001
