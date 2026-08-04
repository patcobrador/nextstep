import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DeterministicLocalScanner, validateMedia } from "./validation.js";

const syntheticMp4 = (durationMs = 2_000, codec = "avc1") => {
  const bytes = Buffer.alloc(80);
  bytes.writeUInt32BE(24, 0);
  bytes.write("ftyp", 4, "ascii");
  bytes.write("isom", 8, "ascii");
  bytes.write(codec, 16, "ascii");
  bytes.writeUInt32BE(32, 24);
  bytes.write("mvhd", 28, "ascii");
  bytes.writeUInt32BE(1_000, 44);
  bytes.writeUInt32BE(durationMs, 48);
  return bytes;
};

const check = (
  bytes: Uint8Array,
  overrides: Partial<{ declaredBytes: number; sha: string }> = {},
) =>
  validateMedia({
    bytes,
    config: { maximumBytes: 1024, maximumDurationMs: 90_000 },
    declaredBytes: overrides.declaredBytes ?? bytes.byteLength,
    expectedSha256:
      overrides.sha ?? createHash("sha256").update(bytes).digest("hex"),
    scanner: new DeterministicLocalScanner(),
  });

describe("B1 media validation", () => {
  it("accepts an MP4/H.264 synthetic object", async () => {
    await expect(check(syntheticMp4())).resolves.toMatchObject({
      status: "READY",
      durationMs: 2_000,
    });
  });

  it("accepts the committed non-identifying H.264 browser fixture", async () => {
    const bytes = await readFile(
      resolve(
        process.cwd(),
        "../../apps/web/e2e/fixtures/evidence/bilateral-control-synthetic.mp4",
      ),
    );
    await expect(
      validateMedia({
        bytes,
        config: {
          maximumBytes: 157_286_400,
          maximumDurationMs: 90_000,
        },
        declaredBytes: bytes.byteLength,
        expectedSha256: createHash("sha256").update(bytes).digest("hex"),
        scanner: new DeterministicLocalScanner(),
      }),
    ).resolves.toMatchObject({ status: "READY", durationMs: 4_000 });
  });

  it.each([
    ["invalid signature", Buffer.from("not a video"), "INVALID_SIGNATURE"],
    [
      "unsupported container",
      syntheticMp4().fill("qt  ", 8, 12),
      "UNSUPPORTED_CONTAINER",
    ],
    ["unsupported codec", syntheticMp4(2_000, "hvc1"), "UNSUPPORTED_CODEC"],
    ["excessive duration", syntheticMp4(91_000), "DURATION_EXCEEDED"],
  ])("rejects %s", async (_name, bytes, code) => {
    await expect(check(bytes)).resolves.toMatchObject({
      status: "REJECTED",
      code,
    });
  });

  it("rejects size and checksum mismatches", async () => {
    const bytes = syntheticMp4();
    await expect(check(bytes, { declaredBytes: 79 })).resolves.toMatchObject({
      code: "SIZE_MISMATCH",
    });
    await expect(check(bytes, { sha: "0".repeat(64) })).resolves.toMatchObject({
      code: "CHECKSUM_MISMATCH",
    });
  });

  it("rejects media over the configured byte limit", async () => {
    const bytes = Buffer.alloc(1_025);
    await expect(check(bytes)).resolves.toMatchObject({
      code: "SIZE_EXCEEDED",
    });
  });

  it("quarantines the deterministic scanner signature", async () => {
    const bytes = Buffer.concat([
      syntheticMp4(),
      Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"),
    ]);
    await expect(check(bytes)).resolves.toMatchObject({
      status: "QUARANTINED",
      code: "MALWARE_DETECTED",
    });
  });
});
