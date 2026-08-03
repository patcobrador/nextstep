# NextStep Sports Platform

Production-shaped walking skeleton for a private, parent-controlled youth basketball development pathway.

## Current implementation

- TypeScript/pnpm/Turborepo monorepo.
- Next.js parent application with Dashboard, Skill Tree, Practice and private Passport destinations.
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
- Checkpoint A relational read models and transactionally persisted guided-practice completion.

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

## Checkpoint A demonstration

The Checkpoint A fixture is deterministic, development-only and safe to rerun. It preserves the source curriculum's `DRAFT` declaration while promoting only the imported database copy when `NEXTSTEP_DEMO_MODE=enabled` is explicit. Running the fixture again resets transient Checkpoint A sessions, attempts, idempotency records, outbox events and projected practice passport events before loading the same baseline.

Start PostgreSQL, deploy every committed migration, then reset and load the fixture:

```powershell
docker compose up -d postgres
$env:DATABASE_URL = "postgresql://nextstep:nextstep@localhost:5433/nextstep?schema=public"
corepack pnpm prisma:migrate:deploy
$env:NEXTSTEP_DEMO_MODE = "enabled"
corepack pnpm demo:checkpoint-a
```

Run the containerized demonstration:

```powershell
corepack pnpm deploy:local
corepack pnpm deploy:status
```

Open `http://127.0.0.1:3100/local-auth`, keep the default **Pat Johnson** persona, and follow:

1. Review Mason Johnson's persisted dashboard and select **Start practice**.
2. Open **Skill Tree**, inspect **Both Hands Check**, then inspect any locked skill to see its prerequisite explanation.
3. Open **Practice**, begin the prescribed plan, and save each guided step.
4. Complete the practice and reload the completion page.
5. Open **Passport** and confirm the persisted practice-started and practice-completed events.
6. Use **Switch persona** to select Alex Reed for the unrelated-household demonstration.

The local persona route is deliberately unavailable unless `NEXTSTEP_LOCAL_AUTH=enabled`; production API startup continues to require the Cognito adapter. Checkpoint A does not include evidence upload or coach assessment UI.

To run the real-stack browser journey and regenerate the ten stable review screenshots:

```powershell
$env:DATABASE_URL = "postgresql://nextstep:nextstep@localhost:5433/nextstep?schema=public"
corepack pnpm test:e2e:checkpoint-a
```

Review artifacts are stored in `docs/review/checkpoint-a/`.

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
corepack pnpm test:e2e:checkpoint-a
corepack pnpm build
```

Synthetic data only; never copy production child data into local environments.

## Source material

The founder specification and original artifacts remain under `build-pack/`. The approved implementation plan is maintained under `docs/charter/`.
