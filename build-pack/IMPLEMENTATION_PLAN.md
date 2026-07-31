# NextStep Sports Platform — Implementation Plan

Status: Approved for implementation  
Prepared: 31 July 2026  
Approved: 31 July 2026  
Source precedence: `NextStep_Sports_Platform_Spec_v1.0.md`, accepted ADRs, OpenAPI, Prisma schema, curriculum seed, `AGENTS.md`

Founder approval includes the recommended defaults and campaign repairs recorded in §8. The original Prisma schema should be used if supplied before its reconstruction is committed; otherwise reconstruction is authorised from the specification, API contract and validation model inventory.

### Definition of ready

- Founder defaults and campaign repairs are approved.
- Canonical contract and schema locations are recorded by ADR.
- Node.js, pnpm, Prisma and OpenAPI tooling versions are pinned before CI is considered stable.
- The absent starter Prisma schema is either supplied or reconstructed with explicit provenance.

## 1. Implementation charter

### Product outcome

Build the smallest production-shaped, parent-controlled basketball pathway proving:

```text
parent creates athlete
→ baseline assigns Foundation campaign
→ prescribed practice is generated and completed
→ progress is evaluated exactly once
→ checkpoint requests private evidence
→ eligible coach completes rubric assessment
→ pass unlocks downstream progression
→ passport records the verified event
```

The first checkpoint should be `foundation.ball.bilateral-control-check`, because it is the seed's coherent asynchronous-video checkpoint.

Its configured completion rule requires three completed sessions across five calendar days and two successful attempts. The walking-skeleton test must use a controllable clock and multiple sessions; it must not weaken the rule merely to make the test shorter.

### Architecture

- TypeScript monorepo using pnpm and Turborepo.
- Next.js responsive PWA.
- NestJS modular-monolith REST API.
- Separate asynchronous worker.
- PostgreSQL and Prisma.
- Transactional outbox with idempotent consumers.
- Private S3-compatible media storage and short-lived access grants.
- Managed OIDC behind an identity adapter.
- Pure framework-independent domain package.
- Provider-independent identity, media, notification and billing interfaces.
- Passport implemented as an event-derived read model.
- Infrastructure managed with Terraform.

### Non-negotiable boundaries

- Parent owns the athlete relationship; no child login in MVP.
- Basketball is the only production sport, while core rules remain sport-agnostic.
- The experience is prescribed, not an unrestricted drill library.
- Demonstrated and coach-verified progression remain distinct.
- Evidence is private and object-authorised.
- No public profiles, social feed, leaderboard or direct coach-to-child messaging.
- No AI or computer vision makes mastery decisions.
- No payments, marketplace, organisation layer, native app or second sport in the first walking skeleton.
- No progression state is directly mutated by the browser.

### Walking-skeleton success criteria

- The loop works through public API contracts and persisted data.
- Every important write is replay-safe.
- Cross-household and cross-coach substitution is denied.
- Evidence never becomes public.
- Practice, assessment, progression and passport facts share traceable event provenance.
- Retry and pass outcomes are both tested.
- Critical parent and coach paths pass accessibility checks.
- API and worker retries do not duplicate unlocks or passport events.

The exact successful terminal transition is:

```text
foundation.ball.bilateral-control-check REVIEW_PENDING
→ assessment PASS
→ checkpoint MASTERED with verified=true
→ foundation.ball.moving-control AVAILABLE
→ dashboard next action changes
→ exactly one passport verification event appears
```

The expected event ledger is:

```text
AthleteCreated
AthleteBaselineCompleted
AthleteCampaignAssigned
PracticePlanGenerated
PracticeSessionCompleted
SkillStateChanged
EvidenceSubmitted
AssessmentRequested
AssessmentAssigned
AssessmentCompleted
SkillStateChanged
RevisitScheduled
```

Every event carries a stable event ID, correlation ID and schema version. Duplicate delivery must not duplicate state transitions, unlocks or passport entries.

## 2. Requirements-to-component traceability

