import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4175",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx tsx tests/browser-server.ts",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
