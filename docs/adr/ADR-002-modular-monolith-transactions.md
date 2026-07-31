# ADR-002: Modular-monolith transaction boundaries

Status: Accepted  
Date: 2026-07-31  
Owners: Domain/data, API/backend

## Context

Practice completion, progress evaluation and event persistence must succeed atomically.

## Decision

Use a NestJS modular monolith backed by one PostgreSQL database. Each module owns its writes. Cross-module writes use application commands or outbox events, never direct table mutation.

## Consequences

Critical workflows can use local transactions while modules remain extractable later.

## Security/privacy impact

Object policy checks precede transactions and audit facts are written with privileged changes.

## Migration/rollback

Use expand/migrate/contract database changes. Service extraction requires another ADR.

## Requirement IDs affected

FR-PRO-004, FR-PRAC-009, FR-ASMT-007–009
