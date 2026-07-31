# AGENTS.md — Next Step Sports Platform

This file tells autonomous build agents how to implement the Next Step Sports Platform without fragmenting the product model.

## 1. Source of truth

Read in this order before changing code:

1. `NextStep_Sports_Platform_Spec_v1.0.md`
2. Accepted files in `docs/adr/`
3. `contracts/openapi.yaml`
4. `data/schema.prisma`
5. Existing tests
6. Existing implementation

A `[DECISION]` in the specification is authoritative. Do not silently reinterpret it.

## 2. Non-negotiable product rules

- Basketball is the only production sport in MVP, but the core engine must remain sport-agnostic.
- The primary audience is approximately U8-U12 athletes using the product with a parent/caregiver.
- The parent owns the account. No independent child login is required for MVP.
- The product is a prescribed pathway, not an unrestricted drill library.
- The skill tree visualises progress and controlled choices; it does not allow skipping hard prerequisites.
- Practice is frequent and low-friction. Human assessment is occasional.
- Child evidence is private. No public profiles, social feed, public leaderboard or direct coach-to-child messaging.
- “Demonstrated” and “coach verified” are different states and must not be conflated.
- No automated computer-vision system may make the final mastery decision in MVP.
- Every privileged access to child data or media must be authorised and auditable.

## 3. Required architecture

Use a TypeScript monorepo:

```text
apps/web        Next.js PWA
apps/api        NestJS REST API
apps/worker     asynchronous jobs
packages/domain pure rules and state machines
packages/contracts shared/generated API contracts
packages/database Prisma schema, migrations and repositories
packages/ui     design system
```

Primary infrastructure:

- PostgreSQL source of truth
- private S3 object storage
- SQS/outbox for asynchronous events
- managed OIDC identity
- Stripe behind a billing adapter
- Terraform for deployed infrastructure

Build a modular monolith. Do not create microservices without an accepted ADR.

## 4. Agent workstreams

### 4.1 Product/UX agent

Owns:

- user flows and information architecture;
- screen states and copy;
- responsive/accessibility behaviour;
- design-system tokens and interaction patterns;
- traceability from screen to functional requirement.

Outputs:

- route map;
- component inventory;
- wireframes or coded prototypes;
- empty/loading/error/offline/unauthorised states;
- acceptance-test scenarios.

Must coordinate with curriculum, frontend, privacy and accessibility agents.

### 4.2 Curriculum/content agent

Owns:

- basketball sport-pack taxonomy;
- node objectives, prerequisites and unlocks;
- drill metadata, cues, variants and safety;
- milestone rubrics;
- seed data and validation fixtures.

Outputs:

- valid curriculum JSON/import files;
- content review checklist;
- example media briefs;
- graph tests;
- migration mappings when versions change.

Must not implement curriculum rules in frontend code.

### 4.3 Domain/data agent

Owns:

- canonical vocabulary and aggregates;
- state machines and completion-rule engine;
- Prisma schema and migrations;
- transaction boundaries;
- domain events and outbox;
- data deletion/export design.

Outputs:

- `packages/domain` rules with tests;
- database models/repositories;
- event schemas;
- migration plans;
- data dictionary.

No cloud or web-framework imports are allowed in pure domain packages.

### 4.4 API/backend agent

Owns:

- NestJS modules and application services;
- REST endpoints and OpenAPI;
- object-level authorisation;
- idempotency;
- provider adapters;
- orchestration of domain events.

Outputs:

- endpoint implementation;
- contract and integration tests;
- consistent problem-detail errors;
- API documentation;
- performance instrumentation.

Never return Prisma entities directly from controllers.

### 4.5 Web/PWA agent

Owns:

- parent/athlete/coach/admin web interfaces;
- PWA installation and offline practice cache;
- accessible components;
- API client integration;
- practice local state and sync queue.

Outputs:

- responsive routes;
- component tests;
- Playwright flows;
- accessibility evidence;
- local/offline recovery handling.

Business state transitions must come from the API/domain, not browser-only logic.

### 4.6 Media/platform agent

Owns:

- upload-intent workflow;
- pre-signed uploads;
- validation/scanning/transcoding;
- signed playback;
- retention/deletion jobs;
- queue and worker reliability.

Outputs:

- media state machine;
- S3/IAM policies;
- worker implementation;
- failure/retry tests;
- cost and lifecycle metrics.

No evidence bucket may ever permit public access.

### 4.7 Security/privacy agent

Owns:

- threat models;
- consent and data minimisation review;
- RBAC/ABAC policy tests;
- secrets/IAM/security headers;
- audit and privileged-access controls;
- privacy/export/deletion verification.

Outputs:

- threat-model documents;
- security test suite;
- release risk assessment;
- incident runbooks;
- privacy data map.

A security agent can block release for unresolved critical child-data exposure risk.

### 4.8 QA/accessibility agent

Owns:

- requirement-based test plan;
- end-to-end and regression suites;
- accessibility tests and manual checks;
- test fixtures;
- release acceptance evidence.

Outputs:

- requirement-to-test traceability matrix;
- Playwright suites;
- axe reports;
- manual test records;
- defect severity and release recommendation.

### 4.9 DevOps/observability agent

Owns:

- Terraform;
- CI/CD;
- environment configuration;
- migrations/deployments;
- logs, metrics, traces and alerts;
- backups and restore exercises.

Outputs:

- reproducible environments;
- deployment runbook;
- dashboards/alerts;
- rollback/restore procedure;
- cost visibility.

