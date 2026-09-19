import { defineConfig, devices } from '@playwright/test';

// Scaffold only: verifies the built frontend image + Reforge.Api.Lite once both exist
// (docs/plan/01-walking-skeleton.md, task #5 — the acceptance suite itself, including
// global-setup/teardown that boot the images and a fake-oidc container, is built there).
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
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
