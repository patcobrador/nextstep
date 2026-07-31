# ADR-012: REST/OpenAPI contract policy

Status: Accepted  
Date: 2026-07-31  
Owners: API/backend, integration/release

## Context

Parent, coach, admin and later native clients require one stable integration boundary.

## Decision

Use REST/JSON under `/v1` with OpenAPI 3.1, explicit DTOs, problem details, opaque UUIDs, idempotency headers for important writes and version fields for mutable resources. Generate a checked contract summary in Slice 0 and a full client in a later contract work item.

## Consequences

Contract changes and generated artifacts ship together. Controllers never expose Prisma entities.

## Security/privacy impact

Contracts expose only necessary athlete context. Playback is granted through short-lived authorised operations.

## Migration/rollback

Backward-incompatible changes require a versioning decision and migration window.

## Requirement IDs affected

All HTTP-facing functional requirements
