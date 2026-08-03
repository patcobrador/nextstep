import AxeBuilder from "@axe-core/playwright";
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const apiDirectory = resolve(root, "apps/api");
const webDirectory = resolve(root, "apps/web");
const reviewDirectory = resolve(root, "docs/review/checkpoint-a");
const databaseUrl =
  process.env["DATABASE_URL"] ??
  "postgresql://nextstep:nextstep@localhost:5433/nextstep";
const apiUrl = "http://127.0.0.1:3131";
const webUrl = "http://127.0.0.1:3130";
let apiProcess: ChildProcess | undefined;
let webProcess: ChildProcess | undefined;

const startApi = async () => {
  if (apiProcess?.exitCode === null) {
    throw new Error("Cannot start API while the previous process is running.");
  }
  apiProcess = spawn(process.execPath, ["--import", "tsx", "src/main.ts"], {
    cwd: apiDirectory,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      IDENTITY_ADAPTER: "local-test",
      NEXTSTEP_DEMO_MODE: "enabled",
      HOST: "127.0.0.1",
      PORT: "3131",
    },
    stdio: "ignore",
  });
  await waitForStatus(`${apiUrl}/v1/health/ready`, 200, apiProcess, "API");
};

const startWeb = async (localAuth: boolean) => {
  if (webProcess?.exitCode === null) {
    throw new Error("Cannot start web while the previous process is running.");
  }
  webProcess = spawn(
    process.execPath,
    [
      resolve(webDirectory, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      "3130",
    ],
    {
      cwd: webDirectory,
      env: {
        ...process.env,
        NEXTSTEP_API_BASE_URL: `${apiUrl}/v1`,
        NEXTSTEP_LOCAL_AUTH: localAuth ? "enabled" : "disabled",
      },
      stdio: "ignore",
    },
  );
  await waitForStatus(
    `${webUrl}/local-auth`,
    localAuth ? 200 : 404,
    webProcess,
    "Web",
  );
};

const stop = async (processToStop: ChildProcess | undefined, label: string) => {
  if (!processToStop || processToStop.exitCode !== null) return;
  await new Promise<void>((done, reject) => {
    const onExit = () => {
      clearTimeout(timeout);
      done();
    };
    const timeout = setTimeout(() => {
      processToStop.off("exit", onExit);
      reject(new Error(`${label} process did not exit within 5 seconds.`));
    }, 5_000);
    processToStop.once("exit", onExit);
    processToStop.kill();
  });
};

const waitForStatus = async (
  url: string,
  expected: number,
  processToWatch: ChildProcess,
  label: string,
) => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (processToWatch.exitCode !== null) {
      throw new Error(
        `${label} process exited with code ${processToWatch.exitCode} before ${url} returned ${expected}.`,
      );
    }
    try {
      if ((await fetch(url)).status === expected) return;
    } catch {}
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`Timed out waiting for ${url} to return ${expected}.`);
};

const capture = async (page: Page, name: string) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
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

const expectAccessible = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "critical" || impact === "serious",
    ),
  ).toEqual([]);
};