| Requirements | Owning components | Principal surface | Required verification | Slice |
|---|---|---|---|---|
| FR-ID-001–003, 008 | Identity adapter, API auth guard, web session | `/me`, roles and MFA | Token, suspension and MFA policy tests | 0/2 |
| FR-ID-002, 004–009 | Household, Athlete, Consent, Audit | Athlete and consent records | Cross-household IDOR, versioning and audit | 2 |
| FR-ON-001–005 | Athlete onboarding, Campaign assignment | Baseline request/result | Safe-default and explainability tests | 2 |
| FR-CUR-001–008 | Curriculum module and SDK | Graph, content and publication | Cycle, reachability and immutability tests | 1 |
| FR-PRO-001–003, 005–008 | Progress, Recommendation and UI | Dashboard/tree/branch contracts | Next-action, locked reason and a11y | 1–4 |
| FR-PRO-004 | Progress, Audit, Outbox | Transition provenance | Concurrency, replay and audit tests | 3 |
| FR-PRAC-001–004, 010 | Recommendation/Practice | Practice-plan snapshots | Prescription, substitution and variation | 3 |
| FR-PRAC-005–007 | Practice session domain and UI | Attempts and completion | Result type, skip and safety-stop tests | 3 |
| FR-PRAC-008 | PWA cache/sync | Cached plan/media manifest | Offline reload and sync recovery | Post-skeleton |
| FR-PRAC-009 | Practice, Progress, Outbox | Session completion | Duplicate completion and transaction tests | 3 |
| FR-ASMT-001–004, 012 | Evidence/Media, Consent, Worker | Upload and retention | File, access, expiry and deletion tests | 4 |
| FR-ASMT-005–011 | Assessment, Coach, Progress | Queue, rubric and decision | Eligibility, retry/pass and replay tests | 4 |
| FR-COACH-001–004, 008 | Coach, Identity, Audit | Credentials and assignments | WWCC, MFA, suspension and IDOR tests | 4 |
| FR-COACH-005–007 | Booking/Billing | Booking/order/payout | Sandbox lifecycle and disputes | Later MVP |
| FR-PASS-001, 003–005 | Passport projection and UI | Passport timeline | Ordering, provenance and privacy | 4 |
| FR-PASS-002 | Export worker | Export request/artifact | Authority and completeness | Later MVP |
| FR-BILL-001–006 | Billing adapter, Entitlements | Orders and webhooks | Signature, replay and isolation | Slice 6 |
| FR-ADM-001–006 | Admin, Audit and Incident | Grants, audit and publication | Maker-checker and JIT access | Later MVP |
| NFR §§21, 36–38 | All apps/packages and infrastructure | CI, telemetry and deployment | Performance, WCAG, scans and restore | Continuous |

## 3. Proposed repository structure

```text
nextstep/
  apps/
    web/
    api/
    worker/
  packages/
    domain/
    contracts/
    database/
      prisma/
        schema.prisma
        migrations/
    curriculum-sdk/
    ui/
    config/
    observability/
    testing/
  contracts/
    openapi.yaml
  content/
    basketball/
      seed/
      fixtures/
      media-manifests/
  infrastructure/
    docker/
    terraform/
      modules/
      environments/
  docs/
    charter/
    traceability/
    adr/
    threat-models/
    runbooks/
    data-dictionary/
    test-evidence/
  tools/
    curriculum/
    contracts/
    ci/
  .github/workflows/
  build-pack/                 # retained as immutable source material
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
```

The recovered Prisma source should become `packages/database/prisma/schema.prisma`. Its relocation from the build pack's documented `data/schema.prisma` must be recorded in an ADR so there is only one canonical implementation schema.

## 4. Technical decisions and ADR list

### Required before affected implementation

