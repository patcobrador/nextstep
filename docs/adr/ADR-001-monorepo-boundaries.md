# ADR-001: TypeScript monorepo and package boundaries

Status: Accepted  
Date: 2026-07-31  
Owners: Integration/release, domain/data

## Context

The PWA, REST API and worker share vocabulary and contracts but must not share framework-specific business logic.

## Decision

Use pnpm workspaces and Turborepo with `apps/web`, `apps/api`, `apps/worker`, and pure/shared packages. `packages/domain` has no web, database or cloud imports. Provider SDKs remain behind adapters.

## Consequences

One release train and shared types reduce integration cost. Boundary checks and package-level tests are required.

## Security/privacy impact

Child-data policies are enforced in API/application boundaries and cannot be bypassed by UI imports.

## Migration/rollback

Package boundaries can be reorganised through import-preserving moves. Microservices require a new ADR.

## Requirement IDs affected

FR-CUR-008, FR-PRO-004, FR-PRAC-009, NFR §21.7
