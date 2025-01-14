const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test/e2e', // Directory for storing your Playwright tests
  timeout: 30000, // Test timeout in milliseconds
  retries: 2, // Number of retries for flaky tests
  workers: 1, // Number of parallel workers
  use: {
    baseURL: 'http://localhost:3000', // Update with your app's base URL
    headless: true, // Run tests in headless mode
    viewport: { width: 1280, height: 720 }, // Default browser viewport size
    actionTimeout: 5000, // Timeout for Playwright actions
    ignoreHTTPSErrors: true, // Ignore HTTPS certificate errors
    video: 'on', // Record video of tests
    screenshot: 'only-on-failure', // Take screenshots on failures
  },
  projects: [
    {
      name: 'Chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'WebKit',
      use: { browserName: 'webkit' },
    },
  ],
});
