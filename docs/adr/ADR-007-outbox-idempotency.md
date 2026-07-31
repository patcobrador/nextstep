# ADR-007: Transactional outbox and idempotency

Status: Accepted  
Date: 2026-07-31  
Owners: Domain/data, worker/platform

## Context

Retries must not duplicate completion, mastery, unlocks, assessment outcomes or passport entries.

## Decision

Persist domain events in an outbox in the same transaction as aggregate changes. Important commands use actor/operation/idempotency-key records. Consumers store processed event IDs and projections key source facts uniquely.

## Consequences

At-least-once delivery is safe. Events include ID, type, version, aggregate, actor, correlation and timestamp.

## Security/privacy impact

Payloads minimise personal data and logs use safe allow-listed fields.

## Migration/rollback

Consumers are replayable; incompatible event changes require new schema versions.

## Requirement IDs affected

FR-PRO-004, FR-PRAC-009, FR-ASMT-007–009, FR-BILL-003
