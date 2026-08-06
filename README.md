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
- Checkpoint B1 purpose-specific evidence consent, direct private MinIO upload, deterministic media validation, short-lived parent playback, explicit assessment submission, and worker-driven deletion.

The foundation is locally deployable with Docker Compose. Production startup still refuses to treat the local-header identity adapter as Cognito. Managed Cognito, production S3 processing, transcoding, production malware scanning, and cloud infrastructure are intentionally later slices.

## Local start

Start Docker Desktop, then run:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev:infra
corepack pnpm prisma:migrate:deploy
corepack pnpm test:e2e:walking-skeleton
```

To build and run the minimal containerized web and API applications:

```bash
corepack pnpm deploy:local
corepack pnpm deploy:status
```

The containerized web application is available at `http://127.0.0.1:3100`; API liveness and readiness are available under `http://127.0.0.1:3101/v1/health/`. Native development retains ports 3000 and 3001.

## Checkpoint A demonstration

The Checkpoint A fixture is deterministic, development-only and safe to rerun. It preserves the source curriculum's `DRAFT` declaration while promoting only the imported database copy when `NEXTSTEP_DEMO_MODE=enabled` is explicit. Running the fixture again resets transient Checkpoint A sessions, attempts, idempotency records, outbox events and projected practice passport events before loading the same baseline.

Start PostgreSQL, deploy every committed migration, then reset and load the fixture:

```bash
docker compose up -d postgres
export DATABASE_URL="postgresql://nextstep:nextstep@localhost:5433/nextstep?schema=public"
corepack pnpm prisma:migrate:deploy
export NEXTSTEP_DEMO_MODE="enabled"
corepack pnpm demo:checkpoint-a
```

Run the containerized demonstration:

```bash
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

The local persona route is deliberately unavailable unless `NEXTSTEP_LOCAL_AUTH=enabled`; production API startup continues to require the Cognito adapter. Checkpoint A remains unchanged by the B1 evidence slice.

To run the real-stack browser journey and regenerate the ten stable review screenshots:

```bash
export DATABASE_URL="postgresql://nextstep:nextstep@localhost:5433/nextstep?schema=public"
corepack pnpm test:e2e:checkpoint-a
```

Review artifacts are stored in `docs/review/checkpoint-a/`.

## Checkpoint B1 private evidence demonstration

B1 uses synthetic media only. Start the full private-media stack, deploy the migration, and reset the deterministic fixture:

```bash
corepack pnpm dev:infra
export DATABASE_URL="postgresql://nextstep:nextstep@localhost:5433/nextstep?schema=public"
corepack pnpm prisma:migrate:deploy
export NEXTSTEP_DEMO_MODE="enabled"
corepack pnpm demo:checkpoint-b1
corepack pnpm deploy:local:b1
corepack pnpm deploy:status
```

Open `http://127.0.0.1:3100/local-auth`, continue as **Pat Johnson**, and choose **Add private evidence**. The local pilot accepts only an MP4 container with H.264 video, no audio requirement, up to 150 MiB and 90 seconds. The checkpoint instructions request a shorter clip. Use only the committed synthetic fixture at `apps/web/e2e/fixtures/evidence/bilateral-control-synthetic.mp4`.

The browser uploads directly to the private bucket with a 15-minute signed PUT. Capture/upload consent is required before that draft; assigned-coach review consent is collected only when a READY draft is submitted. Playback grants last at most five minutes. B1 creates an unassigned assessment request but intentionally has no coach queue, rubric decision, outcome, remediation, or progression-unlock UI.

Run the real-stack B1 journey and regenerate its four review screenshots:

```bash
export DATABASE_URL="postgresql://nextstep:nextstep@localhost:5433/nextstep?schema=public"
docker compose up -d minio minio-init
corepack pnpm test:e2e:checkpoint-b1
```

See `docs/checkpoint-b1-private-evidence.md` for states, authorisation, retention, limitations, and configuration. Review artifacts are stored in `docs/review/checkpoint-b1/`.

## Commands

```bash
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
corepack pnpm test:e2e:checkpoint-b1
corepack pnpm build
docker compose config --quiet
docker compose build api worker web
```

Synthetic data only; never copy production child data into local environments.

## Source material

The founder specification and original artifacts remain under `build-pack/`. The approved implementation plan is maintained under `docs/charter/`.
