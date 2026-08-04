import AxeBuilder from "@axe-core/playwright";
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiDirectory = resolve(root, "apps/api");
const workerDirectory = resolve(root, "apps/worker");
const webDirectory = resolve(root, "apps/web");
const reviewDirectory = resolve(root, "docs/review/checkpoint-b1");
const processLogDirectory = resolve(
  webDirectory,
  ".playwright-artifacts/process",
);
const fixture = resolve(
  webDirectory,
  "e2e/fixtures/evidence/bilateral-control-synthetic.mp4",
);
const databaseUrl =
  process.env["DATABASE_URL"] ??
  "postgresql://nextstep:nextstep@localhost:5433/nextstep";
const apiUrl = "http://127.0.0.1:3141";
const webUrl = "http://127.0.0.1:3140";
const storageEnvironment = {
  OBJECT_STORAGE_ENDPOINT: "http://127.0.0.1:9000",
  OBJECT_STORAGE_PUBLIC_ENDPOINT: "http://127.0.0.1:9000",
  OBJECT_STORAGE_REGION: "ap-southeast-2",
  OBJECT_STORAGE_BUCKET: "nextstep-private-evidence-local",
  OBJECT_STORAGE_ACCESS_KEY: "nextstep-local",
  OBJECT_STORAGE_SECRET_KEY: "change-me-local-only",
  MEDIA_UPLOAD_GRANT_SECONDS: "900",
  MEDIA_PLAYBACK_GRANT_SECONDS: "300",
  MEDIA_MAXIMUM_BYTES: "157286400",
  MEDIA_MAXIMUM_DURATION_MS: "90000",
  MEDIA_ABANDONED_RETENTION_HOURS: "24",
  MEDIA_REVIEWED_RETENTION_DAYS: "30",
  MEDIA_APPEAL_WINDOW_DAYS: "14",
};
let apiProcess: ChildProcess | undefined;
let workerProcess: ChildProcess | undefined;
let webProcess: ChildProcess | undefined;
const processLogHandles: number[] = [];

const startLoggedProcess = (
  label: string,
  cwd: string,
  args: string[],
  env: NodeJS.ProcessEnv,
) => {
  const log = openSync(resolve(processLogDirectory, `${label}.log`), "w");
  processLogHandles.push(log);
  return spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ["ignore", log, log],
  });
};

const waitForStatus = async (
  url: string,
  processToWatch: ChildProcess,
  label: string,
) => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (processToWatch.exitCode !== null) {
      throw new Error(`${label} exited with code ${processToWatch.exitCode}.`);
    }
    try {
      if ((await fetch(url)).status === 200) return;
    } catch {}
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Timed out waiting for ${label}.`);
};

const stop = async (child: ChildProcess | undefined, label: string) => {
  if (!child || child.exitCode !== null) return;
  await new Promise<void>((resolveStop, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${label} did not stop within five seconds.`)),
      5_000,
    );
    child.once("exit", () => {
      clearTimeout(timeout);
      resolveStop();
    });
    child.kill();
  });
};

const capture = async (page: Page, name: string) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: resolve(reviewDirectory, `desktop-${name}.png`),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: resolve(reviewDirectory, `mobile-${name}.png`),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
};

test.beforeAll(async () => {
  await mkdir(reviewDirectory, { recursive: true });
  await mkdir(processLogDirectory, { recursive: true });
  const seeded = spawnSync(
    process.execPath,
    ["--import", "tsx", "src/checkpoint-b1.seed.ts"],
    {
      cwd: apiDirectory,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        NEXTSTEP_DEMO_MODE: "enabled",
      },
      encoding: "utf8",
    },
  );
  if (seeded.status !== 0) throw new Error(seeded.stderr || seeded.stdout);
  apiProcess = startLoggedProcess(
    "b1-api",
    apiDirectory,
    ["--import", "tsx", "src/main.ts"],
    {
      ...process.env,
      ...storageEnvironment,
      DATABASE_URL: databaseUrl,
      HOST: "127.0.0.1",
      IDENTITY_ADAPTER: "local-test",
      NEXTSTEP_DEMO_MODE: "enabled",
      PORT: "3141",
    },
  );
  await waitForStatus(`${apiUrl}/v1/health/ready`, apiProcess, "API");
  workerProcess = startLoggedProcess(
    "b1-worker",
    workerDirectory,
    ["--import", "tsx", "src/main.ts"],
    {
      ...process.env,
      ...storageEnvironment,
      DATABASE_URL: databaseUrl,
    },
  );
  webProcess = startLoggedProcess(
    "b1-web",
    webDirectory,
    [
      resolve(webDirectory, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      "3140",
    ],
    {
      ...process.env,
      NEXTSTEP_API_BASE_URL: `${apiUrl}/v1`,
      NEXTSTEP_LOCAL_AUTH: "enabled",
    },
  );
  await waitForStatus(`${webUrl}/local-auth`, webProcess, "Web");
});