test.beforeAll(async () => {
  await mkdir(reviewDirectory, { recursive: true });
  const seeded = spawnSync(
    process.execPath,
    ["--import", "tsx", "src/checkpoint-a.seed.ts"],
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
  await startApi();
  await startWeb(true);
});

test.afterAll(async () => {
  const results = await Promise.allSettled([
    stop(webProcess, "Web"),
    stop(apiProcess, "API"),
  ]);
  webProcess = undefined;
  apiProcess = undefined;
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (failures.length > 0) {
    throw new AggregateError(failures, "Failed to stop E2E child processes.");
  }
});

test("@visual completes the real Checkpoint A journey", async ({
  page,
  request,
}) => {
  const consoleErrors: string[] = [];
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => consoleErrors.push(error.message);
  const observeConsole = () => {
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
  };
  const stopObservingConsole = () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  };
  observeConsole();

  await page.goto("/local-auth");
  await expect(
    page.getByRole("heading", { name: "Choose a parent persona" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue to NextStep" }).click();
  await expect(
    page.getByRole("heading", { name: "Mason Johnson’s next step" }),
  ).toBeVisible();
  await capture(page, "dashboard");
  await expectAccessible(page);
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMenu = page.getByRole("button", { name: "Menu" });
  await expect(mobileMenu).toHaveAttribute("aria-expanded", "false");
  await mobileMenu.focus();
  await page.keyboard.press("Enter");
  await expect(mobileMenu).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Mobile primary" }),
  ).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press("Escape");
  await expect(mobileMenu).toHaveAttribute("aria-expanded", "false");
  await expect(mobileMenu).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.getByRole("link", { name: "Skill Tree" }).click();
  await expect(page.getByRole("heading", { name: "Skill Tree" })).toBeVisible();
  await expect(page.locator(".domain-orb")).toHaveCount(8);
  await capture(page, "skill-tree");
  await expectAccessible(page);

  const activeNode = page.locator(".domain-orb.state-active");
  await expect(activeNode).toHaveCount(1);
  await activeNode.focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .locator(".skill-detail-panel")
      .getByText("Current focus", { exact: true }),
  ).toBeVisible();
  await capture(page, "skill-detail");
  await expectAccessible(page);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/skill-tree$/);

  const lockedItem = page
    .locator(".skill-domain-list li")
    .filter({ hasText: "Locked" })
    .first();
  await lockedItem.getByRole("link").click();
  await expect(
    page.getByRole("heading", { name: "What comes first" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Practice", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Both-hand ball control" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Begin guided practice/ }).click();
  await expect(page.getByText("1 / 4", { exact: true })).toBeVisible();
  await capture(page, "guided-practice");
  await expectAccessible(page);

  await page.getByRole("button", { name: "Save & next" }).click();
  await page.getByRole("button", { name: "Save & next" }).click();
  await page.reload();
  await expect(page.getByText("3 / 4", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save & next" }).click();
  await page.getByRole("button", { name: "Save & next" }).click();
  await expect(
    page.getByRole("heading", { name: "Finish and save" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Complete practice" }).click();
  await page.waitForURL(/\/complete\?session=/);
  const sessionId = new URL(page.url()).searchParams.get("session");
  expect(sessionId).toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Both-hand ball control complete" }),
  ).toBeVisible();
  await expect(page.getByText("Practice saved", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "View passport" }).click();
  await expect(
    page.getByRole("heading", { name: "Mason Johnson’s journey" }),
  ).toBeVisible();
  await expect(
    page.getByText("Both-hand ball control completed", { exact: true }),
  ).toBeVisible();
  await capture(page, "passport");
  await expectAccessible(page);

  const parentHeaders = {
    "x-actor-id": "checkpoint-a-parent",
    "x-household-id": "c9663e3a-ab64-4d8b-9cb8-68fbe5f6cda3",
  };
  const persistedSession = await page.request.get(
    `${apiUrl}/v1/practice-sessions/${sessionId}`,
    { headers: parentHeaders },
  );
  expect(persistedSession.status()).toBe(200);
  const completedAt = (await persistedSession.json()).completedAt as string;
  const completionEventsBeforeReplay = await page.request.get(
    `${apiUrl}/v1/athletes/25fd56b2-b2f1-4645-8ee6-adbac147069e/passport`,
    { headers: parentHeaders },
  );
  expect(completionEventsBeforeReplay.status()).toBe(200);
  const completionCountBeforeReplay = (
    (await completionEventsBeforeReplay.json()).timeline as Array<{
      eventType: string;
      title: string;
    }>
  ).filter(
    ({ eventType, title }) =>
      eventType === "PRACTICE_COMPLETED" &&
      title === "Both-hand ball control completed",
  ).length;
  const replayedCompletion = await page.request.post(
    `${apiUrl}/v1/practice-sessions/${sessionId}/complete`,
    {
      headers: {
        ...parentHeaders,
        "idempotency-key": `web-complete-${sessionId}`,
      },
      data: {
        enjoymentRating: 4,
        difficultyRating: 3,
        safetyFlag: false,
        completedAt,
      },
    },
  );
  expect(replayedCompletion.status()).toBe(200);
  const completionEventsAfterReplay = await page.request.get(
    `${apiUrl}/v1/athletes/25fd56b2-b2f1-4645-8ee6-adbac147069e/passport`,
    { headers: parentHeaders },
  );
  expect(completionEventsAfterReplay.status()).toBe(200);
  const completionCountAfterReplay = (
    (await completionEventsAfterReplay.json()).timeline as Array<{
      eventType: string;
      title: string;
    }>
  ).filter(
    ({ eventType, title }) =>
      eventType === "PRACTICE_COMPLETED" &&
      title === "Both-hand ball control completed",
  ).length;
  expect(completionCountAfterReplay).toBe(completionCountBeforeReplay);
  expect(consoleErrors).toEqual([]);

  stopObservingConsole();
  await stop(apiProcess, "API");
  apiProcess = undefined;
  await startApi();
  observeConsole();
  await page.reload();
  await expect(
    page.getByText("Both-hand ball control completed", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Switch persona" }).click();
  await page.waitForURL("**/local-auth");
  await expect(
    page.getByRole("heading", { name: "Choose a parent persona" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: /Alex Reed/ }).check();
  await page.getByRole("button", { name: "Continue to NextStep" }).click();
  await page.waitForURL("**/athletes/c4abbb6c-b113-41d9-882e-ff295f7b380e");
  const deniedApi = await page.request.get(
    `${apiUrl}/v1/athletes/25fd56b2-b2f1-4645-8ee6-adbac147069e`,
    {
      headers: {
        "x-actor-id": "checkpoint-a-other-parent",
        "x-household-id": "07094fa0-beac-44e5-a247-bcf4052a373c",
      },
    },
  );
  expect(deniedApi.status()).toBe(404);
  expect(consoleErrors).toEqual([]);

  stopObservingConsole();
  await page.close();
  await stop(webProcess, "Web");
  webProcess = undefined;
  await startWeb(false);
  const localAuthResponse = await request.get(`${webUrl}/local-auth`);
  expect(localAuthResponse.status()).toBe(404);
});
