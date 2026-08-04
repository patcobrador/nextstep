# ADR-010: Assessment transactions and immutable attempts

Status: Accepted
Date: 2026-08-04
Owners: Founder, Domain/data, API/backend

## Context

Evidence submission begins the human-assessment boundary. Checkpoint B1 owns submission and future assigned-coach playback primitives; decisions and progression belong to B2.

## Decision

- PostgreSQL relational records are authoritative; the development-flow snapshot does not own B evidence or assessment state.
- An evidence attempt is immutable after submission: `DRAFT -> SUBMITTED -> ASSIGNED -> REVIEWED`. A later RETRY creates new media and evidence rather than mutating the reviewed attempt.
- Capture/upload consent is required before a draft upload. Independently recorded assigned-coach review consent is required only before submission.
- Submission is idempotent, validates READY media and both active consents, creates the minimum assessment-request primitive, and emits a transactional outbox event. It does not assign a coach or implement a decision.
- Important writes bind idempotency keys to actor, operation, and request hash. Mutable media/evidence/assessment rows use optimistic versions and guarded transitions.
- PASS, RETRY, UNABLE_TO_ASSESS, coach assignment, assessment start, rubric decisions, remediation, and progression changes are B2 and are not implemented by B1.

## Alternatives considered

Reusing the prototype snapshot, allowing callers to choose a coach, overwriting evidence after RETRY, and collecting bundled consent were rejected.

## Consequences

B1 can safely finish at an unassigned assessment request while preserving the contract boundary required for B2. Existing `RETRY_REQUIRED` enum compatibility is retained but is not used for immutable Checkpoint B attempts.

## Security/privacy impact

Coach playback can only be granted in the future when an active database assignment and active review consent both exist. Submission fails safely if review consent is missing, withdrawn, or expired.

## Migration/rollback

The review-consent relationship is nullable for expansion compatibility but required by every new submission command. No applied migration is edited.

## Requirement IDs affected

FR-ASMT-001 through FR-ASMT-010, FR-EVID-006 through FR-EVID-010
