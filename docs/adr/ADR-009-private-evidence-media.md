# ADR-009: Private evidence media

Status: Accepted
Date: 2026-08-04
Owners: Founder, Media/platform, Security/privacy

## Context

Checkpoint B introduces child evidence. Evidence must remain private while a parent uploads, validates, previews, replaces, submits, withdraws, or deletes an attempt. Local MinIO must enforce the same object-authorisation boundary expected from production object storage.

## Decision

- Store media in a private S3-compatible bucket behind provider-neutral `packages/media` interfaces.
- Upload directly from the browser with a 15-minute signed single-part PUT. Return no storage credentials.
- Use opaque `evidence/{uuid}/{uuid}` object keys that contain no athlete, household, or original filename data.
- Grant playback only after object authorisation with a five-minute signed GET. Do not persist or log signed URLs.
- Support MP4/H.264, with optional audio, for the synthetic/pilot B1 path. Validate object existence, signature, container, codec, size, duration, and SHA-256. Do not claim MOV, HEVC, arbitrary browser-recording, or universal phone compatibility.
- Use configuration defaults of 150 MiB and 90 seconds. Recording guidance may request a shorter clip.
- Use a deterministic local scanner adapter and explicit `REJECTED`/`QUARANTINED` states. Production malware scanning and transcoding require a later decision.
- Delete abandoned/rejected media within 24 hours and reviewed media after 30 days unless a bounded hold applies. Real-user media remains blocked pending legal and production codec/retention approval.

## Alternatives considered

Proxying uploads through the API, public objects, permanent URLs, committed credentials, and accepting unvalidated browser formats were rejected because they increase exposure or conceal compatibility limitations.

## Consequences

The browser can report upload progress and retry an interrupted PUT before expiry. Already issued playback grants cannot be individually revoked, so withdrawal denies new grants immediately and bounds residual access to five minutes.

## Security/privacy impact

The bucket denies anonymous access. Parent and future assigned-coach playback is actor-, consent-, and object-authorised and audited. Filenames and signed URLs are excluded from logs, problem responses, audit payloads, and committed artifacts. Only synthetic media is used in tests.

## Migration/rollback

The additive B1 migration records upload/processing/retention timing and optimistic versions. Rollback disables new B1 commands before removing nullable columns; object deletion remains worker-driven.

## Requirement IDs affected

FR-EVID-001 through FR-EVID-010, NFR-SEC-001, NFR-PRIV-001
