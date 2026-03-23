import { defineConfig, devices } from '@playwright/test';

/**
 * RTGS PGL — Playwright E2E Config
 *
 * Runs against the STAGING Cloudflare deployment by default.
 * Set BASE_URL env var to override (e.g. prod for explicit production testing).
 *
 * Test isolation: all write operations use X-Test-Mode: 1 header
 * which routes KV reads/writes to the isolated 'season3_results_test' key.
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,      // run serially — shared KV state
  retries: 1,                // one retry on CI to handle transient CF latency
  workers: 1,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://rtgs-pgl-staging.selvaraj-s.workers.dev',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
