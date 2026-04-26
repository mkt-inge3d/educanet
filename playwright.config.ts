import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { existsSync } from "fs";

// Carga credenciales E2E locales si existen (no se commitea)
if (existsSync("e2e/.env.e2e")) {
  config({ path: "e2e/.env.e2e" });
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global.setup.ts",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