1. ADR-001: TypeScript/pnpm/Turborepo monorepo and package boundaries.
2. ADR-002: Modular-monolith transaction boundaries and cross-module communication.
3. ADR-003: Canonical Prisma location, migration ownership and recovery of the missing starter schema.
4. ADR-004: OIDC provider, browser session/cookie model, role mapping and MFA.
5. ADR-005: Household/resource authorisation policy and policy-test conventions.
6. ADR-006: Progress state machine, demonstrated/verified semantics and concurrency.
7. ADR-007: Transactional outbox, event envelope, ordering and consumer idempotency.
8. ADR-008: Curriculum versioning, immutable publication and migration.
9. ADR-009: Private media upload, scanning, playback and retention.
10. ADR-010: Assessment assignment, rubric snapshots, correction and appeal.
11. ADR-011: Passport projection, rebuild strategy and consistency guarantees.
12. ADR-012: API generation, problem details and compatibility policy.

ADRs 001–003, 006–007 and 012 are Slice 0 gates. Identity, media, assessment and passport ADRs are accepted immediately before their owning slice rather than speculatively blocking repository setup.

### Required before pilot or production

- ADR-013: AWS Sydney deployment and data residency.
- ADR-014: Evidence retention and legal holds.
- ADR-015: Analytics allow-list and personal-data scrubbing.
- ADR-016: Billing/Stripe isolation and webhook processing.
- ADR-017: Deletion/export workflow.
- ADR-018: Backup, restore and disaster recovery.

## 5. MVP vertical-slice plan

### Slice 0 — Repository, contracts and safety rails

- Recover or explicitly reconstruct the missing Prisma schema.
- Establish canonical vocabulary and module boundaries.
- Create monorepo, pinned toolchain and baseline CI.
- Add OpenAPI, Prisma and curriculum validators.
- Add synthetic identity, athlete, coach and media fixtures.

Exit: the repository builds, contracts validate, migrations generate from empty and curriculum validation is executable.

### Slice 1 — Curriculum and read-only pathway

- Repair and import the Foundation fixture.
- Implement graph, completion-rule and publication validation.
- Render dashboard, tree, accessible list and skill detail from fixtures.
- Keep unpublished or incomplete content out of consumer views.
- Add jump-land and stride-stop to the campaign, make chest pass required before the core milestone, and add moving dribble control immediately after the bilateral checkpoint.

Exit: one reachable campaign renders without basketball-specific UI rules.

### Slice 2 — Household, athlete and campaign assignment

- Integrate managed identity through an adapter.
- Create household and parent-owned athlete resources.
- Persist versioned consent.
- Submit baseline and assign the Foundation campaign.
- Enforce household-level object authorisation.

Exit: a parent can create only athletes in their household and receive an explainable campaign assignment.

### Slice 3 — Guided practice and progress

- Generate and persist plan snapshots.
- Start sessions, record typed attempts and complete sessions.
- Support safety stops, skips and reflection.
- Evaluate progress transactionally and exactly once.
- Emit outbox events and surface the next action.

Exit: the configured three-session/five-day rule reaches `EVIDENCE_PENDING` without duplicate transitions.

### Slice 4 — Evidence, assessment, unlock and passport

- Create private upload intent and upload-completion flow.
- Validate and process a synthetic evidence clip.
- Assign an eligible coach.
- Submit an immutable rubric decision.
- Handle retry and pass branches.
- Unlock the downstream node.
- Project practices, assessments and verified progress into the passport.

Exit: the complete required loop passes through the API, database, worker and web interfaces.

The minimum passport projection moves into Slice 4 to meet the walking-skeleton requirement; fuller export and operational features remain in Slice 5.

## 6. Dependency-ordered backlog

