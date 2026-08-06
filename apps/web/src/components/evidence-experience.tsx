"use client";

import type { components } from "@nextstep/contracts";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  completeEvidenceUpload,
  createEvidenceIntent,
  grantEvidencePlayback,
  loadEvidence,
  recordEvidenceConsent,
  requestEvidenceDeletion,
  submitEvidenceForAssessment,
  withdrawEvidenceConsent,
} from "../app/actions/evidence";

type Evidence = components["schemas"]["EvidenceSubmission"];
type Instructions = components["schemas"]["EvidenceInstructions"];

const MAXIMUM_BYTES = 157_286_400;

const sha256 = async (file: File): Promise<string> =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
    ),
  ]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

export function EvidenceExperience({
  athleteId,
  householdId,
  instructions,
  isOwner,
  nodeId,
  initialEvidence = null,
}: {
  athleteId: string;
  householdId: string;
  instructions: Instructions;
  isOwner: boolean;
  nodeId: string;
  initialEvidence?: Evidence | null;
}) {
  const [captureConsentId, setCaptureConsentId] = useState<string | null>(
    initialEvidence?.consentRecordId ?? null,
  );
  const [evidence, setEvidence] = useState<Evidence | null>(initialEvidence);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [playback, setPlayback] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<
    components["schemas"]["UploadIntent"] | null
  >(null);
  const upload = useRef<XMLHttpRequest | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
      upload.current?.abort();
    },
    [localPreview],
  );

  const run = (work: () => Promise<void>) => {
    setError(null);
    startTransition(() => {
      void work().catch((caught: unknown) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "The request could not be completed.",
        );
      });
    });
  };

  const consentToCapture = () =>
    run(async () => {
      const consent = await recordEvidenceConsent(
        householdId,
        athleteId,
        "PRIVATE_EVIDENCE_CAPTURE_UPLOAD",
      );
      setCaptureConsentId(consent.id);
      setMessage("Private capture and upload consent recorded.");
    });

  const chooseFile = (selected: File | null) => {
    setError(null);
    if (!selected) return;
    if (selected.type !== "video/mp4") {
      setError(
        "Choose an MP4 file containing H.264 video. MOV and HEVC are not supported in this pilot.",
      );
      return;
    }
    if (selected.size > MAXIMUM_BYTES) {
      setError(
        "The selected video is larger than the 150 MiB technical limit.",
      );
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setFile(selected);
    setLocalPreview(URL.createObjectURL(selected));
    setProgress(0);
    setMessage("Preview the private file before uploading it.");
  };

  const put = async (
    selected: File,
    currentIntent: components["schemas"]["UploadIntent"],
    checksum: string,
  ) =>
    new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      upload.current = request;
      request.open("PUT", currentIntent.uploadUrl);
      for (const [name, value] of Object.entries(
        currentIntent.requiredHeaders,
      )) {
        request.setRequestHeader(name, value);
      }
      request.upload.onprogress = (event) => {
        if (event.lengthComputable)
          setProgress(Math.round((event.loaded / event.total) * 100));
      };
      request.onerror = () =>
        reject(
          new Error(
            "The upload was interrupted. Retry while the upload grant remains active.",
          ),
        );
      request.onabort = () =>
        reject(
          new Error(
            "Upload cancelled. You can retry this private draft before the grant expires.",
          ),
        );
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) resolve();
        else
          reject(
            new Error(
              "Private storage rejected the upload. The grant may have expired.",
            ),
          );
      };
      request.send(selected);
    }).then(async () => {
      await completeEvidenceUpload(currentIntent.mediaAssetId, checksum);
      await waitForValidation(currentIntent.evidenceId);
    });

  const waitForValidation = async (evidenceId: string) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const next = await loadEvidence(evidenceId);
      setEvidence(next);
      if (
        ["READY", "REJECTED", "QUARANTINED", "DELETED"].includes(
          next.media.status,
        )
      ) {
        setMessage(
          next.media.status === "READY"
            ? "Private evidence is ready to review."
            : "The video could not be accepted. See the validation result below.",
        );
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    throw new Error(
      "Validation is still processing. Reload this private evidence URL to continue.",
    );
  };

  const beginUpload = () =>
    run(async () => {
      if (!captureConsentId || !file)
        throw new Error(
          "Record capture consent and choose a supported video first.",
        );
      const checksum = await sha256(file);
      const created = await createEvidenceIntent({
        athleteId,
        nodeId,
        consentRecordId: captureConsentId,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        checksumSha256: checksum,
      });
      setIntent(created);
      window.history.replaceState(
        null,
        "",
        `/athletes/${athleteId}/evidence/${created.evidenceId}`,
      );
      setMessage("Uploading directly to private storage…");
      await put(file, created, checksum);
    });

  const retryUpload = () =>
    run(async () => {
      if (!file || !intent)
        throw new Error("Choose the file again if this page was reloaded.");
      if (new Date(intent.expiresAt) <= new Date())
        throw new Error(
          "The upload grant expired. Replace this draft to request a new one.",
        );
      await put(file, intent, await sha256(file));
    });

  const openPlayback = () =>
    run(async () => {
      if (!evidence) return;
      const grant = await grantEvidencePlayback(evidence.id);
      setPlayback(grant.url);
      setMessage(
        `Private playback access expires at ${new Date(grant.expiresAt).toLocaleTimeString()}.`,
      );
    });

  const consentAndSubmit = () =>
    run(async () => {
      if (!evidence) return;
      const reviewConsent = await recordEvidenceConsent(
        householdId,
        athleteId,
        "ASSIGNED_COACH_EVIDENCE_REVIEW",
      );
      const submitted = await submitEvidenceForAssessment(
        evidence.id,
        reviewConsent.id,
      );
      setEvidence(submitted);
      setMessage(
        "Evidence submitted for assessment. Coach access is still unavailable until an eligible coach is assigned.",
      );
    });

  const removeEvidence = () =>
    run(async () => {
      if (!evidence) return;
      setEvidence(await requestEvidenceDeletion(evidence.id));
      setPlayback(null);
      setMessage(
        "Deletion requested. The worker will remove the private object.",
      );
    });

  const replaceEvidence = () =>
    run(async () => {
      if (!evidence) return;
      await requestEvidenceDeletion(evidence.id);
      setEvidence(null);
      setIntent(null);
      setPlayback(null);
      setProgress(0);
      setMessage(
        "The earlier private draft is pending deletion. Choose the replacement video and upload a new draft.",
      );
    });

  const withdrawConsent = (consentId: string, purpose: "capture" | "review") =>
    run(async () => {
      await withdrawEvidenceConsent(consentId);
      if (evidence) setEvidence(await loadEvidence(evidence.id));
      setPlayback(null);
      setMessage(
        purpose === "capture"
          ? "Capture/upload consent withdrawn. New playback is blocked and deletion is pending."
          : "Assigned-coach review consent withdrawn. New coach playback is blocked and the submission is withdrawn.",
      );
    });

  const ready = evidence?.media.status === "READY";
  return (
    <div className="evidence-layout">
      <section
        className="evidence-card"
        aria-labelledby="recording-guide-title"
      >
        <p className="eyebrow">Private checkpoint evidence</p>
        <h1 id="recording-guide-title">Record the Both Hands Check</h1>
        <p>{instructions.movement}</p>
        <div className="evidence-guide-grid">
          <div>
            <h2>Set up the frame</h2>
            <p>{instructions.framing}</p>
            <p>
              Keep the clip under {instructions.maxDurationSeconds} seconds.
            </p>
          </div>
          <div>
            <h2>Equipment</h2>
            <ul>
              {instructions.equipment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Movement sequence</h2>
            <ol>
              {instructions.requiredSequence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <div>
            <h2>Practise safely</h2>
            <ul>
              {instructions.safety.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="privacy-notice">
          <h2>Privacy before recording</h2>
          <ul>
            {instructions.privacy.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <strong>Supported pilot format:</strong>{" "}
            {instructions.supportedFormat}. MOV, HEVC and universal phone-video
            compatibility are not currently supported.
          </p>
        </div>
      </section>

      <section className="evidence-card" aria-labelledby="private-upload-title">
        <h2 id="private-upload-title">Choose and upload a private video</h2>
        {!captureConsentId ? (
          <div className="consent-panel">
            <p>
              I am an authorised adult for this athlete. I consent to capturing
              and privately uploading this video for this checkpoint. This does
              not yet allow coach review.
            </p>
            <button
              className="button button-primary"
              onClick={consentToCapture}
              disabled={pending}
            >
              Record capture/upload consent
            </button>
          </div>
        ) : (
          <>
            <label className="file-picker">
              MP4 with H.264 video
              <input
                type="file"
                accept="video/mp4,.mp4"
                onChange={(event) =>
                  chooseFile(event.target.files?.[0] ?? null)
                }
                disabled={pending || evidence?.status === "SUBMITTED"}
              />
            </label>
            {localPreview ? (
              <video
                className="evidence-player"
                controls
                src={localPreview}
                aria-label="Private local video preview"
              />
            ) : null}
            {file && !evidence ? (
              <button
                className="button button-primary"
                onClick={beginUpload}
                disabled={pending}
              >
                Upload privately
              </button>
            ) : null}
          </>
        )}
        {progress > 0 && progress < 100 ? (
          <div>
            <label htmlFor="upload-progress">Private upload {progress}%</label>
            <progress id="upload-progress" max="100" value={progress}>
              {progress}%
            </progress>
            <button
              className="button button-secondary"
              onClick={() => upload.current?.abort()}
            >
              Cancel upload
            </button>
          </div>
        ) : null}
        {intent && error ? (
          <button
            className="button button-secondary"
            onClick={retryUpload}
            disabled={pending}
          >
            Retry this upload
          </button>
        ) : null}
        {evidence ? (
          <div className="media-status" role="status">
            <strong>
              Media status: {evidence.media.status.replaceAll("_", " ")}
            </strong>
            {evidence.media.rejectionCode ? (
              <p>
                Validation result:{" "}
                {evidence.media.rejectionCode.replaceAll("_", " ")}. Choose a
                supported replacement.
              </p>
            ) : null}
            {isOwner && evidence.status === "DRAFT" ? (
              <button
                className="button button-secondary"
                onClick={replaceEvidence}
                disabled={pending}
              >
                Replace private draft
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {ready ? (
        <section className="evidence-card">
          <h2>Review the stored private evidence</h2>
          {playback ? (
            <video
              className="evidence-player"
              controls
              src={playback}
              aria-label="Short-lived private evidence playback"
            />
          ) : (
            <button
              className="button button-secondary"
              onClick={openPlayback}
              disabled={pending}
            >
              Open private playback
            </button>
          )}
          {evidence.status === "DRAFT" ? (
            <div className="consent-panel">
              <h3>Consent to assigned-coach review</h3>
              <p>
                This separate consent permits only an assigned, authorised coach
                to review this evidence. It is required to submit, not to keep
                or preview your private draft.
              </p>
              <button
                className="button button-primary"
                onClick={consentAndSubmit}
                disabled={pending}
              >
                Consent and submit for assessment
              </button>
            </div>
          ) : evidence.status === "ASSIGNED" ? (
            <div className="status-success">
              <strong>Waiting for coach review</strong>
              <p>No new practice is required while the review is pending.</p>
            </div>
          ) : (
            <div className="status-success">
              <strong>Waiting for coach assignment</strong>
              <p>
                Submitted safely. A coach has not been assigned or begun review
                yet.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {evidence && isOwner && evidence.status !== "DELETED" ? (
        <section className="evidence-card danger-zone">
          <h2>Withdraw or delete private evidence</h2>
          <p>
            Each consent remains independently auditable. New playback grants
            stop immediately after relevant consent withdrawal; a grant already
            issued may work only until its short expiry. Physical deletion is
            durable and worker-driven.
          </p>
          <div className="button-row">
            <button
              className="button button-secondary"
              onClick={() =>
                withdrawConsent(evidence.consentRecordId, "capture")
              }
              disabled={pending || evidence.status === "WITHDRAWN"}
            >
              Withdraw capture/upload consent
            </button>
            {evidence.reviewConsentRecordId ? (
              <button
                className="button button-secondary"
                onClick={() =>
                  withdrawConsent(evidence.reviewConsentRecordId!, "review")
                }
                disabled={pending || evidence.status === "WITHDRAWN"}
              >
                Withdraw coach-review consent
              </button>
            ) : null}
            <button
              className="button button-secondary"
              onClick={removeEvidence}
              disabled={pending}
            >
              Request private evidence deletion
            </button>
          </div>
        </section>
      ) : null}
      {!isOwner && evidence ? (
        <p className="supporting-copy">
          A household owner can request withdrawal or deletion. Caregivers can
          upload and submit.
        </p>
      ) : null}
      {message ? (
        <p className="form-message" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
