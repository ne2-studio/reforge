import { defineConfig, devices } from '@playwright/test';

// Verifies the built frontend image + Reforge.Api.Lite (own compose file, own setup/teardown).
// Deliberately a separate package from a future repo-root e2e suite, same reasoning as
// el-baul's app/playwright.config.ts.
export default defineConfig({
  testDir: './acceptance-tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']]
    : 'list',
  outputDir: './test-results',
  globalSetup: './acceptance-tests/global-setup.ts',
  globalTeardown: './acceptance-tests/global-teardown.ts',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