test.afterAll(async () => {
  const results = await Promise.allSettled([
    stop(webProcess, "Web"),
    stop(workerProcess, "Worker"),
    stop(apiProcess, "API"),
  ]);
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  for (const handle of processLogHandles) closeSync(handle);
  if (failures.length) {
    throw new AggregateError(
      failures.map(({ reason }) => reason),
      "B1 process cleanup failed.",
    );
  }
});

test("@visual completes the private parent evidence flow", async ({ page }) => {
  const consoleErrors: string[] = [];
  const observeConsole = (message: ConsoleMessage) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const observePageError = (error: Error) => consoleErrors.push(error.message);
  page.on("console", observeConsole);
  page.on("pageerror", observePageError);

  await page.goto(`${webUrl}/local-auth`);
  await page.getByRole("button", { name: "Continue to NextStep" }).click();
  await expect(
    page.getByRole("link", { name: "Add private evidence" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add private evidence" }).click();
  await expect(
    page.getByRole("heading", { name: "Record the Both Hands Check" }),
  ).toBeVisible();
  await expect(page.getByText(/MOV, HEVC/i)).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious",
    ),
  ).toEqual([]);
  await capture(page, "evidence-instructions");

  await page
    .getByRole("button", { name: "Record capture/upload consent" })
    .click();
  await expect(
    page.getByText("Private capture and upload consent recorded."),
  ).toBeVisible();
  await page.getByLabel("MP4 with H.264 video").setInputFiles(fixture);
  await expect(page.getByLabel("Private local video preview")).toBeVisible();

  expect(consoleErrors).toEqual([]);
  page.off("console", observeConsole);
  page.off("pageerror", observePageError);
  await page.route(
    "http://127.0.0.1:9000/**",
    async (route) => {
      await route.abort("connectionrefused");
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Upload privately" }).click();
  await expect(page.getByText("The upload was interrupted.")).toBeVisible();
  await page.unroute("http://127.0.0.1:9000/**");
  page.on("console", observeConsole);
  page.on("pageerror", observePageError);
  await page.getByRole("button", { name: "Retry this upload" }).click();
  await expect(page.getByText("Media status: READY")).toBeVisible({
    timeout: 60_000,
  });
  await expect(
    page.getByRole("button", { name: "Open private playback" }),
  ).toBeVisible();
  await capture(page, "evidence-ready");

  await page.getByRole("button", { name: "Open private playback" }).click();
  const playback = page.getByLabel("Short-lived private evidence playback");
  await expect(playback).toBeVisible();
  const playbackUrl = await playback.getAttribute("src");
  expect(playbackUrl).toContain("127.0.0.1:9000");
  expect(playbackUrl).toContain("X-Amz-Expires=300");
  const anonymous = await page.request.get(playbackUrl!.split("?")[0]!);
  expect(anonymous.status()).toBe(403);

  await page
    .getByRole("button", { name: "Consent and submit for assessment" })
    .click();
  await expect(
    page.getByText("Submitted for assessment.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/athletes\/.+\/evidence\/.+/);

  const evidenceId = page.url().split("/").at(-1)!;
  const denied = await page.request.get(
    `${apiUrl}/v1/evidence-submissions/${evidenceId}`,
    {
      headers: {
        "x-actor-id": "checkpoint-a-other-parent",
        "x-household-id": "07094fa0-beac-44e5-a247-bcf4052a373c",
      },
    },
  );
  expect(denied.status()).toBe(404);

  await page
    .getByRole("button", { name: "Request private evidence deletion" })
    .click();
  await expect(
    page.getByText(
      "Deletion requested. The worker will remove the private object.",
    ),
  ).toBeVisible();
  const ownerHeaders = {
    "x-actor-id": "checkpoint-a-parent",
    "x-household-id": "c9663e3a-ab64-4d8b-9cb8-68fbe5f6cda3",
  };
  await expect
    .poll(async () => {
      const response = await page.request.get(
        `${apiUrl}/v1/evidence-submissions/${evidenceId}`,
        { headers: ownerHeaders },
      );
      return (await response.json()).media.status;
    })
    .toBe("DELETED");
  await page.request
    .post(`${apiUrl}/v1/evidence-submissions/${evidenceId}/playback-grants`, {
      headers: {
        ...ownerHeaders,
        "idempotency-key": "after-deletion-playback",
      },
    })
    .then((response) => expect(response.status()).toBe(404));
  expect(consoleErrors).toEqual([]);
});