| # | Owner | Work item | Requirements/contracts | Exit criteria |
|---:|---|---|---|---|
| 1 | Integration + Domain/Data | Restore schema and data dictionary | All domain requirements | Prisma validates; no replacement model is silently invented |
| 2 | DevOps + Integration | Monorepo, local services and CI | NFR §§21, 37–38 | Clean install, build and baseline checks pass |
| 3 | Curriculum | Repair seed and build graph validator | FR-CUR-001–008 | Cycle, reachability, required-field and rubric checks pass |
| 4 | Security + API | Identity and object-policy layer | FR-ID-001–009 | Household, suspension and role tests pass |
| 5 | Athlete + API + Web | Athlete, consent, baseline and campaign | FR-ON-001–005 | Parent reaches a campaign; safe default and audit verified |
| 6 | Practice + Progress | Plan, attempts, completion and outbox | FR-PRAC/PRO | Replay returns the same result; evidence becomes pending |
| 7 | Media + Security | Upload, processing and playback | FR-ASMT-001–004 | Invalid media rejected; unauthorised/public access impossible |
| 8 | Assessment + Coach | Assignment queue and rubric decision | FR-ASMT-005–011 | Invalid coach excluded; retry preserved; decision replay-safe |
| 9 | Progress + Passport | Pass, unlock and passport projection | FR-PRO-004, ASMT-008, PASS-001 | One unlock and passport event despite replay |
| 10 | Web + QA + Security | Parent/coach end-to-end UI | All slice contracts | Playwright, axe, keyboard, IDOR and URL-expiry tests pass |

## 7. Contradictions and omissions

### Blocking pack-integrity issues

1. `data/schema.prisma` is missing. `VALIDATION.md` says it contained 58 models and 33 enums, but the supplied pack has no `data/`, `contracts/` or `diagrams/` directories.
2. `openapi.yaml` and `seed_curriculum.json` are at the pack root rather than their documented paths.
3. The OpenAPI media flow lacks the upload-completion endpoint required by specification §30.

### Curriculum contradictions

- `foundation.milestone.core-1` declares `ASYNC_VIDEO`; its linked rubric declares `IN_PERSON`.
- Required campaign node `foundation.footwork.jump-stop` depends on `foundation.movement.jump-land`, which is absent from the campaign.
- The optional finishing branch depends on `foundation.footwork.stride-stop`, also absent from the campaign.
- The milestone requires `foundation.passing.chest-pass`, but chest pass is only an optional branch, making other branch choices unable to reach the milestone.
- Thirteen of 28 nodes have no primary drill.
- All drills and the curriculum are `DRAFT`.
- Required age, review ownership and accessibility metadata are missing.
- The Builder stage has no Builder nodes.

Approved repair: add missing prerequisite nodes to the campaign, make chest pass required before the milestone, add moving dribble control immediately after the bilateral checkpoint and use the bilateral asynchronous checkpoint for the first walking skeleton.

### Broader API omissions

- Consent withdrawal and management endpoints.
- Practice-session get/resume/update contract.
- Media upload-completion and dedicated playback-grant endpoints.
- Athlete deletion request.
- Passport export.
- Skill detail.
- Version/ETag fields for mutable resources.
- Support-access, incident and audit-search contracts.
- Coach credential/WWCC administration.

Before feature implementation, the walking-skeleton contract adds upload completion, authorised playback grants, practice-session retrieve/resume, skill detail, consent management/withdrawal, assessment assignment representation and consistent concurrency/version fields.

### Visual-reference conflict

The supplied mockup shows an overall score, levels, unlocked totals and extra persistent navigation. The specification forbids an opaque global athlete score and defines only Dashboard, Skill Tree & Progress and Practice as primary destinations. Treat the image as visual inspiration, not product authority.

## 8. Founder input

### Required before implementation reaches the affected slice

1. Supply the missing `schema.prisma`, or approve reconstruction from the specification, API and validation model list.
2. Approve the bilateral dribble checkpoint for the walking skeleton.
3. Approve the proposed campaign repairs: add jump-land and stride-stop, and make chest pass required before the core milestone.
4. Confirm whether the core milestone is asynchronous video or in-person.
5. Select the OIDC provider before Slice 2. Recommendation: Cognito behind an adapter.
6. Confirm manual/deterministic coach assignment for the closed skeleton, followed by credential-based assignment.

### Approved defaults

