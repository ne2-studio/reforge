import { defineConfig, mergeConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createViteConfig } from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Separate from vite.config.ts (rather than adding a `test:` block there) so the production
// build config stays untouched by test-only concerns — merged in via mergeConfig purely to
// reuse the existing `@` -> src alias, so test files can import with the same paths the app
// itself uses. Mirrors el-baul's app/vitest.config.ts.
//
// 'node' is the default environment (not jsdom) per docs/architecture/frontend.md's testing
// pyramid: most of this suite is unit-level (pure logic, stores, mappers) that doesn't need a
// DOM and runs faster without one. Component tests opt into jsdom per-file with a
// `// @vitest-environment jsdom` docblock at the top of the file.
export default mergeConfig(
  createViteConfig(),
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.{ts,tsx}'],
            setupFiles: ['./src/test/setup.ts'],
            coverage: {
              provider: 'v8',
              include: ['src/**/*.{ts,tsx}'],
              exclude: ['src/legacy/**'],
              reporter: [['text-summary', { file: 'summary.txt' }], 'json-summary', 'html'],
              reportsDirectory: './coverage',
            },
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
              storybookScript: 'npm run storybook -- --no-open',
            }),
          ],
          test: {
            name: 'storybook',
            testTimeout: 120000,
            retry: 2,
            // Documented Storybook/vitest-addon workaround for resource-overwhelm failures
            // ("Cannot connect to the iframe") in constrained/CI environments — see
            // el-baul's app/vitest.config.ts for the fuller writeup.
            isolate: false,
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
            setupFiles: ['./.storybook/vitest.setup.ts'],
          },
        },
      ],
    },
  })
);
