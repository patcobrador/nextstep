import { describe, expect, it } from "vitest";

import {
  CAPTURE_CONSENT_PURPOSE,
  canTransitionEvidence,
  canTransitionMedia,
  isActiveConsent,
} from "./evidence.js";

describe("private evidence rules", () => {
  it("allows only explicit media transitions", () => {
    expect(canTransitionMedia("UPLOADING", "UPLOADED")).toBe(true);
    expect(canTransitionMedia("UPLOADING", "READY")).toBe(false);
    expect(canTransitionMedia("DELETED", "READY")).toBe(false);
  });

  it("keeps a reviewed evidence attempt immutable", () => {
    expect(canTransitionEvidence("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransitionEvidence("REVIEWED", "DRAFT")).toBe(false);
  });

  it("requires the current independently active consent", () => {
    const consent = {
      athleteId: "athlete-1",
      granted: true,
      policyVersion: "b1-2026-08-04",
      purposeKey: CAPTURE_CONSENT_PURPOSE,
      withdrawnAt: null,
    };
    expect(
      isActiveConsent(consent, {
        athleteId: "athlete-1",
        policyVersion: "b1-2026-08-04",
        purposeKey: CAPTURE_CONSENT_PURPOSE,
      }),
    ).toBe(true);
    expect(
      isActiveConsent(
        { ...consent, withdrawnAt: new Date() },
        {
          athleteId: "athlete-1",
          policyVersion: "b1-2026-08-04",
          purposeKey: CAPTURE_CONSENT_PURPOSE,
        },
      ),
    ).toBe(false);
    expect(
      isActiveConsent(consent, {
        athleteId: "athlete-1",
        policyVersion: "a-new-policy-version",
        purposeKey: CAPTURE_CONSENT_PURPOSE,
      }),
    ).toBe(false);
  });
});
