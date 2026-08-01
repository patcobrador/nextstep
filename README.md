# NextStep Sports Platform

Production-shaped walking skeleton for a private, parent-controlled youth basketball development pathway.

## Current implementation

- TypeScript/pnpm/Turborepo monorepo.
- Next.js responsive PWA shell with the three primary destinations.
- NestJS `/v1` API walking skeleton.
- Durable Prisma/PostgreSQL aggregate repository.
- Persistent idempotency responses and transactional outbox writes.
- Working local-header identity adapter behind an authentication boundary.
- Generated OpenAPI request/response types with drift detection.
- Structured request logs, correlation IDs, RFC 7807 errors and health checks.
- Pure progression and assessment domain rules.
- Prisma 7 PostgreSQL schema reconstructed with provenance.
- Curriculum graph validation and repaired Foundation fixture.
- Idempotent worker-side passport projection.
- Contract, authorisation, accessibility and end-to-end tests.

The foundation is locally deployable with Docker Compose. Production startup still refuses to treat the local-header identity adapter as Cognito, and evidence upload URLs remain a local MinIO-compatible seam. Managed Cognito, production S3 processing and cloud infrastructure are intentionally later slices.

## Local start

Start Docker Desktop, then run:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev:infra
corepack pnpm prisma:migrate:deploy
corepack pnpm test:e2e:walking-skeleton
```

To build and run the minimal containerized web and API applications:

```powershell
corepack pnpm deploy:local
corepack pnpm deploy:status
```

The containerized web application is available at `http://127.0.0.1:3100`; API liveness and readiness are available under `http://127.0.0.1:3101/v1/health/`. Native development retains ports 3000 and 3001.

## Commands

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm contracts:lint
corepack pnpm curriculum:validate
corepack pnpm prisma:validate
corepack pnpm prisma:migrate:deploy
corepack pnpm test:unit
corepack pnpm test:integration
corepack pnpm test:authz
corepack pnpm test:a11y
corepack pnpm test:e2e:walking-skeleton
corepack pnpm build
```

Synthetic data only; never copy production child data into local environments.

## Source material

The founder specification and original artifacts remain under `build-pack/`. The approved implementation plan is maintained under `docs/charter/`.
