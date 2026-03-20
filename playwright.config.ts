import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 600_000,
  use: {
    baseURL: 'http://localhost:4200',
    headless: false,
    trace: 'on',
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: 500,
    },
  },
  projects: [
    { name: 'chromium', use: { channel: 'chromium' } },
  ],
  webServer: {
    command: 'cd Demo_project && npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
