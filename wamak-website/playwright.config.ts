import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: [
    {
      // Receives the CRM webhook so tests can inspect exactly what WAMAK would get.
      command: "node scripts/webhook-sink.mjs",
      port: 3199,
      reuseExistingServer: true,
    },
    {
      command: `npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      // Never reuse: a leftover server would serve a stale build.
      reuseExistingServer: false,
      timeout: 120_000,
      env: { LEAD_WEBHOOK_URL: "http://localhost:3199/hook", RATE_LIMIT_MAX: "1000" },
    },
  ],
});
