import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const relativeOutput =
  "apps/web/e2e/fixtures/evidence/bilateral-control-synthetic.mp4";
mkdirSync(resolve(root, "apps/web/e2e/fixtures/evidence"), { recursive: true });

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "--volume",
    `${root.replaceAll("\\", "/")}:/work`,
    "jrottenberg/ffmpeg:7.1-alpine",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=640x360:rate=24:duration=4",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-map_metadata",
    "-1",
    "-an",
    "-y",
    `/work/${relativeOutput}`,
  ],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

if (result.status !== 0) {
  throw new Error(
    `Synthetic evidence generation failed with status ${result.status}.`,
  );
}
