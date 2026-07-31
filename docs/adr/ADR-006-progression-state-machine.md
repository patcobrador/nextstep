# ADR-006: Explainable progression state machine

Status: Accepted  
Date: 2026-07-31  
Owners: Domain/data, curriculum/content

## Context

Completion, demonstration and coach verification must not be conflated.

## Decision

Persist canonical progress states from the specification. Evaluate immutable rule snapshots deterministically. The first checkpoint requires three sessions across five days and two successes before evidence; only an authorised PASS marks it verified.

## Consequences

Tests use a controllable clock and replayed sessions do not count twice.

## Security/privacy impact

The client cannot mutate progression directly. Administrative corrections require reason-coded audit facts.

## Migration/rollback

State changes require migration mappings and provenance-preserving events.

## Requirement IDs affected

FR-PRO-004–007, FR-PRAC-006–010, FR-ASMT-007–009