### 4.10 Integration/release agent

Owns:

- dependency sequencing;
- contract integration;
- branch/PR coordination;
- ADR enforcement;
- release candidate validation.

Outputs:

- integrated release branch;
- change log;
- known-risk list;
- migration and rollout plan;
- final definition-of-done report.

## 5. Recommended implementation sequence

### Slice 0 — Repository and contracts

- Create monorepo and baseline CI.
- Implement configuration, logging and test packages.
- Validate `schema.prisma` and OpenAPI skeleton.
- Create synthetic fixtures only.

### Slice 1 — Curriculum and read-only prototype

- Import seed basketball curriculum.
- Implement graph validator.
- Render dashboard/tree/skill detail from fixture data.
- No authentication shortcuts that would be retained in production.

### Slice 2 — Household, athlete and onboarding

- Managed identity integration.
- Household and athlete resource policies.
- Consent records.
- Baseline and campaign assignment.

### Slice 3 — Guided practice

- Practice plan generator.
- Persisted plan snapshots.
- Practice player and completion.
- Domain events/outbox.
- Progress state changes.

### Slice 4 — Evidence and assessment

- Private upload pipeline.
- Assessment assignment.
- Coach rubric UI.
- Pass/retry and unlock.
- Media deletion/retention controls.

### Slice 5 — Passport and operations

- Passport read model.
- Audit/admin tools.
- Coach credentials and WWCC expiry.
- Support and incident flows.

### Slice 6 — Billing and controlled pilot

- Subscription entitlements.
- Assessment orders.
- Payment webhooks and refunds.
- Operational dashboards and release hardening.

Do not begin marketplace discovery, native apps or AI analysis before the end-to-end pathway is reliable.

## 6. Development workflow

1. Pick an epic/requirement ID.
2. Write or update acceptance tests before substantial implementation.
3. Identify affected domain module and owner.
4. Update OpenAPI/schema in the same change where the contract changes.
5. Add an ADR for a significant deviation or new dependency.
6. Implement the smallest vertical slice.
7. Run unit, integration, security and relevant E2E tests.
8. Update documentation and traceability.
9. Request cross-functional review when child data, assessment, payment or curriculum progression is affected.

## 7. ADR rules

Create an ADR when changing:

- parent-owned child account model;
- PWA-first strategy;
- modular monolith boundary;
- database, identity, media or payment provider;
- progression state machine;
- curriculum versioning;
- evidence privacy/retention;
- human verification rule;
- API style;
- public/social capability;
- data residency posture.

ADR template:

```markdown
# ADR-NNN: Title

Status: Proposed | Accepted | Superseded
Date: YYYY-MM-DD
Owners: ...

## Context
## Decision
## Alternatives considered
## Consequences
## Security/privacy impact
## Migration/rollback
## Requirement IDs affected
```

## 8. Contract rules

- API paths are versioned under `/v1`.
- Requests/responses use explicit DTOs.
- Errors use a consistent problem-details envelope.
- Important writes support idempotency.
- Events are versioned and emitted through an outbox.
- Currency values are integer minor units plus ISO currency.
- Dates/times are ISO 8601 UTC in APIs.
- IDs are opaque UUIDs/ULIDs; never expose sequential database IDs.
- Provider IDs do not leak into core domain contracts.

## 9. Security rules

- Every athlete-scoped query must enforce relationship/assignment at the database or application-policy boundary.
- Test cross-household ID substitution for every new athlete endpoint.
- Test cross-coach access for every assessment/media endpoint.
- Never log names, evidence URLs, free-text feedback or auth tokens.
- Coach/admin MFA is mandatory.
- Support media access is just-in-time, reason-coded and time-limited.
- Public S3 access block is asserted in infrastructure tests.
- No production data is copied to non-production.
- No AI/model training uses child data without a separately approved feature and consent design.

## 10. UI rules

- Dashboard has one primary next action.
- Skill Tree & Progress has an accessible list alternative.
- Locked nodes explain why.
- Skill detail has one primary action, not a generic drill queue.
- Practice mode uses large targets, minimal text and captions.
- Colour is never the only state indicator.
- No shame/punitive streak language.
- “Verified” appears only when an authorised assessment supports it.

## 11. Test requirements per pull request

Every change must include the tests proportionate to its risk:

- domain unit tests for rules;
- database integration test for persistence/transaction changes;
- authorisation test for new resource paths;
- contract test for API changes;
- E2E test for critical journey changes;
- accessibility test for UI changes;
- idempotency/replay test for events/payments/completion;
- migration test for schema changes.

## 12. Definition of done checklist

- [ ] Requirement IDs linked.
- [ ] Acceptance criteria met.
- [ ] No product decision silently changed.
- [ ] OpenAPI and schema updated.
- [ ] Domain rules tested.
- [ ] Object-level authorisation tested.
- [ ] Accessibility checked.
- [ ] Analytics avoids personal data.
- [ ] Logs/metrics/alerts added.
- [ ] Migration/rollback considered.
- [ ] Documentation/runbook updated.
- [ ] Security/privacy review completed where required.
- [ ] Feature flag and rollout plan defined.

## 13. Agent handoff format

Each agent handoff should contain:

```markdown
## Scope completed
## Requirement IDs
## Files changed
## Contracts changed
## Tests added and results
## Security/privacy considerations
## Known limitations
## Follow-on tasks
## ADRs created or required
```

A handoff that only says “implemented” is not sufficient.
