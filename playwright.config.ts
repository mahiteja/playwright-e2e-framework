/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * playwright.config.ts
 *
 * Supports:
 *  - Environment switching: TEST_ENV=test|uat  (defaults to 'test')
 *  - Sharding:              SHARD_INDEX / SHARD_TOTAL env vars
 *  - Full parallelism:      fullyParallel: true
 *  - Retries on CI:         retries: 2 in CI, 0 locally
 *  - HTML + (optional) Allure reporting
 *  - Trace saved on failure for debugging
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path   from 'path';

// ── Load environment variables ────────────────────────────────────────────────
// Must happen before any lib/ imports so process.env is populated when
// loadEnv() / loadHeaders() are called from fixtures.
const testEnv = process.env['TEST_ENV'] ?? 'test';
const envFile = path.resolve(__dirname, `.env.${testEnv}`);
dotenv.config({ path: envFile });

// Now safe to import utilities that read process.env
import { loadHeaders } from './lib/utils/headerLoader';
// Register custom matchers globally so all test files have access
import './lib/matchers/customMatchers';

// ── Sharding ──────────────────────────────────────────────────────────────────
const shardTotal = parseInt(process.env['SHARD_TOTAL'] ?? '1',  10);
const shardIndex = parseInt(process.env['SHARD_INDEX'] ?? '1',  10);

// ── Config ─────────────────────────────────────────────────────────────────────
export default defineConfig({
  testDir:       './tests',
  timeout:       30_000,
  retries:       process.env['CI'] ? 0 : 0,
  workers:       process.env['CI'] ? 1 : undefined,
  fullyParallel: true,

  // Sharding: SHARD_TOTAL=4 SHARD_INDEX=2 npx playwright test
  shard: shardTotal > 1 ? { total: shardTotal, current: shardIndex } : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ...(process.env['CI'] ? [['blob', { outputDir: 'blob-report' }] as [string, object]] : []),
  ],

  use: {
    // baseURL is used by the built-in `request` fixture and `page.request`
    baseURL: process.env['BASE_URL'] ?? 'https://jsonplaceholder.typicode.com',

    // Environment headers injected into every browser request
    extraHTTPHeaders: {
      'Accept': 'application/json',
      ...loadHeaders(),
    },

    // Capture trace on first retry — available in the HTML report
    trace:      'retain-on-failure',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
  },

  projects: [
    // ── API automation ─────────────────────────────────────────────────────────
    {
      name:      'api-tests',
      use:       { ...devices['Desktop Chrome'] },
      testMatch: '**/api-automation/**/*.spec.ts',
    },

    // ── Web / UI automation ────────────────────────────────────────────────────
    {
      name: 'web-tests',
      use:  {
        ...devices['Desktop Chrome'],
        // baseURL used by page.goto('/todomvc') in TodoMVC page-object tests
        baseURL:          'https://demo.playwright.dev',
        // Override global API headers — not relevant for browser navigation
        extraHTTPHeaders: {},
        viewport:         { width: 1280, height: 720 },
      },
      testMatch: '**/web-automation/**/*.spec.ts',
    },
  ],

  // Global output directories
  outputDir: 'test-results',
});
