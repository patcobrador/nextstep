export interface MediaConfiguration {
  accessKey: string;
  bucket: string;
  internalEndpoint: string;
  publicEndpoint: string;
  region: string;
  secretKey: string;
  uploadGrantSeconds: number;
  playbackGrantSeconds: number;
  maximumBytes: number;
  maximumDurationMs: number;
  abandonedRetentionHours: number;
  reviewedRetentionDays: number;
  appealWindowDays: number;
}

const integer = (
  environment: NodeJS.ProcessEnv,
  key: string,
  fallback: number,
): number => {
  const raw = environment[key];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }
  return value;
};

const required = (
  environment: NodeJS.ProcessEnv,
  key: string,
  localDefault: string,
): string => {
  const value = environment[key];
  if (value) return value;
  if (environment["NODE_ENV"] === "production") {
    throw new Error(`${key} is required.`);
  }
  return localDefault;
};

export const mediaConfiguration = (
  environment: NodeJS.ProcessEnv = process.env,
): MediaConfiguration => ({
  accessKey: required(
    environment,
    "OBJECT_STORAGE_ACCESS_KEY",
    "nextstep-local",
  ),
  bucket: required(
    environment,
    "OBJECT_STORAGE_BUCKET",
    "nextstep-private-evidence-local",
  ),
  internalEndpoint: required(
    environment,
    "OBJECT_STORAGE_ENDPOINT",
    "http://127.0.0.1:9000",
  ),
  publicEndpoint:
    environment["OBJECT_STORAGE_PUBLIC_ENDPOINT"] ??
    required(environment, "OBJECT_STORAGE_ENDPOINT", "http://127.0.0.1:9000"),
  region: required(environment, "OBJECT_STORAGE_REGION", "ap-southeast-2"),
  secretKey: required(
    environment,
    "OBJECT_STORAGE_SECRET_KEY",
    "change-me-local-only",
  ),
  uploadGrantSeconds: integer(environment, "MEDIA_UPLOAD_GRANT_SECONDS", 900),
  playbackGrantSeconds: integer(
    environment,
    "MEDIA_PLAYBACK_GRANT_SECONDS",
    300,
  ),
  maximumBytes: integer(environment, "MEDIA_MAXIMUM_BYTES", 157_286_400),
  maximumDurationMs: integer(environment, "MEDIA_MAXIMUM_DURATION_MS", 90_000),
  abandonedRetentionHours: integer(
    environment,
    "MEDIA_ABANDONED_RETENTION_HOURS",
    24,
  ),
  reviewedRetentionDays: integer(
    environment,
    "MEDIA_REVIEWED_RETENTION_DAYS",
    30,
  ),
  appealWindowDays: integer(environment, "MEDIA_APPEAL_WINDOW_DAYS", 14),
});
