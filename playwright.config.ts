import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// The Playwright test runner is a separate Node process from `next dev`/`next
// start` — it doesn't get Next's automatic .env.local loading, but
// tests/e2e/support/provision.ts talks to the database directly and needs it.
config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    {
      name: "Pixel-class Chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "iPhone 13-class WebKit",
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "iPhone SE-class WebKit",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "Desktop Chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Reduced-motion emulation is set per-file via test.use({ reducedMotion: "reduce" })
      // in tests/e2e/reduced-motion.spec.ts — combining it here with the devices() spread
      // breaks this Playwright version's `use` overload resolution.
      name: "Reduced-motion Chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /reduced-motion\.spec\.ts/,
    },
  ],
});
