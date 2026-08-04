import { describe, expect, it } from "vitest";

import { mediaConfiguration } from "./config.js";

describe("private media configuration", () => {
  it("uses the approved synthetic/local defaults", () => {
    expect(mediaConfiguration({ NODE_ENV: "test" })).toMatchObject({
      uploadGrantSeconds: 900,
      playbackGrantSeconds: 300,
      maximumBytes: 157_286_400,
      maximumDurationMs: 90_000,
      abandonedRetentionHours: 24,
      reviewedRetentionDays: 30,
      appealWindowDays: 14,
    });
  });

  it("requires explicit private-storage configuration in production", () => {
    expect(() => mediaConfiguration({ NODE_ENV: "production" })).toThrow(
      "OBJECT_STORAGE_ACCESS_KEY is required",
    );
  });
});
