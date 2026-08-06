import { createHash } from "node:crypto";

import type { MediaConfiguration } from "./config.js";

export type MediaRejectionCode =
  | "CHECKSUM_MISMATCH"
  | "DURATION_EXCEEDED"
  | "INVALID_SIGNATURE"
  | "MALWARE_DETECTED"
  | "SIZE_EXCEEDED"
  | "SIZE_MISMATCH"
  | "UNSUPPORTED_CODEC"
  | "UNSUPPORTED_CONTAINER";

export interface Scanner {
  scan(bytes: Uint8Array): Promise<"CLEAN" | "QUARANTINE">;
}

export class DeterministicLocalScanner implements Scanner {
  async scan(bytes: Uint8Array): Promise<"CLEAN" | "QUARANTINE"> {
    return Buffer.from(bytes).includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")
      ? "QUARANTINE"
      : "CLEAN";
  }
}

export type MediaValidationResult =
  | {
      durationMs: number;
      mimeType: "video/mp4";
      sha256: string;
      status: "READY";
    }
  | { code: MediaRejectionCode; status: "REJECTED" | "QUARANTINED" };

const ascii = (bytes: Uint8Array, start: number, length: number): string =>
  Buffer.from(bytes.subarray(start, start + length)).toString("ascii");

const uint32 = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
  );

const findAscii = (bytes: Uint8Array, value: string): number =>
  Buffer.from(bytes).indexOf(value, 0, "ascii");

const mp4Duration = (bytes: Uint8Array): number | null => {
  const marker = findAscii(bytes, "mvhd");
  if (marker < 4 || marker + 32 > bytes.length) return null;
  const version = bytes[marker + 4];
  if (version === 0) {
    const timescale = uint32(bytes, marker + 16);
    const duration = uint32(bytes, marker + 20);
    return timescale > 0 ? Math.round((duration * 1000) / timescale) : null;
  }
  if (version === 1 && marker + 40 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const timescale = view.getUint32(marker + 24);
    const duration = view.getBigUint64(marker + 28);
    return timescale > 0
      ? Number((duration * 1000n) / BigInt(timescale))
      : null;
  }
  return null;
};

export const collectBytes = async (
  stream: AsyncIterable<Uint8Array>,
  maximumBytes: number,
): Promise<Uint8Array | null> => {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.byteLength;
    if (size > maximumBytes) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export const validateMedia = async (input: {
  bytes: Uint8Array;
  config: Pick<MediaConfiguration, "maximumBytes" | "maximumDurationMs">;
  declaredBytes: number;
  expectedSha256: string;
  scanner: Scanner;
}): Promise<MediaValidationResult> => {
  if (input.bytes.byteLength > input.config.maximumBytes) {
    return { code: "SIZE_EXCEEDED", status: "REJECTED" };
  }
  if (input.bytes.byteLength !== input.declaredBytes) {
    return { code: "SIZE_MISMATCH", status: "REJECTED" };
  }
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  if (sha256 !== input.expectedSha256.toLowerCase()) {
    return { code: "CHECKSUM_MISMATCH", status: "REJECTED" };
  }
  if (input.bytes.byteLength < 16 || ascii(input.bytes, 4, 4) !== "ftyp") {
    return { code: "INVALID_SIGNATURE", status: "REJECTED" };
  }
  const majorBrand = ascii(input.bytes, 8, 4);
  if (majorBrand === "qt  ") {
    return { code: "UNSUPPORTED_CONTAINER", status: "REJECTED" };
  }
  if (
    findAscii(input.bytes, "avc1") < 0 &&
    findAscii(input.bytes, "avc3") < 0
  ) {
    return { code: "UNSUPPORTED_CODEC", status: "REJECTED" };
  }
  const durationMs = mp4Duration(input.bytes);
  if (durationMs === null) {
    return { code: "INVALID_SIGNATURE", status: "REJECTED" };
  }
  if (durationMs > input.config.maximumDurationMs) {
    return { code: "DURATION_EXCEEDED", status: "REJECTED" };
  }
  if ((await input.scanner.scan(input.bytes)) === "QUARANTINE") {
    return { code: "MALWARE_DETECTED", status: "QUARANTINED" };
  }
  return { durationMs, mimeType: "video/mp4", sha256, status: "READY" };
};
