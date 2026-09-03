import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Some environments ship a pre-installed Chromium instead of letting Playwright
 * download its own. Point at it when it exists; otherwise fall back to whatever
 * `npx playwright install` put in place.
 */
const PREINSTALLED_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(PREINSTALLED_CHROME)
  ? { executablePath: PREINSTALLED_CHROME }
  : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions } },
  ],
  webServer: {
    // NEXT_PUBLIC_* values are inlined during the build, so the build itself has
    // to be pointed at the mock — overriding them at start-up alone is too late.
    command:
      "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key " +
      `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:${PORT} ` +
      "npx next build && node tests/e2e/start-stack.mjs",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { PORT: String(PORT) },
  },
});
