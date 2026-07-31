# ADR-003: Canonical Prisma schema and reconstruction

Status: Accepted  
Date: 2026-07-31  
Owners: Domain/data, integration/release

## Context

The supplied pack references a 58-model schema but omits the file.

## Decision

Reconstruct the implementation schema at `packages/database/prisma/schema.prisma` from the specification, API contract and listed entities. Record provenance beside the schema. Reconcile rather than silently replace if the original appears later.

## Consequences

Slice 0 can validate and generate migrations now. Model-by-model comparison remains required if the original is recovered.

## Security/privacy impact

The reconstruction includes consent, scoped relationships, immutable audit/outbox facts, media metadata and no media bytes.

## Migration/rollback

No production data exists. The schema can be corrected before pilot migrations are baselined.

## Requirement IDs affected

FR-ID-004–009, FR-CUR-001–008, FR-PRO-004, FR-ASMT-001–012, FR-PASS-001–005
