import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4200',

    /* Default timeout for actions (matches the original Python test default) */
    actionTimeout: 5000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  expect: {
    toHaveScreenshot: {
      /* Tolerate up to 1 % pixel-ratio diff to absorb sub-pixel / AA variance. */
      maxDiffPixelRatio: 0.01,
    },
  },

  /* Snapshots live beside the spec file, namespaced by project so each browser
     engine keeps its own reference images. */
  snapshotPathTemplate:
    '{testDir}/__snapshots__/{testFilePath}/{arg}-{projectName}{ext}',

  /* Configure projects for major browsers */
  projects: [
    // ── Functional tests: run on all three engines, skip visual specs ────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/*.visual.spec.ts',
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/*.visual.spec.ts',
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/*.visual.spec.ts',
    },

    // ── Visual regression: Chromium only, fixed 1280×720 viewport ────────────
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: '**/*.visual.spec.ts',
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