- Reconstruct the Prisma schema if the original cannot be supplied before the schema work item begins.
- Use the bilateral dribble checkpoint for the walking skeleton.
- Apply the campaign repairs specified in §§5 and 7.
- Treat the core milestone as in-person and the earlier checkpoint as asynchronous video.
- Use Amazon Cognito behind an identity adapter.
- Use deterministic manual coach assignment for the closed skeleton, followed by credential-based automatic assignment.

### Safe to keep configurable

- Next Step/NextStep consumer spelling.
- Final campaign size and later milestone cadence.
- Exact age-band representation.
- Full CMS versus import-first workflow.
- Evidence retention period, subject to legal review before real media.
- Caregiver export/delete permissions.
- Assessment pricing, compensation and appeal credits.
- Offline content breadth.
- Brand system, native-app trigger and second sport.

## 9. Principal risks

| Risk | Required control |
|---|---|
| Child/media IDOR | Deny-by-default object policy and substitution tests |
| Public/leaked evidence | Public-access blocks, signed URLs, redaction and expiry tests |
| Duplicate mastery/unlock | Transactional evaluation, concurrency and replay tests |
| Curriculum dead ends | Publication-time reachability and branch closure |
| Unsafe prescription | Safety metadata, load checks and stopping states |
| Invalid coach access | MFA, WWCC expiry, scoped assignment and revocation |
| Passport inconsistency | Outbox projection, replay safety and rebuild tests |
| Sensitive telemetry | Allow-listed fields and automated scanning |
| Migration/data loss | Expand/migrate/contract, upgrade tests and restore exercises |
| Premature marketplace | Keep outside the skeleton and provider-isolate later |

## 10. Commands and automated definition of done

CI should expose stable repository commands backed by pinned dependencies:

```powershell
corepack enable
pnpm install --frozen-lockfile

pnpm format:check
pnpm lint
pnpm typecheck

pnpm contracts:lint
pnpm contracts:generate
pnpm contracts:check-generated

pnpm prisma:format
pnpm prisma:validate
pnpm prisma:migrate:diff
pnpm test:migrations

pnpm curriculum:validate
pnpm test:unit
pnpm test:integration
pnpm test:contract
pnpm test:authz
pnpm test:security
pnpm test:a11y
pnpm test:e2e:walking-skeleton

pnpm build
pnpm scan:secrets
pnpm scan:dependencies
pnpm scan:containers
pnpm scan:iac
```

Validation is tiered:

- Pull request: format, lint, types, unit, contract, schema, curriculum, authorisation and targeted automated accessibility checks.
- Integration: PostgreSQL, outbox, worker, media emulator and complete walking-skeleton E2E checks.
- Release: performance, manual screen-reader evidence, security scans, restore exercise and operational runbooks.

The Prisma scripts must wrap the build-pack checks against the single canonical implementation schema. Package scripts are the stable interface; version-specific Prisma flags are finalised when the CLI version is pinned:

```powershell
pnpm exec prisma format --schema packages/database/prisma/schema.prisma
pnpm exec prisma validate --schema packages/database/prisma/schema.prisma
pnpm exec prisma migrate diff --from-empty --to-schema-datamodel packages/database/prisma/schema.prisma --script
```

Done additionally requires:

- OpenAPI semantic validation and generated-client compilation.
- Curriculum cycle, reachability, branch-closure and rubric-link validation.
- Fresh-database and upgrade migration tests.
- Object-level authorisation tests for every athlete/media/assessment/passport route.
- Completion, evidence, assessment, event and webhook replay tests.
- Private-bucket and expired-signed-URL assertions.
- Playwright coverage of the complete walking-skeleton loop.
- Automated axe plus keyboard and screen-reader evidence for critical flows.
- Telemetry-scrubbing checks.
- Documented rollback, feature flag, operational alert and security/privacy review.

## Approval record

The founder approved this plan, the final amendments and the defaults in §8 on 31 July 2026. Implementation proceeds in dependency order, with unresolved external legal, child-safety and pilot-policy decisions remaining release gates rather than silently invented product rules.
