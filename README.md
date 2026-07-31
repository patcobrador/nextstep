# NextStep Sports Platform

Production-shaped walking skeleton for a private, parent-controlled youth basketball development pathway.

## Current implementation

- TypeScript/pnpm/Turborepo monorepo.
- Next.js responsive PWA shell with the three primary destinations.
- NestJS `/v1` API walking skeleton.
- Pure progression and assessment domain rules.
- Prisma 7 PostgreSQL schema reconstructed with provenance.
- Curriculum graph validation and repaired Foundation fixture.
- Idempotent worker-side passport projection.
- Contract, authorisation, accessibility and end-to-end tests.

The API currently uses an explicitly local/test flow adapter. Production startup refuses to run unless the managed identity adapter is selected. PostgreSQL repository wiring, Cognito, private S3 processing and deployed infrastructure remain subsequent approved slice work.

## Commands

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm format:check
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

Local dependencies can be started with `docker compose up -d`. Synthetic data only; never copy production child data into local environments.

## Source material

The founder specification and original artifacts remain under `build-pack/`. The approved implementation plan is maintained under `docs/charter/`.
