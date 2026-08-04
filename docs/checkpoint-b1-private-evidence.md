# Checkpoint B1 private evidence

Checkpoint B1 implements private parent evidence through explicit submission for assessment. It does not implement coach workflow or assessment outcomes (B2), nor integrated Checkpoint B closure (B3).

## Consent and state boundaries

The two consent purposes are separate append-only records:

1. `PRIVATE_EVIDENCE_CAPTURE_UPLOAD` must be the current active consent before an upload intent is issued. It is sufficient for private upload, validation, preview, replacement, withdrawal, and deletion.
2. `ASSIGNED_COACH_EVIDENCE_REVIEW` is not required for a private draft. It must be the current active consent when READY evidence is submitted and whenever an assigned coach requests playback.

Owners and caregivers may record either consent. Only an active household owner may withdraw consent or request physical evidence deletion. Withdrawal timestamps the consent record rather than removing it. It immediately denies new applicable playback grants, withdraws active evidence, cancels a nonterminal assessment request, and schedules object deletion. An already issued playback grant remains bounded by its original five-minute expiry.

No calendar consent duration was approved for B1. A consent is current only when it is the latest decision for the athlete and purpose, is granted and unwithdrawn, and matches the active policy version; a superseding decision or policy-version change makes the earlier record operationally expired.

Media transitions are:

```text
UPLOADING -> UPLOADED -> PROCESSING -> READY
                                  |-> REJECTED -> DELETION_PENDING -> DELETED
                                  |-> QUARANTINED -> DELETION_PENDING -> DELETED
UPLOADING (expired) ----------------> DELETION_PENDING -> DELETED
READY (withdrawal/deletion) --------> DELETION_PENDING -> DELETED
```

Evidence transitions owned by B1 are:

```text
DRAFT -> SUBMITTED
  |          |
  +----------+-> WITHDRAWN -> DELETED
```

`ASSIGNED` and `REVIEWED` are preserved in the schema for the immutable-attempt B2 flow. B1 submission creates one `UNASSIGNED` assessment and an `AssessmentRequested` outbox event in the same transaction. It does not select a coach. A later RETRY will create new media and evidence; it will never overwrite a reviewed attempt.

## Storage and validation

`packages/media` is provider-neutral. The local adapter uses a private MinIO bucket with path-style S3 requests. `minio-init` creates `nextstep-private-evidence-local` and applies `anonymous none`; CORS is restricted to the documented local web and E2E origins.

Object keys have the form `evidence/{uuid}/{uuid}`. They contain no athlete ID, household ID, or original filename. Storage credentials remain server/worker configuration and are never returned to the browser. Signed URLs are generated only in command responses, are not persisted in PostgreSQL, and must not be written to logs, audit metadata, outbox payloads, problem responses, screenshots, or committed artifacts.

Configured local defaults:

| Setting                                      |         Default |
| -------------------------------------------- | --------------: |
| Signed PUT expiry                            |      15 minutes |
| Signed playback expiry                       |       5 minutes |
| Maximum upload size                          |         150 MiB |
| Maximum video duration                       |      90 seconds |
| Abandoned/rejected deletion target           | within 24 hours |
| Reviewed-media retention target              |         30 days |
| Appeal/request-review window reserved for B2 |         14 days |

The B1 pilot accepts MP4 with H.264 (`avc1` or `avc3`) and does not require audio. Validation checks object existence, declared and actual size, SHA-256, MP4 signature/container, codec marker, movie-header duration, and the deterministic local scanner. Invalid or incompatible media receives a stable rejection code; scanner matches enter `QUARANTINED`. No transcoding or production malware provider is included.

## Object authorisation

| Actor                             | Upload/private preview            | Submit                            | Withdraw/delete   | Playback grant                                                             |
| --------------------------------- | --------------------------------- | --------------------------------- | ----------------- | -------------------------------------------------------------------------- |
| Active household owner            | Allowed for own household athlete | Allowed with both active consents | Allowed           | Allowed while capture consent is active                                    |
| Active household caregiver        | Allowed for own household athlete | Allowed with both active consents | Denied by default | Allowed while capture consent is active                                    |
| Unrelated household actor         | Not found/denied                  | Not found/denied                  | Not found/denied  | Not found/denied                                                           |
| Assigned active MFA coach         | No                                | No                                | No                | Primitive only: assigned assessment plus active review and capture consent |
| Unassigned/inactive/non-MFA coach | No                                | No                                | No                | Not found/denied                                                           |
| Child                             | No independent login              | No                                | No                | No                                                                         |

Every relationship is resolved from PostgreSQL. Caller-supplied household or athlete IDs are never treated as authority.

## Idempotency, concurrency, retention, and deletion

Command idempotency binds actor, operation, key, and request hash. Reusing a key with a different request returns a conflict. Upload-intent replay returns the same draft and media IDs, refuses an expired intent, and creates a newly signed URL bounded by the original expiry; the URL itself is not stored. Playback replay is similarly bounded by the first grant expiry.

Media, evidence, and assessment rows carry optimistic versions. Completion, submission, withdrawal, and deletion use guarded or transactional state changes. The worker consumes transactional outbox events at least once and records `ProcessedEvent` keys, so validation and physical deletion are restart durable and idempotent. Retention holds are represented but are not created by B1; the appeal/request-review operation belongs to B2.

## Synthetic fixture and limitations

`scripts/generate-synthetic-evidence.mjs` uses the pinned `jrottenberg/ffmpeg:7.1-alpine` container to generate a four-second, 640×360, 24 fps abstract test pattern encoded as H.264/yuv420p without audio or identifying metadata. The committed manifest records its SHA-256 and generation properties.

This is a synthetic/local pilot. It does not claim support for MOV, HEVC, every phone video, or arbitrary browser-recorded output. In-browser recording is not implemented. Real-user media deployment remains blocked on production codec/transcoding compatibility, malware scanning, legal consent copy, and retention approval. MinIO root credentials are local-only; production IAM and AWS infrastructure are outside this checkpoint.
